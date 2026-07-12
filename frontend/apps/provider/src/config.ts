/**
 * Runtime config from EXPO_PUBLIC_* env vars. Defaults target PRODUCTION
 * (chamafacil.app), so debug APKs built without an env file already talk to
 * prod; for local dev copy .env.example to .env (localhost) — Expo loads it
 * over these. The provider app keeps its own token under a distinct SecureStore
 * key so both apps can be installed side-by-side.
 */
export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.chamafacil.app/api/provider/v1',
  apiHost: process.env.EXPO_PUBLIC_API_HOST ?? 'https://api.chamafacil.app',
  reverb: {
    appKey: process.env.EXPO_PUBLIC_REVERB_KEY ?? '23d159a0399c2dc78ca9e3db64048791',
    wsHost: process.env.EXPO_PUBLIC_REVERB_HOST ?? 'reverb.chamafacil.app',
    wsPort: Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 443),
    forceTLS: (process.env.EXPO_PUBLIC_REVERB_TLS ?? 'true') === 'true',
  },
  googleClientId:
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ??
    '750648294839-6fta9gctg4mh9e1eovvudri7a2c344r0.apps.googleusercontent.com',
  tokenKey: 'chamafacil.provider.token',
};
