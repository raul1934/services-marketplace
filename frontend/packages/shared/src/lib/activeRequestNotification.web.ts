// Push / ongoing notifications don't exist on web — no-op stubs that mirror the
// native module's surface so callers compile and run under react-native-web.

export interface ActiveRequestNotif {
  requestId: number;
  title: string;
  body: string;
  status?: string;
  detail?: string;
}

export async function upsertActiveRequestNotification(_n: ActiveRequestNotif): Promise<void> {}

export async function clearActiveRequestNotification(): Promise<void> {}

export function addActiveRequestTapListener(_onTap: (requestId: number) => void): () => void {
  return () => {};
}
