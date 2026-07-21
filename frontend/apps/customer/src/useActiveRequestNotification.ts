import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  RequestStatus,
  ServiceRequest,
  clearActiveRequestNotification,
  etaLabel,
  flattenPages,
  upsertActiveRequestNotification,
} from '@chamafacil/shared';
import { useMyRequests } from './queries';

/** Statuses that warrant a persistent "chamado em andamento" notification. */
const TRACKABLE: RequestStatus[] = [
  RequestStatus.Open, // aguardando propostas
  RequestStatus.Accepted, // prestador a caminho
  RequestStatus.InProgress, // em atendimento
  RequestStatus.Requote, // recotação pendente
];

/** Most relevant active request: an assigned job outranks an open one, then most recent. */
function pickActive(list: ServiceRequest[]): ServiceRequest | null {
  const active = list.filter((r) => TRACKABLE.includes(r.status));
  if (!active.length) return null;
  const assignedFirst = (r: ServiceRequest) =>
    r.status === RequestStatus.Accepted || r.status === RequestStatus.InProgress ? 0 : 1;
  const recency = (r: ServiceRequest) => (r.created_at ? new Date(r.created_at).getTime() : 0);
  return [...active].sort((a, b) => assignedFirst(a) - assignedFirst(b) || recency(b) - recency(a))[0];
}

/**
 * Keeps a single ongoing notification in sync with the customer's most relevant
 * active request. Reacts to the requests query (which the realtime layer
 * invalidates on every status change) and re-checks when the app returns to the
 * foreground. Mount once, at the app root, while authenticated.
 *
 * Note: on Android 14+ a plain ongoing notification can be swiped away by the
 * user (only a foreground-service notification is truly persistent). We mitigate
 * by re-presenting it on foreground, so it reappears when the app is reopened.
 */
export function useActiveRequestNotification(enabled: boolean): void {
  const { t: tr } = useTranslation();
  const requests = useMyRequests();
  const lastKey = useRef<string | null>(null);

  // Latest data/translator behind refs so the reconcile callback stays stable.
  const dataRef = useRef(requests.data);
  dataRef.current = requests.data;
  const trRef = useRef(tr);
  trRef.current = tr;

  const reconcile = useCallback(
    (force = false) => {
      if (!enabled) return;
      const active = pickActive(flattenPages(dataRef.current?.pages));

      if (!active) {
        if (lastKey.current !== null) {
          lastKey.current = null;
          void clearActiveRequestNotification();
        }
        return;
      }

      // Skip when nothing changed — unless forced (e.g. it may have been swiped away).
      const key = `${active.id}:${active.status}`;
      if (!force && key === lastKey.current) return;
      lastKey.current = key;

      const t = trRef.current;
      const title = active.category
        ? t(`categories.${active.category.slug}`, { defaultValue: active.category.name })
        : t('activeRequest.fallbackTitle');

      // Multi-line body → Android BigText (a larger notification when expanded):
      // status, then the assigned pro + rating + ETA, then the tap hint.
      const lines = [t(`activeRequest.body.${active.status}`, { defaultValue: t('activeRequest.tapToTrack') })];
      // The requests list may not embed the provider participant; fall back to
      // the accepted proposal, which carries the pro's name and rating.
      const provider = active.provider?.name ?? active.accepted_proposal?.provider_name;
      if (provider) {
        const rating = active.provider?.rating_avg ?? active.accepted_proposal?.provider_rating_avg;
        lines.push(rating ? `${provider} · ★ ${rating.toFixed(1)}` : provider);
      }
      const eta = active.accepted_proposal?.eta_minutes;
      if (eta != null) lines.push(t('tracking.arrivingIn', { eta: etaLabel(eta) }));
      lines.push(t('activeRequest.tapToTrack'));

      void upsertActiveRequestNotification({ requestId: active.id, title, body: lines.join('\n') });
    },
    [enabled],
  );

  // React to status changes (the realtime layer invalidates this query).
  useEffect(() => {
    reconcile();
  }, [reconcile, requests.data]);

  // Reconcile + re-present when the app is reopened/foregrounded.
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        void requests.refetch();
        reconcile(true);
      }
    });
    return () => sub.remove();
  }, [enabled, reconcile, requests]);

  // Clear on logout / disable.
  useEffect(() => {
    if (!enabled && lastKey.current !== null) {
      lastKey.current = null;
      void clearActiveRequestNotification();
    }
  }, [enabled]);
}
