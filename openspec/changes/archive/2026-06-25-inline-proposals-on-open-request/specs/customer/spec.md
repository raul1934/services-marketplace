# customer

## MODIFIED Requirements

### Requirement: Customer chooses a proposal inline on the open request screen
(supersedes "Customer chooses a proposal from a dedicated screen")

While a request is open, the proposal list (with sorting by price / ETA /
rating), proposal acceptance, and the cancel-request action SHALL render inline
on the request screen (`request/[id]`) — not on a separate route. Accepting a
proposal SHALL move the same screen into its accepted state. The
`request/[id]/proposals` route SHALL redirect to `request/[id]` so existing
links and notifications keep working.

#### Scenario: Compare and accept inline
- WHEN the customer opens an open request
- THEN the proposals (sortable) are listed inline on the request screen, with no separate "Ver propostas" navigation
- AND accepting one moves the screen into the accepted state

#### Scenario: Legacy proposals URL redirects
- WHEN the customer opens `request/[id]/proposals`
- THEN they are redirected to `request/[id]`

#### Scenario: Cancel while open
- WHEN the customer chooses to cancel from the open request screen
- THEN the request is cancelled after confirmation
