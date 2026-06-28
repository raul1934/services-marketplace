# customer

## ADDED Requirements

### Requirement: The request screen shows its linked asset
The request screen SHALL show the asset the request is tied to — its nickname and
type, the brand logo and make·model·plate caption for vehicles — and tapping it
SHALL open that asset's detail.

#### Scenario: Vehicle request shows the asset with its logo
- WHEN the customer opens a request tied to a vehicle asset
- THEN the screen shows the asset's brand logo and make·model·plate, linking to the asset detail

#### Scenario: Request with no asset
- WHEN a request has no linked asset
- THEN no asset card is shown

### Requirement: Completed requests show a consolidated summary
When a request is completed, the request screen SHALL consolidate what happened:
the settlement/receipt breakdown, the parts used, the key timestamps, the
provider, and the customer's review.

#### Scenario: Completed request summary
- WHEN the customer opens a completed request
- THEN it shows the receipt/settlement, parts, accepted/started/completed times, the provider, and the review (if any)

#### Scenario: Non-completed request
- WHEN the request is not yet completed
- THEN the consolidated completed-summary section is not shown
