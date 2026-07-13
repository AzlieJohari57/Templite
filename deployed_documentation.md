# Templite — Deployed Production Documentation

**Live at <https://templite.my>** — cut over 2026-07-13 from the old single-ECS box.
Every value in this file was **read back from the live deployment**, not remembered.

This supersedes `deployment_new.md` (right in shape, wrong in several details) and
`DEPLOYMENT.md` / `DEPLOYMENT_FC.md` (both obsolete). The old ECS box
`47.237.116.213` no longer serves traffic.

If prod is broken and you are a fresh LLM session: read [§1](#1-architecture),
then [§9 Gotchas](#9-gotchas--every-real-failure-we-hit) — the bug you are looking
at is probably one we already hit.

---

## 1. Architecture

```
                     Cloudflare Worker "templite-router"
                     custom domain: templite.my  (apex, no DNS A record)
                                     │
             ┌───────────────────────┴───────────────────────────┐
             │                                                   │
   path /api/*                                        everything else
             │                                                   │
             ▼                                                   ▼
   FC "templite-api"                                   OSS bucket "templite-prod"
   https://templite-api-jevfmougma                     index.html + assets/*
        .ap-southeast-1.fcapp.run                      (public-read objects)
   HTTP trigger, authType=anonymous
             │
             │  async invoke  (FC OpenAPI InvokeFunction, x-fc-invocation-type: Async)
             │  → FC delivers it to the worker as  POST /invoke
             ▼
   FC "templite-worker"
   https://templite-worker-qbkbetmbzu.ap-southeast-1.fcapp.run
   HTTP trigger, authType=function  (NOT publicly routed — see §5.3)
   LLM (OpenAI) + Playwright/Chromium → PDF
             │
             ▼
   OSS bucket "templite-prod":  jobs/<id>.json   pdf/<file>.pdf
                                images/<phone>.jpg   config/token.json
```

**Both FC functions run the exact same container image.** They never talk to each
other directly — the API function async-invokes the worker, the worker writes the
result to `jobs/<id>.json` in OSS, and the browser polls
`GET /api/resume-status/{job_id}` which reads that same object. OSS is the only
shared state.

**Why two functions:** an FC instance is frozen the moment its HTTP response
returns, so a 60–120 s render cannot run as a background task inside the API
request — it would be killed. See [server/fc_async.py](server/fc_async.py).

---

## 2. Every URL in the system

| What | URL |
|---|---|
| **Production site** | <https://templite.my> |
| API (through the Worker) | `https://templite.my/api/*` |
| Worker preview URL (bypasses custom domain) | <https://templite-router.templite4u.workers.dev> |
| FC API function, public | `https://templite-api-jevfmougma.ap-southeast-1.fcapp.run` |
| FC API function, VPC-internal | `https://templite-api-jevfmougma.ap-southeast-1-vpc.fcapp.run` |
| FC worker function, public | `https://templite-worker-qbkbetmbzu.ap-southeast-1.fcapp.run` (signature-auth; do not route) |
| OSS bucket, public endpoint | `https://templite-prod.oss-ap-southeast-1.aliyuncs.com` |
| OSS endpoint used for signing | `https://oss-ap-southeast-1.aliyuncs.com` |
| OSS endpoint used from inside FC | `oss-ap-southeast-1-internal.aliyuncs.com` (free, in-region) |
| ACR registry (docker push from laptop) | `crpi-3mhayudihrajw76i.ap-southeast-1.personal.cr.aliyuncs.com` |
| ACR registry (what FC pulls from) | `crpi-3mhayudihrajw76i-vpc.ap-southeast-1.personal.cr.aliyuncs.com` |
| FC OpenAPI endpoint (used by fc_async) | `5269171254616099.ap-southeast-1.fc.aliyuncs.com` |
| Google OAuth redirect | `https://templite.my/api/auth/callback` |
| Google auth kickoff / status | `https://templite.my/api/auth/google` · `https://templite.my/api/auth/status` |
| Sheets webhook | `https://script.google.com/macros/s/AKfycbxLtYb7Vmc2Kz…/exec` (full value in `.env`) |

### Console locations

| Resource | Where to click |
|---|---|
| OSS bucket | OSS console → Buckets → `templite-prod` (region Singapore) |
| Bucket public/private | bucket → Permission Control → Block Public Access / ACL |
| Static page rules | bucket → Data Management → Static Page |
| Lifecycle rules | bucket → Data Management → Lifecycle |
| FC functions | Function Compute → Function Management → Functions (region **Singapore**) |
| FC env vars | function → Function Details → **Edit Environment Variables** (JSON Editor) |
| FC image | function → Function Details → **Modify Image** |
| FC trigger auth | function → **Triggers** tab → `defaultTrigger` |
| ACR | Container Registry → Instances → **Personal Edition** |
| ACR docker password | ACR → Access Credential → **Set Password** |
| RAM role | RAM → Identities → Roles → `templite-fc-role` |
| RAM user | RAM → Identities → Users → `templite-deploy` |
| Cloudflare Worker | Cloudflare → Compute → Workers & Pages → `templite-router` |
| Worker custom domain | Worker → **Domains** tab |
| DNS | Cloudflare → `templite.my` → DNS → Records |

---

## 3. Account & resource inventory

| Thing | Value |
|---|---|
| Alibaba account | `templite4u@gmail.com` |
| **Alibaba Account ID** | **5269171254616099** |
| Region — everything lives here | **ap-southeast-1 (Singapore)** |
| OSS bucket | `templite-prod`, Standard, LRS, private bucket |
| ACR edition | **Personal Edition** (free, *no SLA* — see §10) |
| ACR instance ID | `crpi-3mhayudihrajw76i` |
| ACR namespace / repo | `templite` / `templite` (private) |
| **Current image tag** | **`v5`** |
| Current image digest | `sha256:fa62514106db529722b5f98e7103937dce3eb2d96456930534cb33c5959b21b8` |
| Cloudflare account | `Templite4u@gmail.com`, zone `templite.my` (Free plan) |
| Cloudflare Workers subdomain | `templite4u.workers.dev` |

---

## 4. Function Compute — exact live config

Read back from `aliyun fc GET /2023-03-30/functions/<name>` on 2026-07-13.

### 4.1 `templite-api`

| Setting | Value |
|---|---|
| state | `Active` |
| runtime | `custom-container` |
| image | `crpi-3mhayudihrajw76i-vpc.ap-southeast-1.personal.cr.aliyuncs.com/templite/templite:v5` |
| listening port | **9000** |
| startup command | *(none — uses the image's `CMD`; "Default Mode" in the console)* |
| vCPU / memory / disk | **0.5 vCPU / 1024 MB / 512 MB** |
| timeout | **60 s** |
| instance concurrency | **20** |
| min instances | **0** (scales to zero) |
| RAM role | `acs:ram::5269171254616099:role/templite-fc-role` |
| trigger | `defaultTrigger`, type `http`, **`authType: anonymous`**, methods `GET,POST,PUT,DELETE,HEAD,OPTIONS,PATCH` |

### 4.2 `templite-worker`

| Setting | Value |
|---|---|
| state | `Active` |
| runtime | `custom-container` |
| image | same as above (`:v5`, same digest) |
| listening port | **9000** |
| vCPU / memory / disk | **2 vCPU / 3072 MB / 512 MB** (Chromium ~350 MB + LLM + headroom) |
| timeout | **300 s** |
| instance concurrency | **1** ← one render per instance; FC scales by adding instances. This replaces the old in-process `PDF_CONCURRENCY` semaphore. |
| min instances | **0** |
| RAM role | `acs:ram::5269171254616099:role/templite-fc-role` |
| trigger | `defaultTrigger`, type `http`, **`authType: function`** (signature auth — intentional, see §5.3) |

### 4.3 Environment variables — `templite-api`

Set in the console via **Edit Environment Variables → JSON Editor**:

```json
{
  "OPENAI_API_KEY": "<see .env — sk-proj-…>",
  "OSS_ENDPOINT": "oss-ap-southeast-1-internal.aliyuncs.com",
  "OSS_PUBLIC_ENDPOINT": "https://oss-ap-southeast-1.aliyuncs.com",
  "OSS_BUCKET": "templite-prod",
  "ALLOWED_ORIGINS": "https://templite.my",
  "GDRIVE_FOLDER_ID": "1GAErFJQymnBL0XUCD-6VQ5aOtdZSYBrT",
  "GDRIVE_REDIRECT_URI": "https://templite.my/api/auth/callback",
  "SHEETS_WEBHOOK_URL": "<see .env — https://script.google.com/macros/s/…/exec>",
  "WORKER_FUNCTION": "templite-worker",
  "WORKER_FC_ENDPOINT": "5269171254616099.ap-southeast-1.fc.aliyuncs.com",
  "WORKER_FC_REGION": "ap-southeast-1"
}
```

### 4.4 Environment variables — `templite-worker`

Identical **minus the three `WORKER_*` keys** (the worker dispatches nothing):

```json
{
  "OPENAI_API_KEY": "<see .env>",
  "OSS_ENDPOINT": "oss-ap-southeast-1-internal.aliyuncs.com",
  "OSS_PUBLIC_ENDPOINT": "https://oss-ap-southeast-1.aliyuncs.com",
  "OSS_BUCKET": "templite-prod",
  "ALLOWED_ORIGINS": "https://templite.my",
  "GDRIVE_FOLDER_ID": "1GAErFJQymnBL0XUCD-6VQ5aOtdZSYBrT",
  "GDRIVE_REDIRECT_URI": "https://templite.my/api/auth/callback",
  "SHEETS_WEBHOOK_URL": "<see .env>"
}
```

### 4.5 Three env-var rules that will bite you

1. **`FC_` is a reserved prefix.** FC rejects any env var starting with `FC_`
   (`"The environment variable name 'FC_WORKER_FUNCTION' is reserved by Function
   Compute"`). That is why the code reads `WORKER_FUNCTION` /
   `WORKER_FC_ENDPOINT` / `WORKER_FC_REGION`.
2. **`OSS_PUBLIC_ENDPOINT` must include `https://`.** Without the scheme, oss2
   signs `http://` PDF URLs → browser blocks them as mixed content on an https page.
3. **Never leave `WORKER_FUNCTION` / `WORKER_FC_ENDPOINT` unset on templite-api.**
   `fc_async.submit_job()` silently falls back to an in-process
   `asyncio.create_task` — correct locally, fatal on FC (the instance freezes and
   the task dies). Symptom: you get a `job_id`, then poll `processing` forever.

---

## 5. Cloudflare Worker — the front door

### 5.1 Why it exists

`client/src/services/api.ts` starts with `const API_BASE_URL = '';` — every API
call is a **same-origin relative path**. So the SPA and the API must answer on one
domain. The Worker is what makes that true: `/api/*` → FC, everything else → OSS.

It also strips `Content-Disposition: attachment`, which OSS forces on its default
domain (§9.5).

### 5.2 Source (`templite-router`, deployed via Cloudflare dashboard → Edit code)

```js
const OSS = "https://templite-prod.oss-ap-southeast-1.aliyuncs.com";
const API = "https://templite-api-jevfmougma.ap-southeast-1.fcapp.run";

async function fromOss(path) {
  const res = await fetch(OSS + path);
  const headers = new Headers(res.headers);
  headers.delete("content-disposition");   // OSS default domain forces download
  headers.delete("x-oss-force-download");
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return fetch(new Request(API + url.pathname + url.search, request));
    }

    const key = url.pathname === "/" ? "/index.html" : url.pathname;
    let res = await fromOss(key);

    if (res.status === 403 || res.status === 404) {   // SPA client-side routing
      res = await fromOss("/index.html");
      const headers = new Headers(res.headers);
      headers.set("content-type", "text/html; charset=utf-8");
      return new Response(res.body, { status: 200, headers });
    }
    return res;
  },
};
```

### 5.3 `/invoke` is not exposed

`/invoke` is the worker's internal entrypoint ([server/main.py](server/main.py)),
hit only by FC's async delivery. The Worker forwards **only `/api/*`** to FC, so
`https://templite.my/invoke` falls through to the SPA and returns `index.html`
(HTTP 200, `text/html`). That is expected and safe — verify with:

```bash
curl -s https://templite.my/invoke | head -c 40   # → <!doctype html>
```

Belt and braces: the worker function's own HTTP trigger uses `authType: function`
(signature auth), so even its direct fcapp.run URL rejects unsigned requests.

### 5.4 DNS / domain

- `templite.my` (apex) is a **Custom Domain on the Worker** — Cloudflare manages it
  internally; there is **no A/CNAME record** for the apex in the DNS tab any more.
  The old `templite.my A → 47.237.116.213` record was **deleted** at cutover.
- `www.templite.my` **still has `A → 47.237.116.213`** (dead ECS box). Not fixed yet — see §10.
- Rollback: re-create `templite.my A → 47.237.116.213` (proxied) and remove the
  Worker custom domain.

---

## 6. OSS bucket `templite-prod`

### 6.1 Object layout

| Key | Written by | ACL | Notes |
|---|---|---|---|
| `index.html` | `npm run build` → ossutil | **public-read** | the SPA |
| `assets/*` | `npm run build` → ossutil | **public-read** | JS/CSS/images |
| `jobs/<job_id>.json` | `server/jobstore.py` | private | poll target; **holds the real error when a job fails** |
| `pdf/<file_id>_resume.pdf` | worker | private | handed to browser as a signed URL (2 h TTL) |
| `images/<phone>.jpg` | `POST /api/upload-image` | private | signed URL |
| `config/token.json` | Google OAuth callback | private | Drive token, survives cold starts |

Bucket ACL is **private**; only the SPA objects are individually public-read.
Verify at any time:

```bash
curl -o /dev/null -w "%{http_code}\n" https://templite-prod.oss-ap-southeast-1.aliyuncs.com/index.html   # 200
curl -o /dev/null -w "%{http_code}\n" https://templite-prod.oss-ap-southeast-1.aliyuncs.com/pdf/x.pdf    # 403
```

### 6.2 Bucket settings applied

- **Block Public Access: DISABLED** (bucket → Permission Control). Required, or
  public-read object ACLs are refused.
- **Static Page** (bucket → Data Management → Static Page):
  Default Homepage `index.html`, Default 404 Page `index.html`.
  *(Largely vestigial — the Worker does the SPA fallback itself, since the OSS
  website endpoint `templite-prod.oss-website-ap-southeast-1.aliyuncs.com` does
  not resolve.)*
- **Lifecycle** (bucket → Data Management → Lifecycle), 2 rules, both
  `Modified Time` / **1 day** / `Delete Data (Permanent)`:
  - prefix `pdf/`
  - prefix `jobs/`
  These replace the old in-process `PDF_MAX_AGE` cleanup loop.

---

## 7. Identity & permissions

### 7.1 `templite-fc-role` — assumed by BOTH functions

Trusted entity: **Cloud Service → Function Compute** (`fc.aliyuncs.com`).
ARN: `acs:ram::5269171254616099:role/templite-fc-role`

Attached policies — **all three are required**:

| Policy | Why |
|---|---|
| `AliyunOSSFullAccess` | read/write jobs, pdf, images, token in the bucket |
| `AliyunFCFullAccess` | lets `templite-api` async-invoke `templite-worker` |
| `AliyunContainerRegistryReadOnlyAccess` | **lets FC pull the private ACR image.** Without it the function sits in `Pending` forever (§9.3) |

FC injects temporary STS credentials into the container as
`ALIBABA_CLOUD_ACCESS_KEY_ID` / `_SECRET` / `_SECURITY_TOKEN`.
`oss_storage._make_auth()` and `fc_async._async_invoke_fc()` pick these up
automatically — **there are no access keys in any env var**.

### 7.2 `templite-deploy` — RAM user, for the dev machine only

Policies: `AliyunOSSFullAccess`, `AliyunFCFullAccess`.
Its AccessKey pair is used locally by `ossutil` (uploading the SPA) and the
`aliyun` CLI (updating functions). **Not stored in the repo** — keep it in your
password manager. If it leaks: RAM → Users → templite-deploy → Credential → delete
the key, create a new one.

### 7.3 ACR docker login

```bash
docker login crpi-3mhayudihrajw76i.ap-southeast-1.personal.cr.aliyuncs.com \
  --username templite4u@gmail.com
# password = the ACR "Docker login password" (ACR → Access Credential → Set Password)
#            NOT the Alibaba console password
```

`docker login registry.ap-southeast-1.aliyuncs.com` does **not** work — Personal
Edition has its own `crpi-*` host.

---

## 8. Redeploy procedures

Tooling used (both downloaded to the scratchpad, not installed system-wide):
`ossutil` v2.1.2, `aliyun` CLI v3.4.6 (profile `templite`, configured with the
`templite-deploy` AccessKey), Docker Desktop.

### 8.1 Frontend change

```bash
cd client
npm ci && npm run build          # → client/dist

CRED="-e oss-ap-southeast-1.aliyuncs.com --region ap-southeast-1 -i <AK> -k <SK>"
ossutil cp -r dist/ oss://templite-prod/ --update $CRED

# freshly-uploaded objects are PRIVATE by default → re-publish the SPA:
ossutil set-props oss://templite-prod/index.html --acl public-read $CRED
ossutil set-props oss://templite-prod/assets/    --acl public-read -r -f $CRED
```

ossutil v2 syntax notes (v1 docs will mislead you):
- ACL is set with **`set-props --acl public-read`**, not `set-acl <acl>`.
- Recursive needs **`-r -f`**. Without `-f` it prompts `(y or N)` and, in a
  non-interactive shell, silently **cancels**.
- `--region` is mandatory (v4 signing), or you get
  `Error: region must be set in sign version 4`.

No CDN purge needed — Cloudflare caches nothing here by default (`CF-Cache-Status:
DYNAMIC`). Hard-refresh the browser if you see a stale bundle.

### 8.2 Backend change

```bash
# 1. build — the two flags are MANDATORY (see §9.2)
TAG=v4
IMG=crpi-3mhayudihrajw76i.ap-southeast-1.personal.cr.aliyuncs.com/templite/templite:$TAG
docker build --platform linux/amd64 --provenance=false --sbom=false -t $IMG .

# 2. push
docker push $IMG

# 3. repoint BOTH functions at the new tag (note the -vpc host for FC)
VPCIMG=crpi-3mhayudihrajw76i-vpc.ap-southeast-1.personal.cr.aliyuncs.com/templite/templite:$TAG
for f in templite-api templite-worker; do
  MSYS_NO_PATHCONV=1 aliyun fc PUT /2023-03-30/functions/$f \
    --header "Content-Type=application/json" \
    --body "{\"customContainerConfig\":{\"image\":\"$VPCIMG\",\"port\":9000}}" \
    --profile templite
done

# 4. wait for Active (takes ~30-60 s)
MSYS_NO_PATHCONV=1 aliyun fc GET /2023-03-30/functions/templite-api --profile templite
```

- **Always use a NEW tag** (v4, v5 …). FC pins the image **digest** at deploy time;
  re-pushing the same tag does not update a running function, and overwriting a tag
  a function points at can break it.
- Alternatively via console: function → **Modify Image** → Select a Container
  Registry image → pick the tag → Deploy. (Check the digest shown matches your push.)
- On Git Bash/Windows, **prefix every `aliyun` call with `MSYS_NO_PATHCONV=1`** or
  the `/2023-03-30/...` API path is mangled into `C:/Program Files/Git/2023-03-30/...`.

### 8.3 Env / config change

FC console → function → **Edit Environment Variables** → JSON Editor → Deploy.
No rebuild. Applies within seconds. Do it on **both** functions when the var is shared.

### 8.4 Worker change

Cloudflare → Workers & Pages → `templite-router` → **Edit code** → Deploy.
Instant, and versioned (you can roll back from the Deployments tab).

---

## 9. Gotchas — every real failure we hit

If prod is down, start here.

### 9.1 `FC_` env prefix is reserved
**Symptom:** deploying env vars fails —
`The environment variable name 'FC_WORKER_FUNCTION' is reserved by Function Compute`.
**Fix:** [server/fc_async.py](server/fc_async.py) reads `WORKER_FUNCTION`,
`WORKER_FC_ENDPOINT`, `WORKER_FC_REGION` (with a fallback to FC's own injected
`FC_REGION`). Don't "helpfully" rename them back.

### 9.2 buildx attestations → `invalid image, platform of image is unknown/unknown`
**Symptom:** function state goes to `Failed`, stateReason
`invalid image, platform of image is unknown/unknown`.
**Cause:** modern `docker build` attaches provenance/SBOM attestations, which show
up as `unknown/unknown` platform entries in the manifest list. FC refuses it.
**Fix:** build with `--provenance=false --sbom=false`. (This is why the live tag is
`v5` and not `latest` — `latest` is a poisoned attestation manifest. Do not point a
function at `:latest`.)

### 9.3 Function stuck `Pending` forever → `PullImageFailed: accelerated image not ready`
**Symptom:** every request returns
`{"Code":"PullImageFailed","Message":"Failed to pull image. failed to create
container due to accelerated image not ready"}`, and
`GET /functions/<name>` shows `state: Pending — The function is being created.`
for 30+ minutes.
**Cause:** the ACR repo is **private** and `templite-fc-role` had **no ACR read
permission**, so FC could never pull the image. The error message is misleading —
it blames acceleration, not permissions.
**Fix:** attach `AliyunContainerRegistryReadOnlyAccess` to `templite-fc-role`.
(Once it could pull, the *real* error surfaced — which was 9.2.)

### 9.4 FC SDK: wrong async-invoke call → `502 Could not start resume generation`
**Symptom:** `POST /api/create-resume` → `502 {"detail":"Could not start resume
generation."}`. The real error was
`InvokeFunctionRequest.__init__() got an unexpected keyword argument 'x_fc_invocation_type'`.
**Cause:** in `alibabacloud_fc20230330`, `InvokeFunctionRequest` takes only
`(body: BinaryIO, qualifier)`. The invocation type belongs in **headers**.
**Correct shape** (now in [server/fc_async.py](server/fc_async.py)):

```python
request = fc_models.InvokeFunctionRequest(body=io.BytesIO(body))
headers = fc_models.InvokeFunctionHeaders(x_fc_invocation_type="Async")
client.invoke_function_with_options(
    FC_WORKER_FUNCTION, request, headers, util_models.RuntimeOptions()
)
```

**🔑 THE DEBUGGING TRICK:** `/api/create-resume` swallows the exception and returns
a generic 502 — but `jobstore.create_job()` has *already written the job record*,
and the handler writes the true exception into it. **The real error is always in
`oss://templite-prod/jobs/<job_id>.json` under `"error"`.** Read it:

```bash
ossutil ls  oss://templite-prod/jobs/ $CRED          # find the newest
ossutil cat oss://templite-prod/jobs/<id>.json $CRED
```

### 9.5 OSS forces downloads → the browser downloads `index.html` instead of rendering it
**Symptom:** visiting https://templite.my downloads a `.htm` file.
**Cause:** OSS returns `X-Oss-Force-Download: true` + `Content-Disposition:
attachment` for objects served from its *default* domain (anti-abuse policy).
**Fix:** the Worker deletes both headers (§5.2). Verify:

```bash
curl -s -D - -o /dev/null https://templite.my/ | grep -i content-disposition   # must be EMPTY
```

### 9.6 Signed PDF URLs came back as `http://`
**Symptom:** `pdf_url` in the job result starts with `http://` → browser blocks it
as mixed content.
**Fix:** `OSS_PUBLIC_ENDPOINT` must be `https://oss-ap-southeast-1.aliyuncs.com`
(with scheme) on **both** functions.

### 9.7 New HTTP triggers default to Signature Authentication
**Symptom:** browser/curl gets 403 from the API function.
**Fix:** `templite-api` → Triggers → `defaultTrigger` → **No Authentication**
(`authType: anonymous`). The Worker is the only thing in front of it.
`templite-worker` is deliberately left on signature auth.

### 9.8 ACR Personal Edition login host
`docker login registry.ap-southeast-1.aliyuncs.com` → `unauthorized`.
Personal Edition has its own host: `crpi-3mhayudihrajw76i.ap-southeast-1.personal.cr.aliyuncs.com`
(ACR → Access Credential shows the exact command). Username = account email;
password = the separately-set Docker login password.

### 9.9 OSS raises `NotFound`, not `NoSuchKey`, for a missing object
**Symptom:** `GET /api/auth/status` → `500 Internal Server Error`; Google Drive
uploads silently never happen (the PDF still renders and lands in OSS — only the
Drive leg is dead).
**Cause:** `oss_storage.get_bytes()` caught only `oss2.exceptions.NoSuchKey`, but
OSS returns a bare 404 → `oss2.exceptions.NotFound`. So a *missing*
`config/token.json` raised instead of returning `None`, and every code path that
checks "are we authorized?" blew up.
**Fix:** catch `oss2.exceptions.NotFound` (it is the parent of `NoSuchKey`).

### 9.10 OAuth flow stored in a module global doesn't survive FC
**Symptom:** `/api/auth/callback` fails with *"No active auth flow. Visit
/api/auth/google first."* even though you just did.
**Cause:** `gdrive._active_flow` is an in-memory global. On FC, `/auth/google` and
`/auth/callback` can land on different instances (or the instance freezes between
the two requests), so the flow is gone.
**Fix:** `save_token_from_code()` now rebuilds the `Flow` from `credentials.json`
+ `GDRIVE_REDIRECT_URI` when the global is empty. The code exchange needs nothing
else.

### 9.11 FC forbids external HTTP redirects → `ExternalRedirectForbidden`
**Symptom:** visiting `/api/auth/google` returns
`{"Code":"ExternalRedirectForbidden","Message":"The external redirect is forbidden,
please use custom domain endpoint"}`.
**Cause:** FC refuses to emit a 3xx to an external host from its default
`*.fcapp.run` domain.
**Fix:** `/api/auth/google` returns a small HTML page with a `meta refresh` that
navigates the browser to Google, instead of a `RedirectResponse`.

### 9.12 FC's default domain also forces downloads
Like OSS (§9.5), `*.fcapp.run` sets `Content-Disposition: attachment` on responses.
Harmless for the SPA (`fetch()` ignores it), but **directly navigating** to an API
URL in a browser downloads a `.json` file instead of displaying it. That is why
`/api/auth/callback` "downloaded callback.json" — the authorization still succeeded.

### 9.13 Windows/Git-Bash tooling papercuts
- `aliyun` CLI: prefix with `MSYS_NO_PATHCONV=1` (API path mangling).
- `npm` misbehaves under PowerShell's constrained language mode — use Git Bash.
- `ossutil` needs `--region` (v4 signing) and `-f` for recursive ops.

---

## 10. Known TODO / risks

1. **`www.templite.my` still points at the dead ECS box** (`A → 47.237.116.213`).
   Delete that DNS record and add `www.templite.my` as a second Custom Domain on
   the `templite-router` Worker.
2. ~~Google Drive re-authorization~~ — **DONE 2026-07-13.**
   Redirect URI `https://templite.my/api/auth/callback` is registered on the OAuth
   client (`templitewebapp`, client ID `1096750676922-9b10j276imc42qgph84lafu76aq25k8n`),
   consent completed, token persisted to `oss://templite-prod/config/token.json`.
   `/api/auth/status` → `{"authorized": true}`, and jobs now return a `drive_url`.
   To re-authorize (e.g. token revoked): visit `https://templite.my/api/auth/google`.
3. **ACR Personal Edition has no SLA** and Alibaba explicitly says it is not for
   production. Migrate to ACR Enterprise Edition if traffic becomes real.
   (Also: from 2026-02-01 FC will not pull *cross-region* Personal Edition images —
   ours is same-region, so we're fine for now.)
4. **No FC logging configured.** SLS Log Monitoring was left disabled, so the only
   backend error trail is the job JSON in OSS (§9.4). Enable it.
5. **Cold start:** first render after idle pays a Chromium cold start (~10–30 s).
   Set `templite-worker` min instances to 1 to remove it (costs ~an always-on box).
6. **Secrets in FC env vars** are plaintext in the console. `OPENAI_API_KEY` is the
   one worth rotating if the account is ever shared.

---

## 11. Health check / smoke test

```bash
# 1. SPA renders — must be text/html AND have no content-disposition
curl -s -D - -o /dev/null https://templite.my/ | grep -iE "^(HTTP|content-type|content-disposition)"

# 2. SPA client-side routing works
curl -s -o /dev/null -w "%{http_code}\n" https://templite.my/builder     # 200

# 3. API alive + worker dispatch wired
curl -X POST https://templite.my/api/create-resume \
  -H 'Content-Type: application/json' \
  -d '{"resume":{"name":"Smoke Test"},"template":"A","language":"English"}'
# → {"job_id":"…"}

# 4. THE test — proves async invoke reached the worker, it rendered,
#    and it wrote back to OSS. pdf_url MUST be https://
curl https://templite.my/api/resume-status/<job_id>
# → {"status":"processing"} … then {"status":"done","pdf_url":"https://…"}

# 5. worker entrypoint is not publicly routed (should return the SPA, not JSON)
curl -s https://templite.my/invoke | head -c 40      # → <!doctype html>

# 6. both functions Active
MSYS_NO_PATHCONV=1 aliyun fc GET /2023-03-30/functions/templite-api    --profile templite
MSYS_NO_PATHCONV=1 aliyun fc GET /2023-03-30/functions/templite-worker --profile templite
```

If step 4 hangs on `processing` forever → check `WORKER_FUNCTION` /
`WORKER_FC_ENDPOINT` are still set on `templite-api` (§4.5), then read the job JSON
in OSS (§9.4).

---

## 12. Local development is unchanged

Leave all `OSS_*` and `WORKER_*` vars unset. The code then uses its on-disk /
in-memory fallbacks — in-process job dict in `jobstore.py`, `asyncio.create_task`
in `fc_async.py`, local `token.json`, local `images/` — so `docker compose up` or
`uvicorn main:app` works with zero Alibaba dependencies. The Vite dev server
proxies `/api` → `127.0.0.1:8000` (`client/vite.config.ts`).
