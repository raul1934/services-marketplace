/**
 * The shape both map screens already pass around. Declared here rather than
 * imported from `react-native-maps`: that name is a Metro alias in the apps
 * (Leaflet on native, a stub on web) and does not resolve from this package.
 */
export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Whether two regions are close enough to be "the same view".
 *
 * The map reports every region change through `onRegionChangeComplete`,
 * including the ones the app causes itself — recentering, and the `setView`
 * Leaflet performs while the map sets itself up (which it can emit more than
 * once, e.g. again on `invalidateSize`). Without this check those echoes look
 * exactly like a user gesture.
 *
 * Tolerances are relative to the delta so they hold at any zoom level. An
 * absolute threshold does not: measured on device, a fixed ~11 m caught the
 * settle on one run and let it through on the next.
 *
 * Lived in the request screen, where the tracking map used it to avoid
 * re-arming its recenter timer forever. The new-request wizard needs the same
 * answer to a different question — "did the customer actually move the pin, or
 * is this the map settling?" — so it lives here now rather than being copied.
 */
export function isSameRegion(a: Region, b: Region): boolean {
  const tolLat = Math.max(Math.abs(b.latitudeDelta) * 0.05, 1e-5);
  const tolLng = Math.max(Math.abs(b.longitudeDelta) * 0.05, 1e-5);
  const sameZoom =
    b.latitudeDelta > 0 ? (() => { const r = a.latitudeDelta / b.latitudeDelta; return r > 0.75 && r < 1.33; })() : true;

  return (
    Math.abs(a.latitude - b.latitude) < tolLat &&
    Math.abs(a.longitude - b.longitude) < tolLng &&
    sameZoom
  );
}
