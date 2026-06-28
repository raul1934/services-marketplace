# provider

## ADDED Requirements

### Requirement: Provider list endpoints are paginated
The provider list endpoints `GET provider/requests/nearby`,
`GET provider/requests/scheduled`, `GET provider/jobs`, and `GET provider/bids`
SHALL return a page-based paginated envelope (`data` + `meta`) and accept a `page`
query parameter, preserving their existing parameters (nearby/scheduled
`radius_km`).

#### Scenario: First page with metadata
- WHEN the provider requests `GET provider/jobs` without a page
- THEN page 1 is returned with `meta.current_page`, `meta.last_page`, `meta.per_page`, and `meta.total`

#### Scenario: Subsequent page preserves filters
- WHEN the provider requests `GET provider/requests/nearby?radius_km=30&page=2`
- THEN the second page of nearby requests within 30km is returned

### Requirement: Wallet transactions are a separate paginated list
The wallet summary endpoint `GET provider/wallet` SHALL return only the summary
(balance and month stats) without the transactions array, and transactions SHALL
be served by a new paginated endpoint `GET provider/wallet/transactions`.

#### Scenario: Summary excludes transactions
- WHEN the provider requests `GET provider/wallet`
- THEN the balance and month stats are returned and no `transactions` array is included

#### Scenario: Transactions paginated
- WHEN the provider requests `GET provider/wallet/transactions?page=2`
- THEN the second page of wallet transactions is returned with pagination `meta`

### Requirement: Provider lists load by infinite scroll
The Nearby (list view), Scheduled, My jobs, My bids, Agenda, and Earnings
transaction lists SHALL load further items by infinite scroll (next page fetched
near the bottom, footer spinner during the fetch). The Nearby map view is not a
paginated surface and renders markers from the loaded pages.

#### Scenario: Jobs grows on scroll
- WHEN the provider scrolls to the bottom of My jobs and more pages exist
- THEN the next page of jobs is appended with a footer spinner during the fetch

#### Scenario: Earnings transactions grow on scroll
- WHEN the provider scrolls the Earnings screen past the loaded transactions and more exist
- THEN the next page of transactions is appended below the summary cards

#### Scenario: Map view unaffected
- WHEN the provider switches Nearby to the map view
- THEN markers reflect the already-loaded request pages (no paging controls on the map)
