# Change: restructure-create-request-wizard

## Why
The customer create-request wizard ([apps/customer/app/request/new.tsx](../../../frontend/apps/customer/app/request/new.tsx))
has 4 steps, but they're uneven and the last one does the wrong job:

- **Step 1** crams the asset selector, description, all dynamic questions *and*
  photo upload into one screen.
- **Step 4 "Confirm"** is not a confirmation — it's still *data entry* (budget
  meter + payment selector) with only a partial summary above it. Payment is easy
  to miss because it lives at the bottom of the final step, and there's no
  read-only review of everything before submitting.

This change splits the flow into **more focused steps** and makes the **last step
a true read-only synthesis** of the whole request, with **payment promoted to its
own step** (and echoed in the review).

## What changes (in scope)
- **6 steps** instead of 4 (recommended structure — adjust at review if you'd like
  a different split):
  1. **Detalhes** — category context, asset selector (vehicular), description, dynamic questions
  2. **Fotos** — photo upload (optional, skippable)
  3. **Local & acesso** — GPS/map, address, reception type / entry code
  4. **Agendamento** — urgency (now) vs scheduled windows
  5. **Orçamento & pagamento** — budget meter + payment selector (`PaymentSelector`)
  6. **Revisão** — read-only synthesis of *everything* + slide-to-confirm
- **Review step** lists: service + category, vehicle/asset (if any), description,
  answered questions, photo count, location/address, access, when, **budget**, and
  **payment method** — all read-only, each with a "edit" affordance jumping back to
  its step.
- Per-step validation (`canContinue`) updated for the new boundaries.
- i18n keys for the new step titles/subtitles and review labels (pt-BR + en-US).

## Out of scope
- Backend: none. `payment_method`, `budget_max`, etc. are already accepted by
  `POST requests`; this is a pure frontend re-layout.
- Real payment processing (no gateway exists) — payment stays a Pix/Card/Cash
  preference, as today.
- Background photo upload after create stays exactly as-is.

## Impact
- Module: `customer`.
- Files: `apps/customer/app/request/new.tsx` (step structure + review), customer
  i18n locales. `Wiz` is already generic over `total`, so no shared-UI change.
- Behavior: one or two extra taps to submit; payment is now a deliberate step and
  the user sees a full review before confirming.
