# Design — design-audit-fixes

All edits are in `frontend/packages/shared/src/ui/` except FUNC-03.

## Screen phone column (RESP-01/02)
`Screen.tsx`: wrap content in a centered column with `maxWidth: 480, width: '100%', alignSelf: 'center'`. Applies on both the `ScrollView` `contentContainerStyle` and the non-scroll `View`. Safe on native (phones < 480 are unaffected; tablets center). No platform gate needed.

## Text headings + caption contrast (A11Y-01/02)
`Text.tsx`:
- `caption` base color `ink3` → `ink2` (passes AA ~5.4:1). `ink3` still reachable via explicit `color`.
- For `variant` h1/h2/h3, pass `accessibilityRole="header"` and `aria-level` (1/2/3). RNW maps `role="header"` → `role="heading"`; `aria-level` sets the level. Native ignores `aria-level` harmlessly.

## Focus + hover on controls (A11Y-03 / INT-01)
RNW's `Pressable` style callback exposes `{ pressed, hovered, focused }`. For `Button`, `IconButton`, `Card(onPress)`, `Chip`:
- `hovered` → subtle feedback (opacity/scale or surface tint).
- `focused` (web only) → 2px accent outline via `outlineWidth/outlineColor/outlineStyle/outlineOffset` (RNW style props; gated by `Platform.OS === 'web'` to avoid native warnings).

## Icon button names (A11Y-05)
`IconButton.tsx`: add optional `accessibilityLabel` prop; set `accessibilityRole="button"`. Call sites pass labels for icon-only actions (bell, menu) — minimal, additive.

## Insurance toggle (FUNC-03)
`apps/provider/app/edit-profile.tsx`: add a `Toggle` row "Tenho seguro de responsabilidade" bound to `user.provider_profile.insured`; on change call `providerApi.updateProfile({ insured })` and refresh. Backend already validates `insured` and the proposal card already renders the badge.

## Out of scope
Listed in proposal "Deferred". Notably DS-02 (toast) is intentionally separate — it's a broad refactor of ~40 `Alert.alert` call sites.
