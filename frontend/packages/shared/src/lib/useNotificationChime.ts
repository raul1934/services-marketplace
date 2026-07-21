import { useCallback, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const CHIME = require('../../assets/notification.wav');

/**
 * A short chime + haptic for live service updates.
 *
 * The tracking screen already refreshes itself over the websocket, but silently
 * — a bid landing or the provider marking a part looked identical to nothing
 * happening if you weren't staring at it. This is the "something moved" cue.
 *
 * Two deliberate choices:
 *
 * - `playsInSilentMode: false`, unlike the AR feedback chirps. Those are the
 *   point of the screen you're on; this fires while you may be in a meeting,
 *   so a silenced phone must stay silent. The haptic still lands.
 * - Rate-limited, app-wide. A burst of updates (five bids arriving over a
 *   minute, a provider logging parts) would otherwise turn into a rattle.
 */
const MIN_GAP_MS = 4000;

/**
 * Module scope, not a ref: the gap is a property of the user's ears, not of a
 * hook instance. The same event can reach two mounted listeners at once (a
 * screen chiming alongside the root layout, or the old tree still mounted mid
 * navigation), and per-instance refs let each of them claim its own quiet
 * window — so the "rate-limited" chime fired twice, back to back.
 */
let lastPlayedAt = 0;

export function useNotificationChime(): () => void {
  const player = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});

    try {
      player.current = createAudioPlayer(CHIME);
    } catch {
      // No audio device / codec — the haptic below is still worth firing.
    }

    return () => {
      player.current?.remove();
      player.current = null;
    };
  }, []);

  return useCallback(() => {
    const now = Date.now();
    if (now - lastPlayedAt < MIN_GAP_MS) return;
    lastPlayedAt = now;

    try {
      player.current?.seekTo(0);
      player.current?.play();
    } catch {
      // Audio focus lost (a call, another app) — not worth surfacing.
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);
}
