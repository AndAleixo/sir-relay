#!/usr/bin/env bash
# Dev híbrido — Postgres only (run npm run dev separately)
set -euo pipefail
source "$(dirname "$0")/_common.sh"
require_docker

EF="$(env_file)"
[[ -n "$EF" ]] || { echo "error: need .env.local or .env with POSTGRES_PASSWORD" >&2; exit 1; }

docker compose --env-file "$EF" -f docker-compose.yml -f docker-compose.dev.yml up postgres -d
wait_postgres
echo "→ postgres ready on localhost:5432"
