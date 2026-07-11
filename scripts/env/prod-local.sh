#!/usr/bin/env bash
# Prod local (test drive) — full docker compose stack
set -euo pipefail
source "$(dirname "$0")/_common.sh"
require_docker

if [[ ! -f .env ]]; then
  echo "error: copy .env.example → .env (secção Prod local)" >&2
  exit 1
fi

echo "→ prod-local · docker compose up --build"
"${COMPOSE[@]}" up -d --build
"${COMPOSE[@]}" ps

APP_URL="$(grep -E '^APP_URL=' .env | cut -d= -f2- || true)"
echo "→ open ${APP_URL:-http://localhost}"
echo "→ logs: npm run prod-local-logs"
