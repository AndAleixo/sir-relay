#!/usr/bin/env bash
# Restore from backups/{sirrelay,umami}-*.sql.gz — §6.5.1
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 backups/sirrelay-YYYYMMDD-HHMM.sql.gz" >&2
  echo "       $0 backups/umami-YYYYMMDD-HHMM.sql.gz" >&2
  exit 1
fi

# Resolve before cd — relative paths are vs caller cwd, not repo root.
file=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
if [[ ! -f "$file" ]]; then
  echo "error: file not found: $1" >&2
  exit 1
fi

base=$(basename "$file")
db=""
case "$base" in
  sirrelay-*.sql.gz) db=sirrelay ;;
  umami-*.sql.gz) db=umami ;;
  *)
    echo "error: filename must be sirrelay-*.sql.gz or umami-*.sql.gz (got ${base})" >&2
    exit 1
    ;;
esac

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$ROOT/scripts/env/_common.sh"

require_docker
use_running_compose

service=app
if [[ "$db" == umami ]]; then
  service=umami
fi

echo "→ restore-db · stopping ${service}"
"${COMPOSE[@]}" stop "$service" || true

echo "→ recreating database ${db}"
"${COMPOSE[@]}" exec -T postgres psql -U sirrelay -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${db}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ${db};
CREATE DATABASE ${db} OWNER sirrelay;
SQL

echo "→ restoring from ${file}"
gunzip -c "$file" | "${COMPOSE[@]}" exec -T postgres psql -U sirrelay -d "$db" -v ON_ERROR_STOP=1

echo "→ starting ${service}"
"${COMPOSE[@]}" start "$service"
echo "→ done"
