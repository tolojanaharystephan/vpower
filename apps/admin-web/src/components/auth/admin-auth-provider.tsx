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
  clearAdminSession,
  fetchMe,
  getAdminAccessToken,
  getAdminRefreshToken,
  hasAdminAccess,
  loginAdmin,
  logoutAdmin,
  persistAdminSession,
  readCachedSession,
  type AuthResponse,
  type MeResponse,
} from '@/lib/api';

type AdminAuthState = {
  ready: boolean;
  user: MeResponse | AuthResponse['user'] | null;
  roles: string[];
  permissions: string[];
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isStaff: boolean;
};

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AdminAuthState['user']>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    const token = getAdminAccessToken();
    const cached = readCachedSession();
    if (!token) {
      setReady(true);
      return;
    }
    setAccessToken(token);
    if (cached) {
      setUser(cached.user);
      setRoles(cached.roles);
      setPermissions(cached.permissions);
    }
    try {
      const me = await fetchMe(token);
      setUser(me);
      setRoles(me.roles);
      setPermissions(me.permissions);
      if (!hasAdminAccess(me.permissions)) {
        clearAdminSession();
        setUser(null);
        setRoles([]);
        setPermissions([]);
        setAccessToken(null);
      }
    } catch {
      clearAdminSession();
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setAccessToken(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginAdmin({ email, password });
    if (!hasAdminAccess(data.permissions)) {
      throw new Error('NO_ADMIN_ACCESS');
    }
    persistAdminSession(data);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setRoles(data.roles);
    setPermissions(data.permissions);
  }, []);

  const logout = useCallback(async () => {
    const refresh = getAdminRefreshToken();
    await logoutAdmin(refresh);
    clearAdminSession();
    setAccessToken(null);
    setUser(null);
    setRoles([]);
    setPermissions([]);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      user,
      roles,
      permissions,
      accessToken,
      login,
      logout,
      isStaff: hasAdminAccess(permissions),
    }),
    [ready, user, roles, permissions, accessToken, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
