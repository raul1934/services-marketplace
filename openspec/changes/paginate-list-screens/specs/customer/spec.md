# customer

## ADDED Requirements

### Requirement: Customer list endpoints are paginated
The customer list endpoints `GET requests`, `GET requests/{id}/proposals`,
`GET requests/{id}/events`, and `GET assets` SHALL return a page-based paginated
envelope (`data` + `meta`) and accept a `page` query parameter, preserving their
existing parameters (proposals `sort`, assets `type`).

#### Scenario: First page with metadata
- WHEN the customer requests `GET requests` without a page
- THEN page 1 is returned with `meta.current_page`, `meta.last_page`, `meta.per_page`, and `meta.total`

#### Scenario: Subsequent page
- WHEN the customer requests `GET requests?page=2`
- THEN the second slice of their requests is returned (newest-first ordering preserved)

#### Scenario: Existing parameters still apply
- WHEN the customer requests `GET requests/{id}/proposals?sort=price&page=2`
- THEN the second page of proposals sorted by price is returned

### Requirement: Customer lists load by infinite scroll
The My-requests and Assets screens SHALL load further items by infinite scroll
(next page fetched as the user nears the bottom, with a footer spinner), and the
inline proposals and event-feed lists on the request screen SHALL page via the
request screen's scroll without nesting a virtualized list.

#### Scenario: My requests grows on scroll
- WHEN the customer scrolls to the bottom of My requests and more pages exist
- THEN the next page of request cards is appended with a footer spinner during the fetch

#### Scenario: Inline proposals page on the open request
- WHEN the customer scrolls the open request screen near the bottom and more proposals exist
- THEN the next page of proposals is appended inline (no separate scrolling list nested in the screen)

#### Scenario: Status filter over loaded pages
- WHEN a status filter is active on My requests
- THEN it filters the currently loaded pages (full-dataset/server-side filtering is a known follow-up, not provided here)
