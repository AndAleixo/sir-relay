#!/usr/bin/env bash
# Dev híbrido — Postgres Docker + npm run dev + SERVICE_MODE=api
set -euo pipefail
source "$(dirname "$0")/_common.sh"
require_docker
require_env

EF=".env"

if ! grep -qE '^NEXT_PUBLIC_SERVICE_MODE=api' "$EF" 2>/dev/null; then
  echo "warn: set NEXT_PUBLIC_SERVICE_MODE=api in .env" >&2
fi

if ! grep -q '^POSTGRES_PASSWORD=' "$EF" 2>/dev/null; then
  echo "error: set POSTGRES_PASSWORD in .env (same value as DATABASE_URL password)" >&2
  exit 1
fi

echo "→ starting Postgres (dev override :5432)…"
docker compose --env-file "$EF" -f docker-compose.yml -f docker-compose.dev.yml up postgres -d
wait_postgres
echo "→ postgres ready"

if [[ -f prisma/schema.prisma ]]; then
  echo "→ prisma migrate deploy…"
  npx prisma migrate deploy
  npx prisma generate
  if [[ -f prisma/seed.ts ]] || [[ -f prisma/seed.js ]]; then
    npx prisma db seed
  fi
fi

echo "→ dev-hybrid · NEXT_PUBLIC_SERVICE_MODE=api · http://localhost:3000"
echo "  login: sam@example.com / demo12345"
exec npm run dev
