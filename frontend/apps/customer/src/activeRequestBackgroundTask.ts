import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import i18n from 'i18next';
import { clearActiveRequestNotification, upsertActiveRequestNotification } from '@chamafacil/shared';

/**
 * Background notification task — keeps the persistent "chamado em andamento"
 * notification in sync even when the app is backgrounded or killed. Status-change
 * pushes (see backend RequestStatusChanged) carry `active_action`/`active_title`/
 * `active_body`; this task upserts or clears the ongoing notification from that
 * data, off the UI thread.
 *
 * `defineTask` MUST run at module import, before Android delivers a push to a
 * headless (killed-app) launch — which is why this file is imported from
 * index.js and not from a screen or layout: nothing under app/ is evaluated in
 * a headless start, so the task would be registered natively but never defined
 * in JS, and the push would wake the app to do nothing.
 */

const TASK = 'active-request-push';

/** The remote payload arrives under a few shapes across platforms/SDK versions. */
function extractData(data: unknown): Record<string, unknown> {
  const d = data as any;
  if (!d || typeof d !== 'object') return {};
  const envelope = (d.notification?.request?.content?.data ?? d.notification?.data ?? d.data ?? d) as
    | Record<string, unknown>
    | undefined;

  // On Android an Expo data message doesn't hand over the fields directly: the
  // envelope carries Expo's own keys (scopeKey, experienceId, projectId) and the
  // real payload as a JSON *string* under `dataString` (mirrored in `body`).
  // Reading the envelope as-is silently yields no `type`, and the task no-ops.
  const nested = envelope?.dataString ?? envelope?.body;
  if (typeof nested === 'string') {
    try {
      return JSON.parse(nested) as Record<string, unknown>;
    } catch {
      /* not JSON after all — fall back to the envelope */
    }
  }

  return envelope ?? {};
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
      status: d.active_status ? String(d.active_status) : undefined,
      // Reachable here because index.js imports i18n before this module — a
      // headless start never evaluates the layout that used to load it.
      labels: {
        channel: i18n.t('activeRequest.channelName'),
        track: i18n.t('activeRequest.track'),
        call: i18n.t('activeRequest.call'),
      },
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
