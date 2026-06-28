/**
 * Provider app API surface. Self-contained (no shared endpoint definitions) —
 * uses only the shared HTTP transport.
 */
import {
  AuthResponse,
  AuthRole,
  AvailabilityConfig,
  AvailabilityType,
  AvailabilityWindow,
  Collection,
  DeviceData,
  JobPart,
  JobUpdate,
  OtpRequestResponse,
  Paginated,
  PartAction,
  PreBidQuestion,
  PreBidSuggestion,
  Proposal,
  ProviderDocument,
  ProviderDocumentType,
  ProviderProfile,
  RegisterInput,
  RequestStatus,
  ServiceCategory,
  ServiceRequest,
  SocialProvider,
  User,
  http,
  unwrapPage,
} from '@walvee/shared';

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

export const pushApi = {
  register: (device_no: string, notification_token: string, extra?: DeviceData) =>
    http.post<{ ok: boolean }>('push/token', { body: { device_no, notification_token, ...extra } }),
  unregister: (device_no: string) => http.del<{ ok: boolean }>('push/token', { body: { device_no } }),
};

export const jobReportApi = {
  updates: (requestId: number) => http.get<Collection<JobUpdate>>(`requests/${requestId}/updates`).then(unwrapList),
  parts: (requestId: number) => http.get<Collection<JobPart>>(`requests/${requestId}/parts`).then(unwrapList),
};

export interface SubmitProposalPayload {
  price: number;
  eta_minutes: number;
  comment?: string;
  deposit_required?: boolean;
  deposit_percentage?: number;
}

export interface WalletTxn {
  id: number;
  type: 'credit' | 'payout';
  amount: number;
  description: string | null;
  created_at: string;
}
export interface Wallet {
  balance: number;
  month_earnings: number;
  month_jobs: number;
  month_fee: number;
}

export interface DashboardStats {
  earnings_today: number;
  earnings_week: number;
  jobs_today: number;
  jobs_completed: number;
  rating_avg: number;
  rating_count: number;
  is_online: boolean;
}

export const providerApi = {
  updateProfile: (payload: { name?: string; phone?: string; company_name?: string; bio?: string; vehicle_type?: string; coverage_radius_km?: number; insured?: boolean; avatar_media_id?: number }) =>
    http.put<{ user: User }>('provider/profile', { body: payload }).then((r) => r.user),

  getDocuments: () => http.get<{ documents: ProviderDocument[] }>('provider/documents').then((r) => r.documents),
  uploadDocument: (type: ProviderDocumentType, form: FormData) => {
    form.append('type', type);
    return http.post<ProviderDocument>('provider/documents', { form });
  },

  rateClient: (requestId: number, payload: { rating: number; comment?: string; tags?: string[]; preferred?: boolean }) =>
    http.post<{ id: number; rating: number; comment: string | null; tags: string[] }>(`requests/${requestId}/client-review`, { body: payload }),

  // Upload-first: attach already-uploaded photo media ids as before/after photos.
  attachJobMedia: (requestId: number, payload: { phase: 'before' | 'after'; media_ids: number[] }) =>
    http.post<{ data: ServiceRequest }>(`requests/${requestId}/job-media`, { body: payload }).then(unwrap),

  setOnline: (isOnline: boolean, loc?: { latitude: number; longitude: number; accuracy?: number }) =>
    http.put<ProviderProfile>('provider/online', { body: { is_online: isOnline, ...loc } }),
  updateLocation: (latitude: number, longitude: number, accuracy?: number) =>
    http.put<{ ok: boolean }>('provider/location', { body: { latitude, longitude, accuracy } }),
  setCategories: (categoryIds: number[]) =>
    http.put<{ categories: ServiceCategory[] }>('provider/categories', { body: { category_ids: categoryIds } }).then((r) => r.categories),
  getAvailability: () => http.get<AvailabilityConfig>('provider/availability'),
  setAvailability: (availabilityType: AvailabilityType, windows: AvailabilityWindow[]) =>
    http.put<AvailabilityConfig>('provider/availability', { body: { availability_type: availabilityType, windows } }),

  dashboard: () => http.get<DashboardStats>('provider/dashboard'),
  wallet: () => http.get<Wallet>('provider/wallet'),
  walletTransactions: (page = 1) =>
    http.get<Paginated<WalletTxn>>('provider/wallet/transactions', { query: { page } }).then(unwrapPage),
  payout: (amount?: number, pixKey?: string) =>
    http.post<{ message: string; balance: number }>('provider/wallet/payout', { body: { amount, pix_key: pixKey } }),
  requestApproval: (requestId: number) =>
    http.post<{ data: ServiceRequest }>(`requests/${requestId}/request-approval`).then(unwrap),

  nearby: (radiusKm = 30, page = 1) =>
    http.get<Paginated<ServiceRequest>>('provider/requests/nearby', { query: { radius_km: radiusKm, page } }).then(unwrapPage),
  scheduled: (radiusKm = 30, page = 1) =>
    http.get<Paginated<ServiceRequest>>('provider/requests/scheduled', { query: { radius_km: radiusKm, page } }).then(unwrapPage),
  getJob: (id: number) => http.get<{ data: ServiceRequest }>(`provider/requests/${id}`).then(unwrap),
  myJobs: (page = 1, status?: 'active') => http.get<Paginated<ServiceRequest>>('provider/jobs', { query: { page, status } }).then(unwrapPage),
  myBids: (page = 1) => http.get<Paginated<ServiceRequest>>('provider/bids', { query: { page } }).then(unwrapPage),
  submitProposal: (requestId: number, payload: SubmitProposalPayload) =>
    http.post<{ data: Proposal }>(`requests/${requestId}/proposals`, { body: payload }).then(unwrap),
  questions: (requestId: number) =>
    http.get<Collection<PreBidQuestion>>(`requests/${requestId}/questions`).then(unwrapList),
  questionSuggestions: (requestId: number) =>
    http.get<Collection<PreBidSuggestion>>(`requests/${requestId}/question-suggestions`).then(unwrapList),
  // Either a free-typed `question` or a `suggestion_id` (whose text the backend copies).
  askQuestion: (requestId: number, payload: { question?: string; suggestion_id?: number }) =>
    http.post<{ data: PreBidQuestion }>(`requests/${requestId}/questions`, { body: payload }).then(unwrap),
  removeQuestion: (questionId: number) => http.del<void>(`questions/${questionId}`),
  updateStatus: (requestId: number, status: RequestStatus) =>
    http.put<{ data: ServiceRequest }>(`requests/${requestId}/status`, { body: { status } }).then(unwrap),
  startJob: (requestId: number, code: string) =>
    http.post<{ data: ServiceRequest }>(`requests/${requestId}/start`, { body: { code } }).then(unwrap),
  addUpdate: (requestId: number, body: string, photoForm?: FormData) => {
    if (photoForm) {
      photoForm.append('body', body);
      return http.post<{ data: JobUpdate }>(`requests/${requestId}/updates`, { form: photoForm }).then(unwrap);
    }
    return http.post<{ data: JobUpdate }>(`requests/${requestId}/updates`, { body: { body } }).then(unwrap);
  },
  addPart: (requestId: number, part: { name: string; action: PartAction; quantity?: number; unit_price?: number }) =>
    http.post<{ data: JobPart }>(`requests/${requestId}/parts`, { body: part }).then(unwrap),
  deletePart: (partId: number) => http.del<{ ok: boolean }>(`parts/${partId}`),
  // Odometer reading recorded during the service (e.g. an oil change) — flows to
  // the customer's asset history.
  recordOdometer: (requestId: number, payload: { mileage: number; note?: string }) =>
    http.post<{ data: { id: number; mileage: number }; current_mileage: number | null }>(`requests/${requestId}/odometer`, { body: payload }),

  // Surcharge (acréscimo) — provider composes it on the active job. Photo required.
  proposeSurcharge: (requestId: number, form: FormData) =>
    http.post<unknown>(`requests/${requestId}/surcharges`, { form }),

  // Reschedule (R-AGENDA).
  requestReschedule: (requestId: number, payload: ReschedulePayload) =>
    http.post<unknown>(`requests/${requestId}/reschedule`, { body: payload }),
  acceptReschedule: (rescheduleId: number) => http.post<unknown>(`reschedules/${rescheduleId}/accept`),
  declineReschedule: (rescheduleId: number) => http.post<unknown>(`reschedules/${rescheduleId}/decline`),

  // Dispute defense (R5).
  getDispute: (requestId: number) => http.get<unknown>(`requests/${requestId}/dispute`),
  fileDisputeDefense: (disputeId: number, form: FormData) =>
    http.post<unknown>(`disputes/${disputeId}/defense`, { form }),
};

export interface ReschedulePayload {
  proposed_starts_at?: string;
  proposed_ends_at?: string;
  proposed_reception_type?: string;
  reason?: string;
}
