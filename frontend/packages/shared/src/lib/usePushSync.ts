import { useEffect, useRef } from 'react';
import { currentDeviceNo, getPushDevice, setupNotificationHandler } from './push';

interface PushApi {
  register: (deviceNo: string, token: string, extra?: Record<string, unknown>) => Promise<unknown>;
  unregister: (deviceNo: string) => Promise<unknown>;
}

/**
 * Registers this device's Expo push token with the backend once the user is
 * authenticated, and unregisters it on sign-out. No-ops on web / when a token
 * can't be obtained.
 */
export function usePushSync(authed: boolean, api: PushApi): void {
  const registered = useRef(false);

  useEffect(() => {
    setupNotificationHandler();
  }, []);

  useEffect(() => {
    if (authed) {
      if (registered.current) return;
      registered.current = true;
      (async () => {
        const dev = await getPushDevice();
        if (!dev) return;
        try {
          await api.register(dev.device_no, dev.notification_token, {
            os_type: dev.os_type,
            os_version: dev.os_version,
            device_name: dev.device_name,
          });
        } catch {
          /* push is additive — ignore failures */
        }
      })();
      return;
    }

    // Signed out — best-effort token cleanup.
    if (registered.current) {
      registered.current = false;
      (async () => {
        const no = await currentDeviceNo();
        if (no) {
          try {
            await api.unregister(no);
          } catch {
            /* ignore */
          }
        }
      })();
    }
  }, [authed, api]);
}
