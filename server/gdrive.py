"""
Google Drive integration for uploading generated resume PDFs.

First-time setup:
  1. Visit http://127.0.0.1:8000/api/auth/google in your browser
  2. Authorize the app — token.json will be saved automatically
  3. All future uploads happen silently using the stored refresh token
"""

import os
from pathlib import Path
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

SCOPES = ["https://www.googleapis.com/auth/drive.file"]
CREDENTIALS_FILE = Path(__file__).parent.parent / "credentials.json"
TOKEN_FILE = Path(__file__).parent.parent / "token.json"
REDIRECT_URI = os.getenv("GDRIVE_REDIRECT_URI", "http://127.0.0.1:8000/api/auth/callback")
GDRIVE_FOLDER_ID = os.getenv("GDRIVE_FOLDER_ID", None)


def get_auth_url() -> str:
    """Generate Google OAuth2 authorization URL."""
    flow = Flow.from_client_secrets_file(
        str(CREDENTIALS_FILE),
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return auth_url


def save_token_from_code(code: str) -> None:
    """Exchange authorization code for tokens and save to token.json."""
    flow = Flow.from_client_secrets_file(
        str(CREDENTIALS_FILE),
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )
    flow.fetch_token(code=code)
    creds = flow.credentials
    TOKEN_FILE.write_text(creds.to_json())


def get_credentials() -> Credentials | None:
    """Load and refresh stored credentials. Returns None if not authorized yet."""
    if not TOKEN_FILE.exists():
        return None

    creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_FILE.write_text(creds.to_json())

    return creds if creds and creds.valid else None


def upload_pdf_to_drive(pdf_path: Path) -> str | None:
    """
    Upload a PDF to Google Drive.

    Returns:
        Shareable link string, or None if upload fails.
    """
    creds = get_credentials()
    if not creds:
        print("[GDrive] Not authorized. Visit /api/auth/google to authorize.")
        return None

    service = build("drive", "v3", credentials=creds)

    file_metadata = {"name": pdf_path.name}
    if GDRIVE_FOLDER_ID:
        file_metadata["parents"] = [GDRIVE_FOLDER_ID]

    media = MediaFileUpload(str(pdf_path), mimetype="application/pdf")

    uploaded = service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id",
    ).execute()

    file_id = uploaded.get("id")

    # Make file viewable by anyone with the link
    service.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"},
    ).execute()

    return f"https://drive.google.com/file/d/{file_id}/view"


def upload_image_to_drive(image_path: Path) -> str | None:
    """
    Upload a profile image to Google Drive.

    Returns:
        Shareable link string, or None if upload fails.
    """
    creds = get_credentials()
    if not creds:
        print("[GDrive] Not authorized. Visit /api/auth/google to authorize.")
        return None

    mimetype = "image/jpeg"

    service = build("drive", "v3", credentials=creds)

    file_metadata = {"name": image_path.name}
    if GDRIVE_FOLDER_ID:
        file_metadata["parents"] = [GDRIVE_FOLDER_ID]

    media = MediaFileUpload(str(image_path), mimetype=mimetype)

    uploaded = service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id",
    ).execute()

    file_id = uploaded.get("id")

    service.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"},
    ).execute()

    return f"https://drive.google.com/file/d/{file_id}/view"


def is_authorized() -> bool:
    """Check if the app is authorized to access Google Drive."""
    return get_credentials() is not None
