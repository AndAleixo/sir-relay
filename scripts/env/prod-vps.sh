#!/usr/bin/env bash
# Prod VPS (estrada) — run ON the server as deploy, inside the repo
set -euo pipefail
source "$(dirname "$0")/_common.sh"
require_docker
require_env

# shellcheck disable=SC1091
set -a
source .env
set +a

if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
  echo "error: set POSTGRES_PASSWORD in .env" >&2
  exit 1
fi

if [[ $(id -u) -eq 0 ]]; then
  echo "warn: running as root — prefer: su - deploy && cd ~/sir-relay && bash scripts/env/prod-vps.sh" >&2
fi

echo "→ prod-vps · git pull"
git pull

echo "→ postgres + migrate"
wait_postgres_compose
prisma_migrate_deploy_docker "$POSTGRES_PASSWORD"

echo "→ docker compose up --build"
"${COMPOSE[@]}" up -d --build
"${COMPOSE[@]}" ps

APP_URL="$(grep -E '^APP_URL=' .env | cut -d= -f2- || true)"
if [[ -n "$APP_URL" ]]; then
  if curl -sf "${APP_URL}/api/v1/health" >/dev/null 2>&1; then
    echo "→ health OK: ${APP_URL}/api/v1/health"
  else
    echo "→ health check pending (DNS/TLS may still be propagating): ${APP_URL}/api/v1/health"
  fi
fi

echo "→ done · logs: docker compose logs -f app caddy"
