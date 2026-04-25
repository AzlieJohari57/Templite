# ── Stage 1: Build React frontend ─────────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci --silent

COPY client/ ./
RUN npm run build


# ── Stage 2: Production image ──────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies first (cached layer)
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

# Install Playwright + all its Chromium system deps in one step
RUN playwright install chromium --with-deps

# Copy server code and templates
COPY server/ ./server/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /build/client/dist ./client/dist/

# Copy Google OAuth credentials (client ID/secret — safe to bake in)
COPY credentials.json ./

# Pre-create runtime directories
RUN mkdir -p server/generated_resume server/images

EXPOSE 8000

# 1 worker is intentional: asyncio handles concurrency within the worker.
# Multiple workers would each hold their own semaphore, multiplying peak
# Chromium RAM usage (N workers × PDF_CONCURRENCY × ~350 MB).
# Gunicorn --timeout must exceed PDF_TIMEOUT (240 s) so our Python-level
# asyncio.wait_for fires first and returns a clean 504 instead of a SIGKILL.
CMD ["gunicorn", "server.main:app", \
     "--workers", "1", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "300", \
     "--graceful-timeout", "30", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
