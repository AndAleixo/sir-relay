#!/usr/bin/env bash
# Restore from backups/sirrelay-*.sql.gz — stop app, replace DB, restart — §6.5.1
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 backups/sirrelay-YYYYMMDD-HHMM.sql.gz" >&2
  exit 1
fi

# Resolve before cd — relative paths are vs caller cwd, not repo root.
file=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
if [[ ! -f "$file" ]]; then
  echo "error: file not found: $1" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$ROOT/scripts/env/_common.sh"

require_docker

# Prefer the compose files of the running stack (prod-local uses .local.yml).
if [[ -f docker-compose.local.yml ]] && docker compose -f docker-compose.yml -f docker-compose.local.yml ps -q postgres 2>/dev/null | grep -q .; then
  COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.local.yml)
fi

echo "→ restore-db · stopping app"
"${COMPOSE[@]}" stop app

echo "→ recreating database sirrelay"
"${COMPOSE[@]}" exec -T postgres psql -U sirrelay -d postgres -v ON_ERROR_STOP=1 <<'SQL'
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'sirrelay' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS sirrelay;
CREATE DATABASE sirrelay;
SQL

echo "→ restoring from ${file}"
gunzip -c "$file" | "${COMPOSE[@]}" exec -T postgres psql -U sirrelay -d sirrelay -v ON_ERROR_STOP=1

echo "→ starting app"
"${COMPOSE[@]}" start app
echo "→ done"
