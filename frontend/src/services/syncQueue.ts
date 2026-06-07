import axios from 'axios';
import { enqueueOperation, getAllQueued, removeQueued, type SyncOperation } from './db';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Intenta ejecutar una operación contra la API.
 * Si hay error de red (navigator.onLine === false), la encola en IndexedDB.
 * Si hay error de servidor (4xx/5xx), lo relanza al llamador normalmente.
 */
export async function executeOrQueue(
  op: Omit<SyncOperation, 'id' | 'createdAt'>
): Promise<unknown> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await axios({ method: op.method, url: `${BASE_URL}${op.url}`, data: op.data, headers });
    return res.data;
  } catch (err: unknown) {
    // Si es error de red (sin respuesta del servidor) y estamos offline → encolar
    const axiosErr = err as { response?: unknown; code?: string };
    if (!axiosErr.response || axiosErr.code === 'ERR_NETWORK') {
      await enqueueOperation({ ...op, createdAt: Date.now() });
      return null;
    }
    throw err;
  }
}

/**
 * Envía todas las operaciones encoladas en orden.
 * Llama a onProgress(done, total) en cada paso.
 * Si una operación falla con error de servidor, la deja encolada y para.
 */
export async function flushQueue(
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const ops = await getAllQueued();
  if (!ops.length) return;

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      await axios({ method: op.method, url: `${BASE_URL}${op.url}`, data: op.data, headers });
      await removeQueued(op.id!);
      onProgress?.(i + 1, ops.length);
    } catch {
      // Si falla con error de red de nuevo, parar — seguiremos al próximo online event
      break;
    }
  }
}
