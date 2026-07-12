#!/usr/bin/env bash
# Prod local (test drive) — full docker compose stack
set -euo pipefail
source "$(dirname "$0")/_common.sh"
require_docker

COMPOSE_LOCAL=(docker compose -f docker-compose.yml -f docker-compose.local.yml)

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
"${COMPOSE_LOCAL[@]}" up -d postgres
tries=0
until "${COMPOSE_LOCAL[@]}" exec -T postgres pg_isready -U sirrelay -d sirrelay >/dev/null 2>&1; do
  tries=$((tries + 1))
  if [[ $tries -gt 30 ]]; then
    echo "error: postgres not ready after 30s" >&2
    exit 1
  fi
  sleep 1
done

echo "→ prisma migrate deploy"
DATABASE_URL="postgresql://sirrelay:${POSTGRES_PASSWORD}@localhost:5433/sirrelay" npx prisma migrate deploy

echo "→ docker compose up --build"
"${COMPOSE_LOCAL[@]}" up -d --build
"${COMPOSE_LOCAL[@]}" ps

echo "→ open http://localhost"
echo "→ health: curl -s http://localhost/api/v1/health"
echo "→ logs: npm run prod-local-logs"
