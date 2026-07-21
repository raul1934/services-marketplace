# Slim the request screen down to what is true right now

## Why

`request/[id]/index.tsx` is the screen a customer lives in while a job runs, and it
is the most overloaded surface in the app. The tracking tab conditionally stacks up
to **thirteen blocks** — proposals, map, job panel, parts, surcharge, re-quote,
receipt, summary — so what the user sees depends on a pile of conditions rather
than on a stage.

The duplication inside it is measurable. Parts are approved inline *and* listed in
the job panel; the price appears in three places; category, address and urgency are
repeated across the `BackBar`, `JobSubject` and a `DetailRow`. The start code — a
30px card — stays on screen during `in_progress`, long after the code has done its
job. Review lives in three surfaces at once, and the modal one reopens on every
focus and resets on reload, which is a nag.

Two smaller ones sit here: the request list filters client-side, so the count only
reflects what has been paginated and lies to the user; and nobody ever confirms the
job is finished — there is a start code to begin, but settlement appears done with
no customer act.

## What changes

- **REQ-03** — drive the tracking tab from the request's stage: show the blocks
  that belong to the current stage, and move exceptions out of the main scroll.
- **REQ-12** — one source per part and per amount; delete the second rendering.
- **REQ-17** — merge the repeated context into the header.
- **REQ-15** — collapse the start code into a chip once `started_at` is set.
- **REQ-11** — one review surface. The dedicated route stays as a notification
  target only; kill the reopening modal.
- **REQ-10** — filter the request list server-side so the count is honest.
- **REQ-16** — decide the completion model: does the customer confirm the job is
  done before settlement? This is a product decision, not a layout fix.

## Impact

- **Affected specs**: `customer`
- **Affected code**: `app/request/[id]/index.tsx` (the bulk), `rate.tsx`,
  `app/(tabs)/requests.tsx`, `ReceiptView.tsx`, and the list endpoint for
  server-side filtering.
- **Findings**: REQ-03, REQ-10, REQ-11, REQ-12, REQ-15, REQ-16, REQ-17.
- **Depends on**: `consolidate-exception-screens` — REQ-03 wants the exceptions out
  of the scroll, and that change decides where they go.
- **Open decision (REQ-16)**: completion confirmation touches money and disputes.
  Options are customer-confirms, auto-confirm-with-window, or provider-declares
  plus a dispute window. Decide before implementing, not during.
