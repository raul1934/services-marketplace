/**
 * Field-service API client. Talks to the Laravel backend under
 * /api/provider/v1/provider/field/* (auth: provider). The backend derives every
 * execution state (route/site running, stop now/next/done, service done) from
 * the open shift — the app just renders what it returns. Replaces the old mock
 * in data.ts; the shapes below mirror the JSON the controllers emit.
 */
import * as LegacyFS from 'expo-file-system/legacy';
import { ApiError, getToken, http, resolveUrl } from '@chamafacil/shared';
import { PickedPhoto } from '../photos';

export type Charge = 'visit' | 'hour';
export type RunStatus = 'idle' | 'running' | 'done';
export type StopStatus = 'now' | 'next' | 'done';
export type Geo = { lat: number; lng: number };
export type Nest = { icon: string; label: string; sub: string; value: string; tone?: 'charge' | 'free' };

export type ResourceKind = 'equipment' | 'consumable';
/** A catalog item used on a service (from the execution overlay). */
export type ServiceResource = { id: string; kind: ResourceKind; name: string; rate: Charge | null; cost: 'free' | 'charged' | null; qty: number };

// A site's service definition (used on the site detail screen).
export type Service = { id: string; name: string; who: string; whoName: string; rate: Charge; done: boolean; obrig: boolean; nest: Nest[] };

// Whether a service needs equipment and/or a consumable — a flag/message, not a
// specific catalog item.
export type Requires = { equipment: boolean; consumable: boolean };
// On the OS, a service is an added *instance* (repeatable), owned by an operator
// and carrying its own resources. Adding one IS performing it — no done flag.
export type ServiceInstance = { id: string; serviceId: string; name: string; rate: Charge; obrig: boolean; requires: Requires; assignee: string | null; assigneeName: string | null; resources: ServiceResource[] };
// An entry in the "add service" menu (site services + catalog add-ons).
export type MenuItem = { id: string; name: string; obrig: boolean; rate: Charge; requires: Requires };

/** An operator on the open shift (for the per-service assignee picker). */
export type Crew = { shiftId: string; tech: string; who: string };
/** Company catalog for the resource picker: items grouped by category, per kind. */
export type ResourceItem = { id: string; name: string; kind: ResourceKind; rate: Charge | null; cost: 'free' | 'charged' | null };
export type CatalogGroup = { category: string; items: ResourceItem[] };
export type ResourceCatalog = { equipment: CatalogGroup[]; consumable: CatalogGroup[] };

export type SiteSummary = { id: string; name: string; address: string; geo: Geo | null };
export type RouteStop = { siteId: string; km: string; status: StopStatus; times: number; site: SiteSummary | null };
export type LatLng = { latitude: number; longitude: number };
export type Route = { id: string; name: string; km: number; status: RunStatus; required: number; performedTimes: number; geometry: LatLng[] | null; stops: RouteStop[] };

export type SiteListItem = { id: string; name: string; contract: string; address: string; status: RunStatus; geo: Geo | null; servicesCount: number; obrigCount: number };
export type SiteHistory = { id: string; time: string; services: number; status: 'done' | 'doing' };
export type Site = { id: string; name: string; contract: string; address: string; status: RunStatus; geo: Geo | null; geofence: Geo[] | null; services: Service[]; shiftHistory: SiteHistory[] };

export type Performance = { id: string; siteId: string; siteName: string; day: 'today' | 'yesterday'; time: string; crew: number; services: number; status: 'done' | 'doing' };

export type ShiftCrew = { id: string; tech: string; status: string };
export type Shift = { id: string; tech: string; date: string; status: string; isMaster: boolean; startedAt: string | null; endedAt: string | null; crew: ShiftCrew[] };

export type CatalogItem = { id: string; name: string; rate: Charge; obrig: boolean };
export type OsPhoto = { url: string; at: string; takenAt?: string; mediaId: number | null };
export type WeatherType = 'claro' | 'parcialmente-nublado' | 'nublado' | 'chuvoso' | 'tempestade' | 'neblina';
export type Weather = { type: WeatherType | null; temp: number | null };
export type Os = {
  site: { id: string; name: string; contract: string; address: string; geo: Geo | null };
  visit: { id: string; status: string } | null;
  weather: Weather;
  photos: { before: OsPhoto[]; after: OsPhoto[] };
  durations: { siteMinutes: number | null; shiftMinutes: number | null };
  presence: string[];
  crew: Crew[];
  services: ServiceInstance[];
  serviceMenu: MenuItem[];
  resourceCatalog: ResourceCatalog;
};

const unwrap = <T>(r: { data: T }): T => r.data;
const base = 'provider/field';

export const fieldApi = {
  routes: () => http.get<{ data: Route[] }>(`${base}/routes`).then(unwrap),
  route: (id: string) => http.get<{ data: Route }>(`${base}/routes/${id}`).then(unwrap),
  startRoute: (id: string) => http.post<{ data: Route }>(`${base}/routes/${id}/start`).then(unwrap),
  finishRoute: (id: string) => http.post<{ data: Route }>(`${base}/routes/${id}/finish`).then(unwrap),

  sites: () => http.get<{ data: SiteListItem[] }>(`${base}/sites`).then(unwrap),
  site: (id: string) => http.get<{ data: Site }>(`${base}/sites/${id}`).then(unwrap),
  startSite: (id: string) => http.post<{ data: Site }>(`${base}/sites/${id}/start`).then(unwrap),
  finishSite: (id: string) => http.post<{ data: Site }>(`${base}/sites/${id}/finish`).then(unwrap),

  performances: () => http.get<{ data: Performance[] }>(`${base}/performances`).then(unwrap),
  shift: () => http.get<{ data: Shift | null }>(`${base}/shift`).then(unwrap),

  os: (siteId: string) => http.get<{ data: Os }>(`${base}/os/${siteId}`).then(unwrap),
  setWeather: (siteId: string, type: WeatherType) =>
    http.put<{ data: Os }>(`${base}/os/${siteId}/weather`, { body: { type } }).then(unwrap),
  // Add a service instance to the visit under an operator (repeatable).
  addService: (siteId: string, serviceId: string, shiftId: string) =>
    http.post<{ data: Os }>(`${base}/os/${siteId}/services`, { body: { service_id: serviceId, shift_id: shiftId } }).then(unwrap),
  removeService: (siteId: string, performanceId: string) =>
    http.del<{ data: Os }>(`${base}/os/${siteId}/performances/${performanceId}`).then(unwrap),
  // Equipment/consumable on one service instance.
  addResource: (siteId: string, performanceId: string, resourceId: string, qty = 1) =>
    http.post<{ data: Os }>(`${base}/os/${siteId}/performances/${performanceId}/resources/${encodeURIComponent(resourceId)}`, { body: { qty } }).then(unwrap),
  removeResource: (siteId: string, performanceId: string, resourceId: string) =>
    http.del<{ data: Os }>(`${base}/os/${siteId}/performances/${performanceId}/resources/${encodeURIComponent(resourceId)}`).then(unwrap),
  // Uploads the photo file itself via the NATIVE uploader (expo-file-system),
  // not fetch/FormData — RN's fetch multipart drops the request on the New
  // Architecture. The file is stored untouched (EXIF kept) under its lineage
  // filename by the backend.
  attachPhoto: async (siteId: string, phase: 'before' | 'after', photo: PickedPhoto): Promise<Os> => {
    const token = await getToken();
    const res = await LegacyFS.uploadAsync(resolveUrl(`${base}/os/${siteId}/photos`), photo.uri, {
      httpMethod: 'POST',
      uploadType: LegacyFS.FileSystemUploadType.MULTIPART,
      fieldName: 'photo',
      mimeType: photo.mimeType,
      parameters: { phase },
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.status < 200 || res.status >= 300) {
      const payload = res.body ? JSON.parse(res.body) : null;
      throw new ApiError(res.status, payload?.message ?? `Upload failed (${res.status})`, payload?.errors, payload);
    }
    return (JSON.parse(res.body) as { data: Os }).data;
  },
};
