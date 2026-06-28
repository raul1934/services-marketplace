# customer

## MODIFIED Requirements

### Requirement: Home active-request card reflects the request state
The home screen SHALL surface the customer's relevant (non-terminal) requests as
a prioritized list of at most two cards. The order SHALL be: open & urgent, then
open (em cotação), then re-quote, then open & scheduled (by next scheduled date),
then accepted / in progress. When there are no open requests, the upcoming
scheduled requests SHALL therefore surface. When more requests match than are
shown, a "see all" action SHALL navigate to the Requests tab.

Each card SHALL present state-appropriate information: while open it shows the
proposals count and a "review proposals" action; once accepted / in progress it
shows a status badge and a "track service" action. Tapping a card SHALL open that
request's screen.

#### Scenario: Open requests are listed first, capped at two
- WHEN the customer has more than two non-terminal requests
- THEN the home shows the two highest-priority ones (open & urgent first, then open, then re-quote, then scheduled)
- AND a "Ver todos (N)" action is shown

#### Scenario: See all navigates to the Requests tab
- WHEN the customer taps "Ver todos"
- THEN the Requests tab opens with the full list

#### Scenario: Upcoming scheduled requests when nothing is open
- WHEN the customer has no open requests but has scheduled ones
- THEN the home shows the upcoming scheduled requests (soonest first)

#### Scenario: Accepted request shows status and tracking
- WHEN a listed card represents an accepted or in-progress request
- THEN it shows a status badge instead of the proposals count
- AND its action is "Acompanhar atendimento", opening the request screen
