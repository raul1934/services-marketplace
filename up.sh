#!/usr/bin/env bash
#
# Bring up the full guincho (Chama Fácil) local stack — Laravel API + both Expo web
# apps — wired to the published localhost ports so it runs side-by-side with the
# lula stack (no :80 conflict; everything on 19xxx).
#
# Usage:
#   ./up.sh            # start API + web apps
#   ./up.sh --seed     # also (re)seed the database (idempotent)
#   ./up.sh --fresh    # wipe DB, re-migrate, seed, then start
#
# Stop everything:  ./down.sh   (or: docker compose down && docker compose -f docker-compose.web.yml down)
#
set -euo pipefail
cd "$(dirname "$0")"

# The Expo web apps run in the BROWSER, so these URLs resolve from the host
# (where the API/Reverb ports are published) — not from inside the containers.
# The compose file otherwise defaults to api.chamafacil.local (:80), which now
# belongs to the lula proxy, so we override to the direct localhost ports.
export EXPO_PUBLIC_CUSTOMER_API_URL="http://localhost:19000/api/customer/v1"
export EXPO_PUBLIC_PROVIDER_API_URL="http://localhost:19000/api/provider/v1"
export EXPO_PUBLIC_API_HOST="http://localhost:19000"
export EXPO_PUBLIC_REVERB_HOST="localhost"
export EXPO_PUBLIC_REVERB_PORT="19080"
export EXPO_PUBLIC_REVERB_KEY="1kwtg5xpykisjdjv5wlq"

echo "▶ Starting API stack (backend, reverb, queue, db, caddy, landing)…"
docker compose up -d

echo "▶ Waiting for Postgres to be healthy…"
until [ "$(docker inspect -f '{{.State.Health.Status}}' guincho-db 2>/dev/null)" = "healthy" ]; do
  sleep 2
done

echo "▶ Waiting for the API to answer (runs migrations on boot)…"
until [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:19000/api/customer/v1/categories)" = "200" ]; do
  sleep 2
done

case "${1:-}" in
  --fresh)
    echo "▶ migrate:fresh --seed (wiping data)…"
    docker compose exec -T backend php artisan migrate:fresh --seed --force
    ;;
  --seed)
    echo "▶ db:seed (idempotent)…"
    docker compose exec -T backend php artisan db:seed --force
    ;;
esac

echo "▶ Starting Expo web apps (this runs 'npm install' once, then Metro)…"
docker compose -f docker-compose.web.yml up -d

cat <<'EOF'

✅ Stack is up.

Endpoints
  Customer app (web)   http://localhost:19083
  Provider app (web)   http://localhost:19082
  API (customer)       http://localhost:19000/api/customer/v1
  API (provider)       http://localhost:19000/api/provider/v1
  Reverb (WebSocket)   ws://localhost:19080
  Landing              http://localhost:19090
  Caddy proxy          http://localhost:19088   (*.chamafacil.local — optional)

Test logins (password: senha123)
  Client     cliente@chamafacil.test
  Provider   prestador@chamafacil.test   (pre-approved, online, all categories)

Notes
  • First web load takes ~1–2 min while Metro bundles. Watch it with:
        docker compose -f docker-compose.web.yml logs -f customer-web
  • Provider → in-progress "Guincho" job has Adicionar acréscimo / Remarcar.
    Client   → completed "Encanador" job has Garantia / Disputa.
  • react-native-maps has no web build, so tracking/nearby map show a placeholder.
EOF
