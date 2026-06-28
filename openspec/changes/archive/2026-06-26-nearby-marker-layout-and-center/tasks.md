# Tasks — nearby-marker-layout-and-center

## 1. Marker layout
- [x] 1.1 `RequestMarker.tsx`: vertical stack — category icon in a white circle, price label below; icon + price colored red when urgent, accent otherwise.
- [x] 1.2 Web stub `pillHtml`: render the same vertical layout (icon over price, colored by urgency).

## 2. Center on select / restore on close
- [x] 2.1 `nearby.tsx`: add a `mapRef` and track the current region via `onRegionChangeComplete` (kept in a ref).
- [x] 2.2 On marker select: save the current region, then `mapRef.animateToRegion` to the marker's coordinate (keep current zoom).
- [x] 2.3 On sheet close: `mapRef.animateToRegion` back to the saved region.
- [x] 2.4 Web stub: `forwardRef` + `useImperativeHandle({ animateToRegion })` (Leaflet `flyTo`); fire `onRegionChangeComplete` on map `moveend` with the current region.

## 3. Verify
- [x] 3.1 Typecheck provider app (0 new errors).
- [x] 3.2 Visual (Playwright @ :19082, Nearby → Map): markers show the icon with the price below (red when urgent); tapping a marker centers it and opens the sheet; closing the sheet returns the map to the previous view.
