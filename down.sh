#!/usr/bin/env bash
#
# Stop the guincho (Chama Fácil) local stack — API + Expo web apps.
# Data is preserved (named volumes are kept). Add --volumes to wipe the DB too.
#
# Usage:
#   ./down.sh            # stop containers, keep data
#   ./down.sh --volumes  # stop and DELETE the database + caddy volumes
#
set -euo pipefail
cd "$(dirname "$0")"

if [ "${1:-}" = "--volumes" ]; then
  echo "▶ Stopping web apps + API stack and removing volumes (data will be lost)…"
  docker compose -f docker-compose.web.yml down
  docker compose down --volumes
else
  echo "▶ Stopping web apps + API stack (data preserved)…"
  docker compose -f docker-compose.web.yml down
  docker compose down
fi

echo "✅ Stopped."
