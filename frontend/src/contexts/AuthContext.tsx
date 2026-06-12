import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import { migrateGuestData } from '../hooks/useGuestMigration';
import { token } from '../utils/token';
import { applyLanguage } from '../i18n';
import type { MeResponse } from '../types/api';

interface AuthContextValue {
  user: MeResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set the user and sync the app language to their stored preference.
  const applyUser = useCallback((me: MeResponse) => {
    setUser(me);
    applyLanguage(me.language);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    token.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    const handleForcedLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  useEffect(() => {
    if (!token.getAccess()) {
      setIsLoading(false);
      return;
    }
    authApi.me()
      .then(res => applyUser(res.data))
      .catch(() => token.clear())
      .finally(() => setIsLoading(false));
  }, [applyUser]);

  const refreshUser = useCallback(async () => {
    const me = await authApi.me();
    applyUser(me.data);
  }, [applyUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    token.set(res.data.access_token, res.data.refresh_token);
    const me = await authApi.me();
    applyUser(me.data);
    migrateGuestData().catch(() => { /* guest data stays in IndexedDB if migration fails */ });
  }, [applyUser]);

  const loginWithTokens = useCallback(async (accessToken: string, refreshToken: string) => {
    token.set(accessToken, refreshToken);
    const me = await authApi.me();
    applyUser(me.data);
    migrateGuestData().catch(() => { /* guest data stays in IndexedDB if migration fails */ });
  }, [applyUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithTokens, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
