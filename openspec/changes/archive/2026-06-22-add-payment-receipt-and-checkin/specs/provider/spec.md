# provider

## ADDED Requirements

### Requirement: Provider may verify the customer's start code when starting a job
When starting a job (`accepted → in_progress`), the provider SHALL be offered an
optional field to enter the customer's `start_code`. If a code is entered it MUST
be verified server-side before the job starts; if left blank the job starts via
the existing slide action. The `start_code` MUST NOT appear in the provider's
request payload.

#### Scenario: Correct code starts the job
- WHEN the provider enters the correct code and confirms start
- THEN `POST requests/{id}/start` succeeds, the request becomes `in_progress`, `started_at` is set, and `RequestStatusUpdated` is dispatched

#### Scenario: Wrong code is rejected
- WHEN the provider enters an incorrect code
- THEN the request returns 422 with a code error, the status is unchanged, and the screen shows an invalid-code message

#### Scenario: No code starts via slide
- WHEN the provider leaves the code field blank and slides to start
- THEN the job starts through the existing status update with no code required

#### Scenario: Provider never sees the code
- WHEN the provider views the job detail
- THEN the `start_code` is not present in the provider's request payload

### Requirement: Provider bids from a dedicated screen
The provider bid wizard SHALL live on its own route (`job/[id]/bid`) rather than
inline in the job detail. The job detail for an open request SHALL show a summary
and a "Enviar proposta" action that navigates to the bid screen.

#### Scenario: Open the bid screen
- WHEN the provider opens an open (unbid) request and taps "Enviar proposta"
- THEN the bid wizard screen opens and submitting a bid returns to the job detail
