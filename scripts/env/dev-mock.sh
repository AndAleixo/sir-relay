#!/usr/bin/env bash
# Dev mock (maqueta) — in-memory services
set -euo pipefail
source "$(dirname "$0")/_common.sh"

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo "created .env.local from .env.example (NEXT_PUBLIC_SERVICE_MODE=mock)"
fi

echo "→ dev-mock · http://localhost:3000"
echo "  demo: sam@example.com (hub) · ana@example.com (tasks)"
exec npm run dev
