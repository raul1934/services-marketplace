import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Whether the device currently has a usable internet connection.
 *
 * The app had no notion of this at all: offline looked exactly like a slow
 * server, so every failure told the same story ("could not reach the server")
 * whether the phone was in a tunnel or the backend was down. On a roadside app
 * that distinction is the whole message — one of them the user can act on.
 *
 * `isInternetReachable` is deliberately preferred over `isConnected`: Android
 * reports a captive-portal wifi or a connected-but-dead cell link as connected.
 * It starts as `null` (not yet determined), and treating unknown as offline
 * would flash the banner on every cold start, so unknown counts as online.
 */
export function useIsOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isInternetReachable ?? state.isConnected ?? true);
    });
    // The listener only fires on change, so ask once for the current value.
    NetInfo.fetch().then((state) => setOnline(state.isInternetReachable ?? state.isConnected ?? true));
    return unsubscribe;
  }, []);

  return online;
}
