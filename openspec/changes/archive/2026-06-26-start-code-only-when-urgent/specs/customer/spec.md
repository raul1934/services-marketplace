# customer

## MODIFIED Requirements

### Requirement: Customer can read out the start-of-service code
A start code SHALL exist only for **urgent** jobs. While a provider is assigned and
an urgent request is `accepted` (en route, not yet started), the customer SHALL see
the start code to read to the provider on arrival. Scheduled requests have no start
code and SHALL NOT show the card.

#### Scenario: Start code visible while en route (urgent)
- WHEN an urgent request's status is `accepted`
- THEN the request screen shows a "Código de início" with the request's `start_code` and instructions to give it to the provider
- AND the code is no longer emphasized once the job is `in_progress`

#### Scenario: No start code for scheduled jobs
- WHEN a scheduled request is `accepted`
- THEN no start-code card is shown (no code was generated)
