# Templite — New Deployment Plan (OSS + CDN frontend, Function Compute backend)

This plan replaces the single ECS box (see `DEPLOYMENT.md`) with a serverless
architecture on **Alibaba Cloud**:

- **Frontend** (React/Vite SPA) → **OSS** static bucket, fronted by **CDN**.
- **Backend** (FastAPI) → **Function Compute (FC)**, two functions sharing one
  container image.
- **State** (jobs, PDFs, images, Google token) → **OSS**, never local disk.

It is derived directly from this codebase and supersedes the older
`DEPLOYMENT_FC.md` (which had two things wrong — see [Appendix B](#appendix-b--corrections-vs-deployment_fcmd)).

---

## 0. The one constraint that shapes everything

`client/src/services/api.ts` starts with:

```ts
const API_BASE_URL = '';
```

Every API call (`/api/create-resume`, `/api/resume-status/...`,
`/api/upload-image`, …) is therefore **same-origin relative** — the browser
sends it to whatever host served the SPA. Requests also use
`credentials: 'include'`.

**Consequence:** the SPA and the API must answer on the **same public domain**.
The clean way to do that with OSS+CDN+FC is a single CDN domain with path-based
routing:

```
                         ┌──────────────────── templite.my (CDN) ───────────────────┐
User ─ HTTPS ─> CDN ─────┤  /              → OSS bucket  (React SPA static files)     │
                         │  /api/*         → FC HTTP trigger  (templite-api function) │
                         └───────────────────────────────────────────────────────────┘
                                                    │  async-invokes (server-side only)
                                                    ▼
                                          FC worker function (templite-worker)
                                             LLM + Chromium → PDF
                                                    │
                        OSS bucket: jobs/  pdf/  images/  config/token.json
```

> If you instead put the API on a separate subdomain (`api.templite.my`) you
> **must** edit `API_BASE_URL` to point at it and keep CORS + `credentials`
> working across origins. That is more moving parts for no benefit — prefer the
> single-domain path-routing setup above. This plan assumes it.

---

## 1. Architecture summary

Two FC functions run the **same container image** (`Dockerfile`):

| Function | Trigger | Serves | Memory | Timeout |
|---|---|---|---|---|
| `templite-api` | HTTP | `/api/*` — fast; returns a `job_id` | 1024 MB | 60 s |
| `templite-worker` | Async invoke | `/invoke` — LLM + Chromium PDF | 3072 MB | 300 s |

Why two functions: an FC instance is **frozen** the moment its HTTP response
returns, so the long render cannot run as a background task inside the API
request. The API function async-invokes the worker (`server/fc_async.py`); the
worker writes the result to the OSS job store (`server/jobstore.py` →
`oss_storage.py`); the browser polls `GET /api/resume-status/{job_id}`.

The image does **not** bundle the frontend — it is built separately and served
from OSS/CDN. This keeps the image small and cold starts short. (`main.py` still
has a `StaticFiles` mount as a fallback, but `client/dist` won't exist in the
image, so it's inert in production.)

---

## 2. Prerequisites

- Alibaba Cloud account with OSS, CDN, Function Compute, ACR, and RAM enabled.
- A region — this plan uses **`ap-southeast-1` (Singapore)** to match the current
  deployment. Keep **OSS, FC, and ACR all in the same region**.
- CLI tools on your machine: `ossutil`, `docker`, and either the Alibaba Cloud
  CLI (`aliyun`) or the console.
- Domain `templite.my` with DNS you control (currently Cloudflare — see §9).
- Secrets ready: `OPENAI_API_KEY`, Google OAuth `credentials.json`, and the
  optional `SHEETS_WEBHOOK_URL` / `GDRIVE_FOLDER_ID`.

---

## 3. Create the OSS bucket

1. OSS console → **create bucket**, e.g. `templite-prod`, region `ap-southeast-1`.
2. ACL: **private**. The SPA is served through CDN; PDFs/images go out as signed
   URLs (`oss_storage.signed_url`), so nothing needs public-read.
3. **Lifecycle rules** (these replace the old `PDF_MAX_AGE` cleanup task):
   - Prefix `pdf/` → expire after **1 day**
   - Prefix `jobs/` → expire after **1 day**
   - Prefix `images/` → expire after **7 days** (optional)
   - Do **not** expire `config/token.json` or the SPA files at the root.

Object layout the code expects (from `oss_storage.py`):

| Key prefix | Written by | Purpose |
|---|---|---|
| `jobs/<id>.json` | `jobstore` | job status/result (poll target) |
| `pdf/<file_id>_resume.pdf` | worker | generated PDF (signed URL to browser) |
| `images/<phone>.jpg` | `/api/upload-image` | profile photo (signed URL) |
| `config/token.json` | Google OAuth callback | Drive token, survives cold starts |
| `index.html`, `assets/…` | `npm run build` | the SPA itself |

---

## 4. Build & deploy the frontend to OSS

```bash
cd client
npm ci
npm run build            # → client/dist (Vite)
# upload the built SPA to the bucket root
ossutil cp -r dist/ oss://templite-prod/ --update
```

Notes:
- No frontend env vars are required at build time. `VITE_SHEETS_WEBHOOK_URL`
  exists in `client/.env` but is **not referenced** in `client/src` — order
  logging is done server-side via `/api/log-order`. You can ignore it.
- In OSS bucket → **Static Pages**, set **Default Homepage = `index.html`** and
  **Default 404 = `index.html`**. The 404-as-index rule is what makes client-side
  SPA routing work.

Re-run this block on every frontend change (add `ossutil` cache-refresh in §8).

---

## 5. Build & push the backend image (ACR)

The `Dockerfile` is FC-ready: Python 3.12-slim + Playwright Chromium, gunicorn
binding `$FC_SERVER_PORT` (default 9000), no frontend inside.

```bash
# from repo root
ACR=registry.ap-southeast-1.aliyuncs.com/<your-namespace>/templite
docker build -t $ACR:latest .
docker login registry.ap-southeast-1.aliyuncs.com   # ACR credentials
docker push $ACR:latest
```

`credentials.json` (Google OAuth **client** ID/secret) is baked into the image
by the Dockerfile — that's acceptable, it's not a user secret. **Do not** bake
`.env` or `token.json`; those are handled by function env vars (§7) and OSS.

---

## 6. Create the two Function Compute functions

Both use **Custom Container** with the image from §5, listening on port **9000**.

### 6a. `templite-api` (HTTP trigger)
- Memory **1024 MB**, timeout **60 s**.
- Trigger: **HTTP** (this URL is what CDN routes `/api/*` to).
- Enable **image acceleration** for faster cold starts.

### 6b. `templite-worker` (async)
- Same image. Memory **3072 MB** (Chromium ~350 MB + LLM + headroom),
  timeout **300 s**.
- **Instance concurrency = 1** — one render per instance; FC scales by adding
  instances. This replaces the old in-process `PDF_CONCURRENCY` semaphore.
- No trigger needed — it's reached only by the API function's async invoke,
  which FC delivers to `POST /invoke`.
- Optional: **provisioned instances = 1** to avoid a ~10–30 s Chromium cold start
  on the first render after idle (cost trade-off — see [Appendix A](#appendix-a--cost--scaling)).

---

## 7. RAM role & environment variables

### RAM role (no access keys stored anywhere)
Attach a RAM role to **both** functions granting:
- OSS read/write on the bucket (`AliyunOSSFullAccess`, or a bucket-scoped policy).
- `fc:InvokeFunction` on `templite-worker` (so `templite-api` can async-invoke it).

FC injects temporary STS creds as `ALIBABA_CLOUD_ACCESS_KEY_ID` /
`_SECRET` / `ALIBABA_CLOUD_SECURITY_TOKEN`. `oss_storage._make_auth()` and
`fc_async._async_invoke_fc()` read those automatically — **no keys in env**.

### Environment variables

Set on **both** functions unless noted:

| Variable | Example | Notes |
|---|---|---|
| `OPENAI_API_KEY` | `sk-…` | **required** — `main.py` refuses to start without it |
| `OSS_ENDPOINT` | `oss-ap-southeast-1-internal.aliyuncs.com` | **internal** endpoint (free, fast, in-region) |
| `OSS_PUBLIC_ENDPOINT` | `oss-ap-southeast-1.aliyuncs.com` | used to sign browser-facing URLs |
| `OSS_BUCKET` | `templite-prod` | |
| `ALLOWED_ORIGINS` | `https://templite.my` | CORS whitelist (`main.py`) |
| `GDRIVE_FOLDER_ID` | `…` | optional Drive archive folder |
| `GDRIVE_REDIRECT_URI` | `https://templite.my/api/auth/callback` | must match Google console |
| `SHEETS_WEBHOOK_URL` | `https://script.google.com/…/exec` | optional order logging |

**API function only** (enables the async dispatch path in `fc_async.py`):

| Variable | Example |
|---|---|
| `FC_WORKER_FUNCTION` | `templite-worker` |
| `FC_ENDPOINT` | `<account-id>.ap-southeast-1.fc.aliyuncs.com` |
| `FC_REGION` | `ap-southeast-1` |

> ⚠️ If `FC_WORKER_FUNCTION` / `FC_ENDPOINT` are unset, the API function silently
> falls back to running the render **in-process** (`fc_async.submit_job` →
> `asyncio.create_task`). On FC that job dies when the instance freezes after the
> HTTP response. **Never leave these unset in production.**

---

## 8. Wire up CDN with path routing

1. CDN console → add domain `templite.my`.
2. **Origins:**
   - Default / path `/` → origin = **OSS bucket** `templite-prod` (static SPA).
   - Path `/api/` (prefix) → origin = **`templite-api` HTTP trigger** hostname.
3. **Do NOT expose `/invoke`.** It is the worker's internal entrypoint
   (`main.py`) and is only ever hit by FC's async delivery — routing it through
   CDN would let anyone trigger renders. Only `/api/*` and the SPA are public.
4. Enable **HTTPS** on the CDN domain (upload a cert or use Alibaba's managed
   cert). Ensure origin-pull to the FC trigger preserves the `Host`/`Origin`
   headers so CORS (`ALLOWED_ORIGINS`) matches.
5. Add a CDN cache rule: cache SPA static assets aggressively, but **bypass
   cache for `/api/*`** (dynamic).
6. Point DNS (§9) at the CDN CNAME.

Frontend cache-busting on redeploy:
```bash
ossutil cp -r client/dist/ oss://templite-prod/ --update
aliyun cdn RefreshObjectCaches --ObjectPath "https://templite.my/" --ObjectType Directory
```

---

## 9. DNS & domain

Current setup (from `DEPLOYMENT.md`): registrar **GB Network**, DNS on
**Cloudflare**.

- Point `templite.my` (CNAME/flattened A) at the **CDN CNAME** Alibaba gives you.
- If you keep Cloudflare in front, set SSL to **Full** (not Flexible) so the hop
  to the CDN/FC origin stays HTTPS end-to-end. Simplest is to let Alibaba CDN
  terminate TLS and set Cloudflare to **DNS-only (grey cloud)** for this record
  to avoid double-proxying.

---

## 10. Google Drive re-authorization (one-time, after deploy)

The OAuth token now lives in OSS at `config/token.json` (via
`oss_storage.save_token`), so it survives cold starts.

1. In **Google Cloud Console → Credentials → OAuth 2.0 Client ID**, set the
   redirect URI to `https://templite.my/api/auth/callback` (must equal
   `GDRIVE_REDIRECT_URI`).
2. Visit `https://templite.my/api/auth/google` once and complete consent.
3. Confirm `https://templite.my/api/auth/status` returns `{"authorized": true}`.

---

## 11. Post-deploy smoke test

```bash
# 1. SPA loads
curl -I https://templite.my/                       # 200, text/html

# 2. API reachable, worker dispatch wired
curl -X POST https://templite.my/api/create-resume \
  -H 'Content-Type: application/json' \
  -d '{"resume":{"name":"Test"},"template":"A","language":"English"}'
# → {"job_id":"…"}

# 3. Poll until done — proves worker ran and wrote to OSS
curl https://templite.my/api/resume-status/<job_id>
# → {"status":"processing"} … then {"status":"done","pdf_url":"https://…"}

# 4. /invoke must NOT be reachable publicly
curl -i https://templite.my/invoke                 # expect 403/404 from CDN
```

Also open the site in a browser and run one real resume end-to-end (upload
photo → generate → download PDF), watching FC logs for both functions.

---

## 12. Redeploy cheatsheet

| Change | Action |
|---|---|
| Frontend only | `npm run build` → `ossutil cp -r dist/ oss://templite-prod/ --update` → CDN refresh |
| Backend only | `docker build` → `docker push` → update both FC functions to new image tag |
| Env/config | Edit env vars on the FC function(s); no rebuild needed |
| Secrets rotation | Update FC env vars; re-auth Drive if token invalidated |

---

## Appendix A — Cost & scaling

- **Scale-to-zero** is cheapest but the first render after idle pays a Chromium
  cold start (~10–30 s). One **provisioned worker instance** removes that but
  costs roughly a small always-on box — worth it only at low, latency-sensitive
  volume.
- Concurrency is bounded by `templite-worker` **instance-concurrency = 1** ×
  **max instances**. Set max instances to cap spend and match your OpenAI rate
  limits.
- At hundreds of renders/day, re-evaluate whether FC still beats the old ECS box.

## Appendix B — Corrections vs `DEPLOYMENT_FC.md`

The older FC doc has two issues this plan fixes:

1. It suggests routing **`/invoke`** through the CDN alongside `/api/*`. Don't —
   `/invoke` is the worker's internal entrypoint and must stay private (§8, §11).
2. It floats a separate `api.templite.my` subdomain as "simpler." With
   `API_BASE_URL = ''` in the frontend that would actually **break** the SPA
   unless you also edit `api.ts`. Single-domain path routing is the correct
   default (§0).

## Appendix C — What changed vs the ECS design (`DEPLOYMENT.md`)

| Concern | Before (ECS) | After (OSS + CDN + FC) |
|---|---|---|
| Job status | in-memory `_jobs` dict | `jobstore.py` → OSS `jobs/<id>.json` |
| Background render | `asyncio.create_task` in-process | `fc_async.submit_job` → async worker fn (`/invoke`) |
| Generated PDFs | local `generated_resume/` | `/tmp` → OSS `pdf/`, signed URL |
| Profile images | local `images/`, relative path | `/tmp` → OSS `images/`, absolute signed URL |
| Drive token | local `token.json` | OSS `config/token.json` |
| PDF cleanup | asyncio loop + `PDF_MAX_AGE` | OSS lifecycle rules |
| Concurrency cap | in-process semaphores | FC instance-concurrency=1 + max-instances |
| Frontend | served by FastAPI (`StaticFiles`) | OSS + CDN |
| TLS / proxy | Nginx + Cloudflare | CDN (+ optional Cloudflare DNS-only) |

## Appendix D — Local development is unchanged

Leave all `OSS_*` and `FC_*` vars unset. The code then uses on-disk / in-memory
fallbacks (in-process job dict in `jobstore.py`, `asyncio.create_task` in
`fc_async.py`, local `token.json`, local `images/`), so `docker compose up` or
`uvicorn main:app` still works with no Alibaba dependencies. The Vite dev server
proxies `/api` to `127.0.0.1:8000` (`client/vite.config.ts`).
