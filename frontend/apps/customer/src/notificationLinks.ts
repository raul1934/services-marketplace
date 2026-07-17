import { IconName } from '@chamafacil/shared';
import { AppNotification } from './api';

/**
 * Where each kind of notification takes you, and which icon it wears.
 *
 * The server knows 29 kinds and will learn more; this map is deliberately
 * **additive**, not exhaustive. An unknown kind is not a bug — it's an older app
 * meeting a newer server. It still lists, still reads, just doesn't navigate.
 */
interface Link {
  icon: IconName;
  /** Builds the route from the notification's payload, or null if it can't. */
  route?: (p: Record<string, string>) => string | null;
}

const request = (p: Record<string, string>) => (p.request_id ? `/request/${p.request_id}` : null);
const proposals = (p: Record<string, string>) => (p.request_id ? `/request/${p.request_id}/proposals` : null);

const LINKS: Record<string, Link> = {
  // Proposals — the client's decision lives on the proposals screen.
  new_proposal: { icon: 'list', route: proposals },
  proposal_accepted: { icon: 'check', route: request },
  proposal_declined: { icon: 'close', route: request },
  proposal_not_accepted: { icon: 'close', route: request },
  counter_offer_received: { icon: 'cash', route: proposals },
  counter_offer_declined: { icon: 'close', route: request },

  // Request lifecycle.
  status_changed: { icon: 'chevronsR', route: request },
  request_expired: { icon: 'clock', route: request },
  requote_required: { icon: 'chevronsR', route: (p) => (p.request_id ? `/request/${p.request_id}/requote` : null) },
  reschedule_requested: { icon: 'calendar', route: (p) => (p.request_id ? `/request/${p.request_id}/reschedule` : null) },
  reschedule_resolved: { icon: 'calendar', route: request },
  payment_settled: { icon: 'cash', route: (p) => (p.request_id ? `/request/${p.request_id}/receipt` : null) },

  // Money asks.
  surcharge_proposed: { icon: 'cash', route: (p) => (p.request_id ? `/request/${p.request_id}/surcharge` : null) },
  surcharge_resolved: { icon: 'cash', route: request },
  parts_approval_requested: { icon: 'wrench', route: request },
  parts_approved: { icon: 'check', route: request },

  // Questions.
  question_asked: { icon: 'chat', route: request },
  question_answered: { icon: 'chat', route: request },

  // Disputes & warranty.
  dispute_opened: { icon: 'shield', route: (p) => (p.request_id ? `/request/${p.request_id}/dispute` : null) },
  dispute_defense_filed: { icon: 'shield', route: (p) => (p.request_id ? `/request/${p.request_id}/dispute` : null) },
  dispute_resolved: { icon: 'shield', route: request },
  warranty_opened: { icon: 'shieldCheck', route: (p) => (p.request_id ? `/request/${p.request_id}/warranty` : null) },
  warranty_status: { icon: 'shieldCheck', route: (p) => (p.request_id ? `/request/${p.request_id}/warranty` : null) },

  // No-shows and ratings.
  customer_no_show: { icon: 'clock', route: (p) => (p.request_id ? `/request/${p.request_id}/no-show` : null) },
  provider_no_show: { icon: 'clock', route: (p) => (p.request_id ? `/request/${p.request_id}/no-show` : null) },
  you_were_rated: { icon: 'star', route: request },
};

/** Fallback icon for a kind this app version doesn't know. */
const DEFAULT_ICON: IconName = 'bell';

export function notificationIcon(n: AppNotification): IconName {
  return (n.type && LINKS[n.type]?.icon) || DEFAULT_ICON;
}

/** The route to open, or null when there's nowhere sensible to go. */
export function notificationRoute(n: AppNotification): string | null {
  if (!n.type) return null;
  return LINKS[n.type]?.route?.(n.payload ?? {}) ?? null;
}
