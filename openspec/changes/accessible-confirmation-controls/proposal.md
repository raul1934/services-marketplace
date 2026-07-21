# Make the controls that commit money operable by everyone

## Why

Three controls in this app are not merely unlabelled — they are **inoperable**
without sight and a working finger drag, and they happen to be the ones that spend
money.

`SlideToConfirm` has no accessibility props at all: no role, no value, no keyboard
path. It is the only way to accept a proposal (`ProposalsList.tsx:382`), approve a
surcharge (`surcharge.tsx:43`) and approve a re-quote (`requote.tsx:41`). A
TalkBack user therefore cannot hire anyone or approve a charge — not "with
difficulty", at all. That is WCAG 2.1.1, 2.5.7 and 4.1.2 together, on the
conversion path.

`BudgetMeter` is an SVG driven by a `PanResponder` with no role, no value and no
keyboard increment, so the budget cannot be set. `Toggle` looks like a switch and
is a `View` — no `onValueChange`, no `Pressable`, no `accessibilityRole="switch"`
— and it is what gates sharing the asset note with the provider.

## What changes

- **A11Y-01** — `SlideToConfirm` gets `accessibilityRole` with
  `accessibilityActions`, and, when a screen reader is active, an equivalent
  **button** alternative. A gesture may stay as the visual affordance; it may not
  be the only path.
- **A11Y-02** — `BudgetMeter` becomes `accessibilityRole="adjustable"` with
  `accessibilityValue` and increment/decrement actions.
- **DS-07** — `Toggle` becomes a real switch: `Pressable`, `onValueChange`,
  `accessibilityRole="switch"`, `accessibilityState={{ checked }}`.

## Impact

- **Affected specs**: `shared-ui`, `customer`
- **Affected code**: `packages/shared/src/ui/SlideToConfirm.tsx`,
  `BudgetMeter.tsx`, `primitives.tsx:282-289`, and the four call sites
  (`ProposalsList.tsx:382`, `surcharge.tsx:43`, `requote.tsx:41`, `new.tsx:303`).
- **Findings**: A11Y-01 (Crítico), A11Y-02 (Crítico), DS-07.
- **Verification**: with TalkBack on, accept a proposal, approve a surcharge and
  set a budget — end to end, on the device.
- **Note**: REQ-09 questions whether a slide belongs at the end of an urgent funnel
  at all. That is a flow decision and lives in `express-request-flow`; this change
  makes the control accessible wherever it survives.
