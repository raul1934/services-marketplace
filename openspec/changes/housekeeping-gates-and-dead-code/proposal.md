# Close the POC gate and clear the dead weight

## Why

A handful of findings share nothing but their size: each is a few lines, none
needs a design decision, and together they are the cheapest way to shrink the
open list. One of them is not cosmetic at all — `_layout.tsx:79` exempts the AR
measurement screens from the auth gate, so `/medicao` and `/ar-medicao` are
reachable **without logging in, in production**. They were POC screens and the
exemption was a development convenience that shipped.

The rest is residue: a `stepOf` helper on the home that returns 3 for both an
active and a finished request (so the stepper it feeds has been lying), i18n keys
defined and never rendered, and two redirect-only routes that mount a React frame
before bouncing, which reads as a flash.

## What changes

- **AR-01** — drop the `medicao | ar-medicao` exemption from the auth gate, or
  gate it behind `__DEV__`. Decide one; do not leave the route open.
- **PERF-02** — delete `stepOf` in `home.tsx` and the branch that consumes it.
- **CONS-06** — remove the dead i18n keys (`pt-BR.json:98,107,109,132-139`) or
  wire them up; leaving them invites a translator to work on nothing.
- **REQ-18** — `proposals.tsx` / `track.tsx` redirect via the router instead of
  rendering a frame first.
- **REQ-19** — document `receipt.tsx` as an intentional alias (it is a
  notification deep-link target), so the next reader does not "clean it up".
- **CONS-03** — finish the ETA unification: `etaLabel` already zero-pads, but the
  proposal card, the notification and the tracking screen still format
  independently. One formatter, three callers.

## Impact

- **Affected specs**: `customer`
- **Affected code**: `app/_layout.tsx`, `app/(tabs)/home.tsx`,
  `app/request/[id]/proposals.tsx`, `app/request/[id]/track.tsx`,
  `src/i18n/locales/*.json`, the ETA call sites.
- **Findings**: AR-01, PERF-02, CONS-06, REQ-18, REQ-19, CONS-03.
- **Out of scope**: the AR feature itself — this only decides who may reach it.
