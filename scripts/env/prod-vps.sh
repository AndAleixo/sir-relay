#!/usr/bin/env bash
# Prod VPS (estrada) — run ON the server after git clone
set -euo pipefail
source "$(dirname "$0")/_common.sh"
require_docker

if [[ ! -f .env ]]; then
  echo "error: missing .env — see docs/DEPLOY-DIGITALOCEAN.md" >&2
  exit 1
fi

echo "→ prod-vps · git pull"
git pull

echo "→ docker compose up --build"
"${COMPOSE[@]}" up -d --build
"${COMPOSE[@]}" ps

APP_URL="$(grep -E '^APP_URL=' .env | cut -d= -f2- || true)"
if [[ -n "$APP_URL" ]]; then
  if curl -sf "${APP_URL}/api/v1/health" >/dev/null 2>&1; then
    echo "→ health OK: ${APP_URL}/api/v1/health"
  else
    echo "→ health check pending (API may not be live yet): ${APP_URL}/api/v1/health"
  fi
fi

echo "→ done · logs: docker compose logs -f app"
