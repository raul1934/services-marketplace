/**
 * Customer app API surface. Self-contained (no shared endpoint definitions) —
 * uses only the shared HTTP transport. Base URL is configured per app, so
 * paths here are relative.
 */
import {
  AuthResponse,
  AuthRole,
  Collection,
  DeviceData,
  JobPart,
  JobUpdate,
  OtpRequestResponse,
  Paginated,
  PreBidQuestion,
  Proposal,
  ProviderLocationLive,
  RegisterInput,
  RequestEvent,
  ServiceCategory,
  ServiceRequest,
  SocialProvider,
  User,
  http,
  unwrapPage,
} from '@chamafacil/shared';

const unwrap = <T>(r: { data: T }): T => r.data;
const unwrapList = <T>(r: Collection<T>): T[] => r.data;

export const authApi = {
  login: (email: string, password: string, device?: DeviceData) =>
    http.post<AuthResponse>('auth/login', { body: { email, password, ...device } }),
  register: (payload: RegisterInput) => http.post<AuthResponse>('auth/register', { body: payload }),
  me: () => http.get<{ user: User }>('auth/me').then((r) => r.user),
  logout: (device_no?: string) => http.post<{ message: string }>('auth/logout', { body: { device_no } }),
  requestOtp: (phone: string) => http.post<OtpRequestResponse>('auth/phone/request-code', { body: { phone } }),
  verifyOtp: (phone: string, code: string, role: AuthRole, device?: DeviceData) =>
    http.post<AuthResponse>('auth/phone/verify-code', { body: { phone, code, role, ...device } }),
  social: (provider: SocialProvider, token: string, role: AuthRole, device?: DeviceData) =>
    http.post<AuthResponse>('auth/social', { body: { provider, token, role, ...device } }),
};

export const categoriesApi = {
  list: (type?: string) => http.get<Collection<ServiceCategory>>('categories', { query: { type } }).then(unwrapList),
};

export type AssetType = 'vehicle' | 'property' | 'pet';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** Typed per-type detail (the polymorphic `detailable`). All fields optional —
 *  the screens read whichever keys apply to the asset's type. */
export interface AssetDetail {
  // vehicle
  vehicle_make_id?: number | null;
  vehicle_model_id?: number | null;
  make?: string | null;
  model?: string | null;
  make_logo_url?: string | null;
  plate?: string | null;
  color?: string | null;
  year?: string | null;
  current_mileage?: number | null;
  fuel?: string | null;
  chassis?: string | null;
  // property
  property_type_id?: number | null;
  kind?: string | null;
  unit?: string | null;
  address?: string | null;
  floor?: string | null;
  condo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geofence?: GeoPoint[] | null;
  // pet
  pet_species_id?: number | null;
  pet_breed_id?: number | null;
  species?: string | null;
  breed?: string | null;
  birthdate?: string | null;
  weight?: string | null;
  vaccines?: string | null;
  microchip?: string | null;
  // shared
  size?: string | null;
}

export interface Asset {
  id: number;
  type: AssetType;
  nickname: string;
  photo_url: string | null;
  archived: boolean;
  created_at?: string;
  detail?: AssetDetail;
  /** Owner-only; the API returns these only to the asset's owner. */
  private_note?: string | null;
  provider_note?: string | null;
}

/** Values written by the form into `detail` (ids for make/model, strings/ints,
 *  plus the property geofence polygon). */
export type AssetDetailInput = Record<string, string | number | null | undefined | GeoPoint[]>;

export interface CreateAssetPayload {
  type: AssetType;
  nickname: string;
  detail?: AssetDetailInput;
  /** Media id from a prior upload (upload-first); sets the asset photo. */
  photo_media_id?: number;
  /** Owner-only note (never shown to providers). */
  private_note?: string;
  /** Note the owner may share with a provider per-request. */
  provider_note?: string;
}

export interface AssetReading {
  id: number;
  mileage: number;
  recorded_at: string;
  note: string | null;
  source: 'customer' | 'provider';
  service_request_id: number | null;
}

export interface AddReadingPayload {
  mileage: number;
  recorded_at?: string;
  service_request_id?: number;
  note?: string;
}

/** A named part of a property (room/area) with its optional AR measurement. */
export interface AssetPart {
  id: number;
  name: string;
  area: number | null; // m²
  perimeter: number | null; // m
  points_count: number | null;
  measured_at: string | null;
}

export interface PartMeasurement {
  area: number;
  perimeter: number;
  points_count: number;
}

export interface VehicleMake {
  id: number;
  name: string;
  logo_url: string | null;
  models: { id: number; name: string }[];
}

/** A part this kind of property usually has — a suggestion, never a constraint. */
export interface PartTypeSuggestion {
  id: number;
  name: string;
  slug: string;
  /** Pre-tick it for this type (an edícula's pool). Still just an empty slot. */
  default_selected: boolean;
}

export interface PropertyType {
  id: number;
  name: string;
  /** Nested like VehicleMake.models: the whole catalog arrives in one request. */
  part_types?: PartTypeSuggestion[];
}

export interface PetSpecies {
  id: number;
  name: string;
  breeds: { id: number; name: string }[];
}

export const assetsApi = {
  list: (type?: string, page = 1) => http.get<Paginated<Asset>>('assets', { query: { type, page } }).then(unwrapPage),
  get: (id: number) => http.get<{ data: Asset }>(`assets/${id}`).then(unwrap),
  create: (payload: CreateAssetPayload) => http.post<{ data: Asset }>('assets', { body: payload }).then(unwrap),
  update: (id: number, payload: { nickname?: string; detail?: AssetDetailInput; photo_media_id?: number }) =>
    http.put<{ data: Asset }>(`assets/${id}`, { body: payload }).then(unwrap),
  archive: (id: number) => http.del<{ ok: boolean }>(`assets/${id}`),
  history: (id: number, page = 1) =>
    http.get<Paginated<ServiceRequest>>(`assets/${id}/history`, { query: { page } }).then(unwrapPage),
  readings: (id: number, page = 1) =>
    http.get<Paginated<AssetReading>>(`assets/${id}/readings`, { query: { page } }).then(unwrapPage),
  addReading: (id: number, payload: AddReadingPayload) =>
    http.post<{ data: AssetReading; current_mileage: number | null }>(`assets/${id}/readings`, { body: payload }),
  parts: (id: number) => http.get<{ data: AssetPart[] }>(`assets/${id}/parts`).then(unwrap),
  addPart: (id: number, name: string) => http.post<{ data: AssetPart }>(`assets/${id}/parts`, { body: { name } }).then(unwrap),
  /** Batch sibling of addPart: one transaction, so a retry can't duplicate. */
  addParts: (id: number, names: string[]) =>
    http.post<{ data: AssetPart[] }>(`assets/${id}/parts`, { body: { names } }).then(unwrap),
  updatePart: (id: number, partId: number, payload: { name?: string } & Partial<PartMeasurement>) =>
    http.put<{ data: AssetPart }>(`assets/${id}/parts/${partId}`, { body: payload }).then(unwrap),
  removePart: (id: number, partId: number) => http.del<{ ok: boolean }>(`assets/${id}/parts/${partId}`),
};

export const vehicleCatalogApi = {
  makes: () => http.get<Collection<VehicleMake>>('vehicle-makes').then(unwrapList),
};

export const propertyTypesApi = {
  list: () => http.get<Collection<PropertyType>>('property-types').then(unwrapList),
};

export const petSpeciesApi = {
  list: () => http.get<Collection<PetSpecies>>('pet-species').then(unwrapList),
};

export const pushApi = {
  register: (device_no: string, notification_token: string, extra?: DeviceData) =>
    http.post<{ ok: boolean }>('push/token', { body: { device_no, notification_token, ...extra } }),
  unregister: (device_no: string) => http.del<{ ok: boolean }>('push/token', { body: { device_no } }),
};

export const jobReportApi = {
  updates: (requestId: number) => http.get<Collection<JobUpdate>>(`requests/${requestId}/updates`).then(unwrapList),
  parts: (requestId: number) => http.get<Collection<JobPart>>(`requests/${requestId}/parts`).then(unwrapList),
  approvePart: (jobPartId: number) => http.post<{ data: JobPart }>(`parts/${jobPartId}/approve`, {}).then(unwrap),
};

export type ProposalSort = 'price' | 'eta' | 'rating';

/**
 * Status buckets `GET /requests` filters by (`?status=`). The server owns the
 * bucket → statuses mapping, so the app only ever sends the bucket name.
 */
export type RequestStatusFilter = 'open' | 'active' | 'completed' | 'cancelled';

export interface CreateRequestPayload {
  service_category_id: number;
  asset_id?: number;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  reception_type?: string;
  entry_code?: string;
  budget_max?: number;
  payment_method?: string;
  answers?: { question_id: number; answer: string }[];
  urgency?: 'normal' | 'urgent' | 'scheduled';
  max_wait_minutes?: number;
  availabilities?: { starts_at: string; ends_at: string }[];
  /** Ids of media uploaded during the wizard (upload-first), attached on create. */
  media_ids?: number[];
  /** Let the provider see the asset's provider note for this request. */
  share_asset_note?: boolean;
}

export const customerApi = {
  myRequests: (page = 1, status?: RequestStatusFilter) =>
    http.get<Paginated<ServiceRequest>>('requests', { query: { page, status } }).then(unwrapPage),
  createRequest: (payload: CreateRequestPayload) => http.post<{ data: ServiceRequest }>('requests', { body: payload }).then(unwrap),
  getRequest: (id: number) => http.get<{ data: ServiceRequest }>(`requests/${id}`).then(unwrap),
  events: (id: number) => http.get<Collection<RequestEvent>>(`requests/${id}/events`).then(unwrapList),
  cancelRequest: (id: number, reason?: string) => http.post<{ data: ServiceRequest }>(`requests/${id}/cancel`, { body: { reason } }).then(unwrap),
  approveParts: (id: number) => http.post<{ data: ServiceRequest }>(`requests/${id}/approve-parts`).then(unwrap),
  proposals: (id: number, sort: ProposalSort = 'price', page = 1) =>
    http.get<Paginated<Proposal>>(`requests/${id}/proposals`, { query: { sort, page } }).then(unwrapPage),
  acceptProposal: (proposalId: number) => http.post<{ data: ServiceRequest }>(`proposals/${proposalId}/accept`).then(unwrap),
  declineProposal: (proposalId: number) => http.post<{ ok: boolean }>(`proposals/${proposalId}/decline`, {}),
  counterProposal: (proposalId: number, payload: { price: number; message?: string }) =>
    http.post<{ id: number; price: number }>(`proposals/${proposalId}/counter`, { body: payload }),
  providerLocation: (id: number) => http.get<ProviderLocationLive>(`requests/${id}/provider-location`),
  submitReview: (id: number, payload: { rating: number; comment?: string; tags?: string[]; tip_amount?: number }) =>
    http.post<{ id: number; rating: number; comment: string | null; tags: string[]; tip_amount: number | null }>(`requests/${id}/review`, { body: payload }),
  questions: (id: number) => http.get<Collection<PreBidQuestion>>(`requests/${id}/questions`).then(unwrapList),
  // Answer a question, optionally with uploaded photo media ids (upload-first).
  answerQuestion: (questionId: number, answer: string, mediaIds?: number[]) =>
    http.post<PreBidQuestion>(`questions/${questionId}/answer`, { body: { answer, media_ids: mediaIds } }),

  // Surcharge (acréscimo) — client approves/refuses.
  approveSurcharge: (surchargeId: number) => http.post<{ data: unknown }>(`surcharges/${surchargeId}/approve`),
  refuseSurcharge: (surchargeId: number) => http.post<{ data: unknown }>(`surcharges/${surchargeId}/refuse`),

  // Re-cotação (C40) — accept the present provider's new quote, or reopen.
  acceptRequote: (id: number) => http.post<{ data: ServiceRequest }>(`requests/${id}/requote/accept`).then(unwrap),
  reopenRequote: (id: number, description?: string) =>
    http.post<{ data: ServiceRequest }>(`requests/${id}/requote/reopen`, { body: { description } }).then(unwrap),

  // Reschedule (R-AGENDA).
  requestReschedule: (id: number, payload: ReschedulePayload) =>
    http.post<unknown>(`requests/${id}/reschedule`, { body: payload }),
  acceptReschedule: (rescheduleId: number) => http.post<unknown>(`reschedules/${rescheduleId}/accept`),
  declineReschedule: (rescheduleId: number) => http.post<unknown>(`reschedules/${rescheduleId}/decline`),

  // No-show (C35) — reopen at no cost.
  reportNoShow: (id: number, reason?: string) =>
    http.post<{ data: ServiceRequest }>(`requests/${id}/no-show`, { body: { reason } }).then(unwrap),

  // Dispute (C37/C38).
  openDispute: (id: number, form: FormData) => http.post<unknown>(`requests/${id}/disputes`, { form }),
  getDispute: (id: number) => http.get<unknown>(`requests/${id}/dispute`),

  // Warranty / garantia (C41/C42).
  openWarranty: (id: number, payload: { type: 'redo' | 'refund'; description?: string; media_ids?: number[] }) =>
    http.post<unknown>(`requests/${id}/warranty`, { body: payload }),
  warrantyClaims: (id: number) => http.get<Collection<unknown>>(`requests/${id}/warranty`).then(unwrapList),
};

export interface ReschedulePayload {
  proposed_starts_at?: string;
  proposed_ends_at?: string;
  proposed_reception_type?: string;
  reason?: string;
}

/**
 * One row of the bell. `type` is the app-facing kind (e.g. "new_proposal") the
 * deep-link map switches on — not a PHP class name; `payload` carries whatever
 * ids that kind needs. Both can be null/empty for a notification the server
 * knows about and this app version doesn't.
 */
export interface AppNotification {
  id: string;
  type: string | null;
  title: string | null;
  body: string | null;
  payload: Record<string, string>;
  read_at: string | null;
  created_at: string | null;
}

export const notificationsApi = {
  list: (page = 1) => http.get<Paginated<AppNotification>>('notifications', { query: { page } }).then(unwrapPage),
  unreadCount: () => http.get<{ count: number }>('notifications/unread-count'),
  markRead: (id: string) => http.post<{ ok: boolean }>(`notifications/${id}/read`),
  markAllRead: () => http.post<{ ok: boolean }>('notifications/read-all'),
};
