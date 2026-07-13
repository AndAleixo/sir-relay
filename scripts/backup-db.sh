#!/usr/bin/env bash
# pg_dump → backups/sirrelay-YYYYMMDD-HHMM.sql.gz — docs/REQUIREMENTS.md §6.5.1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$ROOT/scripts/env/_common.sh"

require_docker

BACKUP_DIR="${BACKUP_DIR:-backups}"
RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-7}"
mkdir -p "$BACKUP_DIR"

stamp="$(date +%Y%m%d-%H%M)"
out="${BACKUP_DIR}/sirrelay-${stamp}.sql.gz"

if ! "${COMPOSE[@]}" exec -T postgres pg_isready -U sirrelay -d sirrelay >/dev/null 2>&1; then
  echo "error: postgres not ready — run: docker compose up -d postgres" >&2
  exit 1
fi

"${COMPOSE[@]}" exec -T postgres pg_dump -U sirrelay -d sirrelay | gzip >"$out"
echo "→ backup: ${out} ($(du -h "$out" | cut -f1))"

# ponytail: naive retention by mtime; upgrade path: S3/rclone off-VPS (P2-BAK-03)
find "$BACKUP_DIR" -maxdepth 1 -name 'sirrelay-*.sql.gz' -mtime +"${RETAIN_DAYS}" -delete
