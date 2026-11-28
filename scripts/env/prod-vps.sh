#!/usr/bin/env bash
# Prod VPS — always behind sir-edge (TLS in ~/sir-edge). Reads .env from disk.
set -euo pipefail
source "$(dirname "$0")/_common.sh"
require_docker
require_env

POSTGRES_PASSWORD="$(envfile_require POSTGRES_PASSWORD)"
UMAMI_APP_SECRET="$(envfile_get UMAMI_APP_SECRET)"
if [[ -z "$UMAMI_APP_SECRET" || "$UMAMI_APP_SECRET" == "dev-umami-secret-change-me" ]]; then
  echo "error: set UMAMI_APP_SECRET in .env (openssl rand -hex 32)" >&2
  exit 1
fi

APP_URL="$(envfile_get APP_URL)"
APP_DOMAIN="$(envfile_get APP_DOMAIN)"
APP_ROOT_DOMAIN="$(envfile_get APP_ROOT_DOMAIN)"
UMAMI_WEBSITE_ID="$(envfile_get UMAMI_WEBSITE_ID)"

if [[ $(id -u) -eq 0 ]]; then
  echo "warn: running as root — prefer: su - deploy && cd ~/sir-relay && bash scripts/env/prod-vps.sh" >&2
fi

echo "→ prod-vps · git pull"
git pull

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.edge.yml)
echo "→ mode: sir-edge (sirrelay-app / sirrelay-umami on sir_edge)"

echo "→ postgres + migrate"
wait_postgres_compose
ensure_umami_database "${COMPOSE[@]}"
prisma_migrate_deploy_docker "$POSTGRES_PASSWORD"

echo "→ docker compose up --build"
"${COMPOSE[@]}" up -d --build
"${COMPOSE[@]}" ps

if [[ -n "$APP_URL" ]]; then
  if curl -sf "${APP_URL}/api/v1/health" >/dev/null 2>&1; then
    echo "→ health OK: ${APP_URL}/api/v1/health"
  else
    echo "→ health check pending (DNS/TLS may still be propagating): ${APP_URL}/api/v1/health"
  fi
fi

if [[ -n "$UMAMI_WEBSITE_ID" ]]; then
  echo "→ umami tracker: on"
else
  echo "→ umami tracker: off — on analytics.${APP_ROOT_DOMAIN:-<APP_ROOT_DOMAIN>} Add website (domain=${APP_DOMAIN:-<APP_DOMAIN>}), set UMAMI_WEBSITE_ID in .env, then: ${COMPOSE[*]} up -d app"
fi

echo "→ done · logs: ${COMPOSE[*]} logs -f app"
