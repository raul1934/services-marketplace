import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { clearActiveRequestNotification, upsertActiveRequestNotification } from '@chamafacil/shared';

/**
 * Background notification task — keeps the persistent "chamado em andamento"
 * notification in sync even when the app is backgrounded or killed. Status-change
 * pushes (see backend RequestStatusChanged) carry `active_action`/`active_title`/
 * `active_body`; this task upserts or clears the ongoing notification from that
 * data, off the UI thread. `defineTask` MUST run at module import so the task is
 * registered before Android delivers a push to a headless (killed-app) launch —
 * this file is imported from the app entry (_layout).
 */

const TASK = 'active-request-push';

/** The remote payload arrives under a few shapes across platforms/SDK versions. */
function extractData(data: unknown): Record<string, unknown> {
  const d = data as any;
  if (!d || typeof d !== 'object') return {};
  return (d.notification?.request?.content?.data ?? d.notification?.data ?? d.data ?? d) as Record<string, unknown>;
}

TaskManager.defineTask(TASK, async ({ data, error }: { data: unknown; error: unknown }) => {
  if (error) return;
  const d = extractData(data);
  if (d.type !== 'status_changed' && d.type !== 'active_request') return;

  if (d.active_action === 'clear') {
    await clearActiveRequestNotification();
    return;
  }
  if (d.request_id && d.active_title) {
    await upsertActiveRequestNotification({
      requestId: Number(d.request_id),
      title: String(d.active_title),
      body: String(d.active_body ?? ''),
    });
  }
});

/** Activate the background task. Persists natively, so calling once is enough. No-op on web. */
export async function registerActiveRequestBackgroundTask(): Promise<void> {
  try {
    await Notifications.registerTaskAsync(TASK);
  } catch {
    /* additive — ignore */
  }
}
