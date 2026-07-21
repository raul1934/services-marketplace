import { Platform } from 'react-native';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';

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
}

// Notifee requires a background-event handler to be set; taps are re-delivered
// on next launch via getInitialNotification, so this can be a no-op.
notifee.onBackgroundEvent(async () => {});

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return;
  await notifee.createChannel({
    id: CHANNEL,
    name: 'Chamado em andamento',
    importance: AndroidImportance.LOW, // persistent but silent — updates must not buzz.
  });
  channelReady = true;
}

/** iFood-style progress: indeterminate while searching, then advancing by stage. */
function progressFor(status?: string): { max?: number; current?: number; indeterminate?: boolean } | undefined {
  switch (status) {
    case 'open':
      return { indeterminate: true }; // procurando prestadores (loading)
    case 'accepted':
      return { max: 3, current: 1 };
    case 'in_progress':
    case 'requote':
      return { max: 3, current: 2 };
    default:
      return undefined;
  }
}

/** Present or update the ongoing tracker for the given active request. */
export async function upsertActiveRequestNotification(n: ActiveRequestNotif): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ensureChannel();
    const bigText = n.detail ? `${n.body}\n${n.detail}` : n.body;
    await notifee.displayNotification({
      id: NOTIF_ID,
      title: n.title,
      body: n.body,
      data: { type: 'active_request', request_id: String(n.requestId) },
      android: {
        channelId: CHANNEL,
        smallIcon: 'notification_icon',
        color: '#d9481f',
        ongoing: true, // isOngoing — persistent tracker
        autoCancel: false,
        onlyAlertOnce: true, // updates don't re-alert
        showTimestamp: true,
        pressAction: { id: 'default', launchActivity: 'default' },
        progress: progressFor(n.status),
        style: { type: AndroidStyle.BIGTEXT, text: bigText },
      },
    });
  } catch {
    /* additive — never break the app over a notification */
  }
}

/** Remove the ongoing tracker (request closed / no active request / logout). */
export async function clearActiveRequestNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
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
    if (type === EventType.PRESS) {
      const rid = detail.notification?.data?.request_id;
      if (rid) onTap(Number(rid));
    }
  });
}
