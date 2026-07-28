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

export type AuthMode = 'login' | 'register';

type AuthUiContextValue = {
  mode: AuthMode | null;
  openAuth: (mode: AuthMode) => void;
  closeAuth: () => void;
  switchAuth: (mode: AuthMode) => void;
};

const AuthUiContext = createContext<AuthUiContextValue | null>(null);

export function AuthUiProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode | null>(null);

  const openAuth = useCallback((next: AuthMode) => setMode(next), []);
  const closeAuth = useCallback(() => setMode(null), []);
  const switchAuth = useCallback((next: AuthMode) => setMode(next), []);

  useEffect(() => {
    if (!mode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuth();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mode, closeAuth]);

  const value = useMemo(
    () => ({ mode, openAuth, closeAuth, switchAuth }),
    [mode, openAuth, closeAuth, switchAuth],
  );

  return <AuthUiContext.Provider value={value}>{children}</AuthUiContext.Provider>;
}

export function useAuthUi() {
  const ctx = useContext(AuthUiContext);
  if (!ctx) throw new Error('useAuthUi must be used within AuthUiProvider');
  return ctx;
}
