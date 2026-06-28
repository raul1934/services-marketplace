# Change: sticky-screen-header

## Why
Every screen's title/header (the `h1` like "Meus chamados", or the `AppBar` /
`BackBar` top bar) currently lives inside the scroll area, so it scrolls away.
The header should stay pinned at the top while the content scrolls — on every
screen.

## What changes (in scope)
- **`Screen` gains a `stickyHeader` prop.** When set, the screen's **first child**
  (the header — `AppBar` / `BackBar` / the `h1` title block) is rendered pinned at
  the top, outside the ScrollView, over an opaque background; the rest scrolls
  underneath. It mirrors the existing pinned `footer`, and respects the screen's
  `padded` / centered-column layout so headers keep their current spacing.
- **Roll it out to all screens.** Each screen with a header (≈33: 26 `BackBar`,
  2 `AppBar`, 5 `h1` titles) gets `stickyHeader` added to its `<Screen>` — a
  one-prop change, no JSX restructuring (the header is already the first child).

## Deferred (NOT in this change)
- No new visual styling (no shadow/border under the header) beyond making it
  opaque so content doesn't bleed through. Can add a scroll-shadow later.
- Screens without a header-as-first-child (e.g. pure loading/empty states) are
  left as-is.

## Impact
- Module: `shared-ui` (the `Screen` change); applied across `apps/customer` and
  `apps/provider` screens.
- Frontend: `packages/shared/src/ui/Screen.tsx` splits the first child into a
  pinned header when `stickyHeader` is set; ~33 screen files add the prop.
- No backend change. No i18n change.
