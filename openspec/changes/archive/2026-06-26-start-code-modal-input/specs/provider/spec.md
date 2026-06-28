# provider

## MODIFIED Requirements

### Requirement: Provider may verify the customer's start code when starting a job
A `start_code` SHALL exist only for **urgent** jobs. For an urgent job the provider
SHALL be required to enter the customer's `start_code` to move the job from
`accepted` to `in_progress`. The code SHALL be entered in a **modal with a 4-cell
code input** (not an inline field), opened from the start action; the job starts
only via `POST requests/{id}/start` with a code that verifies server-side, and a
wrong code SHALL show an error in the modal. The plain status update
(`accepted → in_progress`) SHALL be rejected for urgent jobs. For scheduled jobs
there is no code: the job starts via the existing slide / status update. The
`start_code` MUST NOT appear in the provider's request payload.

#### Scenario: Urgent start opens a 4-cell code modal
- WHEN the provider taps start on an urgent accepted job
- THEN a modal with four code cells opens, and entering the correct code starts the job via `POST requests/{id}/start`
- AND a plain `accepted → in_progress` status update is rejected (422)

#### Scenario: Wrong code shows an error in the modal
- WHEN the provider enters an incorrect code in the modal
- THEN the start is rejected and the modal shows an error; the job stays `accepted`

#### Scenario: Scheduled job starts without a code
- WHEN the provider starts a scheduled job
- THEN no code modal is shown and the job starts via the existing slide / status update

#### Scenario: Start code hidden from the provider payload
- WHEN the provider views the job detail
- THEN the `start_code` is not present in the provider's request payload
