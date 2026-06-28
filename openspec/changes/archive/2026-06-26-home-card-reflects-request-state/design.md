# Design — home-card-reflects-request-state

## ActiveRequestCard (`app/(tabs)/home.tsx`)
The card already shows for `open`, `accepted`, and `in_progress` (the home
`active` find = open ∪ ACTIVE_STATUSES). Branch its two status-specific bits on
`isOpen = request.status === RequestStatus.Open`:

- **Badge** (top-right of the steps row):
  - open → `requestCard.proposals` count, tone `open` (current).
  - else → `enums.requestStatus.${status}` ("Aceito" / "Em atendimento"), tone
    `live`, dot.
- **Footer CTA text**:
  - open → `home.reviewBids` ("Ver propostas dos prestadores") (current).
  - else → `home.trackRequest` ("Acompanhar atendimento").

`onPress` stays `/request/${id}` — the unified request screen already renders the
right state (map + start code + activity) once accepted, so the card just needs
honest labels.

## i18n
Add `home.trackRequest` — pt-BR "Acompanhar atendimento", en-US "Track service".
`enums.requestStatus.*` labels already exist.

## Out of scope
Provider name on the card needs the list endpoint to load the provider; left for a
follow-up.
