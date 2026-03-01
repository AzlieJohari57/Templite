from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
import asyncio
import uvicorn
import shutil
import sys
from pathlib import Path

# DEBUG: Print Python executable being used
print(f"[DEBUG] Python executable: {sys.executable}")
print(f"[DEBUG] Python version: {sys.version}")

# Check if playwright is importable
try:
    import playwright
    print(f"[DEBUG] Playwright found: {playwright.__file__}")
except ImportError as e:
    print(f"[DEBUG] Playwright NOT FOUND: {e}")

from create_resume import create_resume_full_pipeline

app = FastAPI(
    title="Resume Generator API",
    description="Generate professional resumes from JSON data"
)

# Add CORS middleware to allow client requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


class CreateResumeRequest(BaseModel):
    """Request body for resume creation."""
    resume: dict[str, Any]
    template: str = "A"
    language: str = "English"

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "resume": {
                        "id": "5758",
                        "name": "Hafiz Ramli",
                        "title": "Civil Engineer",
                        "image": "../images/5758.png",
                        "adress": "No. 22, Jalan Setia Indah, 40170 Shah Alam, Selangor",
                        "email": "hafiz.ramli@civiltech.my",
                        "telephone": "+60 13 456 7890",
                        "linkedin": "hafizramli-civil",
                        "about": "Experienced civil engineer with a strong background in infrastructure projects.",
                        "language": [
                            {"Bahasa Malaysia": "professional"},
                            {"English": "professional"}
                        ],
                        "experience": [],
                        "number of jobs": 0,
                        "education": [
                            {
                                "level": "Bachelor of Civil Engineering",
                                "institution": "Universiti Teknologi Malaysia (UTM)",
                                "duration": "",
                                "grade": "CGPA 3.45/4.00"
                            }
                        ],
                        "strength": [
                            "detail-oriented and dependable",
                            "able to work under pressure"
                        ],
                        "reference": [
                            {
                                "name": "En. Zamri Hassan",
                                "position": "Senior Project Manager",
                                "company": "Cipta Bina Sdn Bhd",
                                "email": "",
                                "telephone": "+60 12 888 1122"
                            }
                        ],
                        "skills": {
                            "technical skills": {
                                "AutoCAD": 30,
                                "SAP2000": 25
                            },
                            "soft skills": {
                                "Leadership": 20,
                                "Team Collaboration": 22
                            }
                        },
                        "certification": [
                            {"title": "CIDB Green Card", "issuer": "", "date": "2020"}
                        ],
                        "achievement": [
                            "Spearheaded a cost-saving initiative that reduced material waste by 18%"
                        ],
                        "extracurricular activities": [
                            {
                                "title": "Vice President, UTM Civil Engineering Society",
                                "date": "2018/2019",
                                "details": ""
                            }
                        ]
                    },
                    "template": "I",
                    "language": "English"
                }
            ]
        }
    }


class CreateResumeResponse(BaseModel):
    """Response body with generated resume info."""
    success: bool
    message: str
    pdf_path: str
    html_path: str


class UploadImageResponse(BaseModel):
    """Response body for image upload."""
    success: bool
    image_url: str


# Temporarily commented out - install python-multipart first: pip install python-multipart
# @app.post("/upload-image", response_model=UploadImageResponse)
# async def upload_image(image: UploadFile = File(...)):
#     """
#     Upload an image file and return its URL.
#
#     - **image**: Image file to upload
#
#     Returns the relative path to the uploaded image.
#     """
#     try:
#         # Create images directory if it doesn't exist
#         images_dir = Path("images")
#         images_dir.mkdir(exist_ok=True)
#
#         # Generate unique filename
#         file_extension = Path(image.filename).suffix
#         image_filename = f"{Path(image.filename).stem}_{hash(image.filename)}{file_extension}"
#         image_path = images_dir / image_filename
#
#         # Save the uploaded file
#         with open(image_path, "wb") as buffer:
#             shutil.copyfileobj(image.file, buffer)
#
#         # Return relative path
#         return UploadImageResponse(
#             success=True,
#             image_url=f"../images/{image_filename}"
#         )
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")


@app.post("/create-resume", response_model=CreateResumeResponse)
async def create_resume(request: CreateResumeRequest):
    """
    Generate a professional resume PDF from JSON data.

    - **resume**: Your resume data as JSON object
    - **template**: Template style A-J (default: A)
    - **language**: "English" or "Bahasa Malaysia" (default: English)

    Returns paths to generated HTML and PDF files.
    """
    try:
        result = await asyncio.to_thread(
            create_resume_full_pipeline,
            resume_data=request.resume,
            template_key=request.template,
            language=request.language
        )
        return CreateResumeResponse(
            success=True,
            message="Resume created successfully",
            pdf_path=result["pdf_path"],
            html_path=result["html_path"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
