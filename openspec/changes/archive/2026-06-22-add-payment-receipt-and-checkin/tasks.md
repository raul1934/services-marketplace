# Tasks — add-payment-receipt-and-checkin

## 1. Backend — receipt (C20)
- [x] 1.1 Add derived `settlement` block to `ServiceRequestResource` (labor, parts_total, surcharges_total, total, payment_method, settled_at, receipt_no), present when `accepted_proposal` exists.
- [x] 1.2 Ensure numbers mirror `RequestService::settleEarnings` / `calcPayout` (no commission shown to customer).

## 2. Backend — start code (C17/P14, optional verify)
- [x] 2.1 Migration: `start_code` string(8) nullable on `service_requests`.
- [x] 2.2 Generate `start_code` when a request transitions to `Accepted` (proposal accepted path in `RequestService`).
- [x] 2.3 New route `POST provider/v1/requests/{serviceRequest}/start` + `JobController::start`: validate `code`, 422 on mismatch, else `updateStatus(InProgress)`.
- [x] 2.4 Expose `start_code` in `ServiceRequestResource` only to the owner-customer while status is `accepted`.

## 3. Frontend — types & hooks
- [x] 3.1 Extend shared `ServiceRequest` type with `settlement?` and `start_code?`.
- [x] 3.2 Provider: add `useStartJob(requestId)` → `POST .../start` (api.ts + queries.ts).

## 4. Frontend — customer
- [x] 4.1 New `request/[id]/receipt.tsx` (`V3PagamentoOk`): breakdown + total + method + settled date + receipt no.
- [x] 4.2 Completed-request detail: add "Ver recibo" entry point.
- [x] 4.3 Accepted/en-route detail: show "Código de início" card (4 digits + helper).
- [x] 4.4 **Extract** proposal list+accept → new `request/[id]/proposals.tsx` (C14); move `ProposalCard` + `SortSeg`; index open-state shows "Ver propostas (N)" button.

## 5. Frontend — provider
- [x] 5.1 Accepted state: keep slide-to-start, add optional "Código do cliente" field; confirm routes through `useStartJob({code})` when filled, else `updateStatus(InProgress)`.
- [x] 5.2 **Extract** bid wizard → new `job/[id]/bid.tsx` (P09); move `BidFlow` + `ProviderQna` + `SumRow`; index open-state shows summary + "Enviar proposta" button.

## 6. i18n
- [x] 6.1 Customer pt-BR + en-US: receipt + start-code + proposals-screen keys.
- [x] 6.2 Provider pt-BR + en-US: optional-code keys + error + bid-screen keys.

## 7. Verify
- [x] 7.1 `php artisan migrate`; route list shows `start`; feature test (wrong code 422 / right code → in_progress + event faked; settlement on completed resource).
- [x] 7.2 Typecheck shared + both apps (0 new errors).
