import { client } from './client';

export interface SyncRulePayload {
  ruleType: string;
  enabled: boolean;
  value: string | null;
}

export interface SyncRunPayload {
  id: string;
  gameId: number;
  name: string;
  slug: string;
  gameVersion: string | null;
  randomized: boolean;
  status: string;
  visibility: string;
  favorite: boolean;
  archived: boolean;
  displayOrder: number;
  rules: SyncRulePayload[];
}

export interface SyncEncounterPayload {
  id: string;
  runId: string;
  routeId: number;
  outcome: string;
  notes: string | null;
  encounteredAt: string | null;
}

export interface SyncCaughtPokemonPayload {
  id: string;
  runId: string;
  routeEncounterId: string;
  originalPokemonId: number;
  currentPokemonId: number;
  nickname: string | null;
  shiny: boolean;
  status: string;
}

export interface BatchSyncResponse {
  runsCreated: number;
  runsSkipped: number;
  encountersCreated: number;
  encountersSkipped: number;
  caughtPokemonCreated: number;
  caughtPokemonSkipped: number;
}

export const syncApi = {
  batch: (data: {
    runs: SyncRunPayload[];
    encounters: SyncEncounterPayload[];
    caughtPokemon: SyncCaughtPokemonPayload[];
  }) => client.post<BatchSyncResponse>('/api/sync/batch', data),
};
