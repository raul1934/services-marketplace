# Change: unify-request-screen-with-events

## Why
The customer has two screens for the same request that share most of their
context:

- **`request/[id]/index`** — detail + the actions the customer takes (answer
  pre-bid Q&A, see proposals, approve parts, respond to a surcharge, reschedule,
  review, etc.).
- **`request/[id]/track`** — map, live provider location, a 4-step progress
  strip, and a provider card.

They duplicate the provider card and the status context, force an extra tap
("Acompanhar ao vivo") to see the map, and split the request's story across two
places. There is also **no single, chronological history** of what has happened
to a request: the events exist (status timestamps, proposals, surcharges, parts,
reschedules, `JobUpdate` notes, the review) but they are scattered across
relations and the customer app never shows them as a timeline.

## What changes (in scope)
- **One request screen.** `request/[id]/index` becomes *the* request screen for
  every state (open → accepting proposals → accepted/en route → in progress →
  completed/terminal). When a provider is assigned and located, the live map +
  ETA (today's `track` content) renders inline. `request/[id]/track` becomes a
  thin redirect to `request/[id]` so existing deep links / notifications keep
  working. The "Acompanhar ao vivo" button is removed (the map is inline).

- **Backend event feed (new endpoint).** `GET /api/customer/v1/requests/{id}/events`
  returns a **typed chronological feed** aggregated from existing data — **no new
  table, derived from existing timestamps + relations** (request created;
  proposals received; proposal accepted; en route; started; parts requested /
  approved / each part; surcharge proposed / resolved; reschedule requested /
  resolved; provider `JobUpdate` notes; completed; requote; cancelled; no-show;
  expired; review). Owner-scoped like the other request endpoints.

- **Event list on the screen.** A collapsible feed pinned to the bottom of the
  request screen shows the **approved value** plus the events. Collapsed it shows
  the **5 most recent**, newest at the bottom growing upward (the latest event
  always visible). Tapping expands to the full list.

- **Actions surface inline.** The pending actions the customer must take (approve
  parts, respond to a surcharge, accept/decline a reschedule, accept a requote,
  submit a review, open warranty/dispute) keep appearing as inline cards/banners
  on this one screen. Dense sub-flows (the proposals list, surcharge response,
  requote, reschedule, dispute, warranty) **stay as their own pushed routes**,
  reached from those inline cards — they are not moved inline.

## Deferred (NOT in this change)
- **Provider-side reuse.** The same feed could later power the provider app; this
  change ships the customer endpoint + screen only. (The feed service is written
  so a provider variant is a small follow-up.)
- **Wiring call / message.** The provider card's "Ligar / Mensagem" buttons stay
  stubs (no telephony/chat backend exists yet).
- **Persisting an event-log table.** Events are derived on read. If audit or
  performance later require a stored log, that's a separate change.
- **Moving sub-flows inline** (proposals/surcharge/etc. remain separate screens —
  per the agreed scope).

## Impact
- Modules: `customer` (unified screen + new events endpoint on the customer API).
- Backend: 1 new route (`requests/{id}/events`), `RequestEventController@index`,
  a `RequestEventService` that derives + sorts the feed, `RequestEventResource`.
  No migration.
- Frontend (`apps/customer`): `request/[id]/index.tsx` absorbs the map/tracking
  block and gains an `EventFeed` component (`src/components/EventFeed.tsx`);
  `request/[id]/track.tsx` becomes a redirect; new `RequestEvent` type +
  `useRequestEvents` hook (`src/api.ts` + `src/queries.ts`, type in
  `@walvee/shared`); i18n keys for event labels + the collapse/expand toggle
  (pt-BR + en-US).
- Behavior: the map appears one tap sooner; every request now has a visible
  history; deep links to `/track` still resolve. No data model changes.
