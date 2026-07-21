import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ACTIVE_REQUEST_STEPS,
  RequestStatus,
  ServiceRequest,
  activeRequestStep,
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

/**
 * The tracker's stage names in step order — the exact keys the request screen's
 * TrackSteps renders, so the notification never invents its own vocabulary.
 */
const STEP_LABEL_KEYS = [
  'tracking.stepAccepted',
  'tracking.stepOnWay',
  'tracking.stepArrived',
  'tracking.stepDone',
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

      const step = activeRequestStep(active.status);

      // Name the stage the way the request screen's stepper does. Saying "Em
      // atendimento" here while that screen called the very same stage "Chegou"
      // left two names for one thing. Requote is an exception state rather than a
      // stage, so it keeps its own label.
      const statusText =
        step && active.status !== RequestStatus.Requote
          ? t(STEP_LABEL_KEYS[step - 1])
          : t(`activeRequest.body.${active.status}`, { defaultValue: t('activeRequest.tapToTrack') });

      // Secondary line (shown expanded): stage number, then the assigned pro +
      // rating + ETA. The requests list may not embed the provider participant;
      // fall back to the accepted proposal, which carries the pro's name and rating.
      const detailParts: string[] = [];
      if (step) detailParts.push(t('activeRequest.step', { step, total: ACTIVE_REQUEST_STEPS }));

      const provider = active.provider?.name ?? active.accepted_proposal?.provider_name;
      if (provider) {
        const rating = active.provider?.rating_avg ?? active.accepted_proposal?.provider_rating_avg;
        detailParts.push(rating ? `${provider} · ★ ${rating.toFixed(1)}` : provider);
      }
      const eta = active.accepted_proposal?.eta_minutes;
      if (eta != null) detailParts.push(t('tracking.arrivingIn', { eta: etaLabel(eta) }));

      // Provider phone → enables the "Ligar" action on the notification.
      const phone = active.provider?.phone ?? undefined;

      // `status` drives the progress bar (indeterminate while open, staged after).
      void upsertActiveRequestNotification({
        requestId: active.id,
        title,
        body: statusText,
        status: active.status,
        detail: detailParts.join(' · ') || undefined,
        phone,
        labels: {
          channel: t('activeRequest.channelName'),
          track: t('activeRequest.track'),
          call: t('activeRequest.call'),
        },
      });
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
