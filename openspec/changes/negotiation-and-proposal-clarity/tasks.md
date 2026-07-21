# Tasks — hiring as a considered decision

## 1. Offer detail + confirmation (PROP-01)
- [ ] 1.1 Offer-detail screen: pro, rating, price, ETA, deposit, what happens next.
- [ ] 1.2 Move the accept control inside it (per the recorded product direction).
- [ ] 1.3 `SuccessSplash` after acceptance, then land on tracking.
- [ ] 1.4 Device pass: accept a bid and confirm the user is told what they just agreed to.

## 2. Symmetric QnA (PROP-02)
- [ ] 2.1 Backend: allow the client to post a question on their own request, pre-bid.
- [ ] 2.2 Reuse `QnaThread` for both directions; distinguish authors visually and for screen readers.
- [ ] 2.3 Provider app: surface client questions where bids are composed.

## 3. Counter-offers (PROP-04)
- [ ] 3.1 Allow a second round (client counter → provider counter).
- [ ] 3.2 Define and enforce the round limit server-side.
- [ ] 3.3 Keep the accept control visible while a counter is pending.

## 4. Asset context (PROP-05)
- [ ] 4.1 Include the asset's shareable attributes in the request payload the provider sees.
- [ ] 4.2 Respect the existing `share_asset_note` opt-in; do not leak private notes.
- [ ] 4.3 Confirm a tow request shows make/model without anyone asking.

## 5. Localisation (CONS-07)
- [ ] 5.1 Translate the QnA question strings; fix the seeded English entries.

## 6. Close out
- [ ] 6.1 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
