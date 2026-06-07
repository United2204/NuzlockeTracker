import { client } from './client';

// ── Tipos de catálogo ─────────────────────────────────────────────────────

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

export interface AbilityEntry {
  abilityId: number;
  name: string;
  slot: string;
}

export interface LearnsetEntry {
  moveId: number;
  name: string;
  type: string;
  category: 'PHYSICAL' | 'SPECIAL' | 'STATUS';
  power: number | null;
  accuracy: number | null;
  priority: number;
  learnMethod: string;
  levelLearned: number | null;
}

export interface PokemonCalcData {
  id: number;
  name: string;
  types: string[];
  spriteUrl: string | null;
  baseStats: BaseStats | null;
  abilities: AbilityEntry[];
  learnset: LearnsetEntry[];
}

export interface ItemCalcData {
  itemId: number;
  name: string;
  effect: Record<string, unknown>;
}

// ── Tipos de run ─────────────────────────────────────────────────────────

export interface CalcPreset {
  id: number;
  name: string;
  pokemonId: number;
  formVariant: string | null;
  level: number;
  evHp: number; evAtk: number; evDef: number; evSpAtk: number; evSpDef: number; evSpe: number;
  ivHp: number; ivAtk: number; ivDef: number; ivSpAtk: number; ivSpDef: number; ivSpe: number;
  nature: string | null;
  abilityId: number | null;
  itemId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalcPresetRequest {
  name: string;
  pokemonId: number;
  formVariant?: string | null;
  level?: number;
  evHp?: number; evAtk?: number; evDef?: number; evSpAtk?: number; evSpDef?: number; evSpe?: number;
  ivHp?: number; ivAtk?: number; ivDef?: number; ivSpAtk?: number; ivSpDef?: number; ivSpe?: number;
  nature?: string | null;
  abilityId?: number | null;
  itemId?: number | null;
}

export interface StatOverride {
  pokemonId: number;
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

// ── API ────────────────────────────────────────────────────────────────────

export const calcApi = {
  getPokemonCalcData: (pokemonId: number, gameId?: number, lang = 'en') =>
    client.get<PokemonCalcData>(`/api/pokemon/${pokemonId}/calc-data`, {
      params: { gameId, lang },
    }),

  getCalcItems: (lang = 'en') =>
    client.get<ItemCalcData[]>('/api/items/calc', { params: { lang } }),

  listPresets: (runId: string) =>
    client.get<CalcPreset[]>(`/api/runs/${runId}/calc-presets`),

  createPreset: (runId: string, data: CalcPresetRequest) =>
    client.post<CalcPreset>(`/api/runs/${runId}/calc-presets`, data),

  updatePreset: (runId: string, presetId: number, data: CalcPresetRequest) =>
    client.put<CalcPreset>(`/api/runs/${runId}/calc-presets/${presetId}`, data),

  deletePreset: (runId: string, presetId: number) =>
    client.delete(`/api/runs/${runId}/calc-presets/${presetId}`),

  listOverrides: (runId: string) =>
    client.get<StatOverride[]>(`/api/runs/${runId}/stat-overrides`),

  upsertOverride: (runId: string, pokemonId: number, data: Omit<StatOverride, 'pokemonId'>) =>
    client.put<StatOverride>(`/api/runs/${runId}/stat-overrides/${pokemonId}`, data),

  deleteOverride: (runId: string, pokemonId: number) =>
    client.delete(`/api/runs/${runId}/stat-overrides/${pokemonId}`),
};
