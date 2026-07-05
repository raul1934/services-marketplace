import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface Coords {
  latitude: number;
  longitude: number;
  address?: string;
}

// expo-location's reverseGeocodeAsync has no web implementation (Expo SDK 49
// dropped browser Geocoding API support — it now rejects/no-ops on web), so the
// location step's drag-to-fine-tune pin silently never fills in the address
// there. Nominatim is OSM's free reverse geocoder, matching the app's existing
// no-API-key OSM/CARTO map tiles.
async function reverseGeocodeWeb(coords: { latitude: number; longitude: number }): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return undefined;
    const { address: a } = await res.json();
    if (!a) return undefined;
    return [a.road, a.house_number, a.suburb ?? a.neighbourhood, a.city ?? a.town].filter(Boolean).join(', ');
  } catch {
    return undefined;
  }
}

/** Best-effort reverse geocode of an arbitrary lat/lng into a street address. */
export async function reverseGeocode(coords: { latitude: number; longitude: number }): Promise<string | undefined> {
  if (Platform.OS === 'web') return reverseGeocodeWeb(coords);
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (place) {
      return [place.street, place.streetNumber, place.district, place.city].filter(Boolean).join(', ');
    }
  } catch {
    // reverse geocode is best-effort
  }
  return undefined;
}

/** Request permission + return the device's current position with a best-effort
 * reverse-geocoded address. Throws if permission is denied. */
export async function getCurrentCoords(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Permissão de localização negada.');

  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const coords: Coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  const address = await reverseGeocode(coords);
  if (address) coords.address = address;
  return coords;
}
