# walvee E2E tests (Playwright)

End-to-end tests for the **customer** (`:19083`) and **provider** (`:19082`) web
apps, driven by [Playwright Test](https://playwright.dev). The flows are derived
from the walvee designs (`walvee/walvee - Índice de telas.html`,
`walvee v3 - Mapa de fluxo.html`) and the V5 spec.

## Prerequisites
- The web apps running: `docker compose -f docker-compose.web.yml up -d` (ports 19082/19083).
- Backend seeded with the dev data: `docker exec guincho-backend php artisan migrate:fresh --seed`
  (gives the `cliente@walvee.test` / `prestador@walvee.test` accounts, password `senha123`,
  and requests in every stage that the tests assert against).
- Node via WSL nvm; Chromium is already in `~/.cache/ms-playwright`.

## Install
```bash
cd e2e
npm install            # @playwright/test (browsers already cached)
```

## Run
```bash
npm test               # all projects (customer + provider)
npm run test:customer  # only the customer app
npm run test:provider  # only the provider app
npm run test:headed    # watch it run
npm run test:ui        # Playwright UI mode
npm run report         # open the HTML report
```

Override targets/creds with env vars: `CUSTOMER_URL`, `PROVIDER_URL`,
`CUSTOMER_EMAIL`, `PROVIDER_EMAIL`, `WALVEE_PASSWORD`.

## Feature journeys (start → end)
- **journeys/lifecycle** — the whole V5 happy path across both apps in one test:
  customer creates a request → provider bids → customer accepts → provider starts
  (start code) → completes → customer sees the receipt. Creates its own request, so
  it's idempotent (doesn't depend on / mutate fixed seeded ids).
- **customer/journey-create** — the create-request wizard end-to-end (6 steps →
  slide-to-submit → lands on the new request detail).

Run just the journeys: `npx playwright test --project=journeys`.

The `slide()` helper (tests/helpers/auth.ts) drives the `SlideToConfirm` control
(react-native-web PanResponder) via CDP touch events — needed for submit/accept/
start/complete. It targets `data-testid="slideToConfirm"`.

## Screen coverage
- **customer/auth** — login → home
- **customer/create-request** — the 6-step wizard (custom questions, payment step, read-only review)
- **customer/requests** — requests list + completed-request receipt (C20)
- **provider/auth** — login → dashboard
- **provider/dashboard** — online status, stats, nearby Bateria tile, in-progress jobs
- **provider/job-detail** — accepted job start-code field (C17/P14), open job → bid screen (P09)

Tests rely on the seeded ids (guincho=1, pneu=3, mecânico=6, encanador=13); re-seed
before running if the DB drifted.
