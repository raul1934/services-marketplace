# Design — paginate the growing list screens

## Decisions

### Page-based, not cursor-based
Use Laravel `->paginate($perPage)` (LengthAwarePaginator). The lists are ordered
`latest()` and the volumes are moderate; page-based keeps `total`/`last_page`
available (useful for counts) and matches the pre-existing `Paginated<T>` intent.
`cursorPaginate()` is the better long-term fit for high-churn feeds (nearby,
events) because it avoids skips/dupes as rows shift between requests — noted as a
follow-up, not done here, so the contract stays uniform across all 8 lists.

### Envelope = Laravel default (`data` + `meta`)
Passing a paginator to `JsonResource::collection()` makes Laravel emit:

```json
{
  "data": [ /* resources */ ],
  "links": { "first": "…", "last": "…", "prev": null, "next": "…" },
  "meta": { "current_page": 1, "from": 1, "last_page": 5, "per_page": 20, "to": 20, "total": 93 }
}
```

We adopt this verbatim (least backend code) and **redefine** the currently-unused
flat `Paginated<T>` to match it:

```ts
export interface Paginated<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}
```

`links` is ignored by the client (next page is derived from `meta`). This is the
reconciliation called for in the task: the old flat shape never matched what
Laravel actually returns, so it is corrected rather than worked around with a
custom backend resource.

### `per_page`
A shared default of **20** (events **30**, which are smaller rows), overridable
via `?per_page=`, clamped server-side to `[1, 50]`. Centralized as a controller
constant so the default is consistent.

## Shared layer (`packages/shared`)

### `unwrapPage` + `getNextPageParam`
Replace `unwrapList` for paginated endpoints with:

```ts
export const unwrapPage = <T>(r: Paginated<T>): Paginated<T> => r; // identity, typed
// react-query helper:
export const nextPageParam = (last: Paginated<unknown>) =>
  last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined;
```

`useInfiniteQuery` lives in each app's `queries.ts` (it needs the app's api
client), but `nextPageParam` and the `initialPageParam: 1` convention are shared
so both apps behave identically.

### `PaginatedList<T>` component (shared-ui)
A thin FlatList wrapper used by **top-level** list screens. Props:

- `query`: the `useInfiniteQuery` result (`data.pages`, `fetchNextPage`,
  `hasNextPage`, `isFetchingNextPage`, `isLoading`, `refetch`, `isRefetching`).
- `renderItem`, `keyExtractor`
- `ListHeaderComponent?` (above-list chrome — filter badge, segmented tabs, …)
- `ListEmptyComponent?` (the existing `EmptyState`)
- `estimatedItemSize?`, `contentContainerStyle?`

Behavior it centralizes:
- Flattens `data.pages` → `items` via `pages.flatMap(p => p.data)`.
- `onEndReached` → `if (hasNextPage && !isFetchingNextPage) fetchNextPage()` with
  `onEndReachedThreshold={0.4}`.
- Footer = `ActivityIndicator` while `isFetchingNextPage`.
- Pull-to-refresh via `RefreshControl` wired to `refetch`.
- First-load spinner vs empty-state handling.
- The same centered ~480px phone-column cap the `Screen` applies (so lists match
  the rest of the app on web).

### `Screen onEndReached` passthrough
`Screen` already owns the scroll container. Add optional
`onEndReached?: () => void` (+ internal `onScroll` near-bottom detection at a 0.4
threshold) so **composite** screens that render an inline list inside their own
scroll can drive pagination without nesting a VirtualizedList inside a ScrollView
(an RN anti-pattern + dev warning). This is the mechanism for the customer
request-detail screen.

## Customer app

| List | Hook → | Screen treatment |
|---|---|---|
| My requests | `useMyRequests` → infinite | `requests.tsx` becomes `PaginatedList`; the filter badge row moves into `ListHeaderComponent`. Client-side status filter applies per loaded page (documented caveat: filter acts on loaded pages, full-dataset filtering is a future server-side concern). |
| Assets | `useAssets` → infinite | `assets/index.tsx` → `PaginatedList`. |
| Proposals | `useProposals` → infinite | Lives in `ProposalsList.tsx`, rendered **inline** in `request/[id]`. Switch to `useInfiniteQuery`, flatten pages, and let the parent `Screen onEndReached` call `fetchNextPage` while the request is open. |
| Events feed | `useRequestEvents` → infinite | Lives in `EventFeed.tsx`, inline in `request/[id]`. Same parent-`Screen onEndReached` mechanism when no proposals list is shown. |

`request/[id]` wires `Screen onEndReached` to whichever inline list is active
(proposals while `open`, else events).

`home.tsx` keeps `useMyRequests` but only ever shows the first 2 cards — it reads
`data.pages[0].data` and never paginates. No UX change there.

## Provider app

| List | Hook → | Screen treatment |
|---|---|---|
| Nearby (list) | `useNearby` → infinite | `nearby.tsx` list view → `PaginatedList`. The **map** view is unaffected (it renders markers from the loaded pages; map is not a paginated surface). |
| Scheduled | `useScheduled` → infinite | `nearby.tsx` scheduled/agenda view → `PaginatedList` (grouping by day applied over loaded pages). |
| My jobs | `useMyJobs` → infinite | `jobs.tsx` jobs tab → `PaginatedList`. |
| My bids | `useMyBids` → infinite | `jobs.tsx` bids tab → `PaginatedList`. |
| Agenda | `useMyJobs` → infinite | `agenda.tsx` groups jobs by week/day. Keep the week strip as `ListHeaderComponent`; day groups render over loaded pages. |
| Wallet transactions | new `useWalletTransactions` → infinite | New `GET provider/wallet/transactions`. `earnings.tsx` summary cards become `ListHeaderComponent`; the transaction rows become the paginated list. `useWallet` (summary) stays a plain query. |

## Backend

Each `index`/list method changes `->get()` → `->paginate($perPage)`; the
`Resource::collection(...)` call is unchanged (it detects the paginator). Add a
shared `perPage(Request $r)` helper on the base `Controller` that reads/clamps
`?per_page` with the default. The new `WalletController@transactions` moves the
transaction query out of the wallet summary payload and paginates it; the summary
endpoint drops the `transactions` array.

## Risks / edge cases

- **Nested VirtualizedList**: avoided by the `Screen onEndReached` route for the
  two inline lists (proposals, events). No FlatList is mounted inside a ScrollView.
- **Client-side filters over paginated data** (My requests status filter, nearby
  category/distance filters): these now filter only the loaded pages. Acceptable
  for v1; flagged in the spec as a known limitation with server-side filtering as
  the follow-up.
- **Realtime invalidation**: existing `qc.invalidateQueries` calls refetch the
  infinite query from page 1, which react-query handles natively — no change
  needed beyond the query key staying stable.
- **Tests**: existing feature tests assert `json('data')` arrays; paginated
  responses still expose `data`, so list-membership assertions hold, but any test
  asserting the *absence* of `meta` (none found) would need updating.
