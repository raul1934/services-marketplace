# Design — restructure-create-request-wizard

## Step model
`Wiz` already takes `step`/`total`/`title`/`sub`/`footer`, so this is a re-layout
inside `new.tsx`. Set `TOTAL = 6` and drive `titles[]`/`subs[]` by step.

| Step | Title | Content (moved from today) |
|---|---|---|
| 1 | Detalhes | category header, asset selector (vehicular), description, `DynamicFields` |
| 2 | Fotos | photo picker grid (was in step 1); optional → can continue empty |
| 3 | Local & acesso | map/GPS, address, reception `Segment`, entry code (was step 2) |
| 4 | Agendamento | urgency `Segment` + `Scheduler` (was step 3) |
| 5 | Orçamento & pagamento | `BudgetMeter` + `PaymentSelector` (was in step 4) |
| 6 | Revisão | read-only synthesis + slide-to-confirm |

## Per-step validation (`canContinue`)
- 1: `description ≥ 5` AND (`!isVehicular || assetId != null`)
- 2: always (photos optional)
- 3: `!!coords`
- 4: `urgency === Urgent || availabilities.length > 0`
- 5: always (budget has a default; payment defaults to Pix)
- 6: slide-to-confirm submits

Footer: steps 1–5 show the **Continue** primary (disabled per validation) + Back;
step 6 shows the **slide-to-confirm** (`createRequest` → background photo upload →
`router.replace`). Same submit logic as today, just triggered from step 6.

## Review (step 6) — synthesis
A read-only `Card` of `SumRow`s (reuse the existing `SumRow`), each row optionally
tappable to jump back to its step via `setStep(n)`:
- Serviço — `category.name`
- Veículo — asset nickname + attrs (when vehicular & selected)
- Descrição — `description`
- Each answered dynamic question — `q.label → answers[q.id]`
- Fotos — count (`{{count}} foto(s)`) or "nenhuma"
- Local — `address` or "GPS capturado"; access type (+ entry code if set)
- Quando — Urgent or windows count
- Orçamento — `brl(budget)`
- Pagamento — `tr('payment.<method>')`

No new component; just a longer summary list than today's partial one, now
including budget + payment, rendered after the user has set them in step 5.

## i18n (customer pt-BR + en-US)
New/renamed keys under `createRequest`: `wizPhotosTitle/Sub`, `wizMoneyTitle/Sub`,
`wizReviewTitle/Sub` (rename `wizConfirm*`), and review labels
`summaryVehicle`, `summaryDescription`, `summaryPhotos` ("{{count}} foto(s)"),
`summaryBudget`, `summaryPayment`, `editStep`. Keep existing `wizProblem*`,
`wizLocation*`, `wizWhen*`.

## Verification
- Typecheck shared + customer (0 new errors).
- Playwright (per `guincho-playwright-visual-verify`): log in as `cliente@walvee.test`,
  open `/request/new?categoryId=1`, screenshot each of the 6 steps (advancing via
  Continue), confirming payment appears in step 5 and the review in step 6 lists
  budget + payment. Then complete a request and confirm it lands on the detail.
