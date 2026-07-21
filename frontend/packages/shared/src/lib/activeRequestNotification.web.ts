// Push / ongoing notifications don't exist on web — no-op stubs that mirror the
// native module's surface so callers compile and run under react-native-web.

export interface NotifLabels {
  channel: string;
  track: string;
  call: string;
}

export interface ActiveRequestNotif {
  requestId: number;
  title: string;
  body: string;
  status?: string;
  detail?: string;
  phone?: string;
  labels: NotifLabels;
}

export const ACTIVE_REQUEST_STEPS = 4;

export function activeRequestStep(_status?: string): number | null {
  return null;
}

export async function upsertActiveRequestNotification(_n: ActiveRequestNotif): Promise<void> {}

export async function clearActiveRequestNotification(): Promise<void> {}

export function registerActiveRequestNotificationHandler(): void {}

export function addActiveRequestTapListener(_onTap: (requestId: number) => void): () => void {
  return () => {};
}
