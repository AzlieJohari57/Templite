"""
Resume-generation worker.

Runs the LLM + PDF pipeline and writes progress/results to the OSS job store.
On Function Compute this runs as a *separate async invocation* (see fc_async.py)
because an FC instance is frozen once its HTTP response returns — a background
task started inside the request handler would not reliably finish.

The same function is reused as the local-dev fallback (run in an asyncio task).
"""

from __future__ import annotations

from typing import Any

import jobstore
from create_resume import pipeline_phase1_llm, pipeline_phase2_pdf


def run_resume_job(job_id: str, payload: dict[str, Any]) -> None:
    """
    Execute a resume job end-to-end and record the outcome in the OSS job store.

    payload keys: resume (dict), template (str), language (str).
    Each invocation is its own FC instance, so no in-process semaphore is needed —
    concurrency is capped by FC's instance-concurrency + max-instances settings.
    """
    jobstore.update_job(job_id, status="processing")
    try:
        enhanced_resume, html_content, file_id = pipeline_phase1_llm(
            resume_data=payload["resume"],
            template_key=payload.get("template", "A"),
            language=payload.get("language", "English"),
        )
        result = pipeline_phase2_pdf(html_content, file_id)
        result["enhanced_data"] = enhanced_resume
        jobstore.update_job(job_id, status="done", result=result)
    except Exception as e:  # noqa: BLE001 — surface any failure to the poller
        jobstore.update_job(job_id, status="failed", error=str(e))
