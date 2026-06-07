import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface SyncOperation {
  id?: number;
  method: 'POST' | 'PATCH' | 'DELETE';
  url: string;
  data?: unknown;
  createdAt: number;
}

// Generic query cache entry — stores the JSON body of any GET response
export interface CacheEntry {
  key: string;       // e.g. "runs", "runs/abc/routes"
  data: unknown;
  cachedAt: number;
}

interface NuzlockeSchema extends DBSchema {
  syncQueue: {
    key: number;
    value: SyncOperation;
    indexes: { byCreatedAt: number };
  };
  queryCache: {
    key: string;
    value: CacheEntry;
  };
}

let _db: IDBPDatabase<NuzlockeSchema> | null = null;

export async function getDb(): Promise<IDBPDatabase<NuzlockeSchema>> {
  if (_db) return _db;
  _db = await openDB<NuzlockeSchema>('nuzlocke-tracker', 1, {
    upgrade(db) {
      const sq = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      sq.createIndex('byCreatedAt', 'createdAt');
      db.createObjectStore('queryCache', { keyPath: 'key' });
    },
  });
  return _db;
}

// ─── sync queue ───────────────────────────────────────────────────────────────

export async function enqueueOperation(op: Omit<SyncOperation, 'id'>): Promise<void> {
  const db = await getDb();
  await db.add('syncQueue', op as SyncOperation);
}

export async function getAllQueued(): Promise<SyncOperation[]> {
  const db = await getDb();
  return db.getAllFromIndex('syncQueue', 'byCreatedAt');
}

export async function removeQueued(id: number): Promise<void> {
  const db = await getDb();
  await db.delete('syncQueue', id);
}

// ─── query cache ──────────────────────────────────────────────────────────────

export async function cacheGet(key: string): Promise<unknown | undefined> {
  const db = await getDb();
  const entry = await db.get('queryCache', key);
  return entry?.data;
}

export async function cachePut(key: string, data: unknown): Promise<void> {
  const db = await getDb();
  await db.put('queryCache', { key, data, cachedAt: Date.now() });
}
