# Change: add-payment-receipt-and-checkin

## Why
The main-flow audit (`audit/MAIN_FLOW_GAPS.md`) found the happy path is complete
and reachable **except** for two steps in the payment / start-of-service stretch:

- **C20 `V3PagamentoOk` — payment confirmation + receipt (customer):** after the
  provider marks the job complete, the customer jumps straight to rating. There is
  no screen confirming what was charged or showing a receipt. The money already
  settles backend-side (`RequestService::settleEarnings`, 3% fee → provider wallet
  credit) but the customer never sees it.
- **C17 `CustomerJobCode` / P14 `ProviderVerifyStart` — start-of-service code:**
  the job currently starts via a blind slide-to-start (`updateStatus → in_progress`)
  with no proof the provider is on-site. The design specifies a short code the
  customer reads to the provider, who enters it to start.

## What changes (in scope)
- **C20 — Customer receipt screen.** Backend exposes a derived `settlement`
  breakdown (labor + parts + approved surcharges = total, payment method, settled
  time, receipt no.) on the request resource — **no new payment columns, derived
  from existing data**. New customer screen `request/[id]/receipt` (`V3PagamentoOk`),
  reachable from the completed-request detail and offered right after completion.
- **C17 / P14 — Start-of-service code (optional).** New nullable `start_code` on
  `service_requests`, generated when a proposal is accepted. Exposed to the
  **customer only** (so they can read it out). The provider keeps the existing
  slide-to-start, **plus** an optional "verificar código" field: if a code is
  entered it is verified server-side (`POST requests/{id}/start`, 422 on mismatch);
  if left blank the slide starts the job as today. Customer detail shows the code
  while the provider is en route. Verification is encouraged, not enforced.

- **Inline-screen extraction (in scope).** Split the two oversized consolidated
  screens into focused routes: provider **bid wizard** (P09) → `job/[id]/bid`;
  customer **proposal list + accept** (C14) → `request/[id]/proposals`. After the
  split, `job/[id]/index` is the provider **active-job / manage** view (P16) and
  `request/[id]/index` is the customer **active/em-serviço** view (C18) — each file
  now owns one concern. New screens re-fetch via the existing react-query hooks
  (no prop drilling).

## Deferred (NOT in this change)
- **C39 `V3FalhaPagamento` — payment failure / retry.** There is **no payment
  gateway** in the backend (`payment_method` is only a Pix/Card/Cash preference;
  settlement is an internal wallet credit). A failure/retry flow would be pure
  mock UI with nothing to fail against. Deferred until a real gateway is
  integrated; tracked as follow-up `add-payment-gateway`.
- (Extraction is now **in scope** — see above. Customer C18 / provider P16 are not
  moved to new files; they remain as the `index` screen once bidding/proposals are
  pulled out, so each `index` ends up owning a single concern.)

## Impact
- Modules: `customer` (new — receipt, start-code display, proposals screen),
  `provider` (optional code-verified start, bid screen).
- Backend: 1 migration (`start_code`), 1 new provider endpoint (`requests/{id}/start`),
  `ServiceRequestResource` gains derived `settlement` + customer-only `start_code`,
  `RequestService` generates the code on accept and verifies it on start.
- Frontend: new screens `request/[id]/receipt`, `request/[id]/proposals`,
  `job/[id]/bid`; `useStartJob` hook; the two `index` screens slim down to one
  concern each; i18n keys (both apps, pt-BR + en-US).
- Existing flows behave the same; the start step gains an optional verification and
  the bid/proposals UIs move behind a button (one extra tap).
