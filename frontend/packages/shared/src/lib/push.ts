import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

/**
 * Expo push registration. The backend's ExpoChannel delivers to the
 * `ExponentPushToken[...]` we register here. Native only — web has no push.
 */

const DEVICE_KEY = 'chamafacil_device_no';

export interface PushDevice {
  device_no: string;
  notification_token: string;
  os_type?: string;
  os_version?: string;
  device_name?: string;
}

/**
 * Route a notification tap (background/quit) to a screen. `onTap` receives the
 * data payload — switch on `data.type` (e.g. 'surcharge_proposed', 'dispute_opened')
 * and navigate. Also replays the notification that cold-started the app. Returns
 * an unsubscribe function. Native only — web has no push.
 */
export function addNotificationResponseListener(
  onTap: (data: Record<string, unknown>) => void,
): () => void {
  if (Platform.OS === 'web') return () => {};

  // Cold start: the app was opened by tapping a notification.
  Notifications.getLastNotificationResponseAsync().then((resp) => {
    const data = resp?.notification.request.content.data;
    if (data) onTap(data as Record<string, unknown>);
  });

  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    onTap(resp.notification.request.content.data as Record<string, unknown>);
  });
  return () => sub.remove();
}

/**
 * Show banners/sounds while the app is foregrounded.
 *
 * `shouldSetBadge: false` is deliberate — see NOTIF-05. A launcher badge was
 * evaluated and rejected, because nothing here can keep it honest:
 *
 * 1. **Nobody can raise it while the app is away.** This handler only runs in the
 *    foreground, and the backend (ExpoChannel) sends no `badge` field, so a
 *    visible push never carries a count. Android doesn't wake the background task
 *    for alert messages either (only the silent tracker sync gets through), so a
 *    badge could only ever change while the app is already open.
 * 2. **Nobody would lower it.** The only unread counter is the server's
 *    `notifications/unread-count`, and it drops solely when someone taps a
 *    notification row or "marcar todas". Opening the app — the one moment a badge
 *    is supposed to clear — marks nothing read. The badge would go up and stay up.
 * 3. **The counter it would mirror is known-bad.** NOTIF-02: one request with five
 *    proposals produces ~10 separate notifications, so the in-app bell already sits
 *    at a perpetual 99+. Promoting that number to the launcher amplifies a bug
 *    instead of surfacing information.
 * 4. **The tracker would leak into it.** The "chamado em andamento" ongoing
 *    notification is not an unread item, but the launcher dot counts posted
 *    notifications per channel, so any live job would pin a permanent mark on the
 *    icon.
 *
 * Worth revisiting only once notifications are grouped (NOTIF-02) and unread state
 * is authoritative — at which point the badge should be pushed by the server as a
 * count on the payload and cleared on app foreground, not inferred here.
 */
export function setupNotificationHandler(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const idStore = {
  get: (): Promise<string | null> =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.getItem(DEVICE_KEY) ?? null)
      : SecureStore.getItemAsync(DEVICE_KEY),
  set: (v: string): Promise<void> => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(DEVICE_KEY, v);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(DEVICE_KEY, v);
  },
};

async function deviceNo(): Promise<string> {
  let id = await idStore.get();
  if (!id) {
    id = `${Platform.OS}-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    await idStore.set(id);
  }
  return id;
}

/**
 * Ask for permission, get the Expo push token, and persist a stable device id.
 * Returns the device payload to send to the backend, or null when unavailable
 * (web, denied permission, simulator without a projectId).
 */
export async function getPushDevice(): Promise<PushDevice | null> {
  if (Platform.OS === 'web') return null;
  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    if (!token) return null;

    return {
      device_no: await deviceNo(),
      notification_token: token,
      os_type: Platform.OS,
      os_version: String(Platform.Version),
      device_name: Constants.deviceName ?? undefined,
    };
  } catch {
    // No projectId / no network / unsupported — push is purely additive.
    return null;
  }
}

/** The persisted device id, for unregistering on logout. */
export async function currentDeviceNo(): Promise<string | null> {
  return idStore.get();
}
