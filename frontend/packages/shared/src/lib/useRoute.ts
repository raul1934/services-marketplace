import { useEffect, useState } from 'react';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface Route {
  /** Road geometry as lat/lng points, ready for a <Polyline coordinates>. */
  coords: RoutePoint[];
  distanceKm: number;
  durationMin: number;
}

/** OSRM server (Open Source Routing Machine). Override with a self-hosted instance. */
const OSRM_BASE = process.env.EXPO_PUBLIC_OSRM_URL ?? 'https://router.project-osrm.org';

/**
 * Driving route between two points from OSRM. Returns the road polyline +
 * distance/duration, or null while loading / on failure. Refetches only when an
 * endpoint moves more than ~100 m (coords rounded to 3 decimals) to be gentle on
 * the routing server.
 */
export function useRoute(from: RoutePoint | null | undefined, to: RoutePoint | null | undefined): Route | null {
  const [route, setRoute] = useState<Route | null>(null);
  const r3 = (n: number) => n.toFixed(3);
  const key = from && to ? `${r3(from.latitude)},${r3(from.longitude)};${r3(to.latitude)},${r3(to.longitude)}` : null;

  useEffect(() => {
    if (!from || !to) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    const url = `${OSRM_BASE}/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    fetch(url)
      .then((res) => res.json())
      .then((data: { routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] }) => {
        if (cancelled) return;
        const r0 = data?.routes?.[0];
        if (!r0?.geometry?.coordinates?.length) {
          setRoute(null);
          return;
        }
        setRoute({
          coords: r0.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
          distanceKm: r0.distance / 1000,
          durationMin: Math.max(1, Math.round(r0.duration / 60)),
        });
      })
      .catch(() => {
        if (!cancelled) setRoute(null);
      });
    return () => {
      cancelled = true;
    };
    // Intentionally keyed on the rounded endpoints only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return route;
}
