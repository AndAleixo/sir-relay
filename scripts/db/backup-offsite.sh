#!/usr/bin/env bash
# Local pg_dump + optional rclone to Google Drive (P2-BAK-03).
# Run ON the VPS. One-time setup: docs/DEPLOY-DIGITALOCEAN.md §9.1
#
#   RCLONE_REMOTE=gdrive:sirrelay-backups  bash scripts/db/backup-offsite.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

bash "$ROOT/scripts/db/backup.sh"

REMOTE="${RCLONE_REMOTE:-}"
if [[ -z "$REMOTE" ]]; then
  echo "→ skip offsite (set RCLONE_REMOTE=gdrive:sirrelay-backups)" >&2
  exit 0
fi

if ! command -v rclone >/dev/null 2>&1; then
  echo "error: rclone not installed — see DEPLOY-DIGITALOCEAN.md §9.1" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-backups}"
echo "→ rclone copy ${BACKUP_DIR}/ → ${REMOTE}"
rclone copy "$BACKUP_DIR" "$REMOTE" --include 'sirrelay-*.sql.gz' --verbose
echo "→ offsite done"
