# customer

## ADDED Requirements

### Requirement: The request screen unifies detail and live tracking
The customer SHALL have a single screen per request (`request/[id]`) that serves
every state (open, accepting proposals, accepted/en route, in progress,
completed, and terminal states). When a provider is assigned and a live location
is available, the live map, distance/ETA, and the progress strip SHALL render
inline on that screen. The separate `request/[id]/track` route SHALL redirect to
`request/[id]` so existing links keep working.

#### Scenario: Live map shows inline while en route
- WHEN the request is `accepted` or `in_progress` and a provider location is available
- THEN the request screen shows the map, the distance/ETA, and the progress strip inline, with no separate "track" navigation

#### Scenario: Legacy track URL redirects
- WHEN the customer opens `request/[id]/track`
- THEN they are redirected to `request/[id]`

#### Scenario: One screen across states
- WHEN the request moves from open to completed
- THEN the same `request/[id]` screen represents each state without navigating to a different request screen

### Requirement: Customer sees a chronological event feed for a request
The request screen SHALL show a feed of the request's events plus the approved
value. The feed SHALL be sourced from `GET requests/{id}/events`, which returns a
typed chronological list derived from the request's existing data (creation,
proposals, acceptance, start, parts, surcharges, reschedules, provider updates,
completion, requote, cancellation, no-show, expiry, review). Collapsed, the feed
SHALL show the 5 most recent events with the latest at the bottom; tapping SHALL
expand it to the full list. The events endpoint SHALL be restricted to the
request's owner.

#### Scenario: Collapsed feed shows the latest five
- WHEN a request has more than five events
- THEN the feed shows the five most recent events with the latest at the bottom, plus an affordance to view all

#### Scenario: Expand to full history
- WHEN the customer taps the feed
- THEN the full chronological list of events is shown

#### Scenario: Approved value is shown
- WHEN a proposal has been accepted
- THEN the feed shows the approved value (the accepted proposal's price)

#### Scenario: Events are owner-scoped
- WHEN a user who does not own the request requests its events
- THEN the request is rejected with 403

#### Scenario: Open request shows only what has happened
- WHEN a request is still open with two proposals received
- THEN the feed contains the creation event and the two proposal-received events, and no start/completion events

### Requirement: Required actions surface inline on the request screen
The actions the customer must take SHALL appear as inline cards/banners on the
request screen as they become relevant (approve parts, respond to a surcharge,
accept/decline a reschedule, accept a requote, submit a review, open
warranty/dispute). Dense sub-flows (proposal list, surcharge response, requote,
reschedule, dispute, warranty) SHALL remain their own routes, opened from those
inline cards.

#### Scenario: Pending parts approval shows inline
- WHEN the provider has requested parts approval and it is not yet approved
- THEN an "approve parts" card is shown inline on the request screen

#### Scenario: Sub-flow opens from the inline card
- WHEN the customer taps a pending surcharge card
- THEN the surcharge response screen opens as its own route
