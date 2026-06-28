# Change: home-active-requests-list

## Why
The home "active request" section shows a single card (the first matching
request). The customer can have several requests that need attention — open ones
collecting proposals, a re-quote awaiting a decision, scheduled jobs coming up.
They should all be reachable from home, prioritized, without hunting in the
Requests tab.

## What changes (in scope)
- **A prioritized list instead of one card.** The section shows the customer's
  relevant (non-terminal) requests, **at most 2 cards**, ordered by priority
  (below). Each card is the existing state-aware `ActiveRequestCard`.
- **Priority order** (highest first):
  1. **Open + urgent** — needs attention now.
  2. **Open** (não urgente) — em cotação, receiving proposals.
  3. **Requote** (re-cotação) — awaiting the customer's decision.
  4. **Open + scheduled** (agendados / "no futuro") — sorted by their next
     scheduled date.
  5. **Accepted / in progress** — ongoing job (tracking).
  Completed / cancelled / expired are excluded.
- **Fallback to the future.** Because scheduled (open) requests rank below the
  urgent/normal open ones, when there are no open-now requests the upcoming
  scheduled ones surface automatically.
- **"Ver todos" button.** When more than 2 requests match, a "Ver todos (N)"
  button under the cards navigates to the **Requests tab** (`/(tabs)/requests`).
- **Backend: scheduled date in the list.** `GET /requests` (customer index) eager-
  loads `availabilities` so the home can sort scheduled requests by their next
  date (the resource already emits `availabilities`; only the eager-load is added).

## Deferred (NOT in this change)
- No change to the request screen itself or to the card's per-state content
  (badge/CTA logic from `home-card-reflects-request-state` is reused as-is).

## Impact
- Module: `customer`.
- Frontend (`apps/customer`): `app/(tabs)/home.tsx` builds the prioritized, capped
  list + "Ver todos" button; the `ActiveRequestCard` is reused per item; one new
  i18n key `home.seeAll` (pt-BR + en-US).
- Backend: add `availabilities` to the eager-load in `RequestController@index`
  (no new fields — the resource already exposes them).
