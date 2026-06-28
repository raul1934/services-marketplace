# Tasks — sticky-screen-header

## 1. Screen component
- [x] 1.1 `packages/shared/src/ui/Screen.tsx`: add `stickyHeader?: boolean`; when set, render the first child pinned above the scroll over an opaque (`t.colors.bg`) background, respecting `padded` + the centered column; the rest scrolls.

## 2. Roll out to screens
- [x] 2.1 Add `stickyHeader` to the `<Screen>` of the 5 `h1` tab screens (customer requests, customer profile, provider profile, provider jobs, provider agenda).
- [x] 2.2 Add `stickyHeader` to the 2 `AppBar` dashboards (customer home, provider dashboard).
- [x] 2.3 Add `stickyHeader` to the 26 `BackBar` screens (customer + provider).

## 3. Verify
- [x] 3.1 Typecheck shared + both apps (0 new errors).
- [x] 3.2 Visual (Playwright): on a representative h1 screen (Requests), an AppBar screen (home), and a BackBar screen (a request/job detail), scrolling keeps the header pinned at the top.
