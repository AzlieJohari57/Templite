"""
Job store abstraction.

Production: backed by OSS (jobs/<id>.json) so the poll request and the worker
invocation — which run on different Function Compute instances — share state.

Local dev (OSS not configured): a plain in-process dict, matching the original
ECS behaviour where the background task and the poller live in one process.
"""

from __future__ import annotations

import time
from typing import Any

import oss_storage

# In-memory fallback for local development only.
_jobs: dict[str, dict[str, Any]] = {}


def create_job(job_id: str) -> None:
    if oss_storage.is_configured():
        oss_storage.create_job(job_id)
    else:
        _jobs[job_id] = {"status": "pending", "result": None, "error": None, "created_at": time.time()}


def get_job(job_id: str) -> dict[str, Any] | None:
    if oss_storage.is_configured():
        return oss_storage.get_job(job_id)
    return _jobs.get(job_id)


def update_job(job_id: str, **fields: Any) -> None:
    if oss_storage.is_configured():
        oss_storage.update_job(job_id, **fields)
    else:
        _jobs.setdefault(job_id, {"created_at": time.time()}).update(fields)
