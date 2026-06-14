import { client } from './client';
import type {
  RunSummaryResponse,
  RunDetailResponse,
  RouteWithEncounterResponse,
  CaughtPokemonResponse,
  RunBadgeResponse,
} from '../types/api';

export interface GymCap {
  badgeId: number;
  badgeName: string;
  leaderName: string;
  acePokemonLevel: number;
  levelCap: number;
}

export const runsApi = {
  list: () =>
    client.get<RunSummaryResponse[]>('/api/runs'),

  get: (runId: string) =>
    client.get<RunDetailResponse>(`/api/runs/${runId}`),

  create: (data: {
    gameId: number;
    name: string;
    gameVersion?: string;
    randomized: boolean;
    presetId?: number;
    visibility: string;
    rulesOverride?: { ruleType: string; enabled: boolean; value: string | null }[];
  }) =>
    client.post<RunDetailResponse>('/api/runs', data),

  update: (runId: string, data: Partial<{
    name: string;
    visibility: string;
    favorite: boolean;
    archived: boolean;
    status: string;
  }>) =>
    client.patch<RunDetailResponse>(`/api/runs/${runId}`, data),

  delete: (runId: string) =>
    client.delete(`/api/runs/${runId}`),

  routes: (runId: string, lang = 'en') =>
    client.get<RouteWithEncounterResponse[]>(`/api/runs/${runId}/routes`, { params: { lang } }),

  recordEncounter: (runId: string, data: {
    routeId: number;
    outcome: string;
    encounterId?: string;
    pokemonId?: number;
    nickname?: string;
    shiny?: boolean;
    notes?: string;
  }) =>
    client.post(`/api/runs/${runId}/encounters`, data),

  team: (runId: string) =>
    client.get<CaughtPokemonResponse[]>(`/api/runs/${runId}/team`),

  graveyard: (runId: string) =>
    client.get<CaughtPokemonResponse[]>(`/api/runs/${runId}/graveyard`),

  box: (runId: string) =>
    client.get<CaughtPokemonResponse[]>(`/api/runs/${runId}/box`),

  updatePokemonStatus: (runId: string, pokemonId: string, data: {
    status: string;
    notes?: string;
    correction?: boolean;
  }) =>
    client.patch<CaughtPokemonResponse>(`/api/runs/${runId}/pokemon/${pokemonId}/status`, data),

  evolve: (runId: string, pokemonId: string, targetPokemonId: number) =>
    client.patch<CaughtPokemonResponse>(`/api/runs/${runId}/pokemon/${pokemonId}/evolve`, { targetPokemonId }),

  devolve: (runId: string, pokemonId: string) =>
    client.patch<CaughtPokemonResponse>(`/api/runs/${runId}/pokemon/${pokemonId}/devolve`, {}),

  updateRules: (runId: string, rules: { ruleType: string; enabled: boolean; value: string | null }[]) =>
    client.patch(`/api/runs/${runId}/rules`, { rules }),

  badges: (runId: string) =>
    client.get<RunBadgeResponse[]>(`/api/runs/${runId}/badges`),

  obtainBadge: (runId: string, badgeId: number) =>
    client.post<RunBadgeResponse>(`/api/runs/${runId}/badges`, { badgeId }),

  deleteBadge: (runId: string, badgeId: number) =>
    client.delete(`/api/runs/${runId}/badges/${badgeId}`),

  gymCaps: (runId: string) =>
    client.get<GymCap[]>(`/api/runs/${runId}/gym-caps`),
};
