import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * "Chamado em andamento" — a single persistent (ongoing, non-swipeable) local
 * notification that mirrors the customer's active request. It is presented
 * locally (Android `sticky`/`isOngoing`) because push messages can't set the
 * ongoing flag: the realtime layer / a background push only trigger an upsert.
 *
 * One notification at a time, keyed by a fixed identifier, so re-presenting it
 * updates the shown notification instead of stacking. Tapping deep-links via the
 * `type: 'active_request'` data (handled by addNotificationResponseListener).
 * No-op on web.
 */

const NOTIF_ID = 'active-request';
const CHANNEL_ID = 'chamado-andamento';
let channelReady = false;

export interface ActiveRequestNotif {
  requestId: number;
  title: string;
  body: string;
}

/** Low-importance channel: persistent but silent — status updates must not buzz. */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Chamado em andamento',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    showBadge: false,
  });
  channelReady = true;
}

/** Present or update the ongoing notification for the given active request. */
export async function upsertActiveRequestNotification(n: ActiveRequestNotif): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIF_ID,
      content: {
        title: n.title,
        body: n.body,
        sticky: true, // Android isOngoing — can't be swiped away.
        autoDismiss: false, // survives a tap; we clear it on completion.
        data: { type: 'active_request', request_id: String(n.requestId) },
      },
      // ChannelAwareTriggerInput: fire immediately, routed to our low channel.
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
    });
  } catch {
    /* Notifications are additive — never break the app over one. */
  }
}

/** Remove the ongoing notification (request closed / no active request / logout). */
export async function clearActiveRequestNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.dismissNotificationAsync(NOTIF_ID);
  } catch {
    /* already gone — ignore */
  }
}
