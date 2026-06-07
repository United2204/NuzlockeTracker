import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { flushQueue } from '../services/syncQueue';

export interface SyncState {
  syncing: boolean;
  pendingCount: number;
}

export function useSyncFlush() {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function handleOnline() {
      setSyncing(true);
      try {
        await flushQueue();
        // Refresca todas las queries para mostrar el estado actualizado
        await qc.invalidateQueries();
      } finally {
        setSyncing(false);
      }
    }

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [qc]);

  return { syncing };
}
