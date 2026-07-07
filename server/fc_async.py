"""
Background job dispatch.

Production (Function Compute):
    Async-invoke a second FC function ("worker") that runs the heavy pipeline.
    The API function returns a job_id immediately; the worker writes the result
    to the OSS job store, which the browser polls.

Local dev (OSS/FC not configured):
    Fall back to an in-process asyncio background task — same behaviour as the
    original ECS design.

Config (env):
    FC_WORKER_FUNCTION   name of the worker function (enables async invoke)
    FC_ENDPOINT          account FC endpoint, e.g. <account>.<region>.fc.aliyuncs.com
    FC_REGION            e.g. ap-southeast-1
"""

from __future__ import annotations

import asyncio
import json
import os
from typing import Any

FC_WORKER_FUNCTION = os.getenv("FC_WORKER_FUNCTION", "")
FC_ENDPOINT = os.getenv("FC_ENDPOINT", "")
FC_REGION = os.getenv("FC_REGION", "")


def _use_fc() -> bool:
    return bool(FC_WORKER_FUNCTION and FC_ENDPOINT)


def _async_invoke_fc(job_id: str, payload: dict[str, Any]) -> None:
    """
    Fire-and-forget async invocation of the worker function via the FC 3.0
    OpenAPI. FC queues the invocation and returns immediately; credentials come
    from the API function's RAM role (STS injected into the environment).
    """
    from alibabacloud_fc20230330.client import Client as FCClient
    from alibabacloud_fc20230330 import models as fc_models
    from alibabacloud_tea_openapi import models as open_api_models

    config = open_api_models.Config(
        access_key_id=os.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID"),
        access_key_secret=os.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET"),
        security_token=os.getenv("ALIBABA_CLOUD_SECURITY_TOKEN"),
        endpoint=FC_ENDPOINT,
        region_id=FC_REGION or None,
    )
    client = FCClient(config)

    body = json.dumps({"job_id": job_id, "payload": payload}).encode()
    request = fc_models.InvokeFunctionRequest(
        body=body,
        # Queue it and return right away instead of blocking on the result.
        x_fc_invocation_type="Async",
    )
    client.invoke_function(FC_WORKER_FUNCTION, request)


def submit_job(job_id: str, payload: dict[str, Any]) -> None:
    """
    Start a resume job in the background. Returns immediately.

    Raises only if dispatch itself fails (e.g. FC invoke rejected) — the caller
    should mark the job failed in that case.
    """
    if _use_fc():
        _async_invoke_fc(job_id, payload)
        return

    # Local fallback: run in an in-process asyncio task.
    from worker import run_resume_job
    asyncio.create_task(asyncio.to_thread(run_resume_job, job_id, payload))
