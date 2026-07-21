# Give every control a name, a role and a reachable target

## Why

The app is navigable by sight and close to unusable by TalkBack. The audit found
fourteen accessibility findings; this change takes the transversal half — the ones
that are each a few lines but are everywhere, so they only pay off swept together.

The pattern repeats: `Text onPress` used as a button (no role, no hit target) in
welcome, login, register, verify, the request detail and the proposals list;
selection communicated by border colour alone in `AssetSelector`, `Segment` and
the dynamic-field chips, with no `accessibilityState`; `IconButton` announcing the
**icon name in English** ("bell", "menu") in a pt-BR app; clickable `Card`s that
never say they are buttons; and touch targets at 24–38dp where the guideline is
44 (`marcar todas` ~29px, sheet close ~38px, remove-photo 24px).

Two more are about noise rather than silence: the onboarding scenes read "R$ 95"
and "Melhor opção" out of context because the decorative illustration is not
hidden, and `DividerOr`/`BrandMark` are announced at all.

## What changes

Sweep the customer app and the shared UI so that every interactive element has a
role, an accessible name, a state when it has one, and a target of at least 44dp.

- **A11Y-04** — replace `Text onPress` with `Button`/`Pressable` carrying
  `accessibilityRole="button"` and `hitSlop`, across auth and the request lifecycle.
- **A11Y-05 / A11Y-06** — `accessibilityState={{ selected }}` plus a role on
  `AssetSelector` cards, `Segment` and `DynamicFields` chips.
- **A11Y-09** — i18n labels for `IconButton`; roles on `BackBar` and `Wiz` back.
- **A11Y-10** — bring the listed targets to ≥44dp, with `hitSlop` where layout
  cannot grow.
- **A11Y-12** — an aggregated role and label on clickable `Card`s.
- **A11Y-13 / AUTH-07** — mark decoration as decoration: hide the onboarding
  illustration subtree and `DividerOr`/`BrandMark` from the reader.
- **A11Y-14** — give the unread dot and `Badge dot` a textual equivalent; colour
  alone fails 1.4.1.
- **A11Y-07** — associate field errors with their input and announce them
  (`aria-invalid` + a live region); today the error is visual only, so a reader
  user is told nothing about why the form refused.
- **A11Y-11** — `OtpInput` hides a 1×1px input with no label and renders six loose
  `View`s, so the code field is unreachable and errors do not change the border.
- **A11Y-08** — the focus ring exists only on web and skips sheets, `PickerField`,
  `BackBar`, `Wiz` and "marcar todas".

## Impact

- **Affected specs**: `shared-ui`, `customer`
- **Affected code**: `packages/shared/src/ui/*` (`primitives.tsx`, `Card.tsx`,
  `Badge.tsx`, `DividerOr.tsx`, `BrandMark.tsx`, `Wiz.tsx`), and the auth,
  request-detail, proposals and notifications screens.
- **Findings**: A11Y-04 (partial), A11Y-05, A11Y-06, A11Y-07, A11Y-08, A11Y-09,
  A11Y-10, A11Y-11, A11Y-12, A11Y-13, A11Y-14, AUTH-07.
- **Verification**: TalkBack pass over login → create request → proposals →
  tracking, on the device, not just a code read.
- **Out of scope**: the three controls that are *unusable* rather than unlabelled
  (SlideToConfirm, BudgetMeter, Toggle) — see `accessible-confirmation-controls`.
