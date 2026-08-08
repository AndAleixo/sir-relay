#!/usr/bin/env bash
# pg_dump → backups/{sirrelay,umami}-YYYYMMDD-HHMM.sql.gz — docs/REQUIREMENTS.md §6.5.1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$ROOT/scripts/env/_common.sh"

require_docker
use_running_compose

BACKUP_DIR="${BACKUP_DIR:-backups}"
RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-7}"
mkdir -p "$BACKUP_DIR"

stamp="$(date +%Y%m%d-%H%M)"

if ! "${COMPOSE[@]}" exec -T postgres pg_isready -U sirrelay -d sirrelay >/dev/null 2>&1; then
  echo "error: postgres not ready — run: docker compose up -d postgres" >&2
  exit 1
fi

dump_db() {
  local db="$1"
  local out="${BACKUP_DIR}/${db}-${stamp}.sql.gz"
  "${COMPOSE[@]}" exec -T postgres pg_dump -U sirrelay -d "$db" | gzip >"$out"
  echo "→ backup: ${out} ($(du -h "$out" | cut -f1))"
}

dump_db sirrelay

if "${COMPOSE[@]}" exec -T postgres \
  psql -U sirrelay -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'umami'" | grep -q 1; then
  dump_db umami
else
  echo "→ skip umami (database not present)"
fi

# ponytail: naive retention by mtime; off-VPS: scripts/db/backup-offsite.sh + rclone
find "$BACKUP_DIR" -maxdepth 1 \( -name 'sirrelay-*.sql.gz' -o -name 'umami-*.sql.gz' \) -mtime +"${RETAIN_DAYS}" -delete
