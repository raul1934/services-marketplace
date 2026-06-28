# Tasks — paginate the growing list screens

## 1. Shared contract & components (`packages/shared`)
- [x] 1.1 Redefine `Paginated<T>` in `types/models.ts` to `{ data; meta: { current_page; last_page; per_page; total } }`.
- [x] 1.2 Add `unwrapPage<T>` and `nextPageParam` helpers to the api layer (exported). Also added `flattenPages`.
- [x] 1.3 Add `PaginatedList<T>` component under `src/ui` (FlatList wrapper: `onEndReached`, footer spinner, `RefreshControl`, empty/loading, phone-column cap) and export it from the ui index.
- [x] 1.4 Add optional `onEndReached` (+ near-bottom `onScroll` detection) to `Screen`.
- [x] 1.5 `tsc --noEmit` for `packages/shared` is clean (modulo the known pre-existing errors).

## 2. Backend (`backend`)
- [x] 2.1 Add a `perPage(Request)` helper (default 20, clamp 1–50) on the base `Controller`.
- [x] 2.2 `Customer\RequestController@index` → `->paginate()`.
- [x] 2.3 `Customer\RequestController@events` → paginate the derived feed (LengthAwarePaginator, default 30).
- [x] 2.4 `Customer\ProposalController@index` → `->paginate()` (preserve `sort`).
- [x] 2.5 `Customer\AssetController@index` → `->paginate()` (preserve `type`).
- [x] 2.6 `Provider\NearbyController@index` + `@scheduled` → `->paginate()` via `MatchingService::openRequestsNearPaginated` (preserve `radius_km`).
- [x] 2.7 `Provider\JobController@index` → `->paginate()`.
- [x] 2.8 `Provider\ProposalController@bids` → `->paginate()`.
- [x] 2.9 New `Provider\WalletController@transactions` (paginated, explicit `{data,meta}`) + route `GET provider/wallet/transactions`; removed `transactions` from the `@index` summary payload.
- [x] 2.10 `php artisan test` green (28 passed; only pre-existing unrelated `ExampleTest` fails).

## 3. Customer app (`apps/customer`)
- [x] 3.1 `api.ts`: list methods take `page` and return `Paginated<T>` (requests, proposals, assets). **Events excluded** — see note.
- [x] 3.2 `queries.ts`: convert `useMyRequests`, `useProposals`, `useAssets` to `useInfiniteQuery`. `useRequestEvents` stays `useQuery`.
- [x] 3.3 `requests.tsx` → `PaginatedList`; filter chrome in `listHeader`; status filter over loaded pages via `selectItems`.
- [x] 3.4 `assets/index.tsx` → `PaginatedList` (Add button in pinned `footer`); also fixed wizard `request/new.tsx` asset picker (flatten pages).
- [x] 3.5 `ProposalsList.tsx` → flatten infinite pages; footer spinner; exposes load-more via `loadMoreRef`.
- [~] 3.6 `EventFeed.tsx` — **no change; events feed left unpaginated** (derived, bounded, order-sensitive timeline; paginating it is net-negative). Surfaced as the one scope reduction.
- [x] 3.7 `request/[id]/index.tsx` → wire `Screen onEndReached` to proposals while open.
- [x] 3.8 `home.tsx` → read `flattenPages(pages)`, still cap at 2 cards (no behavior change).
- [x] 3.9 `tsc --noEmit` for `apps/customer` clean (only known pre-existing errors).

## 4. Provider app (`apps/provider`)
- [x] 4.1 `api.ts`: `nearby`, `scheduled`, `myJobs`, `myBids` take `page` and return `Paginated<T>`; added `walletTransactions(page)`; dropped `transactions` from `Wallet`.
- [x] 4.2 `queries.ts`: converted `useNearby`, `useScheduled`, `useMyJobs`, `useMyBids` to `useInfiniteQuery`; added `useWalletTransactions`.
- [x] 4.3 `nearby.tsx` → list + agenda views are `FlatList` with `onEndReached` + footer spinner (kept the custom shell/map/overlays; `PaginatedList`'s full-screen container would fight them). Map reads loaded pages.
- [x] 4.4 `jobs.tsx` → jobs + bids tabs use `PaginatedList` (title + Segment in pinned header).
- [x] 4.5 `agenda.tsx` → week strip + day groups paginate via `Screen onEndReached` + footer spinner.
- [x] 4.6 `earnings.tsx` → transactions via `useWalletTransactions` (paginates via `Screen onEndReached`; balance/summary stay visible). Also fixed `dashboard.tsx` (flatten `useMyJobs`/`useNearby`).
- [x] 4.7 `tsc --noEmit` for `apps/provider` clean (only the 5 known pre-existing errors; `keys.nearby` line shifted 75→118).

## 5. Verification
- [x] 5.1 Backend: `php artisan test` green (28 pass). Curl confirmed `GET requests?per_page=2` → `{data,links,meta}`, `meta.{current_page,last_page,per_page,total}` (customer #1 has 55 → 28 pages), and `?page=2` returns different ids `[3,6]`. Assets paginate too.
- [x] 5.2 `tsc --noEmit` clean on `packages/shared`, `apps/customer`, `apps/provider` (only the documented pre-existing errors).
- [x] 5.3 Playwright (phone viewport): customer My-requests fetched `page=1` then `page=2`/`page=3` on wheel-scroll and the list advanced to new items; provider jobs/nearby/earnings render, all paginated calls fire (incl. new `wallet/transactions?page=1`), zero console errors.
- [x] 5.4 Requirements walked with evidence (see final summary).
