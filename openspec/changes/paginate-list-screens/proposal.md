# Paginate the growing list screens (infinite scroll)

## Why

Every list in both apps is fetched in full (`->get()` on the backend, `useQuery`
on the client) and rendered with `.map()` inside the `Screen` ScrollView. There
are no virtualized lists anywhere. As a user's history grows — requests, bids,
nearby jobs, wallet transactions — these endpoints return ever-larger payloads
and the UI mounts every row at once. This gets slow and wasteful on exactly the
accounts that matter most (active customers and busy providers).

A `Paginated<T>` type already exists in `packages/shared/src/types/models.ts`
but is unused — the codebase anticipated this and never wired it up.

## What changes

Add page-based pagination with **infinite scroll** to the 8 growing,
server-backed lists, end to end (backend + shared + both apps). Bounded lists
(categories, per-request questions/parts/updates, preferred clients) are
explicitly out of scope.

**Backend** — switch these endpoints from `->get()` to `->paginate()`:

| Endpoint | Controller |
|---|---|
| `GET requests` | `Customer\RequestController@index` |
| `GET requests/{id}/proposals` | `Customer\ProposalController@index` |
| `GET requests/{id}/events` | `Customer\RequestController@events` |
| `GET assets` | `Customer\AssetController@index` |
| `GET provider/requests/nearby` | `Provider\NearbyController@index` |
| `GET provider/requests/scheduled` | `Provider\NearbyController@scheduled` |
| `GET provider/jobs` | `Provider\JobController@index` |
| `GET provider/bids` | `Provider\ProposalController@bids` |
| `GET provider/wallet/transactions` *(new)* | `Provider\WalletController@transactions` |

Wallet transactions are split into a new paginated endpoint; `GET provider/wallet`
keeps returning the summary (balance + month stats) only.

**Shared** — define the real paginated envelope and the reusable infinite-scroll
surface:
- Redefine `Paginated<T>` to match Laravel's resource-collection-with-paginator
  output (`{ data, meta: { current_page, last_page, per_page, total } }`) and add
  an `unwrapPage` helper + a `getNextPageParam` convention.
- Add a shared `PaginatedList` component (FlatList wrapper) that owns
  `onEndReached`, the footer spinner, pull-to-refresh, the empty/loading states,
  and the phone-column constraint.
- Extend `Screen` with an optional `onEndReached` passthrough for composite
  screens that host an inline list inside their own scroll.

**Customer app** — convert `useMyRequests`, `useProposals`, `useRequestEvents`,
`useAssets` to `useInfiniteQuery`; My-requests and Assets become `PaginatedList`;
the inline Proposals and Events lists inside `request/[id]` page via the parent
`Screen onEndReached` (no nested virtualization).

**Provider app** — convert `useNearby`, `useScheduled`, `useMyJobs`, `useMyBids`,
and wallet transactions to `useInfiniteQuery`; the list views adopt
`PaginatedList` / `Screen onEndReached`.

## Impact

- **Affected specs**: `shared-ui`, `customer`, `provider`
- **Affected code**: 9 backend controllers + the wallet route, `packages/shared`
  (types, api client, new `PaginatedList`, `Screen`), both apps' `queries.ts` +
  `api.ts`, and ~8 screens / 2 list components.
- **API contract change**: the 8 list endpoints now return the paginated envelope
  (`data` + `meta`) instead of a bare `{ data: [...] }` collection. All consumers
  are updated in the same change, so there is no orphaned caller.
- **Out of scope**: bounded lists, cursor-based pagination (page-based is used;
  cursor noted as a future option in `design.md`), and any server-side search.
