# Change: nearby-map-markers

## Why
On the provider Nearby map, each open request is a plain colored dot. A dot
carries no information. The provider should see, per pin, the **category** (its
icon) and the **average price**, with **urgent** requests standing out in red.

## What changes (in scope)
- **Informative markers.** Each request on the Nearby map shows a pill with the
  category icon + the area average price (falling back to the budget cap). Urgent
  requests use red; the rest use the accent color.
- **Both platforms.** The same marker content renders on native (react-native-maps
  custom marker child) and on web (the Leaflet stub renders the marker's React
  content to HTML for a `divIcon`).
- Tapping a marker still selects the request (existing behavior).
- **Fix the tapped-pin sheet z-order.** Today the detail sheet that opens when a
  marker is tapped renders *behind* the map on web. It is raised above the map
  (explicit z-index + native elevation).

## Deferred (NOT in this change)
- No change to the customer map (its request/provider pins stay as they are).
- No clustering / zoom-based density handling.

## Impact
- Module: `provider`.
- Frontend (`apps/provider`): new `src/components/RequestMarker.tsx` (inline-styled
  pill: `CategoryIcon` + price, red when urgent); `app/(tabs)/nearby.tsx` renders
  it as the `<Marker>` child (drops `pinColor`); the web stub
  (`src/web-stubs/react-native-maps.tsx`) renders a marker's children via
  `renderToStaticMarkup` into a Leaflet `divIcon` (keeping the dot fallback for
  markers without custom content, e.g. the request-detail pins).
- No backend change (`area_avg_price` is already on the resource).

## Risk
- `renderToStaticMarkup` of RN-Web components can drop class-based styles, so
  `RequestMarker` uses inline styles only. Verified visually on web.
