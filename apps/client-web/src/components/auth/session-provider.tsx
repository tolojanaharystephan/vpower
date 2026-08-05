'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearTokens,
  fetchMe,
  getAccessToken,
  getRefreshToken,
  logoutUser,
  persistTokens,
  type MeResponse,
} from '@/lib/api';

type SessionState = {
  ready: boolean;
  user: MeResponse | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  setSession: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<MeResponse | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setAccessToken(null);
      setReady(true);
      return;
    }
    try {
      const me = await fetchMe(token);
      setUser(me);
      setAccessToken(token);
    } catch {
      clearTokens();
      setUser(null);
      setAccessToken(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setSession = useCallback(async (access: string, refreshTok: string) => {
    persistTokens(access, refreshTok);
    setAccessToken(access);
    const me = await fetchMe(access);
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser(getRefreshToken());
    clearTokens();
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      refresh,
      setSession,
      logout,
    }),
    [ready, user, accessToken, refresh, setSession, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
