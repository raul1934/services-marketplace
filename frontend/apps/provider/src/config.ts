/**
 * Runtime config from EXPO_PUBLIC_* env vars. Defaults target the local docker
 * stack served via Caddy. The provider app keeps its own token under a distinct
 * SecureStore key so both apps can be installed side-by-side.
 */
export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:19000/api/provider/v1',
  apiHost: process.env.EXPO_PUBLIC_API_HOST ?? 'http://localhost:19000',
  reverb: {
    appKey: process.env.EXPO_PUBLIC_REVERB_KEY ?? 'walvee',
    wsHost: process.env.EXPO_PUBLIC_REVERB_HOST ?? 'localhost',
    wsPort: Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 19080),
    forceTLS: (process.env.EXPO_PUBLIC_REVERB_TLS ?? 'false') === 'true',
  },
  tokenKey: 'walvee.provider.token',
};
