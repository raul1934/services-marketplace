# customer

## ADDED Requirements

### Requirement: Create-request is a multi-step wizard ending in a read-only review
Creating a request SHALL be a stepped wizard whose **final step is a read-only
synthesis** of the whole request, shown before submission. Payment method SHALL be
chosen on its own step (not buried in the final step) and SHALL appear in the
review. No data entry happens on the review step — only confirmation.

#### Scenario: Payment is a deliberate step
- WHEN the customer reaches the budget & payment step
- THEN they pick a payment method (Pix / Card / Cash) alongside the budget
- AND the chosen method is carried into the request on submit

#### Scenario: Final step synthesizes the request
- WHEN the customer reaches the last step
- THEN it shows a read-only summary including service, vehicle (if any), description, answered questions, photo count, location/access, schedule, budget, and payment method
- AND confirming (slide-to-confirm) creates the request and navigates to its detail

#### Scenario: Jump back to edit from the review
- WHEN the customer taps a row in the review
- THEN the wizard returns to the step that owns that field for editing

#### Scenario: Step validation
- WHEN a required step is incomplete (no description/asset, no location, or no schedule when scheduled)
- THEN Continue is disabled until it is satisfied
- AND optional steps (photos, budget/payment) can be advanced with their defaults
