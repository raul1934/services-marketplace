# Chama Fácil (Guincho)

> Roadside-assistance & home-services marketplace — customers post a service
> request, nearby providers bid on it, and the job runs end-to-end with realtime
> tracking, a one-time start code, surcharge re-quotes and in-app settlement.

**Chama Fácil** is the product brand; **Guincho** is the name of the local dev stack
(Portuguese for "tow truck", the original roadside use case). Service categories
include towing, tyre, mechanic, plumber and more.

## How it works

1. **Customer** creates a service request — category, vehicle/asset, location,
   urgency, payment method, photos, optional custom questions.
2. **Providers** submit **proposals** (price, ETA, optional deposit).
3. The customer **accepts** a proposal — it becomes a **job**.
4. The provider travels (live location on the map), **starts** the job with a
   one-time start code, then **completes** it. Mid-job **surcharges** trigger a
   re-quote the customer must approve.
5. The customer sees the **receipt**; the provider's earnings settle through the
   **wallet**.

Realtime updates flow over Laravel **Reverb** (private `request.{id}` channel:
`proposal.received`, `location.updated`, `status.updated`); push notifications go
through **FCM / Expo**.

## Tech stack

| Layer | Tech |
|-------|------|
| Backend API | Laravel 12 (PHP 8.2), PostgreSQL 16 |
| Auth | Sanctum, ability-scoped tokens (`client` / `provider`) |
| Realtime | Laravel Reverb (WebSockets) ← `laravel-echo` + `pusher-js` |
| Queues | Laravel Horizon |
| Admin | Filament 3 |
| Push | FCM (`laravel-notification-channels/fcm`) / Expo |
| Mobile | React Native + Expo (expo-router), TanStack Query |
| Infra | Docker Compose, Caddy reverse proxy |
| Tests | PHPUnit (backend), Playwright (e2e) |

## Repository layout

```
backend/    Laravel API + Filament admin (REST under /api/v1, Sanctum, Reverb)
frontend/   React Native (Expo) monorepo — apps/customer, apps/provider,
            packages/shared (theme, API client, realtime, UI kit)
landing/    Static marketing site (served by Caddy)
e2e/        Playwright end-to-end tests (run against web builds of the apps)
openspec/   OpenSpec change proposals & specs
audit/      Design / accessibility / responsive audit reports
docker-compose*.yml, Caddyfile, up.sh / down.sh   local stack
```

> The previous Ionic/Angular frontend has been retired in favour of the Expo apps
> in `frontend/`. It is no longer part of this repository.

## Getting started

**Prerequisites:** Docker + Docker Compose, Node 20+ (for the Expo apps).

### 1. Backend stack (Docker)

```bash
cp backend/.env.example backend/.env      # tweak if needed
docker compose up -d                       # db, backend, queue, reverb, caddy, landing
docker exec guincho-backend php artisan migrate:fresh --seed
```

Host ports (all in the `19xxx` range so the stack can coexist with others):

| Service | URL |
|---------|-----|
| Backend API | http://localhost:19000/api/v1 |
| Filament admin | http://localhost:19000/admin |
| Reverb (WebSocket) | ws://localhost:19080 |
| PostgreSQL | localhost:19432 |
| Caddy reverse proxy (`*.chamafacil.local`) | http://localhost:19088 |
| Landing page | http://localhost:19090 |

Seeded dev accounts (password `senha123`): `cliente@chamafacil.test` (customer),
`prestador@chamafacil.test` (provider). See [DOCKER.md](DOCKER.md) for coexistence notes.

### 2. Mobile apps (Expo)

```bash
cd frontend
npm install                                # installs all workspaces
cp apps/customer/.env.example apps/customer/.env
cp apps/provider/.env.example apps/provider/.env

npm run customer                           # Expo dev server — customer app
npm run provider                           # Expo dev server — provider app
```

On a **physical device**, point `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_REVERB_HOST`
at your machine's LAN IP (not `localhost`). Native modules (`react-native-maps`)
need a dev build (`npm run android:customer`) rather than Expo Go. More detail in
[frontend/README.md](frontend/README.md).

## Testing

```bash
# Backend (PHPUnit)
docker exec guincho-backend php artisan test

# End-to-end (Playwright) — web builds of the apps
docker compose -f docker-compose.web.yml up -d        # apps on :19082 / :19083
cd e2e && npm install && npm test
```

See [e2e/README.md](e2e/README.md) for the full journey coverage and helpers.
