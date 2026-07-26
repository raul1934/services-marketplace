import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const toCoords = (p: Location.LocationObject): Coords => ({
  latitude: p.coords.latitude,
  longitude: p.coords.longitude,
  accuracy: p.coords.accuracy ?? undefined,
});

/** Great-circle distance in metres between the user and a {lat,lng} point. */
export function distanceMeters(a: Coords, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.latitude);
  const dLng = toRad(b.lng - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type LL = { lat: number; lng: number };

/** Metres between two {lat,lng} points. */
export function metersBetweenLL(a: LL, b: LL): number {
  return distanceMeters({ latitude: a.lat, longitude: a.lng }, b);
}

/** Average of the ring's vertices — good enough to place the area label. */
export function polygonCentroid(pts: LL[]): LL {
  const n = pts.length || 1;
  return { lat: pts.reduce((s, p) => s + p.lat, 0) / n, lng: pts.reduce((s, p) => s + p.lng, 0) / n };
}

export function edgeMidpoint(a: LL, b: LL): LL {
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
}

/** Area (m²) of a small lat/lng ring via a local equirectangular projection. */
export function polygonAreaSqm(pts: LL[]): number {
  if (pts.length < 3) return 0;
  const R = 6371000;
  const lat0 = (polygonCentroid(pts).lat * Math.PI) / 180;
  const k = Math.cos(lat0);
  const xy = pts.map((p) => ({ x: (p.lng * Math.PI) / 180 * R * k, y: (p.lat * Math.PI) / 180 * R }));
  let a = 0;
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    a += xy[i].x * xy[j].y - xy[j].x * xy[i].y;
  }
  return Math.abs(a) / 2;
}

/** Request permission + return current position. Throws if denied. */
export async function getCurrentCoords(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Permissão de localização negada.');
  return toCoords(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
}

/**
 * Live current position for the map ("you are here"). Returns null until a fix
 * arrives, or if permission is denied — the caller just omits the dot then.
 */
export function useMyLocation(): Coords | null {
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    let alive = true;
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !alive) return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (alive) setCoords(toCoords(pos));
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
          (p) => alive && setCoords(toCoords(p)),
        );
      } catch {
        /* denied or unavailable — leave null, the dot is simply omitted */
      }
    })();

    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);

  return coords;
}
