import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getToken, setToken, setUnauthorizedHandler } from '../api/client';
import { disconnectRealtime } from '../realtime/echo';
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
    try {
      const me = await api.me();
      setUser(me);
      setStatus('authed');
    } catch {
      await setToken(null);
      setStatus('guest');
    }
  }, [api]);

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
