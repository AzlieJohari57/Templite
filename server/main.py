from fastapi import FastAPI, Form, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Any
from pathlib import Path
import asyncio
import uvicorn
import os
import uuid
from PIL import Image
import pillow_heif
pillow_heif.register_heif_opener()

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

_missing_env = [k for k in ("OPENAI_API_KEY",) if not os.getenv(k)]
if _missing_env:
    raise RuntimeError(f"Missing required environment variables: {', '.join(_missing_env)}")

from create_resume import get_llm
from gdrive import get_auth_url, save_token_from_code, is_authorized, upload_image_to_drive
import jobstore
import fc_async
import oss_storage
from worker import run_resume_job

# Ephemeral scratch dir for image conversion. On Function Compute only /tmp is
# writable; the converted JPEG is uploaded to OSS + Google Drive and the local
# copy is discarded within the same request.
import tempfile
IMAGES_DIR = Path(tempfile.gettempdir()) / "images"
IMAGES_DIR.mkdir(exist_ok=True)


app = FastAPI(
    title="Resume Generator API",
    description="Generate professional resumes from JSON data",
)

_ALLOWED_ORIGINS = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


class CreateResumeRequest(BaseModel):
    resume: dict[str, Any]
    template: str = Field("A", pattern=r"^[A-M]$")
    language: str = Field("English", max_length=20)


class GenerateProfileRequest(BaseModel):
    job_title: str = Field(..., max_length=200)
    language: str = Field("English", max_length=20)


class LogOrderRequest(BaseModel):
    action: str = Field(..., max_length=50)
    sessionId: str = Field(..., max_length=100)
    channel: str = Field("", max_length=20)
    value: str = Field("", max_length=100)
    language: str = Field("", max_length=20)
    name: str = Field("", max_length=200)
    email: str = Field("", max_length=254)
    jobTitle: str = Field("", max_length=200)
    template: str = Field("", max_length=5)
    pages: str = Field("", max_length=5)
    resumeLink: str = Field("", max_length=500)
    imageLink: str = Field("", max_length=500)


@app.post("/api/create-resume")
async def create_resume(request: CreateResumeRequest):
    """
    Start resume generation and return a job_id immediately.
    The heavy LLM + Playwright pipeline runs in a separate Function Compute
    async invocation (see fc_async.submit_job); progress is written to the OSS
    job store. Poll GET /api/resume-status/{job_id} to track it.
    """
    job_id = str(uuid.uuid4())
    jobstore.create_job(job_id)
    try:
        fc_async.submit_job(job_id, {
            "resume": request.resume,
            "template": request.template,
            "language": request.language,
        })
    except Exception as e:
        jobstore.update_job(job_id, status="failed", error=f"Could not start job: {e}")
        raise HTTPException(status_code=502, detail="Could not start resume generation.")
    return {"job_id": job_id}


@app.post("/invoke")
async def invoke(request: Request):
    """
    Function Compute worker entrypoint (async event invocation).
    FC delivers the event as the POST body: {"job_id": ..., "payload": {...}}.
    Not exposed publicly — only the worker function's event trigger hits this.
    """
    event = await request.json()
    job_id = event["job_id"]
    payload = event["payload"]
    # Run the (blocking) pipeline off the event loop.
    await asyncio.to_thread(run_resume_job, job_id, payload)
    return {"ok": True, "job_id": job_id}


@app.get("/api/resume-status/{job_id}")
async def resume_status(job_id: str):
    """Poll this endpoint every few seconds after calling /api/create-resume."""
    job = jobstore.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or expired.")

    response: dict[str, Any] = {"status": job["status"]}

    if job["status"] == "done":
        result = job["result"] or {}
        response["pdf_url"] = result.get("pdf_url")      # signed OSS download URL
        response["pdf_path"] = result.get("pdf_path")    # kept for backward compat
        response["drive_url"] = result.get("drive_url")

    if job["status"] == "failed":
        response["error"] = job["error"]

    return response


@app.post("/api/generate-profile")
async def generate_profile(request: GenerateProfileRequest):
    """Generate AI-suggested resume profile (about me, skills, strengths) for a given job title."""
    if not request.job_title.strip():
        raise HTTPException(status_code=400, detail="job_title is required")

    is_bm = request.language == "BM"

    if is_bm:
        prompt = (
            f"Anda adalah penulis resume profesional. Jana profil resume untuk jawatan '{request.job_title}'.\n\n"
            "Balas dengan HANYA objek JSON (tiada markdown, tiada blok kod):\n"
            '{{"aboutMe":"2-3 ayat Tentang Saya","technicalSkills":[{{"skill":"kemahiran","percentage":75}}],'
            '"softSkills":[{{"skill":"kemahiran","percentage":80}}],"strengths":"2-3 ayat kelebihan"}}\n\n'
            f"Sertakan 4 kemahiran teknikal dan 4 kemahiran insaniah yang berkaitan dengan '{request.job_title}'."
        )
    else:
        prompt = (
            f"You are a professional resume writer. Generate a resume profile for a '{request.job_title}' position.\n\n"
            "Reply with ONLY a JSON object (no markdown, no code blocks):\n"
            '{{"aboutMe":"2-3 sentence About Me","technicalSkills":[{{"skill":"skill name","percentage":75}}],'
            '"softSkills":[{{"skill":"skill name","percentage":80}}],"strengths":"2-3 sentence strengths paragraph"}}\n\n'
            f"Include 4 technical skills and 4 soft skills relevant to '{request.job_title}'."
        )

    try:
        llm = get_llm()
        response = await asyncio.to_thread(llm.invoke, prompt)
        import json, re
        text = response.content.strip()
        # strip markdown fences if model adds them despite instructions
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        data = json.loads(text)
        return data
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned malformed JSON. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


_SHEETS_WEBHOOK_URL = os.getenv("SHEETS_WEBHOOK_URL", "")


@app.post("/api/log-order")
async def log_order(payload: LogOrderRequest):
    if not _SHEETS_WEBHOOK_URL:
        print(f"[Sheet] ERROR: SHEETS_WEBHOOK_URL is not set in .env")
        return {"success": False, "reason": "no webhook configured"}
    try:
        import requests as _req
        def _post():
            r = _req.post(_SHEETS_WEBHOOK_URL, json=payload.model_dump(), timeout=15, allow_redirects=True)
            print(f"[Sheet] {payload.action} → status={r.status_code} body={r.text[:300]}")
            return r
        await asyncio.to_thread(_post)
        return {"success": True}
    except Exception as e:
        print(f"[Sheet] Log failed: {e}")
        return {"success": False, "error": str(e)}


@app.get("/api/auth/google")
async def auth_google():
    """
    Send the browser to the Google OAuth2 consent screen.

    Function Compute rejects a 3xx to an external host ("ExternalRedirectForbidden"),
    so navigate client-side instead of returning a RedirectResponse.
    """
    url = get_auth_url()
    return HTMLResponse(
        f'<!doctype html><meta http-equiv="refresh" content="0;url={url}">'
        f'<p>Redirecting to Google… <a href="{url}">continue</a></p>'
    )


@app.get("/api/auth/callback")
async def auth_callback(code: str):
    """Handle Google OAuth2 callback and save token."""
    try:
        save_token_from_code(code)
        return {"success": True, "message": "Google Drive authorized successfully. You can close this tab."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authorization failed: {str(e)}")


@app.get("/api/auth/status")
async def auth_status():
    """Check if Google Drive is authorized."""
    return {"authorized": is_authorized()}


IMAGE_MAX_BYTES = 15 * 1024 * 1024  # 15 MB cap before PIL decode


@app.post("/api/upload-image")
async def upload_image(image: UploadFile = File(...), phone: str = Form(...)):
    """Upload a profile image, named by phone number."""
    phone_clean = phone.replace(" ", "").replace("-", "").replace("+", "")
    if not phone_clean:
        raise HTTPException(status_code=400, detail="Phone number is required")

    # Save raw upload to a temp file first, enforcing a size cap.
    # A raw HEIC from a 48 MP phone can decompress to ~150 MB in RAM —
    # rejecting files over 15 MB keeps peak PIL memory under ~60 MB.
    raw_suffix = Path(image.filename).suffix.lower() or ".jpg"
    raw_path = IMAGES_DIR / f"{phone_clean}_raw{raw_suffix}"
    written = 0
    try:
        with open(raw_path, "wb") as f:
            while chunk := image.file.read(64 * 1024):
                written += len(chunk)
                if written > IMAGE_MAX_BYTES:
                    raise HTTPException(status_code=413, detail="Image must be under 15 MB")
                f.write(chunk)
    except HTTPException:
        raw_path.unlink(missing_ok=True)
        raise

    # Convert to JPEG (handles JPG, PNG, WEBP, HEIC, HEIF, etc.)
    image_path = IMAGES_DIR / f"{phone_clean}.jpg"
    try:
        with Image.open(raw_path) as img:
            img = img.convert("RGB")
            img.save(image_path, format="JPEG", quality=90)
    finally:
        raw_path.unlink(missing_ok=True)

    # Upload the JPEG to OSS and return an absolute URL. The PDF render happens
    # in a *separate* worker invocation, so the profile image must be reachable
    # over HTTPS (Chromium loads it by URL) rather than by local relative path.
    drive_image_url = ""  # shareable Google Drive link, later logged to the sheet
    try:
        if oss_storage.is_configured():
            key = oss_storage.put_image(phone_clean, image_path)
            image_url = oss_storage.signed_url(key)
        else:
            image_url = f"../images/{phone_clean}.jpg"  # local-dev fallback

        # Also archive a copy to Google Drive (best-effort) and keep its link.
        try:
            drive_image_url = upload_image_to_drive(image_path) or ""
        except Exception as e:
            print(f"[GDrive] Image upload failed: {e}")
    finally:
        # Discard the ephemeral local copy once uploaded.
        if oss_storage.is_configured():
            image_path.unlink(missing_ok=True)

    return {"success": True, "image_url": image_url, "drive_image_url": drive_image_url}


# Serve built frontend in production
CLIENT_DIST = Path(__file__).parent.parent / "client" / "dist"
if CLIENT_DIST.exists():
    app.mount("/", StaticFiles(directory=str(CLIENT_DIST), html=True), name="frontend")


if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=False)
