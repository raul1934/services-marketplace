# customer

## ADDED Requirements

### Requirement: Customer sees a payment receipt after the job completes
After a request reaches `completed`, the customer SHALL be able to view a receipt
showing the amount breakdown (labor, parts, approved surcharges), the total, the
payment method, the settled date, and a receipt number. The figures SHALL equal
what settled on the backend (`settleEarnings`). The platform commission is not
shown to the customer.

#### Scenario: View receipt for a completed request
- WHEN the customer opens a completed request and taps "Ver recibo"
- THEN the receipt screen (`V3PagamentoOk`) shows labor, each part line, surcharges, the total, the payment method, the settled date, and the receipt number
- AND the total equals labor + parts + approved surcharges

#### Scenario: Receipt unavailable before completion
- WHEN the request has not been completed
- THEN no receipt entry point is shown

### Requirement: Customer can read out the start-of-service code
While a provider is assigned and the request is `accepted` (en route, not yet
started), the customer SHALL see a start code to read to the provider on arrival.

#### Scenario: Start code visible while en route
- WHEN the request status is `accepted`
- THEN the request detail shows a "Código de início" with the request's `start_code` and instructions to give it to the provider
- AND the code is no longer emphasized once the job is `in_progress`
