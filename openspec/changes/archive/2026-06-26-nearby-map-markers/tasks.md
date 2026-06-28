# Tasks — nearby-map-markers

## 1. RequestMarker component
- [x] 1.1 `apps/provider/src/components/RequestMarker.tsx`: an inline-styled pill — `CategoryIcon` (white) + average price (`area_avg_price ?? budget_max`, `brl`), background red (`danger`) when `urgency === Urgent` else `accent`. Inline styles only (for web `renderToStaticMarkup`).

## 2. Use it on the Nearby map
- [x] 2.1 `app/(tabs)/nearby.tsx`: render `<Marker coordinate onPress={...}><RequestMarker request={r} /></Marker>` (drop `pinColor`).

## 3. Web stub renders custom markers
- [x] 3.1 `apps/provider/src/web-stubs/react-native-maps.tsx`: when a `<Marker>` has children, render them via `renderToStaticMarkup` into a Leaflet `divIcon` (centered anchor, transparent container) instead of a `circleMarker`; keep the `circleMarker` + popup path for markers without children. Preserve `onPress`.

## 3b. Fix the tapped-pin sheet z-order
- [x] 3b.1 `app/(tabs)/nearby.tsx`: add an explicit `zIndex` (+ `elevation` for native) to the tapped-pin detail sheet so it sits above the map (currently renders behind it on web).

## 4. Verify
- [x] 4.1 Typecheck provider app (0 new errors).
- [x] 4.2 Visual (Playwright @ :19082, Nearby → Map): markers show the category icon + average price; an urgent request's marker is red; tapping a marker still selects it.
