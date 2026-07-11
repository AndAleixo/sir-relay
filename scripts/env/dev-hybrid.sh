#!/usr/bin/env bash
# Dev híbrido (oficina) — Postgres Docker + npm run dev + SERVICE_MODE=api
set -euo pipefail
source "$(dirname "$0")/_common.sh"
require_docker

EF="$(env_file)"
if [[ -z "$EF" ]]; then
  echo "error: copy .env.example → .env.local and enable the Dev híbrido section" >&2
  exit 1
fi

if ! grep -qE '^NEXT_PUBLIC_SERVICE_MODE=api' "$EF" 2>/dev/null; then
  echo "warn: set NEXT_PUBLIC_SERVICE_MODE=api in $EF"
fi

if ! grep -q '^POSTGRES_PASSWORD=' "$EF" 2>/dev/null; then
  echo "error: set POSTGRES_PASSWORD in $EF (same value as DATABASE_URL password)" >&2
  exit 1
fi

echo "→ starting Postgres (dev override :5432)…"
docker compose --env-file "$EF" -f docker-compose.yml -f docker-compose.dev.yml up postgres -d
wait_postgres
echo "→ postgres ready"

if [[ -f prisma/schema.prisma ]]; then
  echo "→ prisma migrate dev…"
  npx prisma migrate dev
  if [[ -f prisma/seed.ts ]] || [[ -f prisma/seed.js ]]; then
    npx prisma db seed
  fi
else
  echo "ponytail: prisma/ not found — skipping migrate (Phase 1 pending)"
  if grep -q '^NEXT_PUBLIC_SERVICE_MODE=api' "$EF" 2>/dev/null; then
    echo "warn: SERVICE_MODE=api will throw until src/services/api exists"
  fi
fi

echo "→ dev-hybrid · http://localhost:3000"
exec npm run dev
