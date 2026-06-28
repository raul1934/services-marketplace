# Tasks — provider-account-drawer-avatar

## 1. Remove Profile from the bar
- [x] 1.1 `app/(tabs)/_layout.tsx`: set `options={{ href: null }}` (keep title/icon) on the `profile` Tabs.Screen so it leaves the bar but stays routable. Bar = Dashboard, Find, Work, Schedule.

## 2. Avatar button on the dashboard
- [x] 2.1 `app/(tabs)/dashboard.tsx`: wrap the header-right avatar (`AvInit`) in a `Pressable` → `router.push('/(tabs)/profile')`, with an accessibility label.

## 3. Account in the drawer
- [x] 3.1 `app/(tabs)/dashboard.tsx`: change the drawer account section's first item to "Minha conta" → `/(tabs)/profile` (the account hub).
- [x] 3.2 i18n: add `drawer.myAccount` to provider pt-BR + en-US.

## 3b. Back control on the account screen
- [x] 3b.1 `app/(tabs)/profile.tsx`: add a back button next to the title (returns to the dashboard), since the screen is now reached by navigation rather than a tab.

## 4. Verify
- [x] 4.1 Typecheck provider app (0 new errors).
- [x] 4.2 Visual (Playwright @ :19082): bottom bar shows 4 tabs (no Profile); tapping the dashboard avatar opens the profile screen; the drawer's account item opens the profile hub.
