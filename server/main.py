from fastapi import FastAPI, Form, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Any
from pathlib import Path
import asyncio
import shutil
import uvicorn
import os
import time
import uuid
from PIL import Image
import pillow_heif
pillow_heif.register_heif_opener()

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from create_resume import pipeline_phase1_llm, pipeline_phase2_pdf
from gdrive import get_auth_url, save_token_from_code, is_authorized, upload_image_to_drive

IMAGES_DIR = Path(__file__).parent / "images"
IMAGES_DIR.mkdir(exist_ok=True)

GENERATED_PDF_DIR = Path(__file__).parent / "generated_resume"

# Limit concurrent Playwright/Chromium instances.
# Each Chromium process uses ~300-400 MB. On a 4 GB instance with 2 Gunicorn
# workers, this caps peak Chromium RAM at 2 × 2 × 350 MB = 1.4 GB total.
_PDF_CONCURRENCY = int(os.getenv("PDF_CONCURRENCY", "2"))
_pdf_semaphore: asyncio.Semaphore | None = None  # initialised in lifespan

# Request timeout covers the full LLM + Playwright pipeline (seconds).
PDF_TIMEOUT = int(os.getenv("PDF_TIMEOUT", "240"))

# Delete generated PDFs and job records older than this many seconds.
PDF_MAX_AGE = int(os.getenv("PDF_MAX_AGE", "7200"))  # 2 hours

# In-memory job store — fine for single-server deployment (no Redis needed).
# Each entry: {"status": str, "result": dict|None, "error": str|None, "created_at": float}
_jobs: dict[str, dict] = {}


async def _cleanup_old_pdfs() -> None:
    """Background task: delete PDFs and job records older than PDF_MAX_AGE."""
    while True:
        await asyncio.sleep(1800)  # run every 30 minutes
        cutoff = time.time() - PDF_MAX_AGE
        for f in GENERATED_PDF_DIR.glob("*.pdf"):
            try:
                if f.stat().st_mtime < cutoff:
                    f.unlink()
            except OSError:
                pass
        stale = [jid for jid, j in _jobs.items() if j["created_at"] < cutoff]
        for jid in stale:
            _jobs.pop(jid, None)


from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _pdf_semaphore
    _pdf_semaphore = asyncio.Semaphore(_PDF_CONCURRENCY)
    cleanup_task = asyncio.create_task(_cleanup_old_pdfs())
    yield
    cleanup_task.cancel()


app = FastAPI(
    title="Resume Generator API",
    description="Generate professional resumes from JSON data",
    lifespan=lifespan,
)

_ALLOWED_ORIGINS = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateResumeRequest(BaseModel):
    resume: dict[str, Any]
    template: str = "A"
    language: str = "English"


async def _run_resume_job(job_id: str, request: CreateResumeRequest) -> None:
    """
    Two-phase pipeline:
      Phase 1 — LLM enhancement + HTML render. Runs freely for all users in parallel.
                 Uses only OpenAI network I/O, no Chromium, no RAM spike.
      Phase 2 — Playwright PDF generation. Semaphore-guarded: only PDF_CONCURRENCY
                 Chromium instances run at a time (~350 MB each).
    """
    _jobs[job_id]["status"] = "processing"
    try:
        # Phase 1: all users run this simultaneously — no semaphore needed
        enhanced_resume, html_content, file_id = await asyncio.wait_for(
            asyncio.to_thread(
                pipeline_phase1_llm,
                resume_data=request.resume,
                template_key=request.template,
                language=request.language,
            ),
            timeout=PDF_TIMEOUT,
        )

        # Phase 2: semaphore only gates Playwright — LLM time is not wasted waiting
        async with _pdf_semaphore:
            result = await asyncio.wait_for(
                asyncio.to_thread(pipeline_phase2_pdf, html_content, file_id),
                timeout=60,
            )

        result["enhanced_data"] = enhanced_resume
        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["result"] = result
    except asyncio.TimeoutError:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"] = "Resume generation timed out. Please try again."
    except Exception as e:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"] = str(e)


@app.post("/api/create-resume")
async def create_resume(request: CreateResumeRequest):
    """
    Start resume generation and return a job_id immediately.
    Poll GET /api/resume-status/{job_id} to track progress.
    """
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "status": "pending",
        "result": None,
        "error": None,
        "created_at": time.time(),
    }
    asyncio.create_task(_run_resume_job(job_id, request))
    return {"job_id": job_id}


@app.get("/api/resume-status/{job_id}")
async def resume_status(job_id: str):
    """Poll this endpoint every few seconds after calling /api/create-resume."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or expired.")

    response: dict[str, Any] = {"status": job["status"]}

    if job["status"] == "done":
        response["pdf_path"] = job["result"]["pdf_path"]
        response["drive_url"] = job["result"].get("drive_url")

    if job["status"] == "failed":
        response["error"] = job["error"]

    return response


@app.get("/api/auth/google")
async def auth_google():
    """Redirect to Google OAuth2 consent screen."""
    return RedirectResponse(url=get_auth_url())


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

    # Upload image to Google Drive
    try:
        upload_image_to_drive(image_path)
    except Exception as e:
        print(f"[GDrive] Image upload failed: {e}")

    return {"success": True, "image_url": f"../images/{phone_clean}.jpg"}


# Serve built frontend in production
CLIENT_DIST = Path(__file__).parent.parent / "client" / "dist"
if CLIENT_DIST.exists():
    app.mount("/", StaticFiles(directory=str(CLIENT_DIST), html=True), name="frontend")


if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=False)
