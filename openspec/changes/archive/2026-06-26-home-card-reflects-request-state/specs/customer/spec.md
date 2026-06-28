# customer

## ADDED Requirements

### Requirement: Home active-request card reflects the request state
The home "active request" card SHALL present state-appropriate information. While
the request is open it SHALL show the proposals count and a "review proposals"
action. Once a proposal has been accepted (accepted / in progress) it SHALL show
a status badge instead of the proposals count, and its action SHALL be to track
the request rather than to review proposals. Tapping the card SHALL open the
request screen in both cases.

#### Scenario: Open request shows proposals
- WHEN the home card represents an open request
- THEN it shows the proposals-count badge and a "Ver propostas dos prestadores" action

#### Scenario: Accepted request shows status and tracking
- WHEN the home card represents an accepted or in-progress request
- THEN it shows a status badge (e.g. "Aceito" / "Em atendimento") instead of the proposals count
- AND its action is "Acompanhar atendimento", opening the request screen
