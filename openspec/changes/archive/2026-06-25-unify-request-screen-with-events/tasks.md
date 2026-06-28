# Tasks — unify-request-screen-with-events

## 1. Backend — event feed
- [x] 1.1 `RequestEventService::for(ServiceRequest): array` — derive typed events from existing timestamps + relations (see design catalog), sorted ascending by `at` (lifecycle ordinal breaks same-second ties). Emit an event only when its source timestamp/row exists.
- [x] 1.2 `RequestEventResource` — pass-through over the already-shaped `{ id, type, at, amount?, data? }` arrays.
- [x] 1.3 `RequestController@events` — `authorizeOwner`, return the resource collection (method-injected `RequestEventService`, reuses the existing owner guard rather than a new controller).
- [x] 1.4 Route `GET requests/{serviceRequest}/events` in the client group of `routes/customer_api.php`.

## 2. Frontend — data layer
- [x] 2.1 Add `RequestEvent` + `RequestEventType` to `@walvee/shared` (models.ts).
- [x] 2.2 `customerApi.events(id)` in `apps/customer/src/api.ts` → `GET requests/{id}/events`.
- [x] 2.3 `useRequestEvents(id)` + `keys.events(id)` in `apps/customer/src/queries.ts`.

## 3. Frontend — unified screen
- [x] 3.1 Move the map + ETA + 4-step progress strip from `track.tsx` into `request/[id]/index.tsx`, rendered when the request is active (reuses `useTracking` + the `onLocation` socket).
- [x] 3.2 Remove the "Acompanhar ao vivo" button; keep all existing inline action cards.
- [x] 3.3 Replace `request/[id]/track.tsx` body with a redirect to `request/[id]`.
- [x] 3.4 Invalidate `keys.events(id)` from the existing `subscribeToRequest` handlers so the feed updates live.

## 4. Frontend — EventFeed component
- [x] 4.1 `apps/customer/src/components/EventFeed.tsx`: approved-value header + collapsed last-5 (newest at bottom), tap-to-expand to the full list.
- [x] 4.2 Map each event type → icon + i18n label + optional amount/caption.
- [x] 4.3 Mount `EventFeed` at the bottom of `request/[id]/index.tsx` for all states.

## 5. i18n
- [x] 5.1 Customer pt-BR + en-US: one label per event type + the "ver tudo / N" toggle + approved-value label.

## 6. Verify
- [x] 6.1 Feature test (`RequestEventFeedTest`): accept → parts → surcharge → complete returns the expected types in chronological order with correct amounts; open request shows only what happened; a non-owner gets 403. 3 passed.
- [x] 6.2 Visual (Playwright @ :19083): in-progress #6 shows the map inline + "Approve total" card; completed #13 shows the feed "ACTIVITY 9 · Approved value · R$220" with last-5 + "View all (9)"; open #1 shows request_created + 3 proposals, no map/approved-value; `/request/6/track` redirects to `/request/6`.
- [x] 6.3 Typecheck shared + customer app: 0 new errors (only 3 pre-existing: push.ts, leaflet web-stub, google.svg).
