import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Low-level HTTP client for the Chama Fácil Laravel API.
 *
 * Each app (customer / provider) configures a base URL and a token storage key
 * once at startup. The bearer token is the Sanctum token for that app's role
 * ability ('client' or 'provider'). It is persisted in the device keychain on
 * native and in localStorage on web (expo-secure-store has no web backend).
 */

const tokenStore = {
  get: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return Promise.resolve(globalThis.localStorage?.getItem(key) ?? null);
    }
    return SecureStore.getItemAsync(key);
  },
  set: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  remove: (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export interface ApiConfig {
  baseUrl: string;
  /** SecureStore key under which the bearer token is persisted. */
  tokenKey: string;
}

let config: ApiConfig | null = null;
let cachedToken: string | null | undefined; // undefined = not yet loaded

export function configureApi(cfg: ApiConfig) {
  config = cfg;
  cachedToken = undefined;
}

/**
 * Two-letter UI language sent on every request as `X-Locale`, so the backend
 * can localize validation and business-rule messages. Browsers forbid setting
 * Accept-Language from fetch, hence a custom header. Kept in sync with i18n by
 * each app calling setApiLocale() on language change.
 */
let apiLocale = 'pt';
export function setApiLocale(locale: string) {
  apiLocale = (locale || 'pt').slice(0, 2);
}

function requireConfig(): ApiConfig {
  if (!config) throw new Error('API not configured — call configureApi() at startup.');
  return config;
}

export async function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken ?? null;
  const { tokenKey } = requireConfig();
  cachedToken = (await tokenStore.get(tokenKey)) ?? null;
  return cachedToken;
}

/**
 * Notified whenever the bearer token actually changes (login, re-login after a
 * 401, logout). HTTP requests read the token per call so they never go stale,
 * but long-lived consumers — the realtime socket — capture it once at connect
 * time and need a nudge to rebuild. `null` means "signed out".
 */
type TokenListener = (token: string | null) => void;
const tokenListeners = new Set<TokenListener>();

export function onTokenChange(fn: TokenListener): () => void {
  tokenListeners.add(fn);
  return () => {
    tokenListeners.delete(fn);
  };
}

export async function setToken(token: string | null): Promise<void> {
  const { tokenKey } = requireConfig();
  const previous = cachedToken;
  cachedToken = token;
  if (token) await tokenStore.set(tokenKey, token);
  else await tokenStore.remove(tokenKey);
  // `previous` is undefined until the token is first read; treat that as "no
  // change" only when we are also clearing, so bootstrap doesn't fire a bogus
  // logout notification.
  if ((previous ?? null) !== token) {
    for (const listener of tokenListeners) listener(token);
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
    public payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** First validation message for a field, if any. */
  fieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }
}

/** Emitted when a request returns 401 so the app can sign the user out. */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null) {
  onUnauthorized = fn;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** Pass a FormData for multipart uploads (photos). */
  form?: FormData;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const { baseUrl } = requireConfig();
  const url = new URL(path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Locale': apiLocale };
  if (token) headers.Authorization = `Bearer ${token}`;

  let bodyInit: BodyInit | undefined;
  if (opts.form) {
    bodyInit = opts.form as unknown as BodyInit; // RN sets multipart boundary automatically
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyInit = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: bodyInit,
      signal: opts.signal,
    });
  } catch (e) {
    // A cancelled request (component unmounted, superseded query) — let it
    // through untouched so callers can ignore it.
    if (e instanceof Error && e.name === 'AbortError') throw e;
    // No HTTP response at all: the server is unreachable — offline, DNS, refused
    // or timed out (RN surfaces this as "Network request failed" /
    // java.net.ConnectException). Turn the raw error into a friendly, localized
    // message. status 0 marks it as a connectivity failure, not a server reply.
    throw new ApiError(0, connectionErrorMessage(), undefined, e);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const payload = text ? safeJson(text) : null;

  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.();
    const message =
      (payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : null) ?? `Request failed (${res.status})`;
    const errors =
      payload && typeof payload === 'object' && 'errors' in payload
        ? ((payload as { errors: Record<string, string[]> }).errors)
        : undefined;
    throw new ApiError(res.status, message, errors, payload);
  }

  return payload as T;
}

/** Friendly, localized message for a connection failure (no server response). */
function connectionErrorMessage(): string {
  return apiLocale === 'en'
    ? 'Could not reach the server. Check your connection and try again.'
    : 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const http = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, opts?: RequestOptions) => request<T>('POST', path, opts),
  put: <T>(path: string, opts?: RequestOptions) => request<T>('PUT', path, opts),
  patch: <T>(path: string, opts?: RequestOptions) => request<T>('PATCH', path, opts),
  del: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
};
