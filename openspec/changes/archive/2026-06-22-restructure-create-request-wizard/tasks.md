# Tasks — restructure-create-request-wizard

## 1. Step structure
- [x] 1.1 Set `TOTAL = 6`; build `titles[]` / `subs[]` for the 6 steps.
- [x] 1.2 Update `canContinue` per the new step boundaries (photos optional, money step optional, etc.).
- [x] 1.3 Footer: Continue (1–5, disabled per validation) + Back; slide-to-confirm on step 6.

## 2. Move content into the new steps
- [x] 2.1 Step 1 Detalhes: category header + asset selector + description + DynamicFields (drop photos here).
- [x] 2.2 Step 2 Fotos: the photo picker grid.
- [x] 2.3 Step 3 Local & acesso: map/GPS + address + reception + entry code (was step 2).
- [x] 2.4 Step 4 Agendamento: urgency + Scheduler (was step 3).
- [x] 2.5 Step 5 Orçamento & pagamento: BudgetMeter + PaymentSelector.

## 3. Review (synthesis) step 6
- [x] 3.1 Read-only summary card: service, vehicle, description, answered questions, photo count, location/access, when, budget, payment.
- [x] 3.2 Make rows tappable to jump back to their step (`setStep`).

## 4. i18n
- [x] 4.1 Customer pt-BR + en-US: new step titles/subs (`wizPhotos*`, `wizMoney*`, `wizReview*`) + review labels (`summaryVehicle/Description/Photos/Budget/Payment`, `editStep`).

## 5. Verify
- [x] 5.1 Typecheck shared + customer (0 new errors).
- [x] 5.2 Playwright: screenshot all 6 steps for a roadside category; confirm payment in step 5 and full review (incl. budget + payment) in step 6; complete a request end-to-end.
