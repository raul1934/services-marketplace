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
