# Tasks — provider-nearby-tab

## 1. Make Nearby a tab
- [x] 1.1 Move `app/nearby.tsx` → `app/(tabs)/nearby.tsx` (route `/nearby` unchanged; fix the relative imports `../src` → `../../src`).
- [x] 1.2 Replace its `BackBar` with a tab title row: `Text variant="h1"` ({nearby.title}) + the existing `FilterButton` on the right, no back arrow.
- [x] 1.3 Add a `Tabs.Screen name="nearby"` as the **2nd** entry in `app/(tabs)/_layout.tsx` (search icon, title `tabs.nearby`).

## 2. Remove the FAB
- [x] 2.1 Remove the floating search `Pressable` (→ `/nearby`) from `app/(tabs)/dashboard.tsx` (and any now-unused imports).

## 3. i18n
- [x] 3.1 Add `tabs.nearby` to provider pt-BR + en-US.

## 4. Verify
- [x] 4.1 Typecheck provider app (0 new errors).
- [x] 4.2 Visual (Playwright @ :19082): the bottom bar shows Nearby as the 2nd tab; tapping it opens the Nearby feed (no back arrow, filter present); the dashboard no longer shows the floating button.
