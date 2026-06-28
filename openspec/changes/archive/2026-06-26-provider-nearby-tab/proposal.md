# Change: provider-nearby-tab

## Why
The provider reaches the "Nearby jobs" feed (where they find open requests to bid
on) via a floating search button on the dashboard. That feed is a primary part of
the provider's job, so it belongs in the bottom tab bar — as the second tab —
rather than a floating button.

## What changes (in scope)
- **Nearby becomes the 2nd bottom tab.** The tab order becomes: Dashboard,
  **Nearby**, Work (jobs), Schedule (agenda), Profile. The tab uses the search
  icon (matching the old button).
- **The floating button is removed** from the dashboard.
- The Nearby screen moves into the tab group (route `/nearby` is unchanged, so the
  drawer link still works) and its header switches from a back-bar to a tab title
  (no back arrow), keeping the filter button.

## Deferred (NOT in this change)
- No change to the Nearby feed itself (list/map/calendar, filters).
- The drawer's "Nearby" shortcut is left in place (still valid; now also a tab).

## Impact
- Module: `provider`.
- Frontend (`apps/provider`): move `app/nearby.tsx` → `app/(tabs)/nearby.tsx`;
  swap its `BackBar` for a tab title row (title + filter button, no back); add the
  Nearby `Tabs.Screen` as the 2nd entry in `app/(tabs)/_layout.tsx`; remove the
  FAB from `app/(tabs)/dashboard.tsx`. i18n: add `tabs.nearby` (pt-BR + en-US).
- No backend change.
