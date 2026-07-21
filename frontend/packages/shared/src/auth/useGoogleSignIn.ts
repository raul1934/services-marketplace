import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { useAuth } from './AuthProvider';

/**
 * Google sign-in. The native SDK (@react-native-google-signin/google-signin)
 * obtains a Google access token, which the backend exchanges for the app's
 * Sanctum token via `useAuth().social('google', token)` (SocialAuthController +
 * Socialite `userFromToken`).
 *
 * Call `configureGoogleSignIn(webClientId)` once at startup (see each app's
 * init.ts). `webClientId` is the OAuth **Web** client ID; the native
 * Android/iOS client is matched automatically by the app's package id + signing
 * certificate, so it isn't passed here.
 *
 * The native module is `require`d lazily (like realtime/echo.ts) so Metro's web
 * bundle — which has no native module — doesn't break at import time.
 */
let configuredWebClientId: string | null = null;

function getGoogleSignin(): any | null {
  if (Platform.OS === 'web') return null;
  try {
    const mod = require('@react-native-google-signin/google-signin');
    return mod.GoogleSignin ?? null;
  } catch {
    return null;
  }
}

/** Wire the Google SDK to the OAuth Web client ID. Safe to call once at startup. */
export function configureGoogleSignIn(webClientId: string) {
  configuredWebClientId = webClientId || null;
  const GoogleSignin = getGoogleSignin();
  if (GoogleSignin && configuredWebClientId) {
    GoogleSignin.configure({ webClientId: configuredWebClientId });
  }
}

/**
 * Whether Google sign-in can actually run: native module present *and* a
 * webClientId configured. Screens use this to decide whether to offer the
 * button at all — without it the user is led into a dead end whose only
 * possible outcome is the `auth.googleUnavailable` error.
 */
export function isGoogleSignInAvailable(): boolean {
  return !!getGoogleSignin() && !!configuredWebClientId;
}

export function useGoogleSignIn() {
  const { social } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setError(null);
    const GoogleSignin = getGoogleSignin();
    if (!GoogleSignin || !configuredWebClientId) {
      setError(t('auth.googleUnavailable'));
      return;
    }
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      // v13+ returns { type: 'cancelled' } on user cancel instead of throwing.
      if (result?.type === 'cancelled') return;
      const { accessToken } = await GoogleSignin.getTokens();
      if (!accessToken) throw new Error(t('auth.googleUnavailable'));
      await social('google', accessToken);
    } catch (e: any) {
      // Swallow user-cancellations (varies by SDK version); surface real errors.
      const code = String(e?.code ?? '');
      if (['SIGN_IN_CANCELLED', 'CANCELED', '-5', '12501'].includes(code)) return;
      setError((e as Error)?.message ?? t('auth.googleUnavailable'));
    } finally {
      setLoading(false);
    }
  }, [t, social]);

  // `configureGoogleSignIn` runs in each app's initServices() before the first
  // render, so this is stable for the lifetime of the screen.
  return { signIn, loading, error, available: isGoogleSignInAvailable() };
}
