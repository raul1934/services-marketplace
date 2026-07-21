# Give the design system the primitives it has been copy-pasting

## Why

The design system is mature in intent and leaky in practice. Three gaps produce
most of the drift the audit found.

There is no `<Sheet>`. Six files reimplement modal + backdrop + grab handle —
`DictationModal`, `RequestFilterSheet`, `RecordKmSheet`, `SinglePicker`,
`LinkedPicker`, `DatePicker` — and the giveaway is that the same explanatory
comment appears verbatim in all six. Their paddings, insets and accessibility have
already diverged, which is why "pad the sheets past the Android nav bar" had to be
fixed six times. `SelectField` is copy-pasted three times, and the gradient CTA
card twice.

There is no spacing scale. Values are hardcoded (12/13/14/16/18/20…) and the
"line" gap is 13 in one primitive and 12 in another — a difference nobody chose.
Typography escapes the same way: raw `fontSize: 12.5 / 13.5 / 14.5` outside
`<Text variant>`, which defeats the type scale.

And contrast is still failing. The CTA accent was deepened to 4.29:1, but `soft`
(2.54:1), `ok` (2.57:1) and `ink3` (2.59:1) are used as text throughout and fail
1.4.3.

## What changes

- **DS-02** — extract `<Sheet>` (backdrop, grab handle, insets, focus and
  accessibility) and migrate all six call sites.
- **DS-06 / DS-05** — extract `<SelectField>` and `<GradientCTACard>`.
- **DS-03** — add a 4-pt `theme.space` scale plus `radius.sheet`; migrate `Row`,
  `Screen`, `Card` first.
- **DS-04** — widen `Text`'s `Variant` set to cover the sizes in use; add a lint
  rule banning literal `fontSize`.
- **DS-01** — finish contrast: darken `soft`/`ok` or introduce `*Text` tokens, and
  demote `ink3` to decorative only.
- **DS-08 / DS-09 / DS-10** — consume `t.headWeight` instead of raw `'800'`, use
  `t.radius.btn` instead of `borderRadius: 999`, and drop the duplicated asset-type
  icon map.
- **PERF-01** — `StyleSheet.create` for the static parts of the ~23 components
  that build style objects every render.

## Impact

- **Affected specs**: `shared-ui`
- **Affected code**: `packages/shared/src/ui/*` and `themes.ts`; the six sheet call
  sites and the three `SelectField` sites in both apps.
- **Findings**: DS-01 (partial, Crítico), DS-02, DS-03, DS-04, DS-05, DS-06,
  DS-08, DS-09, DS-10, PERF-01.
- **Touches the provider app**: the shared UI is used by both, so migrations must
  be verified there too, even though the audit only covered the customer.
- **Sequencing**: land `<Sheet>` before `consolidate-exception-screens`, which
  plans to turn several exception screens into inline sheets.
