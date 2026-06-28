# ACCESSIBILITY_REPORT (WCAG 2.1 AA)

**Apps:** Customer (19083) / Provider (19082), Expo web (react-native-web). **Method:** code review + computed contrast ratios from theme tokens. Live AT/keyboard testing marked **(verify-on-web)**.

## Contrast (computed from `themes.ts` sunset, on `surface #ffffff`)

| Pair | Use | Ratio (approx) | AA normal (4.5) | AA large/UI (3.0) |
|---|---|---|---|---|
| `ink #15233b` on white | body/titles | ~13:1 | ✅ | ✅ |
| `ink2 #5b6b82` on white | secondary text | ~5.4:1 | ✅ | ✅ |
| `ink3 #95a2b6` on white | **captions/placeholders** | **~2.6:1** | ❌ | ❌ |
| white on `accent #ff6a3d` | **primary CTA / gradient** | **~2.85:1** | ❌ | ⚠ ~3:1 |
| white on `ok #12b981` | success buttons/badges | **~2.5:1** | ❌ | ❌ |
| white on `danger #f0455b` | danger buttons/badges | **~3.7:1** | ❌ | ✅ |

**Findings:**
- **A11Y-02 (High):** `ink3` text and white-on-accent/ok/danger fail AA. `ink3` is widely used for captions (`Text variant="caption"`), placeholders, and meta lines; primary CTAs use white on the orange accent/gradient.
- **Fix:** promote caption color to `ink2`; for CTAs use a darker accent shade for text-bearing fills or dark ink on accent; treat `ink3` as decorative only.

## Structure & semantics
- **A11Y-01 (High):** No heading hierarchy or landmarks — RN-web emits `<div>/<span>`; `variant="h1/h3"` are visual. No `<nav>/<main>/<header>`. → fails 1.3.1, 2.4.1, 2.4.6.
- **Fix:** `accessibilityRole="header"` on titles (+ heading level), landmark roles on Screen/AppBar/TabBar containers.

## Keyboard & focus
- **A11Y-03 (Medium):** No visible focus ring on Pressable/Button/IconButton/Chip; tappable `Text onPress` items aren't reliably focusable/operable. → fails 2.1.1, 2.4.7.
- **A11Y-05 (Low/Med):** Some actions are `<44px` text links without `accessibilityRole="button"` → 2.5.5.
- **Fix:** global `:focus-visible` outline for pressables; wrap text actions in Pressable with `role=button` + `hitSlop`.

## Forms
- **A11Y-04 (Medium):** `Field` has visual `error`, but validation is server-side via `Alert.alert`; errors aren't associated to inputs (`aria-describedby`/`role=alert`), no `aria-invalid`, required state not announced. → fails 3.3.1, 3.3.2, 3.3.3, 4.1.3.
- **Fix:** drive validation into `Field error`; add `aria-describedby`, `accessibilityLiveRegion`.

## Other
- **Dynamic feedback** via `Alert.alert` → native dialog focus is OK for AT but off-brand (see DS-02); success toasts aren't announced as live regions.
- **Images/icons:** decorative icons mostly lack `accessibilityLabel`; icon-only buttons (bell, menu) need accessible names. → 1.1.1 / 4.1.2.
- **Color as sole signal:** delta ("acima/abaixo do orçamento") and tiers rely partly on color + text (text present → OK), but status dots rely on color (1.4.1) — pair with text/shape.

## Accessibility score
**~55/100 (Needs work).** Token contrast and missing semantics/focus are the main gaps. Most are systemic (fix once in `Text`/`Button`/`Field`/`Screen` + token tweaks) rather than per-screen — so remediation is high-leverage.
