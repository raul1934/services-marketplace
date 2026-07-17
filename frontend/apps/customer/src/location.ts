import * as Location from 'expo-location';
import { Platform } from 'react-native';

/** Structured Brazilian address parts, matching the asset_properties columns. */
export interface AddressParts {
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface Coords extends AddressParts {
  latitude: number;
  longitude: number;
  address?: string;
}

// expo-location's reverseGeocodeAsync has no web implementation (Expo SDK 49
// dropped browser Geocoding API support — it now rejects/no-ops on web), so the
// location step's drag-to-fine-tune pin silently never fills in the address
// there. Nominatim is OSM's free reverse geocoder, matching the app's existing
// no-API-key OSM/CARTO map tiles.
// Reverse geocoders return the state's full name ("São Paulo"), but the field
// wants the 2-letter UF. Map the ones we can; pass anything else through.
const UF: Record<string, string> = {
  acre: 'AC', alagoas: 'AL', amapá: 'AP', amazonas: 'AM', bahia: 'BA', ceará: 'CE',
  'distrito federal': 'DF', 'espírito santo': 'ES', goiás: 'GO', maranhão: 'MA',
  'mato grosso': 'MT', 'mato grosso do sul': 'MS', 'minas gerais': 'MG', pará: 'PA',
  paraíba: 'PB', paraná: 'PR', pernambuco: 'PE', piauí: 'PI', 'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN', 'rio grande do sul': 'RS', rondônia: 'RO', roraima: 'RR',
  'santa catarina': 'SC', 'são paulo': 'SP', sergipe: 'SE', tocantins: 'TO',
};

function toUF(s?: string | null): string | undefined {
  if (!s) return undefined;
  if (s.length === 2) return s.toUpperCase();
  return UF[s.trim().toLowerCase()] ?? undefined;
}

/** Join the parts into a single readable line (used as the request's address). */
export function formatAddress(p: AddressParts): string | undefined {
  const line = [p.street, p.number, p.neighborhood, p.city && p.state ? `${p.city} - ${p.state}` : p.city].filter(Boolean).join(', ');
  return line || undefined;
}

async function reverseGeocodeWebParts(coords: { latitude: number; longitude: number }): Promise<AddressParts | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return undefined;
    const { address: a } = await res.json();
    if (!a) return undefined;
    return {
      cep: a.postcode,
      street: a.road,
      number: a.house_number,
      neighborhood: a.suburb ?? a.neighbourhood,
      city: a.city ?? a.town ?? a.village ?? a.municipality ?? a.county,
      state: a['ISO3166-2-lvl4']?.split('-')[1] ?? toUF(a.state),
    };
  } catch {
    return undefined;
  }
}

/** Best-effort reverse geocode into structured Brazilian address parts. */
export async function reverseGeocodeParts(coords: { latitude: number; longitude: number }): Promise<AddressParts | undefined> {
  if (Platform.OS === 'web') return reverseGeocodeWebParts(coords);
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (place) {
      return {
        cep: place.postalCode ?? undefined,
        street: place.street ?? undefined,
        number: place.streetNumber ?? undefined,
        neighborhood: place.district ?? undefined,
        city: place.city ?? place.subregion ?? undefined,
        state: toUF(place.region),
      };
    }
  } catch {
    // reverse geocode is best-effort
  }
  return undefined;
}

/** Best-effort reverse geocode of an arbitrary lat/lng into a one-line address. */
export async function reverseGeocode(coords: { latitude: number; longitude: number }): Promise<string | undefined> {
  const parts = await reverseGeocodeParts(coords);
  return parts ? formatAddress(parts) : undefined;
}

/** Request permission + return the device's current position with a best-effort
 * reverse-geocoded address. Throws if permission is denied. */
export async function getCurrentCoords(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Permissão de localização negada.');

  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const coords: Coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  const parts = await reverseGeocodeParts(coords);
  if (parts) {
    Object.assign(coords, parts);
    const line = formatAddress(parts);
    if (line) coords.address = line;
  }
  return coords;
}
