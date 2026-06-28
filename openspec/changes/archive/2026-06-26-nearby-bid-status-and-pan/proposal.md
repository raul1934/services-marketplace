# Change: nearby-bid-status-and-pan

## Why
- A provider can't tell from the Nearby list which open requests they've **already
  bid on** (e.g. job 9), so they may open it expecting to bid again.
- Centering a tapped marker currently animates the map's *region* (re-deriving the
  zoom), which nudges the zoom out a little on every tap. It should keep the zoom
  fixed.

## What changes (in scope)
- **"Bid sent" in the Nearby list.** Each nearby request the provider has already
  bid on shows a "Proposta enviada" badge instead of the "Enviar proposta" button.
  Backend: the Nearby feed loads the provider's own proposal so `my_proposal` is
  populated.
- **Pan, don't re-zoom.** Tapping a marker pans the map to center it **without
  changing zoom** (`animateCamera({ center })`); closing the sheet pans back to the
  previous center. No zoom drift. A `maxZoom` cap is set on the map.

## Deferred (NOT in this change)
- No change to the bid flow itself; the already-bid request still opens the job
  screen (which shows the submitted proposal).

## Impact
- Module: `provider`.
- Backend: `NearbyController` eager-loads the provider's own `proposals` on the
  nearby feed (so `my_proposal` resolves). No new fields.
- Frontend (`apps/provider`): `nearby.tsx` `NearbyJob` shows a "bid sent" badge
  when `my_proposal` exists; centering/restore use `animateCamera({ center })`
  (pan, keep zoom) instead of `animateToRegion`; the web stub gains `animateCamera`
  (Leaflet `panTo`) + a `maxZoom`. i18n: `nearby.bidSent`.
