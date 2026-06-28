# Tasks — nearby-bid-status-and-pan

## 1. Bid status in the Nearby feed
- [x] 1.1 `NearbyController::near`: eager-load the provider's own proposals on the results (`$requests->load(['proposals' => fn ($q) => $q->where('provider_id', $userId)])`) so `my_proposal` resolves.
- [x] 1.2 `nearby.tsx` `NearbyJob`: when `request.my_proposal` exists, show a "Proposta enviada" badge instead of the "Enviar proposta" button.
- [x] 1.3 i18n: add `nearby.bidSent` (pt-BR + en-US).

## 2. Pan instead of re-zoom
- [x] 2.1 `nearby.tsx`: center on select and restore on close via `mapRef.animateCamera({ center }, { duration })` (keeps the current zoom); track the previous center.
- [x] 2.2 Web stub: add `animateCamera({ center }, opts)` to the imperative handle (Leaflet `panTo`); set `maxZoom` on the map.

## 3. Verify
- [x] 3.1 Typecheck provider app (0 new errors).
- [x] 3.2 Backend: nearby feed includes `my_proposal` for a request the provider bid on.
- [x] 3.3 Visual (Playwright @ :19082): a nearby request the provider bid on shows "Proposta enviada" in the list; tapping a marker centers it without changing zoom; closing returns to the previous center.
