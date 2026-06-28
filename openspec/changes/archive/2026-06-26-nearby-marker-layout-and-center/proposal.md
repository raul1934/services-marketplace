# Change: nearby-marker-layout-and-center

## Why
Two refinements to the provider Nearby map:
- The marker pill reads better as the category **icon with the price below it**,
  and urgent jobs should make **both** the icon and the price red (not a filled
  red pill).
- When a marker is tapped (opening the detail sheet), the map should **center on
  that marker** so it's in view above the sheet; closing the sheet should **return
  the map to the previous view** (position + zoom).

## What changes (in scope)
- **Marker layout.** `RequestMarker` becomes a vertical stack: the category icon
  (in a white circle) above, the price below. Both the icon and the price are red
  when the request is urgent, accent otherwise. Web stub HTML updated to match.
- **Center on select.** Tapping a marker animates the map to center on it (keeping
  the current zoom); the previous region is saved.
- **Restore on close.** Closing the detail sheet animates the map back to the
  saved region.

## Deferred (NOT in this change)
- No change to which requests appear or to filtering.

## Impact
- Module: `provider`.
- Frontend (`apps/provider`): `RequestMarker.tsx` (vertical layout, urgency color
  on icon + price); `nearby.tsx` holds a map ref, tracks the region
  (`onRegionChangeComplete`), animates to the marker on select and back on close;
  the web stub (`web-stubs/react-native-maps.tsx`) gains `animateToRegion` (via
  ref) + fires `onRegionChangeComplete`, and renders the vertical marker HTML.
- No backend change.
