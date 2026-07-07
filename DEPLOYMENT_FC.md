# Templite — Function Compute + OSS + CDN Deployment

This replaces the single ECS box with a serverless setup:

```
User ─ HTTPS ─> Alibaba CDN
                 ├── /            → OSS bucket (React SPA)         [static]
                 └── /api/*       → Function Compute "API" fn      [dynamic]
                                        │ async-invokes
                                        ▼
                                    Function Compute "worker" fn (Chromium PDF)
                                        │
                             OSS bucket: jobs/, pdf/, images/, config/token.json
```

Two FC functions run the **same container image**:
| Function | Trigger | Handles |
|---|---|---|
| `templite-api` | HTTP | `/api/*` — quick requests, returns a `job_id` |
| `templite-worker` | Async event | `/invoke` — the heavy LLM + Chromium pipeline |

Why two functions: an FC instance is frozen once its HTTP response returns, so
the long render can't run as a background task inside the API request. The API
function async-invokes the worker, which writes the result to OSS; the browser
polls `/api/resume-status/{job_id}`.

---

## 1. Create the OSS bucket

1. OSS console → create bucket, e.g. `templite-prod`, **same region** as FC (e.g. `ap-southeast-1` Singapore).
2. ACL: **private** (PDFs/images are served via signed URLs; the SPA is served via CDN).
3. **Lifecycle rule** (this replaces the old `PDF_MAX_AGE` cleanup task):
   - Prefix `pdf/` → expire after **1 day**
   - Prefix `jobs/` → expire after **1 day**
   - (optional) Prefix `images/` → expire after **7 days**

## 2. Deploy the React SPA to OSS + CDN

```bash
cd client
npm ci
npm run build          # outputs client/dist
# upload the built site to the bucket root
ossutil cp -r dist/ oss://templite-prod/ --update
```

- OSS bucket → **Static Pages**: index = `index.html`, 404 = `index.html` (SPA routing).
- Add a **CDN domain** (e.g. `templite.my`) with **origin = the OSS bucket**.
- Add a CDN **path rule**: route `/api/*` and `/invoke` to the FC HTTP trigger URL as a second origin (or use a separate `api.templite.my` subdomain pointing straight at the API function — simpler).
- Point Cloudflare/DNS at the CDN CNAME.

## 3. Build & push the container image

```bash
# Alibaba Container Registry (ACR)
docker build -t registry.<region>.aliyuncs.com/<ns>/templite:latest .
docker push registry.<region>.aliyuncs.com/<ns>/templite:latest
```

The image no longer bundles the frontend (it's on OSS/CDN) — this keeps it
smaller and cold starts shorter.

## 4. Create the API function (HTTP)

- Type: **Custom Container**, image above.
- Port: **9000** (the container listens on `$FC_SERVER_PORT`, default 9000).
- Memory: **1024 MB** is plenty (no Chromium here).
- Timeout: **60 s**.
- Trigger: **HTTP**.
- Enable **image acceleration**.

## 5. Create the worker function (async event)

- Same image.
- Memory: **3072 MB** (Chromium ~350 MB + LLM threads + headroom).
- Timeout: **300 s** (matches the old `PDF_TIMEOUT` budget).
- **Instance concurrency: 1** — one render per instance; FC scales out by adding
  instances. This replaces the old in-process `PDF_CONCURRENCY` semaphore.
- Trigger: none needed (invoked via API); FC delivers events to `POST /invoke`.
- (Cost vs. speed) To avoid cold-start latency on the first render after idle,
  set **provisioned instances = 1**. Leave at 0 for cheapest / scale-to-zero.

## 6. RAM role (no keys to store)

Attach a RAM role to **both** functions granting:
- `AliyunOSSFullAccess` (or a bucket-scoped policy) — read/write OSS.
- `fc:InvokeFunction` on `templite-worker` — so the API fn can async-invoke it.

FC injects temporary STS credentials into the environment; `oss_storage.py` and
`fc_async.py` pick them up automatically. No access keys in `.env`.

## 7. Environment variables (set on BOTH functions)

| Variable | Example | Notes |
|---|---|---|
| `OPENAI_API_KEY` | `sk-...` | required |
| `OSS_ENDPOINT` | `oss-ap-southeast-1-internal.aliyuncs.com` | **internal** endpoint (free, fast) |
| `OSS_PUBLIC_ENDPOINT` | `oss-ap-southeast-1.aliyuncs.com` | used to sign browser download URLs |
| `OSS_BUCKET` | `templite-prod` | |
| `FC_WORKER_FUNCTION` | `templite-worker` | API fn only — enables async invoke |
| `FC_ENDPOINT` | `<account-id>.ap-southeast-1.fc.aliyuncs.com` | API fn only |
| `FC_REGION` | `ap-southeast-1` | API fn only |
| `GDRIVE_FOLDER_ID` | `...` | optional |
| `GDRIVE_REDIRECT_URI` | `https://templite.my/api/auth/callback` | must match Google console |
| `ALLOWED_ORIGINS` | `https://templite.my` | CORS |
| `SHEETS_WEBHOOK_URL` | `...` | optional order logging |

> If `FC_WORKER_FUNCTION`/`FC_ENDPOINT` are unset, the API function falls back to
> running the job in-process (local-dev behaviour) — do **not** leave them unset
> in production or the render will die when the instance freezes.

## 8. Re-authorize Google Drive (one time)

The OAuth token now lives in OSS at `config/token.json`, so it survives cold
starts. Authorize once after deploy:

```
https://templite.my/api/auth/google
```

Update the redirect URI in **Google Cloud Console → Credentials** to the new domain.

---

## What changed in the code

| Concern | Before (ECS) | After (FC) |
|---|---|---|
| Job status | in-memory `_jobs` dict | `jobstore.py` → OSS `jobs/<id>.json` |
| Background render | `asyncio.create_task` | `fc_async.submit_job` → async worker fn (`/invoke`) |
| Generated PDFs | local `generated_resume/` | `/tmp` → OSS `pdf/`, returned as signed URL |
| Profile images | local `images/`, relative path | `/tmp` → OSS `images/`, absolute signed URL |
| GDrive token | local `token.json` | OSS `config/token.json` |
| PDF cleanup | asyncio loop + `PDF_MAX_AGE` | OSS lifecycle rules |
| Concurrency cap | in-process semaphores | FC instance-concurrency=1 + max-instances |
| Frontend | served by FastAPI | OSS + CDN |

## Local development

Leave all `OSS_*` and `FC_*` vars unset. The app then uses the on-disk / in-memory
fallbacks (`token.json`, in-process job dict, local `images/`) exactly as before,
so `docker compose up` or `uvicorn main:app` still works without any Alibaba deps.

## Cost note

Scale-to-zero is cheapest but the first render after idle pays a Chromium cold
start (~10–30 s). One provisioned worker instance removes that but costs roughly
as much as a small ECS box — so it only pays off at low render volume. At high
volume (hundreds of renders/day) revisit whether FC still beats ECS.
