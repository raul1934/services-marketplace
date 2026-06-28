# Change: provider-account-drawer-avatar

## Why
The provider bottom bar now has 5 tabs (Dashboard, Find, Work, Schedule,
Profile), which is crowded. The account/profile is better reached from the drawer
and a quick avatar button, freeing the bar to 4 primary destinations.

## What changes (in scope)
- **Remove Profile from the bottom tab bar.** The bar becomes Dashboard, Find,
  Work, Schedule (4 tabs). The profile route stays available (`href: null`), so
  it's reachable but not shown in the bar.
- **Avatar button on the dashboard.** The dashboard's top-right avatar becomes a
  tappable circular button that opens the account (profile) screen.
- **Account in the drawer.** The drawer's account section links to the profile
  hub (`/(tabs)/profile`) instead of going straight to edit-profile.

## Deferred (NOT in this change)
- No change to the customer app (its 3-tab bar is fine).
- No change to the profile screen's content (it stays the account hub).

## Impact
- Module: `provider`.
- Frontend (`apps/provider`): `app/(tabs)/_layout.tsx` sets `href: null` on the
  profile tab; `app/(tabs)/dashboard.tsx` wraps the header avatar in a Pressable
  → `/(tabs)/profile`, and its drawer account item points to `/(tabs)/profile`.
  i18n: `drawer.myAccount` (pt-BR + en-US).
- No backend change.
