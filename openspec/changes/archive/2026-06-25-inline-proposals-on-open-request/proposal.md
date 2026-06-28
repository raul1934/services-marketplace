# Change: inline-proposals-on-open-request

## Why
While a request is still open, choosing a proposal lives on a separate route
(`request/[id]/proposals`), reached via a "Ver propostas (N)" button on the
request screen. That's the same kind of unnecessary split we just removed for
live tracking: the open request screen is *about* receiving and choosing
proposals, so the list belongs on it — not one tap away. (This reverses, for the
open state only, the proposals extraction from the earlier
`add-payment-receipt-and-checkin` change.)

## What changes (in scope)
- **Proposals render inline.** On an open request, the request screen
  (`request/[id]`) shows the proposal list directly — sorting (price / ETA /
  rating), each proposal card, accept (slide-to-accept on the best, button on the
  rest), and the cancel-request link — instead of the "Ver propostas (N)" button.
- **The dedicated route redirects.** `request/[id]/proposals` becomes a thin
  redirect to `request/[id]` (mirrors what `track` now does), so existing links /
  push notifications still resolve.
- **Reuse, no duplication.** The list/sort/card/accept logic moves out of the
  screen into a `ProposalsList` component used inline; accepting no longer needs
  to navigate (already on the request screen) — it just refreshes.

## Deferred (NOT in this change)
- No change to non-open states (the inline action cards stay as they are).
- No backend change — the `GET requests/{id}/proposals` endpoint is unchanged.

## Impact
- Module: `customer`.
- Frontend (`apps/customer`): new `src/components/ProposalsList.tsx` (extracted
  from `request/[id]/proposals.tsx`); the open branch of `request/[id]/index.tsx`
  renders it instead of the navigate button; `request/[id]/proposals.tsx` becomes
  a redirect. i18n keys are reused (no new copy expected).
- Behavior: one fewer tap to see proposals; deep links to `/proposals` still
  land on the request. The "Ver propostas (N)" button is removed.
