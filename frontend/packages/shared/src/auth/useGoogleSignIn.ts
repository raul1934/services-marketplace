import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthProvider';

/**
 * Google sign-in hook. The backend side is complete: once a native Google
 * `idToken` is obtained, `useAuth().social('google', idToken)` exchanges it for
 * the app's Sanctum token (see SocialAuthController + Socialite).
 *
 * Finishing the client side needs `expo-auth-session` + Google OAuth client IDs
 * (web/iOS/Android) in EXPO_PUBLIC_GOOGLE_CLIENT_ID*. Until those are provided,
 * the button surfaces a clear "not configured yet" message instead of failing
 * silently. Wiring point is marked with TODO below.
 */
export function useGoogleSignIn() {
  const { social } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setError(null);
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (!webClientId) {
      setError(t('auth.googleUnavailable'));
      return;
    }
    try {
      setLoading(true);
      // TODO: const idToken = await promptGoogleAuthSession(); await social('google', idToken);
      void social;
      setError(t('auth.googleUnavailable'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [t, social]);

  return { signIn, loading, error };
}
