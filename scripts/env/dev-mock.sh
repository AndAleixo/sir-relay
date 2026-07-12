#!/usr/bin/env bash
# Dev mock — in-memory services (forces SERVICE_MODE=mock for this process)
set -euo pipefail
source "$(dirname "$0")/_common.sh"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "created .env from .env.example"
fi
require_env

export NEXT_PUBLIC_SERVICE_MODE=mock

echo "→ dev-mock · NEXT_PUBLIC_SERVICE_MODE=mock · http://localhost:3000"
echo "  demo: sam@example.com (any password) · ana@example.com (any password)"
exec npm run dev
