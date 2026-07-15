import * as SecureStore from 'expo-secure-store';
import { configureApi, configureRealtime } from '@chamafacil/shared';
import { config } from './config';

/**
 * Runtime environment switch (Dev ↔ Prod). The build-time EXPO_PUBLIC_* vars set
 * the initial target; the user can override it on the pre-login screen and it is
 * persisted, so a debug build can talk to local or production without rebuilding.
 *
 * On a physical device, "Dev" (localhost:19000) is reached over USB via
 * `adb reverse tcp:19000 tcp:19000` pointing at the dev backend on the machine.
 */
export type EnvName = 'dev' | 'prod';
const KEY = 'chamafacil.customer.env';

export const ENVS: Record<EnvName, { label: string; apiUrl: string; apiHost: string; reverbHost: string; reverbPort: number; reverbTLS: boolean }> = {
  dev: {
    label: 'Dev (local)',
    apiUrl: 'http://localhost:19000/api/customer/v1',
    apiHost: 'http://localhost:19000',
    reverbHost: 'localhost',
    reverbPort: 8080,
    reverbTLS: false,
  },
  prod: {
    label: 'Produção',
    apiUrl: 'https://api.chamafacil.app/api/customer/v1',
    apiHost: 'https://api.chamafacil.app',
    reverbHost: 'reverb.chamafacil.app',
    reverbPort: 443,
    reverbTLS: true,
  },
};

let current: EnvName =
  config.apiHost.includes('localhost') || config.apiHost.includes('10.0.2.2') || config.apiHost.startsWith('http://') ? 'dev' : 'prod';

export function getEnv(): EnvName {
  return current;
}

export function currentHost(): string {
  return ENVS[current].apiHost;
}

/** Re-point the shared API + realtime clients at the given environment. */
export function applyEnv(name: EnvName): void {
  const e = ENVS[name];
  configureApi({ baseUrl: e.apiUrl, tokenKey: config.tokenKey });
  configureRealtime({
    appKey: config.reverb.appKey,
    wsHost: e.reverbHost,
    wsPort: e.reverbPort,
    forceTLS: e.reverbTLS,
    authBaseUrl: e.apiHost,
  });
}

/** Load the persisted choice (or the build default) and apply it. Call at startup. */
export async function loadEnv(): Promise<EnvName> {
  try {
    const v = await SecureStore.getItemAsync(KEY);
    if (v === 'dev' || v === 'prod') current = v;
  } catch {
    // ignore — fall back to the build default
  }
  applyEnv(current);
  return current;
}

export async function setEnv(name: EnvName): Promise<void> {
  current = name;
  try {
    await SecureStore.setItemAsync(KEY, name);
  } catch {
    // non-fatal: the switch still applies for this session
  }
  applyEnv(name);
}
