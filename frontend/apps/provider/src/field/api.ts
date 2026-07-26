/**
 * Field-service API client. Talks to the Laravel backend under
 * /api/provider/v1/provider/field/* (auth: provider). The backend derives every
 * execution state (route/site running, stop now/next/done, service done) from
 * the open shift — the app just renders what it returns. Replaces the old mock
 * in data.ts; the shapes below mirror the JSON the controllers emit.
 */
import { http } from '@chamafacil/shared';
import { appendPhoto, PickedPhoto } from '../photos';

export type Charge = 'visit' | 'hour';
export type RunStatus = 'idle' | 'running' | 'done';
export type StopStatus = 'now' | 'next' | 'done';
export type Geo = { lat: number; lng: number };
export type Nest = { icon: string; label: string; sub: string; value: string; tone?: 'charge' | 'free' };

export type Service = { id: string; name: string; who: string; whoName: string; rate: Charge; done: boolean; obrig: boolean; nest: Nest[] };

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
export type OsPhoto = { url: string; at: string; mediaId: number | null };
export type Os = {
  site: { id: string; name: string; contract: string; address: string; geo: Geo | null };
  visit: { id: string; status: string } | null;
  photos: { before: OsPhoto | null; after: OsPhoto | null };
  durations: { siteMinutes: number | null; shiftMinutes: number | null };
  presence: string[];
  services: Service[];
  catalog: CatalogItem[];
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
  toggleService: (siteId: string, serviceId: string, done: boolean) =>
    http.put<{ data: Os }>(`${base}/os/${siteId}/services/${encodeURIComponent(serviceId)}`, { body: { done } }).then(unwrap),
  addCatalog: (siteId: string, catalogId: string) =>
    http.post<{ data: Os }>(`${base}/os/${siteId}/catalog/${encodeURIComponent(catalogId)}`).then(unwrap),
  // Uploads the photo file itself (multipart) so the backend can store it
  // untouched (EXIF kept) under its lineage filename.
  attachPhoto: async (siteId: string, phase: 'before' | 'after', photo: PickedPhoto) => {
    const form = new FormData();
    form.append('phase', phase);
    await appendPhoto(form, 'photo', photo);
    return http.post<{ data: Os }>(`${base}/os/${siteId}/photos`, { form }).then(unwrap);
  },
};
