# Tasks — design system foundations

## 1. `<Sheet>` (DS-02)
- [ ] 1.1 Extract `<Sheet>`: backdrop, grab handle, safe-area insets, close target ≥44dp, accessibility (role, dismiss).
- [ ] 1.2 Migrate `DictationModal.tsx:104`.
- [ ] 1.3 Migrate `RequestFilterSheet.tsx:51`.
- [ ] 1.4 Migrate `RecordKmSheet.tsx:63`.
- [ ] 1.5 Migrate `SinglePicker.tsx:43`.
- [ ] 1.6 Migrate `LinkedPicker.tsx:86`.
- [ ] 1.7 Migrate `DatePicker.tsx:88`.
- [ ] 1.8 Delete the six copies of the duplicated comment.

## 2. Other extractions (DS-05, DS-06)
- [ ] 2.1 `<SelectField>` — replace `LinkedPicker.tsx:129`, `primitives.tsx:231`, `DatePicker.tsx:80`.
- [ ] 2.2 `<GradientCTACard>` — replace `home.tsx:182-197` and `HomeAssets.tsx:154-174`.

## 3. Tokens (DS-03, DS-08, DS-09, DS-10)
- [ ] 3.1 Add `theme.space` (4-pt scale) and `radius.sheet`.
- [ ] 3.2 Migrate `Row`, `Screen`, `Card` off magic numbers; settle the 13-vs-12 line gap.
- [ ] 3.3 Replace raw `'800'`/`'700'` with `t.headWeight` (`primitives.tsx:162,166,213`).
- [ ] 3.4 Replace `borderRadius: 999` with `t.radius.btn` (`Badge.tsx:27`, `Chip.tsx:26`, `primitives.tsx:295`).
- [ ] 3.5 Single asset-type icon map in `assetDisplay`; drop the local one in `assets/[id]/index.tsx:30`.

## 4. Typography (DS-04)
- [ ] 4.1 Extend `Variant` to cover the sizes actually used.
- [ ] 4.2 Migrate the inline `fontSize` sites (`primitives.tsx`, `Wiz.tsx`, `notifications.tsx`).
- [ ] 4.3 Add the lint rule banning literal `fontSize` in `packages/shared/src/ui`.

## 5. Contrast (DS-01)
- [ ] 5.1 Measure `soft`, `ok`, `ink3` against their backgrounds; record the ratios.
- [ ] 5.2 Darken them or add `*Text` variants that clear 4.5:1.
- [ ] 5.3 Restrict `ink3` to decorative use and fix the places using it as text.

## 6. Performance (PERF-01)
- [ ] 6.1 `StyleSheet.create` for the static parts of the ~23 components that build styles inline.

## 7. Verify
- [ ] 7.1 Customer app: visual pass, light and dark.
- [ ] 7.2 Provider app: same, since it consumes the same primitives.
- [ ] 7.3 `tsc --noEmit` clean in `packages/shared` and both apps.

## 8. Close out
- [ ] 8.1 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
