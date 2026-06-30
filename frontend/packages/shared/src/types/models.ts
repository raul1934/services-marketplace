/**
 * Entity types mirrored from the Laravel API resources
 * (app/Http/Resources/*). These match the JSON the API actually returns,
 * not the raw DB columns.
 */
import {
  AvailabilityType,
  CategoryType,
  PartAction,
  PaymentMethod,
  ProposalStatus,
  ReceptionType,
  RequestStatus,
  RequestUrgency,
  Weekday,
} from './enums';

/** A backend-defined intake question for a category's request form. */
export interface CategoryQuestionOption {
  value: string;
  label: string;
}

export interface CategoryQuestion {
  id: number;
  key: string;
  type: 'text' | 'select' | 'number';
  label: string;
  placeholder?: string | null;
  required?: boolean;
  half?: boolean;
  options?: CategoryQuestionOption[] | null;
}

/** A client's stored answer to an intake question (id, text snapshot, answer). */
export interface RequestAnswer {
  question_id: number | null;
  text: string;
  answer: string;
}

/** tokens map: one Sanctum token per role the user holds. */
export interface TokenSet {
  client?: string;
  provider?: string;
  admin?: string;
}

export type TokenAbility = keyof TokenSet;

export interface ProviderProfile {
  id: number;
  company_name: string | null;
  bio: string | null;
  vehicle_type: string | null;
  is_online: boolean;
  is_approved: boolean;
  /** Subscription plan + its per-job commission (0–1), from the backend. */
  plan?: 'free' | 'pro' | 'enterprise';
  commission_rate?: number;
  /** When the current paid plan is valid until (null/absent = no expiry). */
  plan_expires_at?: string | null;
  coverage_radius_km: number;
  insurance_valid_until: string | null;
  availability_type: string | null;
  rating_avg: number;
  rating_count: number;
  jobs_completed: number;
}

export type ProviderDocumentType = 'id' | 'proof_of_address' | 'selfie' | 'certificate';
export type ProviderDocumentStatus = 'pending' | 'uploaded' | 'approved' | 'rejected';

export interface ProviderDocument {
  id: number;
  type: ProviderDocumentType;
  status: ProviderDocumentStatus;
  url: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  is_client: boolean;
  is_provider: boolean;
  is_admin: boolean;
  avatar_url: string | null;
  provider_profile?: ProviderProfile | null;
  categories?: ServiceCategory[];
}

export interface AuthResponse {
  user: User;
  tokens: TokenSet;
}

/** Device metadata sent with auth + push registration. */
export interface DeviceData {
  device_no?: string;
  os_type?: string;
  device_name?: string;
  os_version?: string;
  app_version?: string;
  notification_token?: string;
}

export interface RegisterInput extends DeviceData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'client' | 'provider' | 'both';
}

export type SocialProvider = 'google' | 'apple' | 'facebook';
export type AuthRole = 'client' | 'provider' | 'both';

export interface OtpRequestResponse {
  message: string;
  expires_in: number;
  /** Present only outside production, to make the flow testable. */
  debug_code?: string | null;
}

/** The auth surface each app supplies to the shared AuthProvider. */
export interface AuthApi {
  login: (email: string, password: string, device?: DeviceData) => Promise<AuthResponse>;
  register: (payload: RegisterInput) => Promise<AuthResponse>;
  me: () => Promise<User>;
  logout: (deviceNo?: string) => Promise<unknown>;
  /** Phone + OTP: request a code, then verify it to sign in. */
  requestOtp: (phone: string) => Promise<OtpRequestResponse>;
  verifyOtp: (phone: string, code: string, role: AuthRole, device?: DeviceData) => Promise<AuthResponse>;
  /** Native social sign-in (Google/Apple/Facebook) — exchanges a provider token. */
  social: (provider: SocialProvider, token: string, role: AuthRole, device?: DeviceData) => Promise<AuthResponse>;
}

export interface ServiceCategory {
  id: number;
  type: CategoryType;
  /** Asset type this category's requests attach to (null = none, e.g. beauty). */
  asset_type?: 'vehicle' | 'property' | 'pet' | null;
  slug: string;
  name: string;
  icon: string | null;
  questions?: CategoryQuestion[];
  sort_order?: number;
}

export interface RequestPhoto {
  id: number;
  url: string;
}

export interface Availability {
  starts_at: string;
  ends_at: string;
}

export interface ProposalSummary {
  id: number;
  price: number;
  eta_minutes: number;
  status: ProposalStatus;
}

export interface RequestParticipant {
  id: number;
  name: string;
  phone?: string | null;
  rating_avg?: number;
}

export interface ServiceRequest {
  id: number;
  status: RequestStatus;
  description: string;
  latitude: number;
  longitude: number;
  address: string | null;
  reception_type: ReceptionType | null;
  entry_code?: string | null;
  /** Start-of-service code (C17): owner-customer only, present while accepted. */
  start_code?: string | null;
  budget_max: number | null;
  payment_method?: PaymentMethod;
  /** Derived payment receipt (C20): present once a proposal is accepted. */
  settlement?: Settlement | null;
  answers?: RequestAnswer[];
  urgency: RequestUrgency;
  category?: ServiceCategory;
  asset?: Asset | null;
  photos?: RequestPhoto[];
  before_photos?: RequestPhoto[];
  after_photos?: RequestPhoto[];
  area_avg_price?: number | null;
  parts_approval_requested?: boolean;
  parts_approved?: boolean;
  proposals_count?: number;
  accepted_proposal_id: number | null;
  accepted_provider_id: number | null;
  accepted_proposal?: Proposal | null;
  my_proposal?: ProposalSummary | null;
  client?: RequestParticipant;
  provider?: RequestParticipant;
  availabilities?: Availability[];
  job_updates?: JobUpdate[];
  job_parts?: JobPart[];
  surcharges?: Surcharge[];
  reschedule_requests?: RescheduleRequest[];
  review?: { id: number; rating: number; comment: string | null; tags?: string[]; tip_amount?: number | null } | null;
  /** The provider's review of the client (provider → client). */
  provider_review?: { id: number; rating: number; comment: string | null; tags?: string[] } | null;
  /** Present only on nearby (haversine) queries. */
  distance_km?: number;
  created_at?: string;
  accepted_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

/** What the customer paid (C20 receipt) — derived server-side from the settled job. */
export interface Settlement {
  labor: number;
  parts_total: number;
  surcharges_total: number;
  total: number;
  payment_method?: PaymentMethod | null;
  settled_at?: string | null;
  receipt_no: string;
}

/** Typed per-type asset detail (the polymorphic `detailable`). All optional —
 *  consumers read whichever keys apply to the asset's type. */
export interface AssetDetail {
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
  property_type_id?: number | null;
  kind?: string | null;
  unit?: string | null;
  address?: string | null;
  floor?: string | null;
  condo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geofence?: { latitude: number; longitude: number }[] | null;
  pet_species_id?: number | null;
  pet_breed_id?: number | null;
  species?: string | null;
  breed?: string | null;
  birthdate?: string | null;
  weight?: string | null;
  vaccines?: string | null;
  microchip?: string | null;
  size?: string | null;
}

export interface Asset {
  id: number;
  type: 'vehicle' | 'property' | 'pet';
  nickname: string;
  detail?: AssetDetail;
  photo_url?: string | null;
  archived?: boolean;
}

export type SurchargeTier = 'simple' | 'reinforced' | 'requote';
export type SurchargeStatus = 'pending' | 'approved' | 'refused';

export interface Surcharge {
  id: number;
  amount: number;
  reason: string;
  percent_accumulated: number;
  tier: SurchargeTier;
  status: SurchargeStatus;
  photos?: string[];
  provider?: { id: number; name: string };
  created_at?: string;
  resolved_at?: string | null;
}

export type RescheduleStatus = 'pending' | 'accepted' | 'declined';

export interface RescheduleRequest {
  id: number;
  requested_by_role: 'client' | 'provider';
  proposed_starts_at: string | null;
  proposed_ends_at: string | null;
  proposed_reception_type: ReceptionType | null;
  reason: string | null;
  status: RescheduleStatus;
  late: boolean;
  created_at?: string;
  resolved_at?: string | null;
}

export type DisputeStatus = 'open' | 'under_review' | 'resolved';

export interface DisputeEvidence {
  party: 'client' | 'provider';
  text: string | null;
  photos?: string[];
}

export interface Dispute {
  id: number;
  status: DisputeStatus;
  claim: string;
  resolution: string | null;
  opened_by_id: number;
  evidence?: DisputeEvidence[];
  created_at?: string;
  resolved_at?: string | null;
}

export type WarrantyType = 'redo' | 'refund';
export type WarrantyStatus = 'open' | 'accepted' | 'in_progress' | 'resolved';

export interface WarrantyClaim {
  id: number;
  type: WarrantyType;
  status: WarrantyStatus;
  description: string | null;
  deadline_at: string | null;
  created_at?: string;
  resolved_at?: string | null;
}

export interface Proposal {
  id: number;
  service_request_id: number;
  provider_id: number;
  price: number;
  eta_minutes: number;
  comment: string | null;
  deposit_required?: boolean;
  deposit_percentage?: number | null;
  deposit_amount?: number | null;
  status: ProposalStatus;
  created_at?: string;
  provider_name?: string;
  provider_rating_avg?: number;
  provider_rating_count?: number;
  provider_insured?: boolean;
}

/** A provider's pre-bid question on a request (with the client's answer). */
export interface PreBidQuestion {
  id: number;
  service_request_id: number;
  provider_id: number;
  provider_name?: string;
  /** Suggestion this was copied from, when picked from the catalogue (tracking). */
  suggestion_id?: number | null;
  question: string;
  answer: string | null;
  /** Whether the client's answer must include a photo. */
  image_required?: boolean;
  /** URLs of photos the client attached to the answer. */
  answer_photos?: string[];
  answered: boolean;
  answered_at?: string | null;
  created_at?: string;
}

/** A canned pre-bid question, localized, returned for a request's category. */
export interface PreBidSuggestion {
  id: number;
  key: string;
  text: string;
  image_required: boolean;
}

export interface JobUpdate {
  id: number;
  body: string | null;
  photo_url: string | null;
  created_at: string;
}

/** Every kind of event the request feed can surface (see RequestEventService). */
export type RequestEventType =
  | 'request_created'
  | 'proposal_received'
  | 'proposal_accepted'
  | 'job_started'
  | 'parts_approval_requested'
  | 'parts_approved'
  | 'part_added'
  | 'surcharge_proposed'
  | 'surcharge_resolved'
  | 'requote'
  | 'reschedule_requested'
  | 'reschedule_resolved'
  | 'job_update'
  | 'job_completed'
  | 'cancelled'
  | 'no_show'
  | 'expired'
  | 'disputed'
  | 'review_submitted';

/**
 * One entry in a request's chronological event feed. Derived server-side from
 * existing timestamps/relations (no event-log table). `data` is type-specific
 * (provider_name, reason, rating, part name…).
 */
export interface RequestEvent {
  id: string;
  type: RequestEventType;
  at: string;
  amount?: number | null;
  data?: Record<string, unknown> | null;
}

export interface JobPart {
  id: number;
  name: string;
  action: PartAction;
  quantity: number;
  unit_price: number | null;
}

export interface ProviderLocationLive {
  available: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number | null;
  updated_at?: string;
  distance_km?: number;
  eta_minutes_approx?: number;
}

export interface AvailabilityWindow {
  weekday: Weekday;
  start_time: string;
  end_time: string;
}

export interface AvailabilityConfig {
  availability_type: AvailabilityType | null;
  windows: AvailabilityWindow[];
}

/** Generic Laravel resource-collection envelope ({ data: [...] }). */
export interface Collection<T> {
  data: T[];
}

/**
 * Laravel resource-collection-with-paginator envelope. A paginator passed to
 * `JsonResource::collection()` emits `data` + `meta` (+ `links`, which the client
 * ignores — the next page is derived from `meta`).
 */
export interface PageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}
