#!/bin/bash
# Templite — Alibaba Cloud Simple Application Server Deployment Script
# Run as root on a fresh Ubuntu 22.04 instance
set -e

APP_DIR="/opt/templite"
DOMAIN=""   # Set your domain or server IP e.g. "123.45.67.89" or "resume.example.com"
PORT=8000

echo "=== Templite Deployment ==="

# ── 1. System update ───────────────────────────────────────────────────────────
apt-get update && apt-get upgrade -y

# ── 2. Swap (critical: Playwright/Chromium spikes to ~350 MB per render) ───────
SWAP_FILE="/swapfile"
if [ ! -f "$SWAP_FILE" ]; then
    echo "Creating 2 GB swap..."
    fallocate -l 2G "$SWAP_FILE"
    chmod 600 "$SWAP_FILE"
    mkswap "$SWAP_FILE"
    swapon "$SWAP_FILE"
    echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
    # Reduce swap aggressiveness — only use swap under real memory pressure
    sysctl vm.swappiness=10
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    echo "Swap enabled: $(free -h | grep Swap)"
else
    echo "Swap already configured, skipping."
fi

# ── 3. Install Docker & Docker Compose ────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! docker compose version &>/dev/null; then
    echo "Installing Docker Compose plugin..."
    apt-get install -y docker-compose-plugin
fi

echo "Docker version: $(docker --version)"
echo "Compose version: $(docker compose version)"

# ── 4. Copy app files ──────────────────────────────────────────────────────────
mkdir -p "$APP_DIR"
cp -r . "$APP_DIR/"
cd "$APP_DIR"

# ── 5. Ensure .env exists ─────────────────────────────────────────────────────
if [ ! -f .env ]; then
    echo "ERROR: .env file missing. Create it with OPENAI_API_KEY, GDRIVE_FOLDER_ID, GDRIVE_REDIRECT_URI"
    exit 1
fi

# Update redirect URI and CORS origins to the server's domain
if [ -n "$DOMAIN" ]; then
    sed -i "s|GDRIVE_REDIRECT_URI=.*|GDRIVE_REDIRECT_URI=http://$DOMAIN:$PORT/api/auth/callback|" .env
    echo "Set GDRIVE_REDIRECT_URI to http://$DOMAIN:$PORT/api/auth/callback"

    # Set ALLOWED_ORIGINS in docker-compose so the frontend domain passes CORS
    sed -i "s|ALLOWED_ORIGINS:.*|ALLOWED_ORIGINS: \"http://$DOMAIN,http://$DOMAIN:$PORT,http://localhost:5173\"|" docker-compose.yml
    echo "Set ALLOWED_ORIGINS for domain: $DOMAIN"
fi

# Ensure token.json exists (must be a file, not created by Docker as a directory)
touch "$APP_DIR/token.json"

# ── 6. Build & start ──────────────────────────────────────────────────────────
echo "Building Docker image (first build ~5-8 min — Playwright + Chromium deps are large)..."
docker compose build --no-cache

echo "Starting container..."
docker compose up -d

# ── 7. Health check ───────────────────────────────────────────────────────────
echo "Waiting for container to be ready..."
for i in $(seq 1 15); do
    if curl -sf "http://localhost:$PORT/api/auth/status" > /dev/null 2>&1; then
        echo "Health check passed."
        break
    fi
    echo "  attempt $i/15..."
    sleep 4
done

echo ""
echo "=== Deployment complete ==="
echo "App running at: http://${DOMAIN:-localhost}:$PORT"
echo ""
echo "Memory budget (4 GB instance):"
echo "  OS + Docker daemon : ~400 MB"
echo "  Container limit    : 3 GB  (set in docker-compose.yml)"
echo "  Peak Chromium ×2   : ~700 MB  (PDF_CONCURRENCY=2)"
echo "  Headroom           : ~1.9 GB"
echo "  Swap safety net    : +2 GB"
echo ""
echo "Next steps:"
echo "  1. Open http://${DOMAIN:-localhost}:$PORT/api/auth/google to authorize Google Drive"
echo "  2. Check logs  : docker compose logs -f"
echo "  3. Restart     : docker compose restart"
echo "  4. Stop        : docker compose down"
echo "  5. Memory live : docker stats templite"
