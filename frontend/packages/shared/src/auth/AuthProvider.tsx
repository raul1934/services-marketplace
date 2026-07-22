import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, getToken, setToken, setUnauthorizedHandler } from '../api/client';
import { disconnectRealtime } from '../realtime/echo';
import { useIsOnline } from '../lib/connectivity';
import { AuthApi, AuthResponse, DeviceData, OtpRequestResponse, RegisterInput, SocialProvider, User } from '../types';

type Role = 'client' | 'provider';
type Status = 'loading' | 'authed' | 'guest';

interface AuthValue {
  user: User | null;
  status: Status;
  login: (email: string, password: string, device?: DeviceData) => Promise<void>;
  register: (payload: Omit<RegisterInput, 'role'>) => Promise<void>;
  requestOtp: (phone: string) => Promise<OtpRequestResponse>;
  verifyOtp: (phone: string, code: string, device?: DeviceData) => Promise<void>;
  social: (provider: SocialProvider, token: string, device?: DeviceData) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Retry budget for the boot-time `me()` call, in milliseconds between tries.
 * ~3.5s total: long enough to ride out a handover or a sleeping radio, short
 * enough that a genuinely offline start still reaches a usable screen quickly.
 */
const BOOTSTRAP_BACKOFF_MS = [400, 1000, 2000];
const BOOTSTRAP_RETRIES = BOOTSTRAP_BACKOFF_MS.length;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * App-level auth. The app supplies its own `api` (no shared API layer);
 * `role` selects which Sanctum token to keep from the `tokens` map the API
 * returns — 'client' for the customer app, 'provider' for the provider app.
 */
export function AuthProvider({ role, api, children }: { role: Role; api: AuthApi; children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const bootstrap = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setStatus('guest');
      return;
    }
    // Only the server rejecting the token ends the session. This `catch` used
    // to be unconditional, so "the server is unreachable" and "your token is no
    // longer valid" were the same event: a one-minute network blip deleted the
    // token and dropped the user on the welcome screen, with nothing to
    // recover from once the connection came back. Measured on device — pulling
    // the API tunnel for about a minute logged a live session out for good.
    //
    // A connectivity failure says nothing about whether the token is valid, so
    // it must not be treated as an answer.
    for (let attempt = 0; ; attempt++) {
      try {
        const me = await api.me();
        setUser(me);
        setStatus('authed');
        return;
      } catch (e) {
        const httpStatus = e instanceof ApiError ? e.status : undefined;
        if (httpStatus === 401) {
          // The token really is dead. This is the only path that discards it.
          await setToken(null);
          setUser(null);
          setStatus('guest');
          return;
        }
        // Unreachable server (status 0) or a server-side error. Give a short
        // blip a chance to pass — but bounded, because an unbounded retry here
        // is just a splash screen that never ends.
        if (attempt < BOOTSTRAP_RETRIES) {
          await sleep(BOOTSTRAP_BACKOFF_MS[attempt]);
          continue;
        }
        // Still no answer. Show the signed-out UI, but KEEP the token: the next
        // launch with a working connection picks the session straight back up.
        setUser(null);
        setStatus('guest');
        return;
      }
    }
  }, [api]);

  // Connection came back after we gave up. `bootstrap` returns immediately when
  // there is no stored token, so this only does work for the case it exists
  // for: a session we kept but could not verify. Without it the user sits on
  // the welcome screen, already back online, until they reopen the app.
  const online = useIsOnline();
  useEffect(() => {
    if (online && status === 'guest' && !user) bootstrap();
  }, [online, status, user, bootstrap]);

  useEffect(() => {
    bootstrap();
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      setStatus('guest');
    });
    return () => setUnauthorizedHandler(null);
  }, [bootstrap]);

  const login = useCallback(
    async (email: string, password: string, device?: DeviceData) => {
      const res = await api.login(email, password, device);
      const token = res.tokens[role];
      if (!token) throw new Error(`Esta conta não tem acesso de ${role === 'client' ? 'cliente' : 'prestador'}.`);
      await setToken(token);
      setUser(res.user);
      setStatus('authed');
    },
    [api, role],
  );

  const register = useCallback(
    async (payload: Omit<RegisterInput, 'role'>) => {
      const res = await api.register({ ...payload, role });
      const token = res.tokens[role];
      if (!token) throw new Error('Falha ao criar a conta.');
      await setToken(token);
      setUser(res.user);
      setStatus('authed');
    },
    [api, role],
  );

  // Pick this app's role token off an auth response and become authed.
  const adopt = useCallback(
    async (res: AuthResponse) => {
      const token = res.tokens[role];
      if (!token) throw new Error(`Esta conta não tem acesso de ${role === 'client' ? 'cliente' : 'prestador'}.`);
      await setToken(token);
      setUser(res.user);
      setStatus('authed');
    },
    [role],
  );

  const requestOtp = useCallback((phone: string) => api.requestOtp(phone), [api]);

  const verifyOtp = useCallback(
    async (phone: string, code: string, device?: DeviceData) => {
      const res = await api.verifyOtp(phone, code, role, device);
      await adopt(res);
    },
    [api, role, adopt],
  );

  const social = useCallback(
    async (provider: SocialProvider, token: string, device?: DeviceData) => {
      const res = await api.social(provider, token, role, device);
      await adopt(res);
    },
    [api, role, adopt],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // clear locally regardless
    }
    disconnectRealtime();
    await setToken(null);
    setUser(null);
    setStatus('guest');
  }, [api]);

  const value = useMemo<AuthValue>(
    () => ({ user, status, login, register, requestOtp, verifyOtp, social, logout, refresh: bootstrap }),
    [user, status, login, register, requestOtp, verifyOtp, social, logout, bootstrap],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
