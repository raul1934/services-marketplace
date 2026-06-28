# Change: design-audit-fixes

## Why
The design/implementation audit (`audit/DESIGN_AUDIT.md`) found 18 issues. The
highest-leverage ones are **systemic** and live in the shared UI kit, so a small
number of edits fix them across every screen of both apps. This change ships
those quick, high-confidence wins.

## What changes (in scope)
- **RESP-01 / RESP-02 (High/Med):** constrain the app to a centered phone-width
  column on the web so the mobile layout stops stretching edge-to-edge on
  tablet/desktop. (`Screen`)
- **A11Y-02 (High):** caption text uses `ink3` (~2.6:1, fails AA) → default
  `caption` to `ink2` (~5.4:1). (`Text`)
- **A11Y-01 (High):** headings have no semantic role → `h1/h2/h3` get
  `accessibilityRole="header"` with level. (`Text`)
- **A11Y-03 + INT-01 (Med):** interactive controls get visible web focus rings
  and hover feedback. (`Button`, `IconButton`, `Card`, `Chip`)
- **A11Y-05 (Low/Med):** icon-only buttons get accessible names. (`IconButton`)
- **FUNC-03 (Med):** provider can toggle "com seguro" coverage from edit-profile
  (backend already accepts `insured`; badge already shows). (provider edit-profile)

## Deferred (named follow-up changes, NOT in this one)
- **DS-02** `add-toast-system` — replace `Alert.alert` with branded toast +
  in-context error banners (cross-cutting refactor).
- **FUNC-01** `add-query-error-states` — error/retry UI on data screens.
- **A11Y-04** `wire-form-error-a11y` — field-level validation + aria associations.
- **VIS-01** `web-map-fallback` — Leaflet/Google fallback for react-native-maps.
- **FUNC-02** `client-account-screens` — Endereços/Pagamentos/Notificações/Ajuda.
- **INT-02** `drawer-slide-gesture` — slide/edge-swipe drawer.
- **TYPO-01**, **VIS-02/03** — font preload polish; icon-style review (lucide is intentional).

## Impact
- Modules: `shared-ui` (kit), `provider` (edit-profile).
- No API or schema changes. No new dependencies. Behavior of existing flows
  unchanged except the additive a11y/responsive/visual improvements.
