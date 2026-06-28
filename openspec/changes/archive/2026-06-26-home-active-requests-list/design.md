# Design — home-active-requests-list

## Selection + ordering (`app/(tabs)/home.tsx`)
Replace the single `active` find with a derived, sorted, capped list from
`useMyRequests()` (already returns all of the customer's requests).

```
const RANK = (r) =>
  r.status === 'open' && r.urgency === 'urgent' ? 0 :   // urgent now
  r.status === 'open' && r.urgency !== 'scheduled' ? 1 :// em cotação (normal open)
  r.status === 'requote' ? 2 :                          // re-cotação
  r.status === 'open' && r.urgency === 'scheduled' ? 3 :// agendados (future)
  isActiveStatus(r.status) ? 4 :                        // accepted / in_progress
  99;                                                   // terminal → excluded
```

- Candidates = requests with `RANK < 99` (excludes completed/cancelled/expired).
- Sort by `RANK` asc, then:
  - rank 3 (scheduled): by next availability `starts_at` asc (earliest upcoming
    first); requests without availabilities fall back to `created_at`.
  - other ranks: by `created_at` desc (most recent first).
- `visible = candidates.slice(0, 2)`; render one `ActiveRequestCard` each.
- If `candidates.length > 2`, render a "Ver todos ({n})" button below that calls
  `router.push('/(tabs)/requests')`.
- The section header (`home.activeRequest`) shows only when `candidates.length > 0`.

`nextDate(r)` = min `starts_at` among `r.availabilities` that is in the future
(fallback: first availability, else undefined).

## Card
`ActiveRequestCard` is unchanged — it already renders the right badge/CTA per
state (open → proposals + "Ver propostas"; accepted/in_progress → status + "Track
service"). Scheduled/requote open requests use the open branch (proposals + review)
which is correct (they are still collecting / re-collecting quotes).

## Backend
`RequestController@index`: add `availabilities` to the eager-load so the list
resource includes them for date sorting:

```
->with(['category', 'photos', 'availabilities'])
```

`ServiceRequestResource` already emits `availabilities` via `whenLoaded`, and the
shared `ServiceRequest` type already has `availabilities?: Availability[]`. No new
fields, no migration.

## i18n
Add `home.seeAll` — pt-BR "Ver todos ({{count}})", en-US "See all ({{count}})".

## Why cap at 2 + a tab jump
Home is a launchpad, not a full list. Two cards keep it scannable; the Requests
tab already renders the complete list, so "Ver todos" reuses it rather than
duplicating a list on home.
