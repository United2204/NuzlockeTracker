import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { RunRuleResponse, RunBadgeResponse } from '../types/api';

export interface SyncOperation {
  id?: number;
  method: 'POST' | 'PATCH' | 'DELETE';
  url: string;
  data?: unknown;
  createdAt: number;
}

export interface CacheEntry {
  key: string;
  data: unknown;
  cachedAt: number;
}

export interface GuestRun {
  id: string;
  gameId: number;
  gameName: string;
  gameVersion: string | null;
  name: string;
  randomized: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'GAME_OVER' | 'ABANDONED';
  rules: RunRuleResponse[];
  badges: RunBadgeResponse[];
  favorite: boolean;
  archived: boolean;
  startedAt: string;
}

export interface GuestEncounterSlot {
  id: string;
  runId: string;
  routeId: number;
  outcome: string;
  notes: string | null;
  caughtPokemonId: string | null;
}

export interface GuestCaughtPokemon {
  id: string;
  runId: string;
  encounterId: string;
  routeId: number;
  routeName: string;
  originalPokemonId: number;
  currentPokemonId: number;
  currentPokemonName: string;
  currentPokemonTypes: string[];
  currentPokemonSpriteUrl: string | null;
  nickname: string | null;
  shiny: boolean;
  status: 'ACTIVE' | 'BOXED' | 'FAINTED';
  caughtAt: string;
  chainId: number | null;
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
  guestRuns: {
    key: string;
    value: GuestRun;
  };
  guestEncounterSlots: {
    key: string;
    value: GuestEncounterSlot;
    indexes: { byRunId: string };
  };
  guestCaughtPokemon: {
    key: string;
    value: GuestCaughtPokemon;
    indexes: { byRunId: string; byEncounterId: string };
  };
}

let _db: IDBPDatabase<NuzlockeSchema> | null = null;

export async function getDb(): Promise<IDBPDatabase<NuzlockeSchema>> {
  if (_db) return _db;
  _db = await openDB<NuzlockeSchema>('nuzlocke-tracker', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const sq = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        sq.createIndex('byCreatedAt', 'createdAt');
        db.createObjectStore('queryCache', { keyPath: 'key' });
      }
      if (oldVersion < 2) {
        db.createObjectStore('guestRuns', { keyPath: 'id' });
        const slots = db.createObjectStore('guestEncounterSlots', { keyPath: 'id' });
        slots.createIndex('byRunId', 'runId');
        const caught = db.createObjectStore('guestCaughtPokemon', { keyPath: 'id' });
        caught.createIndex('byRunId', 'runId');
        caught.createIndex('byEncounterId', 'encounterId');
      }
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
