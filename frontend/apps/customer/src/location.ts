import * as Location from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
  address?: string;
}

/** Request permission + return the device's current position with a best-effort
 * reverse-geocoded address. Throws if permission is denied. */
export async function getCurrentCoords(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Permissão de localização negada.');

  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const coords: Coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };

  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (place) {
      coords.address = [place.street, place.streetNumber, place.district, place.city]
        .filter(Boolean)
        .join(', ');
    }
  } catch {
    // reverse geocode is best-effort
  }
  return coords;
}
