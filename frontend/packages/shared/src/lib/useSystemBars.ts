import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../theme';

/**
 * Keeps Android's navigation bar in step with the app's light/dark theme.
 *
 * Without this the gesture pill / back-home-recents icons keep the colour the
 * OS picked at launch, so switching the app to dark left black icons on a dark
 * bar (and the reverse in light) — invisible either way.
 *
 * Only the button style is set, not the background. From Android 15 the system
 * enforces edge-to-edge and ignores a navigation-bar colour, so setting one is
 * a no-op there and merely diverges from the icons on older versions. With a
 * transparent bar the app's own background shows through, which already tracks
 * the theme.
 *
 * REQUIRES A NATIVE REBUILD. expo-navigation-bar ships a native module, so a
 * dev client or APK built before it was added simply doesn't have it — this
 * then no-ops rather than crashing (it threw an uncaught error on first
 * attempt, which is what the probe below exists to prevent).
 */

/** `undefined` = not probed yet, `null` = unavailable in this binary. */
let navBar: { setButtonStyleAsync?: (style: 'light' | 'dark') => Promise<void> } | null | undefined;

function loadNavigationBar() {
  if (navBar !== undefined) return navBar;

  try {
    // requireOptionalNativeModule returns null instead of throwing when the
    // native side is missing. Checking it first is what makes an older binary
    // degrade quietly — requiring the JS wrapper directly throws on import.
    const core = require('expo-modules-core');
    const native = core?.requireOptionalNativeModule?.('ExpoNavigationBar');

    navBar = native ? require('expo-navigation-bar') : null;
  } catch {
    navBar = null;
  }

  return navBar;
}

export function useSystemBars(): void {
  const t = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const mod = loadNavigationBar();
    if (typeof mod?.setButtonStyleAsync !== 'function') return;

    // Dark theme → light (white) icons, and vice versa.
    mod.setButtonStyleAsync(t.dark ? 'light' : 'dark').catch(() => {
      // Cosmetic — never let bar styling take the app down.
    });
  }, [t.dark]);
}
