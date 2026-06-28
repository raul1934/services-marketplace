# Design — unify-request-screen-with-events

## Event model (derived, no table)
Events are computed on read from the request and its already-existing relations;
nothing is persisted. Each event is normalized to:

```
RequestEvent {
  id: string            // stable per source row, e.g. "proposal:42", "status:started"
  type: string          // see catalog below
  at: string            // ISO-8601 timestamp used for ordering
  amount?: number       // when money is involved (proposal price, surcharge, total)
  data?: object         // type-specific payload (provider name, part name, reason, rating…)
}
```

### Event catalog and source
| type | source field / relation |
|---|---|
| `request_created` | `service_requests.created_at` |
| `proposal_received` | each `proposals.created_at` (provider, price, eta) |
| `proposal_accepted` | `accepted_at` + `accepted_proposal` (provider, **approved value**) |
| `job_started` | `started_at` |
| `parts_approval_requested` | `parts_approval_requested_at` |
| `parts_approved` | `parts_approved_at` |
| `part_added` | each `job_parts.created_at` (name, qty, unit_price, action) |
| `surcharge_proposed` | each `surcharges.created_at` (amount, reason, tier) |
| `surcharge_resolved` | `surcharges.resolved_at` (approved/refused) |
| `reschedule_requested` | each `reschedule_requests.created_at` (by role, proposed time) |
| `reschedule_resolved` | reschedule resolved (accepted/declined) |
| `job_update` | each `JobUpdate.created_at` (provider note + optional photo) |
| `job_completed` | `completed_at` |
| `requote` | requote surcharge (tier = requote) / requote resolution |
| `cancelled` | `cancelled_at` (+ reason) |
| `no_show` | `no_show_at` (+ reason) |
| `expired` | status `expired` (uses the relevant timestamp) |
| `review_submitted` | `review.created_at` (rating) |
| `disputed` | dispute opened |

Only events whose source timestamp exists are emitted (e.g. no `job_started`
until `started_at` is set), so an open request shows just `request_created` +
any `proposal_received`.

### Ordering & shape
- The endpoint returns events **ascending by `at`** (oldest → newest).
- The UI renders newest at the bottom; collapsed view = the **last 5**.
- The **approved value** = `accepted_proposal.price`; surfaced both as the
  `proposal_accepted` event and as the header label of the feed panel.

## Backend
- `RequestEventService::for(ServiceRequest $request): array` — eager-loads the
  needed relations, maps each source to zero/one `RequestEvent`, sorts by `at`
  then a per-type lifecycle ordinal (DB timestamps are second-precision, so a
  request and its first proposal can tie — the ordinal keeps creation first).
  Single place to add future event types; written so a provider variant can pick
  a different visibility subset.
- `RequestController@events` — added as a method on the existing controller (not
  a new `RequestEventController`) so it reuses the private `authorizeOwner`
  guard; the `RequestEventService` is method-injected. Returns
  `RequestEventResource::collection(...)`.
- Route: `GET requests/{serviceRequest}/events` inside the client group in
  `routes/customer_api.php`.
- No migration; no new columns.

## Frontend (`apps/customer`)
- **`request/[id]/index.tsx`** stays the entry. Add an `active && hasLocation`
  block that renders the map + ETA + 4-step strip (lifted from `track.tsx`,
  reusing `useTracking` + the `onLocation` socket already wired in `track`). The
  existing inline action cards are unchanged; the "Acompanhar ao vivo" button is
  removed.
- **`EventFeed` component** (`src/components/EventFeed.tsx`): renders the approved
  value header + the collapsed last-5 (newest at bottom) with a "ver tudo / N"
  affordance that expands to the full list in place. Each event maps to an icon +
  i18n label + optional amount/caption. Pure presentational; takes `events` +
  `approvedValue`.
- **`request/[id]/track.tsx`** → `<Redirect href={`/request/${id}`} />` (keep the
  file so `/request/N/track` URLs and existing `router.push(.../track)` callers
  resolve; remove the push from index in the same change).
- **Data layer**: `RequestEvent` type in `@walvee/shared`; `customerApi.events(id)`
  in `src/api.ts`; `useRequestEvents(id)` + a `keys.events(id)` query key in
  `src/queries.ts`. Invalidate `keys.events(id)` from the same
  `subscribeToRequest` handlers the screen already uses (status/proposal/
  surcharge/parts/reschedule/dispute), so the feed updates live.

## Why derive instead of an event table
The data already exists and is authoritative; a parallel log would risk drift and
needs backfill. Deriving keeps one source of truth and makes the feed a pure
read-model. The service boundary (`RequestEventService`) means we can switch to a
stored log later without changing the controller/route or the frontend contract.

## Alternatives considered
- **Assemble the feed in the client** — rejected: duplicates mapping logic across
  apps and can't see server-only ordering nuances cleanly.
- **Keep `track` as a separate screen** — rejected: it shares the provider card +
  status and the user wants one screen; redirect preserves links without the
  duplication.
