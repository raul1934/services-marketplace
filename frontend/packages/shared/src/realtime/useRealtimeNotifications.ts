import { useEffect, useRef } from 'react';
import { AppNotificationEvent, subscribeToUser } from './echo';

/**
 * Subscribes to the user's private notification channel while signed in, and
 * invokes `onNotification` for each app notification pushed over WebSocket.
 * Apps typically use this to invalidate React Query caches (live UI refresh)
 * and/or surface a toast.
 */
export function useRealtimeNotifications(
  userId: number | null | undefined,
  onNotification: (n: AppNotificationEvent) => void,
): void {
  const handler = useRef(onNotification);
  handler.current = onNotification;

  useEffect(() => {
    if (!userId) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;

    subscribeToUser(userId, (n) => handler.current(n))
      .then((unsub) => {
        if (cancelled) unsub();
        else dispose = unsub;
      })
      .catch(() => {
        /* realtime is additive — push + polling still deliver */
      });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [userId]);
}
