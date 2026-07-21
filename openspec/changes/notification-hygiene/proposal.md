# Make notifications calm, grouped and correctly wired

## Why

The live tracker got the attention; the rest of the notification surface did not.
What is left is mostly about volume and restraint.

The bell badge runs an `Animated.loop` for as long as **any** notification is
unread — a ring pulsing forever, which is anxiety and battery rather than
information. Underneath it, nothing is grouped: every bid and every question is
its own alert, so one request with five bids produces roughly ten notifications
and a badge that parks at 99+ and stops meaning anything.

Two smaller wiring problems: the realtime socket is a singleton that captured the
token it connected with, so after a token refresh it keeps using the stale one and
silently stops receiving; and the chime's rate limit is a module-level constant
per instance, so two listeners do not share it and can double-ring.

## What changes

- **NOTIF-01** — the bell pulses once when an unread arrives, then rests.
- **NOTIF-02** — group notifications by request and by type. One request with five
  bids becomes one collapsible entry, not ten rows. Android gets a real
  notification group; the in-app list collapses by `request_id`.
- **NOTIF-03** — resubscribe the Echo socket when the token changes, rather than
  holding the one captured at connect time.
- **NOTIF-04** — move the chime rate limit to shared state so concurrent listeners
  honour the same gap.
- **NOTIF-05** — decide on the launcher badge (`shouldSetBadge` is `false`, so the
  unread count lives only inside the app) and either enable it or record why not.

## Impact

- **Affected specs**: `customer`, `shared-ui`
- **Affected code**: `packages/shared/src/ui/primitives.tsx` (bell badge),
  `packages/shared/src/realtime/echo.ts`, `src/useNotificationChime.ts`,
  `packages/shared/src/lib/push.ts`, `app/notifications.tsx`, and the backend
  notification classes if grouping needs a group key.
- **Findings**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05.
- **Out of scope**: the "chamado em andamento" tracker (NOTIF-06..10, already
  delivered) and any change to which events produce a notification at all.
