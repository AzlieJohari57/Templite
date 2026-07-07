# Templite — Deployment Guide

## Infrastructure Overview

| Component | Details |
|---|---|
| **Server** | Alibaba Cloud ECS |
| **Instance ID** | i-t4n1jty5eu3as28y18rw |
| **Specs** | 4 vCPU, 16 GiB RAM |
| **OS** | Alibaba Cloud Linux (CentOS-based) |
| **Region** | Singapore |
| **Public IP** | 47.237.116.213 |
| **App directory** | `/opt/Templite` |
| **Domain** | templite.my |
| **Domain Registrar** | GB Network |
| **DNS** | Cloudflare (Flexible SSL) |
| **Nameservers** | davina.ns.cloudflare.com, watson.ns.cloudflare.com |

## Architecture

```
User → HTTPS → Cloudflare → HTTP:80 → Nginx → HTTP:8000 → Docker (Gunicorn + Uvicorn + FastAPI)
```

## Services Used

| Service | Purpose |
|---|---|
| Alibaba Cloud ECS | Virtual server hosting the app |
| Docker + Docker Compose | Containerisation |
| Gunicorn + Uvicorn | Python ASGI web server (1 worker) |
| Nginx | Reverse proxy (port 80 → 8000) |
| Cloudflare | DNS management + free SSL (Flexible mode) |
| GB Network | Domain registrar for templite.my |
| OpenAI API (gpt-4o-mini) | LLM resume enhancement |
| Google Drive API | PDF + image upload |
| Playwright / Chromium | HTML → PDF conversion |

## Key Configuration Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Container config, memory limits, env vars |
| `Dockerfile` | Multi-stage build (Node → Python + Playwright) |
| `server/main.py` | FastAPI app, semaphores, job store |
| `server/create_resume.py` | LLM + PDF pipeline |
| `.env` | API keys (never commit this) |
| `credentials.json` | Google OAuth client ID/secret |
| `/etc/nginx/conf.d/templite.conf` | Nginx reverse proxy config (on server) |

## Memory Limits (on server)

| Component | Peak |
|---|---|
| OS + Docker daemon | ~500 MB |
| Container hard cap | 6 GB (set in docker-compose.yml) |
| 2× Chromium (PDF_CONCURRENCY=2) | ~800 MB |
| 6× LLM threads (LLM_CONCURRENCY=6) | ~300 MB |
| Actual peak usage | ~2.1 GB |
| Free headroom | ~13.9 GB |

---

## Connecting to the Server

Use the Alibaba Cloud ECS Workbench (browser terminal) or SSH:

```bash
ssh root@47.237.116.213
```

---

## How to Push Future Code Changes to Production

### Step 1 — Make changes locally

Edit files in `C:\Users\azlie\OneDrive\Desktop\Templite` as needed.

### Step 2 — Upload changed files to server

Open PowerShell on your Windows machine:

```powershell
scp -r "C:\Users\azlie\OneDrive\Desktop\Templite" root@47.237.116.213:/opt/
```

Enter your root password when prompted.

### Step 3 — Rebuild and restart on server

Connect to the ECS terminal, then:

```bash
cd /opt/Templite
docker compose down
docker compose build --no-cache
docker compose up -d
```

> First build takes 5–8 minutes (Playwright + Chromium). Subsequent builds are faster if only Python/JS files changed.

### Step 4 — Verify it's running

```bash
docker compose logs -f
```

You should see:
```
Application startup complete.
```

Press `Ctrl+C` to stop watching logs.

---

## Useful Server Commands

```bash
# Check container status
docker ps

# Watch live logs
docker compose -f /opt/Templite/docker-compose.yml logs -f

# Restart container only (no rebuild)
cd /opt/Templite && docker compose restart

# Check live memory usage
docker stats templite

# Check Nginx status
systemctl status nginx

# Reload Nginx after config changes
nginx -t && systemctl reload nginx
```

---

## Environment Variables (in docker-compose.yml)

| Variable | Default | Description |
|---|---|---|
| `PDF_CONCURRENCY` | 2 | Max concurrent Chromium instances (~350 MB each) |
| `LLM_CONCURRENCY` | 6 | Max concurrent LLM jobs (Phase 1) |
| `PDF_TIMEOUT` | 240 | Full pipeline timeout in seconds |
| `PDF_MAX_AGE` | 7200 | Delete generated PDFs after 2 hours |
| `ALLOWED_ORIGINS` | see file | CORS whitelist |
| `PYTHONPATH` | /app/server | Required for Python imports |

---

## Google Drive Re-authorization

If Google Drive token expires or auth breaks:

```
https://templite.my/api/auth/google
```

Open in browser and complete the OAuth flow.

---

## DNS & Domain

- Domain registered at **GB Network** (gbnetwork.my)
- Nameservers point to **Cloudflare**
- DNS A records managed in **Cloudflare dashboard**
- SSL mode: **Flexible** (Cloudflare → origin over HTTP)

To update DNS records: log in to Cloudflare → templite.my → DNS Records.

---

## Google Cloud Console

OAuth redirect URI registered:
```
https://templite.my/api/auth/callback
```

If domain changes, update this at:
**Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID**
