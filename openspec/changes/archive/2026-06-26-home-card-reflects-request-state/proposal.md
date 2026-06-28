# Change: home-card-reflects-request-state

## Why
The home "Chamado em andamento" card always shows a proposals-count badge
("1 proposta(s)") and a "Ver propostas dos prestadores" footer — even after a
proposal has been accepted and the job is en route / in progress. Once a provider
is chosen, there are no proposals to review; the card should reflect the job's
current state and point at tracking, not bidding.

## What changes (in scope)
- **State-aware badge.** Open → keep the proposals-count badge. Accepted /
  in-progress → show a status badge instead ("Aceito" / "Em atendimento").
- **State-aware footer CTA.** Open → keep "Ver propostas dos prestadores".
  Accepted / in-progress → "Acompanhar atendimento" (the card already opens
  `/request/[id]`, which now shows the live map + activity inline).
- Frontend-only; the tap target (open the request) is unchanged.

## Deferred (NOT in this change)
- Showing the accepted provider's name on the card (would need `GET /requests`
  to include the provider — not done here, per the chosen scope).

## Impact
- Module: `customer`.
- Frontend (`apps/customer`): `ActiveRequestCard` in `app/(tabs)/home.tsx` branches
  badge + footer on `status === open`; one new i18n key `home.trackRequest`
  (pt-BR + en-US). No backend change.
