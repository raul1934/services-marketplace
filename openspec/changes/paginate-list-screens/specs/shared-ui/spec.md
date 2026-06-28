# shared-ui

## ADDED Requirements

### Requirement: Paginated response envelope
The shared layer SHALL model a page-based paginated API response as
`Paginated<T> = { data: T[]; meta: { current_page; last_page; per_page; total } }`,
matching Laravel's resource-collection-with-paginator output, and SHALL provide a
`nextPageParam` helper that returns the next page number, or `undefined` on the
last page.

#### Scenario: Next page derived from meta
- WHEN a `Paginated<T>` has `meta.current_page < meta.last_page`
- THEN `nextPageParam` returns `current_page + 1`

#### Scenario: Last page stops paging
- WHEN `meta.current_page === meta.last_page`
- THEN `nextPageParam` returns `undefined`

### Requirement: Reusable infinite-scroll list
The shared UI SHALL provide a `PaginatedList` component backed by a virtualized
list that, given a react-query infinite-query result, renders the flattened
pages, loads the next page as the user nears the bottom, shows a footer spinner
while fetching the next page, supports pull-to-refresh, renders an empty state
when there are no items, and applies the same centered phone-column width cap as
`Screen`.

#### Scenario: Load more on scroll
- WHEN the user scrolls near the bottom and another page exists
- THEN the next page is fetched once (not re-triggered while a fetch is in flight) and a footer spinner shows until it arrives

#### Scenario: Empty list
- WHEN the query resolves with zero items
- THEN the provided empty state renders instead of the list

#### Scenario: Pull to refresh
- WHEN the user pulls down on the list
- THEN the query refetches from the first page

### Requirement: Screen can drive pagination for an inline list
The `Screen` component SHALL accept an optional `onEndReached` callback that
fires when its scroll container nears the bottom, so a composite screen can
paginate an inline list without nesting a virtualized list inside the scroll view.

#### Scenario: Composite screen paginates inline content
- WHEN a `Screen` with `onEndReached` is scrolled near the bottom
- THEN `onEndReached` is invoked so the host can fetch the next page of its inline list
