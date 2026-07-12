#!/usr/bin/env bash
# Dev híbrido — Postgres only (run npm run dev separately)
set -euo pipefail
source "$(dirname "$0")/_common.sh"
require_docker
require_env

docker compose --env-file .env -f docker-compose.yml -f docker-compose.dev.yml up postgres -d
wait_postgres
echo "→ postgres ready on localhost:5432"
