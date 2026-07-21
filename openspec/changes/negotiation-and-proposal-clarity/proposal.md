# Make hiring a considered decision, and let the client talk

## Why

Accepting a proposal is the moment money is committed, and it is the moment the
app is quietest. The slide accepts and transitions straight to tracking: no summary
of what was agreed, no "você contratou X por R$ Y", no success state. An
irreversible financial action with less confirmation than deleting a photo.

Around it, the negotiation is one-directional by construction. Only the provider
can ask questions, and the QnA thread only appears **after** a proposal exists — so
a client who needs to clarify something before receiving bids has nowhere to do it.
When a counter-offer is made it becomes `pending_counter_offer` and the button
disappears: one round, accept or decline, no counter-counter.

Providers also ask what the app already knows. The asset carries make, model and
plate, and none of it reaches the proposal or the QnA, so the first question on a
tow request is often "qual o modelo?". And some seeded QnA text is in English in a
pt-BR app.

## What changes

- **PROP-01** — a confirmation step before accepting: who, how much, ETA, what
  happens next. A `SuccessSplash` after, so the peak of the funnel has a resolution.
- **PROP-02** — make the QnA symmetric: the client can ask, using the same
  component, and can ask before bids arrive.
- **PROP-04** — allow at least a second negotiation round instead of a single
  counter-offer.
- **PROP-05** — pass the asset's known attributes to the proposal/QnA context so
  providers stop asking what the app already stored.
- **CONS-07** — localise the QnA strings and seed data.

## Impact

- **Affected specs**: `customer`, `provider`
- **Affected code**: `src/components/ProposalsList.tsx` (accept flow, counter),
  `QnaThread.tsx`, the pre-bid question endpoints, the proposal resource
  (asset attributes), and the seeders for the English strings.
- **Findings**: PROP-01, PROP-02, PROP-04, PROP-05, CONS-07.
- **Cross-app**: PROP-02 and PROP-04 change what providers see and can do, so the
  provider app moves in the same change or the negotiation breaks asymmetrically.
- **Depends on**: `accessible-confirmation-controls` — the accept control should
  already be operable before we wrap a confirmation around it.
- **Product decision already recorded**: the audit notes that accepting will go
  through an offer-detail screen with the slide inside it. This change should
  implement that shape rather than invent another.
