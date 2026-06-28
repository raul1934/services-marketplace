# provider

## MODIFIED Requirements

### Requirement: Provider bids from a dedicated screen
The provider bid wizard SHALL live on its own route (`job/[id]/bid`) rather than
inline. The job detail for an open (unbid) request SHALL show a summary and a
"Enviar proposta" action that navigates to the bid screen. A bid SHALL be sendable
only once: after a successful send the send control SHALL be disabled. On success
the screen SHALL show a full-screen success animation (green with an animated
check) and then land on the job screen showing the submitted proposal, navigating
with `replace` so the wizard cannot be returned to.

#### Scenario: Open the bid screen
- WHEN the provider opens an open (unbid) request and taps "Enviar proposta"
- THEN the bid wizard screen opens

#### Scenario: Sending a bid shows success then the proposal
- WHEN the provider slides to send a completed bid
- THEN a full-screen green check animation plays
- AND the provider then lands on the job screen showing their submitted proposal

#### Scenario: A bid cannot be sent twice
- WHEN a bid has been sent successfully
- THEN the send control is disabled and the wizard is replaced, so the same bid cannot be submitted again
