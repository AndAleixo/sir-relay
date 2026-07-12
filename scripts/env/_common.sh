#!/usr/bin/env bash
# Shared helpers for scripts/env/*.sh — source, do not execute.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose)
COMPOSE_DEV=(docker compose -f docker-compose.yml -f docker-compose.dev.yml)

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

wait_postgres() {
  local tries=0
  until "${COMPOSE_DEV[@]}" exec -T postgres pg_isready -U sirrelay -d sirrelay >/dev/null 2>&1; do
    tries=$((tries + 1))
    if [[ $tries -gt 30 ]]; then
      echo "error: postgres not ready after 30s" >&2
      exit 1
    fi
    sleep 1
  done
}
