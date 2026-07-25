/**
 * Runtime API environment switch (dev ↔ prod), toggled from the login screen and
 * persisted. Lets a developer point the app at the local backend or production
 * without rebuilding. "dev" uses the build's config (localhost via .env); "prod"
 * uses the fixed production endpoints. Only surfaced in __DEV__ builds.
 */
import * as SecureStore from 'expo-secure-store';
import { configureApi, configureRealtime } from '@chamafacil/shared';
import { config } from './config';

export type ApiEnv = 'dev' | 'prod';
const KEY = 'chamafacil.provider.apiEnv';

/** Fixed production endpoints. Reverb key is public (client-side), as in config.ts. */
const PROD = {
  apiUrl: 'https://api.chamafacil.app/api/provider/v1',
  apiHost: 'https://api.chamafacil.app',
  reverb: { appKey: '23d159a0399c2dc78ca9e3db64048791', wsHost: 'reverb.chamafacil.app', wsPort: 443, forceTLS: true },
};

const envConfig = (env: ApiEnv) =>
  env === 'prod'
    ? PROD
    : {
        apiUrl: config.apiUrl,
        apiHost: config.apiHost,
        reverb: { appKey: config.reverb.appKey, wsHost: config.reverb.wsHost, wsPort: config.reverb.wsPort, forceTLS: config.reverb.forceTLS },
      };

/** Point the API client and realtime at the given environment. */
export function applyApiEnv(env: ApiEnv) {
  const e = envConfig(env);
  configureApi({ baseUrl: e.apiUrl, tokenKey: config.tokenKey });
  configureRealtime({ appKey: e.reverb.appKey, wsHost: e.reverb.wsHost, wsPort: e.reverb.wsPort, forceTLS: e.reverb.forceTLS, authBaseUrl: e.apiHost });
}

export async function loadApiEnv(): Promise<ApiEnv> {
  try {
    return (await SecureStore.getItemAsync(KEY)) === 'prod' ? 'prod' : 'dev';
  } catch {
    return 'dev';
  }
}

export async function setApiEnv(env: ApiEnv) {
  applyApiEnv(env);
  try {
    await SecureStore.setItemAsync(KEY, env);
  } catch {
    /* best-effort persistence */
  }
}
