import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { token } from '../utils/token';
import { cachePut, cacheGet, enqueueOperation } from '../services/db';
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

// Cachea respuestas GET exitosas en IndexedDB para acceso offline
client.interceptors.response.use(async res => {
  if (res.config.method?.toLowerCase() === 'get' && res.config.url) {
    // Normaliza la clave quitando la baseURL y el query string
    const rawPath = res.config.url.replace(BASE_URL, '').split('?')[0];
    await cachePut(rawPath, res.data).catch(() => { /* silenciar errores de IDB */ });
  }
  return res;
});

let refreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function drainQueue(err: unknown, newToken: string | null) {
  queue.forEach(p => (err ? p.reject(err) : p.resolve(newToken!)));
  queue = [];
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _queued?: boolean;
}

client.interceptors.response.use(
  res => res,
  async (error: unknown) => {
    const axiosError = error as {
      response?: { status: number };
      config?: RetryConfig;
      code?: string;
    };
    const original = axiosError.config;
    if (!original) return Promise.reject(error);

    // ── Error de red: sin respuesta del servidor ────────────────────
    const isNetworkError = !axiosError.response || axiosError.code === 'ERR_NETWORK';
    const method = original.method?.toUpperCase() as 'POST' | 'PATCH' | 'DELETE' | undefined;
    const isMutation = method && ['POST', 'PATCH', 'DELETE'].includes(method);

    if (isNetworkError && isMutation && !original._queued) {
      original._queued = true;
      const url = (original.url ?? '').replace(BASE_URL, '');
      await enqueueOperation({
        method: method as 'POST' | 'PATCH' | 'DELETE',
        url,
        data: original.data ? JSON.parse(original.data as string) : undefined,
        createdAt: Date.now(),
      }).catch(() => { /* silenciar */ });
      // Devolver un objeto vacío para que la UI no explote
      return Promise.resolve({ data: null, status: 0, offline: true });
    }

    // ── GET offline: servir desde caché ────────────────────────────
    if (isNetworkError && original.method?.toLowerCase() === 'get' && original.url) {
      const rawPath = original.url.replace(BASE_URL, '').split('?')[0];
      const cached = await cacheGet(rawPath).catch(() => undefined);
      if (cached !== undefined) {
        return Promise.resolve({ data: cached, status: 200, fromCache: true });
      }
    }

    // ── 401: renovar token ─────────────────────────────────────────
    if (axiosError.response?.status !== 401 || original._retry) {
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
