/**
 * Realtime client for Laravel Reverb (Pusher protocol) using laravel-echo +
 * pusher-js. Mirrors backend app/Events: the private `request.{id}` channel
 * carries `proposal.received`, `location.updated` and `status.updated`.
 *
 * pusher-js and laravel-echo are app-level deps; we import them lazily so the
 * shared package stays usable in contexts that don't need realtime.
 */
import { Platform } from 'react-native';
import { getToken } from '../api/client';

export interface RealtimeConfig {
  /** Reverb app key (REVERB_APP_KEY). */
  appKey: string;
  /** WebSocket host (no protocol), e.g. 'api.chamafacil.local' or an IP. */
  wsHost: string;
  wsPort: number;
  /** true in production (wss/https). */
  forceTLS: boolean;
  /** Base URL of the API host that serves /broadcasting/auth. */
  authBaseUrl: string;
}

let echo: any = null;
let cfg: RealtimeConfig | null = null;

export function configureRealtime(config: RealtimeConfig) {
  cfg = config;
}

async function getEcho(): Promise<any> {
  if (echo) return echo;
  if (!cfg) throw new Error('Realtime not configured — call configureRealtime().');

  // Lazy require so Metro only bundles these when realtime is actually used.
  // Pick the platform build explicitly: the RN entry pulls in NetInfo and would
  // break on web, while the browser build lacks RN transports. pusher-js dist
  // bundles are UMD (`module.exports = Pusher`) with no `.default` — take the
  // module itself when `.default` is absent, otherwise laravel-echo receives
  // `undefined` and throws "Pusher is not defined".
  const pusherModule =
    Platform.OS === 'web' ? require('pusher-js') : require('pusher-js/react-native');
  const Pusher: any = pusherModule.default ?? pusherModule;
  const Echo = require('laravel-echo').default;

  const token = await getToken();

  echo = new Echo({
    broadcaster: 'reverb',
    Pusher,
    key: cfg.appKey,
    wsHost: cfg.wsHost,
    wsPort: cfg.wsPort,
    wssPort: cfg.wsPort,
    forceTLS: cfg.forceTLS,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${cfg.authBaseUrl.replace(/\/$/, '')}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json',
      },
    },
  });

  return echo;
}

export interface ProposalReceivedEvent {
  request_id: number;
  proposal_id: number;
}
export interface LocationUpdatedEvent {
  request_id: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
}
export interface StatusUpdatedEvent {
  request_id: number;
  status: string;
}
export interface PartsApprovalRequestedEvent {
  request_id: number;
  total: number;
}
export interface PartsApprovedEvent {
  request_id: number;
}
export interface QuestionUpdatedEvent {
  request_id: number;
  question_id: number;
  action: 'asked' | 'answered';
}
export interface SurchargeProposedEvent {
  request_id: number;
  surcharge_id: number;
  amount: number;
  tier: 'simple' | 'reinforced' | 'requote';
  percent_accumulated: number;
}
export interface SurchargeResolvedEvent {
  request_id: number;
  surcharge_id: number;
  status: 'approved' | 'refused';
}
export interface RescheduleRequestedEvent {
  request_id: number;
  reschedule_id: number;
  by_role: 'client' | 'provider';
}
export interface RescheduleResolvedEvent {
  request_id: number;
  reschedule_id: number;
  status: 'accepted' | 'declined';
}
export interface DisputeUpdatedEvent {
  request_id: number;
  dispute_id: number;
  action: 'opened' | 'defense_filed' | 'resolved';
}

export interface RequestChannelHandlers {
  onProposal?: (e: ProposalReceivedEvent) => void;
  onLocation?: (e: LocationUpdatedEvent) => void;
  onStatus?: (e: StatusUpdatedEvent) => void;
  onPartsApprovalRequested?: (e: PartsApprovalRequestedEvent) => void;
  onPartsApproved?: (e: PartsApprovedEvent) => void;
  onQuestion?: (e: QuestionUpdatedEvent) => void;
  onSurchargeProposed?: (e: SurchargeProposedEvent) => void;
  onSurchargeResolved?: (e: SurchargeResolvedEvent) => void;
  onRescheduleRequested?: (e: RescheduleRequestedEvent) => void;
  onRescheduleResolved?: (e: RescheduleResolvedEvent) => void;
  onDispute?: (e: DisputeUpdatedEvent) => void;
}

/**
 * Subscribe to a request's private channel. Returns an unsubscribe function.
 * The dotted event names mirror each backend Event's broadcastAs().
 */
export async function subscribeToRequest(
  requestId: number,
  handlers: RequestChannelHandlers,
): Promise<() => void> {
  const e = await getEcho();
  const channel = e.private(`request.${requestId}`);

  if (handlers.onProposal) channel.listen('.proposal.received', handlers.onProposal);
  if (handlers.onLocation) channel.listen('.location.updated', handlers.onLocation);
  if (handlers.onStatus) channel.listen('.status.updated', handlers.onStatus);
  if (handlers.onPartsApprovalRequested) channel.listen('.parts.approval_requested', handlers.onPartsApprovalRequested);
  if (handlers.onPartsApproved) channel.listen('.parts.approved', handlers.onPartsApproved);
  if (handlers.onQuestion) channel.listen('.question.updated', handlers.onQuestion);
  if (handlers.onSurchargeProposed) channel.listen('.surcharge.proposed', handlers.onSurchargeProposed);
  if (handlers.onSurchargeResolved) channel.listen('.surcharge.resolved', handlers.onSurchargeResolved);
  if (handlers.onRescheduleRequested) channel.listen('.reschedule.requested', handlers.onRescheduleRequested);
  if (handlers.onRescheduleResolved) channel.listen('.reschedule.resolved', handlers.onRescheduleResolved);
  if (handlers.onDispute) channel.listen('.dispute.updated', handlers.onDispute);

  return () => {
    e.leave(`request.${requestId}`);
  };
}

/** A Laravel broadcast notification on the user's private channel. */
export interface AppNotificationEvent {
  type: string;
  title: string;
  body: string;
  request_id?: string;
  proposal_id?: string;
  question_id?: string;
  surcharge_id?: string;
  reschedule_id?: string;
  dispute_id?: string;
  warranty_id?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * Subscribe to the user's private notification channel. Fires for every app
 * notification broadcast over WebSocket (status changes, proposals, Q&A…).
 * Returns an unsubscribe function.
 */
export async function subscribeToUser(
  userId: number,
  onNotification: (n: AppNotificationEvent) => void,
): Promise<() => void> {
  const e = await getEcho();
  const name = `App.Models.User.${userId}`;
  e.private(name).notification((n: AppNotificationEvent) => onNotification(n));

  return () => {
    e.leave(name);
  };
}

/** Tear down the whole connection (e.g. on logout). */
export function disconnectRealtime() {
  if (echo) {
    echo.disconnect();
    echo = null;
  }
}
