# ── Function Compute Custom Container image ────────────────────────────────────
# The React frontend is NOT bundled here — it is built separately and served
# from OSS + CDN (see DEPLOYMENT_FC.md). Keeping Chromium-only in the image keeps
# it smaller, which directly shortens Function Compute cold starts.

FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies first (cached layer)
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

# Install Playwright + all its Chromium system deps in one step
RUN playwright install chromium --with-deps

# Copy server code and templates
COPY server/ ./server/

# Copy Google OAuth credentials (client ID/secret — safe to bake in)
COPY credentials.json ./

WORKDIR /app/server

# Function Compute routes both the HTTP trigger (API function) and async event
# invocations (worker function) to the port below. FC injects the port via
# $FC_SERVER_PORT; default to 9000 which is FC's convention.
ENV PORT=9000
EXPOSE 9000

# 1 worker + instance-concurrency=1 on FC: each Chromium render gets a whole
# instance's memory, and FC scales out by adding instances instead of threads.
# --timeout must exceed the function timeout so FC (not gunicorn) owns the clock.
CMD ["sh", "-c", "gunicorn main:app \
     --workers 1 \
     --worker-class uvicorn.workers.UvicornWorker \
     --bind 0.0.0.0:${FC_SERVER_PORT:-${PORT:-9000}} \
     --timeout 600 \
     --graceful-timeout 30 \
     --access-logfile - \
     --error-logfile -"]
