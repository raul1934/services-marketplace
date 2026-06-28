# Change: bid-send-success-splash

## Why
When the provider slides to send a bid, the screen currently shows a native alert
and goes back. Two problems: (1) the bid can be sent more than once (the slide is
only disabled while the request is in flight, not after it succeeds), and (2) the
confirmation is an OS alert, not a satisfying in-app success state.

## What changes (in scope)
- **Send once.** After a successful send the slide is permanently disabled, so the
  provider cannot submit the same bid twice.
- **Success animation.** On success the screen shows a full-screen green overlay
  with an animated check in the center (instead of the alert).
- **Then the proposal.** After the animation, the provider lands on the job screen
  showing their submitted proposal ("proposta enviada"), via `replace` so they
  can't slide-send again by going back.

## Deferred (NOT in this change)
- No change to the bid wizard steps or the proposal payload.

## Impact
- Module: `shared-ui` (new reusable `SuccessSplash` — green full-screen + animated
  check, fires `onDone` after a short hold) + `provider` (bid send wiring).
- Frontend (`apps/provider`): `job/[id]/bid.tsx` sets a `sent` flag on success
  (disables the slide), renders `SuccessSplash`, and on its `onDone` does
  `router.replace('/job/[id]')`. The native alert is removed.
- No backend change (submit is already idempotent on (request, provider)).
