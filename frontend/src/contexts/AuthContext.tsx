import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import { migrateGuestData } from '../hooks/useGuestMigration';
import { token } from '../utils/token';
import type { MeResponse } from '../types/api';

interface AuthContextValue {
  user: MeResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      .then(res => setUser(res.data))
      .catch(() => token.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    token.set(res.data.access_token, res.data.refresh_token);
    const me = await authApi.me();
    setUser(me.data);
    migrateGuestData().catch(() => { /* guest data stays in IndexedDB if migration fails */ });
  }, []);

  const loginWithTokens = useCallback(async (accessToken: string, refreshToken: string) => {
    token.set(accessToken, refreshToken);
    const me = await authApi.me();
    setUser(me.data);
    migrateGuestData().catch(() => { /* guest data stays in IndexedDB if migration fails */ });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithTokens, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
