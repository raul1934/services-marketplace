import { useEffect, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const FOUND = require('../../../assets/sounds/plane-found.wav');
const LOST = require('../../../assets/sounds/plane-lost.wav');

/**
 * Chirps + vibrates when the surface is acquired or lost, so you can keep your eyes
 * on the thing you're measuring instead of the status text. Fires only on the
 * transition — never on every frame — and stays silent on the very first render so
 * opening the screen doesn't beep.
 */
export function usePlaneFeedback(surfaceReady: boolean): void {
  const previous = useRef<boolean | null>(null);
  const players = useRef<{ found: ReturnType<typeof createAudioPlayer>; lost: ReturnType<typeof createAudioPlayer> } | null>(null);

  useEffect(() => {
    // Play even when the ringer is on silent — this is UI feedback, not media.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    players.current = { found: createAudioPlayer(FOUND), lost: createAudioPlayer(LOST) };
    return () => {
      players.current?.found.remove();
      players.current?.lost.remove();
      players.current = null;
    };
  }, []);

  useEffect(() => {
    const prev = previous.current;
    previous.current = surfaceReady;
    if (prev === null || prev === surfaceReady) return; // first render, or no change

    const player = surfaceReady ? players.current?.found : players.current?.lost;
    try {
      player?.seekTo(0);
      player?.play();
    } catch {
      // Audio focus lost / player released — the haptic below still lands.
    }
    Haptics.impactAsync(surfaceReady ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [surfaceReady]);
}
