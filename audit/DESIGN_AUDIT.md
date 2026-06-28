# DESIGN_AUDIT

**Date:** 2026-06-22 · **Apps:** Customer (19083) / Provider (19082), Expo web
**Reference:** HTML prototypes (`walvee Prototipo.html`, `Pro.html`, `Prestador.html`, `v3 Cliente - Layouts.html`), `walvee-ui.css`, V5 spec.
**Method:** code + computed tokens vs `walvee-ui.css` + V5 spec + native-emulator screenshots. Live web screenshots were not capturable (Preview MCP cannot attach to the Docker-served ports; no Figma source exists). Items needing a browser pass are marked **(verify-on-web)**.

Severity: **Critical** (blocks use / broken), **High** (clear deviation, broad impact), **Medium** (noticeable), **Low** (polish).

---

### RESP-01 — Phone-frame UI not constrained on tablet/desktop
- **Screen:** All · **URL:** any (`19083`/`19082`) · **Component:** `Screen` · **Category:** Responsive · **Severity:** High
- **Issue:** The prototype is a fixed **`Phone` frame (390×844)**. The web build's `Screen` (`ui/Screen.tsx`) sets only `paddingHorizontal: 20` with **no `maxWidth`/centering**, so at ≥768px the mobile layout stretches edge-to-edge.
- **Current:** Content fills the full viewport width at 768/1024/1280/1440/1920; cards and rows become very wide; the design’s phone composition is lost.
- **Expected:** Constrain content to a phone-width column (~390–430px) centered, or provide a true responsive desktop layout. Prototype renders inside `.phone`.
- **Impact:** On desktop the apps look broken/unintended; line lengths and tap targets are off.
- **Fix:** Add `maxWidth` + `alignSelf:'center'` to `Screen`’s container (e.g. `maxWidth: 480`), or a web-only frame wrapper. **Design tokens:** none (layout).

### DS-02 — Errors/success use native browser dialogs, not styled toasts
- **Screen:** All · **Component:** `Alert.alert` usages · **Category:** Design System / UX · **Severity:** High
- **Issue:** Every confirmation/error/success uses RN `Alert.alert`, which on **react-native-web renders as `window.alert/confirm`** — unstyled OS dialogs.
- **Current:** “Salvo”, “Erro”, validation messages appear as browser-chrome dialogs (off-brand, blocking).
- **Expected:** Branded toast/snackbar + in-context error banners (prototype shows inline feedback, not OS dialogs).
- **Impact:** Breaks the visual language on web; blocking modals hurt flow; inconsistent with mobile.
- **Fix:** Add a shared `Toast`/`Snackbar` and an in-screen error banner; replace `Alert.alert` for non-destructive feedback. Keep confirm dialogs as a styled modal. **Tokens:** surface, danger/ok, dangerSoft/okSoft.

### A11Y-01 — No semantic headings/landmarks
- **Screen:** All · **Category:** Accessibility · **Severity:** High
- **Issue:** RN-web renders `Text` as `<div>/<span>` and containers as `<div>`. There are **no `<h1>`/heading levels, no `<nav>/<main>/<header>` landmarks**, and `variant="h1"/"h3"` are visual only.
- **Current:** Screen readers get a flat structure; no heading navigation, no landmark navigation.
- **Expected:** WCAG 2.1 AA: meaningful heading hierarchy and landmark regions.
- **Impact:** Poor screen-reader UX; fails 1.3.1 / 2.4.1 / 2.4.6.
- **Fix:** Use `accessibilityRole="header"` on titles (maps to `role/aria-level` on web) and `role` landmarks via `aria-*`/`role` props on key containers; set heading levels. **Tokens:** none.

### A11Y-02 — Insufficient color contrast (CTAs + captions)
- **Screen:** All · **Component:** `Button` (grad/accent), `Text variant="caption"` (ink3) · **Category:** Accessibility · **Severity:** High
- **Issue:** White text on the accent/gradient (`#ff6a3d`) ≈ **2.5:1**; `accentInk` on `ok #12b981` ≈ 2.0:1, on `danger #f0455b` ≈ 3.3:1; caption text `ink3 #95a2b6` on `surface #fff` ≈ **2.4:1**. All below WCAG AA (4.5:1 normal / 3:1 large/UI). **(verify-on-web with exact ratios)**
- **Current:** Primary CTAs and secondary captions are low-contrast.
- **Expected:** ≥4.5:1 for text; ≥3:1 for large text/UI.
- **Impact:** Fails 1.4.3; hard to read in sunlight/low vision.
- **Fix:** Darken accent for text-bearing surfaces or use a darker ink on accent; reserve `ink3` for non-essential text only; bump caption color to `ink2`. **Tokens:** accent, accentInk, ink2, ink3, ok, danger.

### A11Y-03 — No visible focus indicators / unclear keyboard activation
- **Screen:** All · **Component:** `Button`, `IconButton`, `Card(onPress)`, `Chip`, text-as-link · **Category:** Accessibility · **Severity:** Medium
- **Issue:** Pressables render without a web focus ring; several tappables are `Text onPress` (not button role, not keyboard-focusable).
- **Expected:** Visible focus (2.4.7) and keyboard operability (2.1.1) for all interactive elements.
- **Fix:** Add `:focus-visible` outline (web style) to Pressable wrappers; give tappable text `accessibilityRole="button"` + ensure focusable. **Tokens:** accent (focus ring).

### A11Y-04 — Form errors not associated with fields
- **Screen:** create-request, auth, asset add/edit, dispute, warranty · **Component:** `Field` · **Category:** Accessibility · **Severity:** Medium
- **Issue:** `Field` supports an `error` prop (visual), but validation today is server-side surfaced via `Alert.alert`; errors aren’t tied to inputs (`aria-describedby`/`role="alert"`), and required state isn’t announced.
- **Expected:** Programmatic label/error association; `aria-invalid`, live-region announcement (3.3.1/3.3.3/4.1.3).
- **Fix:** Route validation into `Field error`, wire `aria-describedby`, add `accessibilityLiveRegion`. **Tokens:** danger.

### INT-01 — No hover affordances on web
- **Screen:** All · **Component:** `Button`, `Card`, `Chip`, nav · **Category:** Visual/Interaction · **Severity:** Medium
- **Issue:** Components implement only `pressed` (scale/opacity). On desktop there’s **no hover state**.
- **Expected:** Hover feedback for pointer devices (prototype is mobile-first, but web needs hover affordance).
- **Fix:** Add web hover styles (RNW supports `:hover` via style or `onHoverIn`). **Tokens:** surface2, accentSoft.

### INT-02 — Drawer lacks slide/edge-swipe; fade only
- **Screen:** home / dashboard · **Component:** `AppDrawer` · **Category:** Interaction · **Severity:** Medium
- **Issue:** `AppDrawer` is a `Modal animationType="fade"` overlay; no slide-in-from-left animation and no edge-swipe gesture.
- **Expected:** Drawer slides from the left; optional edge-swipe (spec: “hambúrguer” drawer).
- **Fix:** Animate translateX, or migrate to `@react-navigation/drawer` if edge-swipe is required. **Tokens:** bg, line, shadow.

### VIS-01 — Map screens show a placeholder on web
- **Screen:** customer track, provider nearby (Mapa tab) · **Component:** `react-native-maps` · **Category:** Visual/Functional · **Severity:** Medium
- **Issue:** `react-native-maps` has no web implementation; a stub renders (per `docker-compose.web.yml` note).
- **Expected:** Live map with pins/ETA (C15, P06).
- **Fix:** Web map fallback (Leaflet/Google JS) behind the same component, or hide the Mapa tab on web. **Tokens:** none.

### FUNC-01 — Data-fetch errors have no in-screen state
- **Screen:** lists/detail (requests, proposals, jobs, nearby, assets, wallet) · **Category:** Functional · **Severity:** Medium
- **Issue:** Queries show `ActivityIndicator` while loading and content on success, but **on error there’s no error/retry UI** (React Query error states aren’t rendered; failures are silent or only via Alert on mutations).
- **Expected:** Error state with retry (V5 implies graceful degradation).
- **Fix:** Render `query.isError` → error card + retry button. **Tokens:** danger, surface.

### FUNC-03 — Provider “com seguro” has no toggle UI
- **Screen:** provider edit-profile · **Component:** insurance · **Category:** Functional · **Severity:** Medium
- **Issue:** Backend accepts `insured` and the **badge shows on proposals**, but `edit-profile` has **no control** to turn coverage on/off.
- **Expected:** Opt-in toggle in the pro’s profile (V5: selo “com seguro”).
- **Fix:** Add a Toggle in `edit-profile` calling `updateProfile({ insured })`. **Tokens:** ok, accent.

### FUNC-02 — Drawer omits several spec menu items
- **Screen:** home / dashboard drawer · **Category:** Functional (missing feature) · **Severity:** Low
- **Issue:** V5 client drawer lists Endereços, Pagamentos, Notificações, Quero ser prestador, Ajuda & garantia; provider lists Avaliações, Notificações, Ajuda. These are **omitted** (no destination screens).
- **Expected:** Either the screens exist, or items are clearly “em breve”.
- **Fix:** Build the missing screens or hide intentionally; don’t leave the spec set partially represented silently. **Tokens:** none.

### DS-03 — Duplicated UI patterns (tech debt)
- **Screen:** multiple · **Category:** Design System · **Severity:** Low/Medium
- **Issue:** Asset-summary card (3×), bottom-sheet modals (4×), key-value/breakdown rows (`TotalLine`/`SumRow`/`Line`/`Stat`), and `initialsOf()` are re-implemented per screen.
- **Expected:** Shared `AssetRow`, `BottomSheet`, `KeyValueRow`, shared `initials()`.
- **Fix:** Extract to `@walvee/shared`. **Tokens:** none.

### VIS-02 — Icon set swapped to lucide (glyph drift vs prototype)
- **Screen:** All · **Component:** `Icon` · **Category:** Visual/Design System · **Severity:** Low
- **Issue:** `Icon` migrated from the prototype’s bespoke SVG set to **lucide-react-native** (fixes missing icons). Lucide glyphs differ slightly in weight/shape from the prototype assets; `pix`→`QrCode` is an approximation.
- **Expected:** Prototype icon style (custom set).
- **Fix:** Acceptable trade-off (consistency + completeness); if pixel-match matters, supply lucide-equivalent or restore the SVG set with full coverage. **Tokens:** none.

### RESP-02 — Mobile chrome not adapted for desktop
- **Screen:** All (tabs) · **Component:** Tab bar (84px), nearby floating toggle, dashboard FAB · **Category:** Responsive · **Severity:** Medium
- **Issue:** Bottom tab bar (fixed 84px), the floating List/Map/Agenda toggle, and the FAB are positioned for phones; on desktop they sit at the bottom of a full-width canvas.
- **Expected:** Within a constrained phone column (see RESP-01) these are fine; full-width desktop makes them look stranded.
- **Fix:** Resolve via RESP-01 (phone column) or a desktop nav. **Tokens:** none.

### TYPO-01 — Web font loading / FOUT
- **Screen:** All · **Category:** Visual · **Severity:** Low
- **Issue:** Manrope/Space Mono load via `@expo-google-fonts`; on web first paint can flash system fonts; `_layout` returns null until fonts load (blank flash).
- **Fix:** Preload fonts / `font-display: swap`; show splash instead of null. **Tokens:** font.

### A11Y-05 — Small/!button tap targets
- **Screen:** various (“Sair”, “Editar”, cancel-as-text, sort segment text) · **Component:** `Text onPress` · **Category:** Accessibility · **Severity:** Low/Medium
- **Issue:** Several actions are `Text` with `onPress` (<44px height, no button role).
- **Expected:** ≥44×44 targets (2.5.5) and button semantics.
- **Fix:** Wrap in Pressable with hitSlop + `accessibilityRole="button"`. **Tokens:** none.

### VIS-03 — Android 17 emulator “16 KB page” compat dialog (Expo Go)
- **Screen:** native launch (provider) · **Category:** Visual (environment) · **Severity:** Low
- **Issue:** On the Android 17 preview emulator, Expo Go shows a 16KB-alignment compatibility dialog over the app (captured in native screenshots).
- **Expected:** No system dialog.
- **Fix:** Environment-only (Expo Go libs not 16KB-aligned); a dev/native build on a stable Android image avoids it. **Tokens:** none.

---

## Positives (no action)
- **Token fidelity**: theme is a faithful 1:1 port of `walvee-ui.css` (colors, radii, shadows, gradients, fonts).
- **Loading + empty states** present across data screens; **i18n pt-BR/en-US** complete for new flows.
- **Realtime + push** infrastructure wired; **back-button** hardened with `canGoBack` fallback; **footer/FAB** fixed-position bugs resolved earlier this session.
- **Voice dictation** affordance (web STT; native keyboard) added to free-text fields.
