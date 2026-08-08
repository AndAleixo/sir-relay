#!/usr/bin/env bash
# Shared helpers for scripts/env/*.sh — source, do not execute.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose)
COMPOSE_LOCAL=(docker compose -f docker-compose.yml -f docker-compose.local.yml)

# Prefer prod-local compose when that postgres is running.
use_running_compose() {
  if [[ -f docker-compose.local.yml ]] \
    && docker compose -f docker-compose.yml -f docker-compose.local.yml ps -q postgres 2>/dev/null | grep -q .; then
    COMPOSE=( "${COMPOSE_LOCAL[@]}" )
  fi
}

require_env() {
  if [[ ! -f .env ]]; then
    echo "error: copy .env.example → .env" >&2
    exit 1
  fi
  if [[ -f .env.local ]]; then
    echo "error: .env.local found — remove it; this project uses .env only" >&2
    exit 1
  fi
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "error: docker not found" >&2
    exit 1
  fi
}

wait_postgres_compose() {
  local -a cmd=( "${COMPOSE[@]}" )
  if [[ $# -gt 0 ]]; then
    cmd=( "$@" )
  fi
  "${cmd[@]}" up -d postgres
  local tries=0
  until "${cmd[@]}" exec -T postgres pg_isready -U sirrelay -d sirrelay >/dev/null 2>&1; do
    tries=$((tries + 1))
    if [[ $tries -gt 30 ]]; then
      echo "error: postgres not ready after 30s" >&2
      exit 1
    fi
    sleep 1
  done
}

# Extra DB for Umami on the same Postgres (idempotent). Pass compose argv, e.g. ensure_umami_database "${COMPOSE[@]}".
ensure_umami_database() {
  local -a cmd=( "$@" )
  if [[ ${#cmd[@]} -eq 0 ]]; then
    cmd=( "${COMPOSE[@]}" )
  fi
  if "${cmd[@]}" exec -T postgres \
    psql -U sirrelay -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'umami'" | grep -q 1; then
    return 0
  fi
  echo "→ create database umami"
  "${cmd[@]}" exec -T postgres \
    psql -U sirrelay -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE umami OWNER sirrelay;"
}

prisma_migrate_deploy_docker() {
  local password=$1
  local network
  network="$(
    docker compose ps -q postgres 2>/dev/null | head -1 \
      | xargs -r docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}'
  )"
  if [[ -z "$network" ]]; then
    echo "error: postgres container network not found — is postgres running?" >&2
    exit 1
  fi
  docker run --rm \
    --network "$network" \
    -v "$ROOT/prisma:/prisma" \
    -w /prisma \
    -e DATABASE_URL="postgresql://sirrelay:${password}@postgres:5432/sirrelay" \
    node:20-bookworm-slim \
    bash -c "npm install prisma@6.19.3 && npx prisma migrate deploy"
}
