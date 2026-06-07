import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { token } from '../utils/token';
import type { TokenResponse } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const t = token.getAccess();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let refreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function drainQueue(err: unknown, newToken: string | null) {
  queue.forEach(p => (err ? p.reject(err) : p.resolve(newToken!)));
  queue = [];
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

client.interceptors.response.use(
  res => res,
  async (error: unknown) => {
    const axiosError = error as { response?: { status: number }; config?: RetryConfig };
    const original = axiosError.config;

    if (!original || axiosError.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (refreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: t => {
            original.headers.Authorization = `Bearer ${t}`;
            resolve(client(original));
          },
          reject,
        });
      });
    }

    refreshing = true;
    try {
      const refreshToken = token.getRefresh();
      if (!refreshToken) throw new Error('no refresh token');

      const res = await axios.post<TokenResponse>(`${BASE_URL}/api/auth/refresh`, {
        refreshToken,
      });
      token.set(res.data.access_token, res.data.refresh_token);
      drainQueue(null, res.data.access_token);
      original.headers.Authorization = `Bearer ${res.data.access_token}`;
      return client(original);
    } catch (e) {
      drainQueue(e, null);
      token.clear();
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(e);
    } finally {
      refreshing = false;
    }
  }
);
