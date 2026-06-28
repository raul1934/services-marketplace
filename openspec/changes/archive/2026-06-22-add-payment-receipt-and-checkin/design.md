# Design — add-payment-receipt-and-checkin

## C20 — Payment receipt (customer)

### Backend (no migration)
`settleEarnings` already computes the numbers; the receipt just needs to expose
them. Add a derived `settlement` block to `ServiceRequestResource`, present once
`accepted_proposal` exists (final once `status === completed`):

```
settlement: {
  labor:           acceptedProposal.price,
  parts_total:     sum(jobParts.unit_price * quantity)   // provider-supplied lines
  surcharges_total: sum(surcharges where status=approved .amount),
  total:           labor + parts_total + surcharges_total,   // what the customer owes
  payment_method:  payment_method,
  settled_at:      completed_at,                          // settlement is implicit at completion
  receipt_no:      "WV-" + str_pad(id, 6, '0', LEFT),
}
```

The platform commission (3%) is provider-side and intentionally **not** shown to
the customer. Numbers mirror `settleEarnings`/`calcPayout` exactly so receipt ==
what settled. No schema change; pure serialization.

### Frontend
- Extend the TS `ServiceRequest` type with an optional `settlement` object.
- New screen `apps/customer/app/request/[id]/receipt.tsx` (`V3PagamentoOk`):
  BackBar + a success header + a key/value breakdown (labor, each part line,
  surcharges, divider, **Total**), payment-method row, settled date, receipt no.,
  and a "Concluído" affirmation. Reuse existing `Card`/`Row`/`Text` primitives.
- Entry points: a "Ver recibo" button on the completed-request detail
  (`request/[id]/index`, completed branch) and a push/navigation right after the
  provider completes (the rate CTA stays; receipt is its sibling).

## C17 / P14 — Start-of-service code

### Backend
- Migration: `start_code` string(8) nullable on `service_requests`.
- `RequestService::acceptProposal` (or the accept path that sets `Accepted`):
  generate a 4-digit code (e.g. `str_pad(random_int(0,9999),4,'0')`) into
  `start_code` when the request transitions to `Accepted`.
- New route `POST /api/provider/v1/requests/{serviceRequest}/start` →
  `JobController::start`: validates `code` (required, 4 digits), 422
  `{ code: ['invalid'] }` on mismatch; on match calls
  `service->updateStatus($req, InProgress)` (which already sets `started_at`,
  fires `RequestStatusUpdated` + notification). The existing
  `PUT requests/{id}/status` keeps handling `completed`.
- `ServiceRequestResource`: expose `start_code` **only when the viewer is the
  customer (owner) and status is `accepted`** — never to the provider (that would
  defeat the check). Mirror the existing conditional used for `entry_code`.

### Frontend (optional verification — slide stays)
- Customer `request/[id]/index` Accepted/en-route branch: show a prominent
  "Código de início" card with the 4 digits + helper text "informe ao prestador
  ao chegar".
- Provider `job/[id]/index` Accepted state: keep `SlideToConfirm(slideStart)` plus
  an optional "Código do cliente (opcional)" field above it. On confirm:
  - if a code is entered → `useStartJob({ code })` (`POST .../start`, 422 on
    mismatch shows an inline error, status unchanged);
  - if blank → existing `updateStatus(InProgress)` path (`PUT .../status`).
  Slide-to-complete (in_progress → completed) is unchanged.
- Hooks: customer reads `start_code` off the request (no new hook).
  Provider `useStartJob(requestId)` → `POST .../start`.

## Inline-vs-screen decision (the "should these move?" question)
Audited both consolidated screens. Decision (per scope confirmation): **extract the
two largest single-concern blocks; leave the rest as the `index` view.**

| Inline state | Design ID | Decision | Target |
|---|---|---|---|
| Proposal list + accept | C13/C14 | **extract** | `request/[id]/proposals.tsx`; index open-state shows "Ver propostas (N)" |
| Provider bid wizard | P09 | **extract** | `job/[id]/bid.tsx`; index open-state shows summary + "Enviar proposta" |
| Customer active / em serviço | C18 | keep as index | once proposals leave, `request/[id]/index` owns this concern |
| Provider active-job panel | P16 | keep as index | once bid leaves, `job/[id]/index` owns this concern |

Extracted screens re-fetch with the existing hooks (`useRequest`, `useProposals`,
etc.) keyed by `id`, so no state/props are threaded through `index`. Helper
sub-components (`ProposalCard`, `SortSeg`, `BidFlow`, `ProviderQna`, `SumRow`) move
with their screen.

## Verification
- Backend: `php artisan migrate`, route list shows `requests/{id}/start`, feature
  test asserting wrong code → 422 + status unchanged, right code → `in_progress`
  + `RequestStatusUpdated` dispatched (`Event::fake`), and `settlement` present on
  a completed request resource.
- Frontend: typecheck shared + both apps (0 new errors), i18n keys present in
  pt-BR + en-US for both apps.
