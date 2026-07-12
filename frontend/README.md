# Chama Fácil — React Native (Expo) frontend

Monorepo for the two Chama Fácil mobile apps, rebuilt from the previous Angular +
Ionic apps. Both apps share a design system, API client, types and realtime
client from `packages/shared`.

```
frontend/
├── packages/
│   └── shared/          @chamafacil/shared — theme (sunset/trust/night), types,
│                        API client (Sanctum), Reverb realtime, auth, UI kit
└── apps/
    ├── customer/        Customer app (Expo, expo-router) — role: client
    └── provider/        Provider app (Expo, expo-router) — role: provider
```

> The original Ionic apps have been retired. A local copy may remain in
> `../frontend-ionic-legacy/` for reference, but it is no longer tracked in git.

## Stack

- **Expo SDK 52** (managed) · **expo-router** (file-based navigation)
- **@tanstack/react-query** (server state) · **expo-secure-store** (Sanctum token)
- **react-native-maps** (tracking / nearby) · **react-native-svg** (budget gauge)
- **laravel-echo + pusher-js** → Laravel **Reverb** (realtime)
- **expo-location** / **expo-image-picker** (native capabilities)

## Setup

```bash
cd frontend
npm install                      # installs all workspaces

# per-app env (defaults target the docker stack via Caddy)
cp apps/customer/.env.example apps/customer/.env
cp apps/provider/.env.example apps/provider/.env
```

When running on a **physical device**, set `EXPO_PUBLIC_API_URL` /
`EXPO_PUBLIC_REVERB_HOST` to your machine's **LAN IP** (e.g.
`http://192.168.0.10:8000/api/v1`), since `localhost` resolves to the phone.

## Run

Start the backend stack first (`docker compose up` in the repo root), then:

```bash
npm run customer     # Expo dev server for the customer app
npm run provider     # Expo dev server for the provider app
```

Press `a` for Android / `i` for iOS, or scan the QR with Expo Go. Native
modules (`react-native-maps`) require a dev build (`npm run android:customer`)
rather than Expo Go.

## Backend contract

The apps target the existing Laravel API at `/api/v1` (see repo `backend/`).
Auth is Sanctum with ability-scoped tokens: the customer app keeps the
`client` token, the provider app the `provider` token. Realtime uses the
private `request.{id}` channel (`proposal.received`, `location.updated`,
`status.updated`).
