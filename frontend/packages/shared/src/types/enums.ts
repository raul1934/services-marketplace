/**
 * Enums mirrored 1:1 from the Laravel backend (app/Enums). Implemented as
 * runtime const objects (+ a matching type of the same name) so the apps
 * compare against `RequestStatus.Open` instead of the bare string 'open'.
 * Values MUST equal the PHP enum backing values.
 */

export const CategoryType = {
  Roadside: 'roadside',
  Residential: 'residential',
  Condo: 'condo',
  Beauty: 'beauty',
  Pet: 'pet',
} as const;
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

/** Display/grouping order for category types. */
export const CATEGORY_TYPE_ORDER: CategoryType[] = [
  CategoryType.Roadside,
  CategoryType.Residential,
  CategoryType.Condo,
  CategoryType.Beauty,
  CategoryType.Pet,
];

export const RequestStatus = {
  Open: 'open',
  Accepted: 'accepted',
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
  Expired: 'expired',
  // Paused on a mandatory re-quote (surcharge >50% or scope change).
  Requote: 'requote',
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const ACTIVE_STATUSES: RequestStatus[] = [RequestStatus.Accepted, RequestStatus.InProgress];
export const CLOSED_STATUSES: RequestStatus[] = [
  RequestStatus.Completed,
  RequestStatus.Cancelled,
  RequestStatus.Expired,
];

/** Provider assigned and the job is live (tracking available). */
export const isActiveStatus = (s: RequestStatus): boolean => ACTIVE_STATUSES.includes(s);
/** Terminal status, no further action. */
export const isClosedStatus = (s: RequestStatus): boolean => CLOSED_STATUSES.includes(s);

export const ProposalStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Withdrawn: 'withdrawn',
} as const;
export type ProposalStatus = (typeof ProposalStatus)[keyof typeof ProposalStatus];

export const RequestUrgency = {
  Urgent: 'urgent', // needs help right now
  Scheduled: 'scheduled', // within given time windows
} as const;
export type RequestUrgency = (typeof RequestUrgency)[keyof typeof RequestUrgency];

export const ReceptionType = {
  AdultKey: 'adult_key', // an adult with a key receives the provider
  EntryCode: 'entry_code', // provider enters with a code
} as const;
export type ReceptionType = (typeof ReceptionType)[keyof typeof ReceptionType];

export const PaymentMethod = {
  Pix: 'pix',
  Card: 'card',
  Cash: 'cash',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHODS: PaymentMethod[] = [PaymentMethod.Pix, PaymentMethod.Card, PaymentMethod.Cash];

export const PartAction = {
  Replaced: 'replaced',
  Adjusted: 'adjusted',
  Added: 'added',
  Cleaned: 'cleaned',
} as const;
export type PartAction = (typeof PartAction)[keyof typeof PartAction];

export const PART_ACTIONS: PartAction[] = [
  PartAction.Replaced,
  PartAction.Adjusted,
  PartAction.Added,
  PartAction.Cleaned,
];

export const AvailabilityType = {
  Always: 'always', // 24h every day
  Scheduled: 'scheduled', // specific weekly windows
} as const;
export type AvailabilityType = (typeof AvailabilityType)[keyof typeof AvailabilityType];

export const Weekday = {
  Monday: 'mon',
  Tuesday: 'tue',
  Wednesday: 'wed',
  Thursday: 'thu',
  Friday: 'fri',
  Saturday: 'sat',
  Sunday: 'sun',
} as const;
export type Weekday = (typeof Weekday)[keyof typeof Weekday];

export const WEEKDAYS: Weekday[] = [
  Weekday.Monday,
  Weekday.Tuesday,
  Weekday.Wednesday,
  Weekday.Thursday,
  Weekday.Friday,
  Weekday.Saturday,
  Weekday.Sunday,
];

export const DevicePlatform = {
  Ios: 'ios',
  Android: 'android',
} as const;
export type DevicePlatform = (typeof DevicePlatform)[keyof typeof DevicePlatform];
