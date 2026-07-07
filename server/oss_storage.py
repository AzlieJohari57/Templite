"""
Alibaba Cloud OSS storage layer.

Replaces the local filesystem (and the in-memory job dict) so the app can run
statelessly on Function Compute, where every request may hit a different,
short-lived instance and local disk does not persist.

What lives in OSS:
  - jobs/<job_id>.json     resume-generation job status + result (the poll target)
  - config/token.json      Google Drive OAuth token (survives cold starts)
  - images/<phone>.jpg     uploaded profile photos
  - pdf/<file_id>.pdf       generated resume PDFs (auto-expired by an OSS lifecycle rule)

Credentials:
  On Function Compute, the function's RAM role injects temporary STS credentials
  via ALIBABA_CLOUD_ACCESS_KEY_ID / _SECRET / _SECURITY_TOKEN — no keys to store.
  Locally, set OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET in .env instead.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

# oss2 is imported lazily (inside functions) so local dev without the Alibaba
# SDK installed can still run using the on-disk fallbacks in jobstore/gdrive.

# ── Configuration (from environment) ──────────────────────────────────────────
OSS_ENDPOINT = os.getenv("OSS_ENDPOINT", "")          # e.g. oss-ap-southeast-1-internal.aliyuncs.com
OSS_BUCKET = os.getenv("OSS_BUCKET", "")              # e.g. templite-prod
OSS_PUBLIC_ENDPOINT = os.getenv("OSS_PUBLIC_ENDPOINT", OSS_ENDPOINT)  # used for signed URLs handed to the browser

_JOB_PREFIX = "jobs/"
_TOKEN_KEY = "config/token.json"
_IMAGE_PREFIX = "images/"
_PDF_PREFIX = "pdf/"

# Signed-URL lifetime for PDFs handed back to the browser (seconds).
SIGNED_URL_TTL = int(os.getenv("OSS_SIGNED_URL_TTL", "7200"))  # 2 hours


def _make_auth():
    """
    Prefer explicit keys (local dev). Otherwise use the STS credentials that
    Function Compute injects into the environment via the function's RAM role.
    """
    import oss2
    key_id = os.getenv("OSS_ACCESS_KEY_ID")
    key_secret = os.getenv("OSS_ACCESS_KEY_SECRET")
    if key_id and key_secret:
        return oss2.Auth(key_id, key_secret)

    # Function Compute injects these from the assigned service/function role.
    fc_id = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID")
    fc_secret = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET")
    fc_token = os.getenv("ALIBABA_CLOUD_SECURITY_TOKEN")
    if fc_id and fc_secret and fc_token:
        return oss2.StsAuth(fc_id, fc_secret, fc_token)

    raise RuntimeError(
        "No OSS credentials found. Set OSS_ACCESS_KEY_ID/OSS_ACCESS_KEY_SECRET "
        "locally, or assign a RAM role to the Function Compute function."
    )


_bucket = None
_bucket_public = None


def _get_bucket():
    """Bucket bound to the internal endpoint (fast, free traffic inside Alibaba)."""
    global _bucket
    if _bucket is None:
        import oss2
        if not OSS_ENDPOINT or not OSS_BUCKET:
            raise RuntimeError("OSS_ENDPOINT and OSS_BUCKET must be set.")
        _bucket = oss2.Bucket(_make_auth(), OSS_ENDPOINT, OSS_BUCKET)
    return _bucket


def _get_public_bucket():
    """
    Bucket bound to the public endpoint — used only to sign URLs the browser
    can reach. The internal endpoint is not routable from outside Alibaba.
    """
    global _bucket_public
    if _bucket_public is None:
        import oss2
        _bucket_public = oss2.Bucket(_make_auth(), OSS_PUBLIC_ENDPOINT, OSS_BUCKET)
    return _bucket_public


def is_configured() -> bool:
    """True when OSS is wired up. Lets code fall back to local disk in dev."""
    return bool(OSS_ENDPOINT and OSS_BUCKET)


# ── Generic object helpers ────────────────────────────────────────────────────

def put_bytes(key: str, data: bytes, content_type: str | None = None) -> None:
    headers = {"Content-Type": content_type} if content_type else None
    _get_bucket().put_object(key, data, headers=headers)


def put_file(key: str, local_path: str | Path, content_type: str | None = None) -> None:
    headers = {"Content-Type": content_type} if content_type else None
    _get_bucket().put_object_from_file(key, str(local_path), headers=headers)


def get_bytes(key: str) -> bytes | None:
    import oss2
    try:
        return _get_bucket().get_object(key).read()
    except oss2.exceptions.NoSuchKey:
        return None


def exists(key: str) -> bool:
    return _get_bucket().object_exists(key)


def signed_url(key: str, ttl: int = SIGNED_URL_TTL) -> str:
    """A time-limited HTTPS URL the browser can use to download the object."""
    return _get_public_bucket().sign_url("GET", key, ttl, slash_safe=True)


# ── Job store (replaces the in-memory _jobs dict) ─────────────────────────────

def job_key(job_id: str) -> str:
    return f"{_JOB_PREFIX}{job_id}.json"


def create_job(job_id: str) -> None:
    record = {"status": "pending", "result": None, "error": None, "created_at": time.time()}
    put_bytes(job_key(job_id), json.dumps(record).encode(), "application/json")


def get_job(job_id: str) -> dict[str, Any] | None:
    raw = get_bytes(job_key(job_id))
    return json.loads(raw) if raw else None


def update_job(job_id: str, **fields: Any) -> None:
    record = get_job(job_id) or {"created_at": time.time()}
    record.update(fields)
    put_bytes(job_key(job_id), json.dumps(record).encode(), "application/json")


# ── Google Drive token persistence ────────────────────────────────────────────

def load_token() -> str | None:
    raw = get_bytes(_TOKEN_KEY)
    return raw.decode() if raw else None


def save_token(token_json: str) -> None:
    put_bytes(_TOKEN_KEY, token_json.encode(), "application/json")


# ── Images & PDFs ─────────────────────────────────────────────────────────────

def put_image(phone: str, local_path: str | Path) -> str:
    key = f"{_IMAGE_PREFIX}{phone}.jpg"
    put_file(key, local_path, "image/jpeg")
    return key


def put_pdf(file_id: str, local_path: str | Path) -> str:
    key = f"{_PDF_PREFIX}{file_id}_resume.pdf"
    put_file(key, local_path, "application/pdf")
    return key
