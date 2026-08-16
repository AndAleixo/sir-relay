#!/usr/bin/env bash
# Prod local (test drive) — full docker compose stack
set -euo pipefail
source "$(dirname "$0")/_common.sh"
require_docker

if [[ ! -f .env ]]; then
  echo "error: copy .env.example → .env (secção Prod local)" >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
  echo "error: set POSTGRES_PASSWORD in .env" >&2
  exit 1
fi

echo "→ prod-local · postgres + migrate"
wait_postgres_compose "${COMPOSE_LOCAL[@]}"
ensure_umami_database "${COMPOSE_LOCAL[@]}"

echo "→ prisma migrate deploy"
DATABASE_URL="postgresql://sirrelay:${POSTGRES_PASSWORD}@localhost:5433/sirrelay" npx prisma migrate deploy

echo "→ docker compose up --build"
"${COMPOSE_LOCAL[@]}" up -d --build
# Bind-mounted Caddyfile changes are not always picked up by a long-lived caddy container.
"${COMPOSE_LOCAL[@]}" up -d --force-recreate caddy
"${COMPOSE_LOCAL[@]}" ps

echo "→ open http://localhost"
echo "→ umami dashboard: http://localhost:3001  (admin / umami — change password)"
if [[ -n "${UMAMI_WEBSITE_ID:-}" ]]; then
  echo "→ umami tracker: on"
else
  echo "→ umami tracker: off — Add website (domain=${APP_DOMAIN:-localhost}), set UMAMI_WEBSITE_ID then: ${COMPOSE_LOCAL[*]} up -d app"
fi
echo "→ health: curl -s http://localhost/api/v1/health"
echo "→ logs: npm run prod-local-logs"
