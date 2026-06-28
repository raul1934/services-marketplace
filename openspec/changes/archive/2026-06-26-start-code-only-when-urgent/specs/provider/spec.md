# provider

## MODIFIED Requirements

### Requirement: Provider may verify the customer's start code when starting a job
A `start_code` SHALL exist only for **urgent** jobs. For an urgent job the provider
SHALL be required to enter the customer's `start_code` to move the job from
`accepted` to `in_progress`: the code field is shown, and the job starts only via
`POST requests/{id}/start` with a code that verifies server-side. The plain status
update (`accepted → in_progress`) SHALL be rejected for urgent jobs. For scheduled
jobs there is no code: the field is not shown and the job starts via the existing
slide / status update. The `start_code` MUST NOT appear in the provider's request
payload.

#### Scenario: Urgent job requires the correct code
- WHEN the provider starts an urgent job
- THEN the start-code field is shown and the job starts only after entering the correct code via `POST requests/{id}/start`
- AND a plain `accepted → in_progress` status update is rejected (422)

#### Scenario: Wrong or missing code on an urgent job
- WHEN the provider submits an incorrect (or empty) code for an urgent job
- THEN the start is rejected and the job stays `accepted`

#### Scenario: Scheduled job starts without a code
- WHEN the provider starts a scheduled job
- THEN no start-code field is shown and the job starts via the existing slide / status update with no code

#### Scenario: Start code hidden from the provider payload
- WHEN the provider views the job detail
- THEN the `start_code` is not present in the provider's request payload
