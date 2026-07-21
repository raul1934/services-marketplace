import { Linking, Platform } from 'react-native';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * The persistent "chamado em andamento" notification — an iFood-style live
 * tracker rendered with Notifee (expo-notifications can't do progress bars):
 * a brand-coloured ongoing notification with a progress bar that is
 * indeterminate while searching for a pro and advances by stage afterwards.
 * One notification, keyed by a fixed id, so re-displaying it updates in place.
 * Driven by the realtime layer while the app is alive (see useActiveRequest-
 * Notification) and by a background push task when it is killed.
 */

const CHANNEL = 'chamado-andamento';
const NOTIF_ID = 'active-request';
let channelReady = false;

export interface ActiveRequestNotif {
  requestId: number;
  title: string;
  body: string;
  /** open | accepted | in_progress | requote — drives the progress bar. */
  status?: string;
  /** Optional secondary line (provider · ETA) shown when expanded. */
  detail?: string;
  /** Provider phone — adds a "Ligar" action when present. */
  phone?: string;
}

/**
 * How many times a swipe is undone before the tracker takes the hint. Persistent
 * shouldn't mean undismissible: someone who swipes it away three times in a row
 * means it. The count resets on the next real change (see `stageOf`), so the
 * tracker comes back when there's genuinely something new to say.
 */
const MAX_REDISPLAYS = 3;

/** What is on screen right now, so a user swipe can be undone. Null when cleared. */
let current: ActiveRequestNotif | null = null;
let dismissals = 0;

// ...and mirrored to disk, because a dismissal can wake the app from a dead
// process, where the in-memory copy is gone. SecureStore is what the rest of the
// app persists preferences with, and it encrypts — this payload holds the pro's phone.
const STORE_KEY = 'active_request_notif';

/** Identity of "the same news", for deciding whether to forgive past dismissals. */
function stageOf(n: ActiveRequestNotif | null): string {
  return n ? `${n.requestId}:${n.status ?? ''}` : '';
}

async function remember(n: ActiveRequestNotif | null): Promise<void> {
  current = n;
  try {
    if (n) await SecureStore.setItemAsync(STORE_KEY, JSON.stringify({ n, dismissals }));
    else await SecureStore.deleteItemAsync(STORE_KEY);
  } catch {
    /* non-fatal — the in-memory copy still covers the live app */
  }
}

async function lastShown(): Promise<ActiveRequestNotif | null> {
  if (current) return current;
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { n: ActiveRequestNotif; dismissals?: number };
    dismissals = saved.dismissals ?? 0;
    return saved.n;
  } catch {
    return null;
  }
}

/**
 * Android 14 dropped the guarantee that `ongoing` notifications can't be swiped
 * away — and a foreground service wouldn't help, since its notification is
 * dismissible too from API 34 on. So the tracker earns its persistence: while the
 * job is still running, a dismissal puts it straight back, up to MAX_REDISPLAYS.
 * Cancelling it from the app (clearActiveRequestNotification) doesn't emit
 * DISMISSED, so completing or cancelling a request still removes it for good.
 */
async function onNotificationEvent({ type }: { type: EventType }): Promise<void> {
  if (type !== EventType.DISMISSED) return;
  const n = await lastShown();
  if (!n) return;

  dismissals += 1;
  if (dismissals > MAX_REDISPLAYS) {
    await remember(n); // keep the payload — the next status change re-presents it
    return;
  }
  await upsertActiveRequestNotification(n);
}

/**
 * Wire up Notifee's background events. **Call this from the app's entry point
 * (index.js), never from a component or provider**: a dismissal starts the app
 * headless, with no UI, so a handler reached only through a screen does not exist
 * yet when the event fires — Notifee then logs "No task registered for key
 * app.notifee.notification-event" and drops it.
 */
export function registerActiveRequestNotificationHandler(): void {
  if (Platform.OS === 'web') return;
  notifee.onBackgroundEvent(onNotificationEvent);
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return;
  await notifee.createChannel({
    id: CHANNEL,
    name: 'Chamado em andamento',
    importance: AndroidImportance.LOW, // persistent but silent — updates must not buzz.
  });
  channelReady = true;
}

/** Stage count of the in-app tracker: Aceito → A caminho → Chegou → Concluído. */
export const ACTIVE_REQUEST_STEPS = 4;

/**
 * 1-based position in that same tracker (see TrackSteps on the request screen),
 * so the notification and the app never disagree about how far along a job is.
 * Null while the request is still open — no pro assigned, so no stage yet.
 */
export function activeRequestStep(status?: string): number | null {
  switch (status) {
    case 'accepted':
      return 2; // "A caminho"
    case 'in_progress':
    case 'requote':
      return 3; // "Chegou"
    case 'completed':
      return 4;
    default:
      return null;
  }
}

/** iFood-style progress: indeterminate while searching, then one notch per stage. */
function progressFor(status?: string): { max?: number; current?: number; indeterminate?: boolean } | undefined {
  const step = activeRequestStep(status);
  if (step) return { max: ACTIVE_REQUEST_STEPS, current: step };
  return status === 'open' ? { indeterminate: true } : undefined; // procurando prestadores
}

/** Present or update the ongoing tracker for the given active request. */
export async function upsertActiveRequestNotification(n: ActiveRequestNotif): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ensureChannel();

    // A genuinely new stage is new information, so it isn't held against the
    // user's earlier swipes — the dismissal budget starts over. (This also
    // hydrates the count from disk when the process is cold.)
    const previous = await lastShown();
    if (stageOf(previous) !== stageOf(n)) dismissals = 0;
    // Collapsed is what people actually see, and it only renders title + progress
    // bar — so the status goes in the title, and the body carries the pro + ETA.
    const heading = `${n.title} · ${n.body}`;
    const actions = [{ title: 'Acompanhar', pressAction: { id: 'default', launchActivity: 'default' } }];
    if (n.phone) actions.push({ title: 'Ligar', pressAction: { id: 'call', launchActivity: 'default' } });

    await notifee.displayNotification({
      id: NOTIF_ID,
      title: heading,
      body: n.detail,
      data: { type: 'active_request', request_id: String(n.requestId), phone: n.phone ?? '' },
      android: {
        channelId: CHANNEL,
        smallIcon: 'notification_icon',
        // The brand mark on the right. Must be a real bitmap: `ic_launcher` is an
        // adaptive icon (XML) on API 26+ and silently fails to decode.
        largeIcon: 'ic_launcher_foreground',
        // Tints the small icon and app name. The progress bar itself follows the
        // system accent on some OEM skins (One UI renders it blue) — not overridable.
        color: '#d9481f',
        ongoing: true, // isOngoing — persistent tracker
        autoCancel: false,
        onlyAlertOnce: true, // updates don't re-alert
        showTimestamp: true,
        pressAction: { id: 'default', launchActivity: 'default' },
        actions,
        progress: progressFor(n.status),
        // Expanded: let a long "pro · rating · ETA" line wrap instead of ellipsing.
        style: n.detail ? { type: AndroidStyle.BIGTEXT, text: n.detail } : undefined,
      },
    });
    await remember(n);
  } catch {
    /* additive — never break the app over a notification */
  }
}

/** Remove the ongoing tracker (request closed / no active request / logout). */
export async function clearActiveRequestNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  await remember(null); // before cancelling, so a racing DISMISSED can't resurrect it
  try {
    await notifee.cancelNotification(NOTIF_ID);
  } catch {
    /* already gone */
  }
}

/**
 * Deep-link taps on the tracker (Notifee has its own event system, separate from
 * expo-notifications). Handles foreground taps and the cold-start tap that opened
 * the app. Returns an unsubscribe function.
 */
export function addActiveRequestTapListener(onTap: (requestId: number) => void): () => void {
  if (Platform.OS === 'web') return () => {};
  void notifee.getInitialNotification().then((initial) => {
    const rid = initial?.notification?.data?.request_id;
    if (rid) onTap(Number(rid));
  });
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.DISMISSED) {
      void onNotificationEvent({ type }); // re-present: the job is still running
      return;
    }
    if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) return;
    const data = detail.notification?.data;
    // "Ligar" action → open the dialer with the provider's number.
    if (detail.pressAction?.id === 'call' && data?.phone) {
      void Linking.openURL(`tel:${data.phone}`);
      return;
    }
    // Body tap or "Acompanhar" → open the request.
    const rid = data?.request_id;
    if (rid) onTap(Number(rid));
  });
}
