import { getDb, type GuestRun, type GuestEncounterSlot, type GuestCaughtPokemon } from './db';
import type {
  RunSummaryResponse,
  RunDetailResponse,
  RouteResponse,
  RouteWithEncounterResponse,
  CaughtPokemonResponse,
  RunRuleResponse,
  RunBadgeResponse,
} from '../types/api';
import type { PokemonSearchResponse } from '../types/api';

function uuid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function toSummary(run: GuestRun, activePokemon: number, faintedPokemon: number): RunSummaryResponse {
  return {
    id: run.id,
    name: run.name,
    slug: run.id,
    gameId: run.gameId,
    gameName: run.gameName,
    gameVersion: run.gameVersion,
    randomized: run.randomized,
    status: run.status,
    visibility: 'PRIVATE',
    favorite: run.favorite,
    archived: run.archived,
    displayOrder: 0,
    activePokemon,
    faintedPokemon,
    startedAt: run.startedAt,
    lastActivityAt: null,
  };
}

function toDetail(run: GuestRun, activePokemon: number, faintedPokemon: number, boxedPokemon: number): RunDetailResponse {
  return {
    id: run.id,
    userId: 'guest',
    name: run.name,
    slug: run.id,
    gameId: run.gameId,
    gameName: run.gameName,
    gameVersion: run.gameVersion,
    randomized: run.randomized,
    status: run.status,
    visibility: 'PRIVATE',
    favorite: run.favorite,
    displayOrder: 0,
    basePresetName: null,
    rules: run.rules,
    badges: run.badges,
    activePokemon,
    faintedPokemon,
    boxedPokemon,
    startedAt: run.startedAt,
    endedAt: null,
    lastActivityAt: null,
  };
}

function toCaughtPokemon(cp: GuestCaughtPokemon): CaughtPokemonResponse {
  return {
    id: cp.id,
    originalPokemonId: cp.originalPokemonId,
    currentPokemonId: cp.currentPokemonId,
    currentPokemonName: cp.currentPokemonName,
    currentPokemonTypes: cp.currentPokemonTypes,
    currentPokemonSpriteUrl: cp.currentPokemonSpriteUrl,
    nickname: cp.nickname,
    shiny: cp.shiny,
    status: cp.status,
    caughtAt: cp.caughtAt,
    routeId: cp.routeId,
    routeName: cp.routeName,
    chainId: cp.chainId,
  };
}

async function getCounts(runId: string): Promise<{ active: number; fainted: number; boxed: number }> {
  const db = await getDb();
  const all = await db.getAllFromIndex('guestCaughtPokemon', 'byRunId', runId);
  return {
    active:  all.filter(p => p.status === 'ACTIVE').length,
    fainted: all.filter(p => p.status === 'FAINTED').length,
    boxed:   all.filter(p => p.status === 'BOXED').length,
  };
}

export const guestStore = {
  async listRuns(): Promise<RunSummaryResponse[]> {
    const db = await getDb();
    const runs = await db.getAll('guestRuns');
    const results: RunSummaryResponse[] = [];
    for (const run of runs) {
      const { active, fainted } = await getCounts(run.id);
      results.push(toSummary(run, active, fainted));
    }
    return results.sort((a, b) => a.startedAt < b.startedAt ? 1 : -1);
  },

  async getRun(id: string): Promise<RunDetailResponse | undefined> {
    const db = await getDb();
    const run = await db.get('guestRuns', id);
    if (!run) return undefined;
    const { active, fainted, boxed } = await getCounts(id);
    return toDetail(run, active, fainted, boxed);
  },

  async createRun(data: {
    gameId: number;
    gameName: string;
    gameVersion?: string;
    name: string;
    randomized: boolean;
    rules: RunRuleResponse[];
  }): Promise<RunDetailResponse> {
    const db = await getDb();
    const run: GuestRun = {
      id: uuid(),
      gameId: data.gameId,
      gameName: data.gameName,
      gameVersion: data.gameVersion ?? null,
      name: data.name,
      randomized: data.randomized,
      status: 'ACTIVE',
      rules: data.rules,
      badges: [],
      favorite: false,
      archived: false,
      startedAt: now(),
    };
    await db.put('guestRuns', run);
    return toDetail(run, 0, 0, 0);
  },

  async updateRun(id: string, patch: Partial<{
    name: string;
    favorite: boolean;
    archived: boolean;
    status: 'ACTIVE' | 'COMPLETED' | 'GAME_OVER' | 'ABANDONED';
  }>): Promise<RunDetailResponse> {
    const db = await getDb();
    const run = await db.get('guestRuns', id);
    if (!run) throw new Error('Run not found');
    const updated: GuestRun = { ...run, ...patch };
    await db.put('guestRuns', updated);
    const { active, fainted, boxed } = await getCounts(id);
    return toDetail(updated, active, fainted, boxed);
  },

  async buildRoutesWithEncounters(
    runId: string,
    catalogRoutes: RouteResponse[],
  ): Promise<RouteWithEncounterResponse[]> {
    const db = await getDb();
    const slots = await db.getAllFromIndex('guestEncounterSlots', 'byRunId', runId);
    const slotsByRoute = new Map<number, GuestEncounterSlot[]>();
    for (const s of slots) {
      const list = slotsByRoute.get(s.routeId) ?? [];
      list.push(s);
      slotsByRoute.set(s.routeId, list);
    }

    const allCaught = await db.getAllFromIndex('guestCaughtPokemon', 'byRunId', runId);
    const caughtById = new Map(allCaught.map(cp => [cp.id, cp]));

    return catalogRoutes.map(route => {
      const routeSlots = slotsByRoute.get(route.id) ?? [];
      return {
        routeId:          route.id,
        routeName:        route.name,
        encounterType:    route.encounterType,
        routeOrder:       route.displayOrder,
        requiredBadgeId:  route.requiredBadgeId,
        requiredBadgeName: route.requiredBadgeName,
        isCustom:         false,
        slots: routeSlots.map(s => ({
          id:            s.id,
          outcome:       s.outcome,
          notes:         s.notes,
          encounteredAt: null,
          caughtPokemon: s.caughtPokemonId
            ? toCaughtPokemon(caughtById.get(s.caughtPokemonId)!)
            : null,
        })),
      };
    });
  },

  async recordEncounter(runId: string, data: {
    routeId: number;
    routeName: string;
    outcome: string;
    encounterId?: string;
    pokemon?: PokemonSearchResponse;
    nickname?: string;
    shiny?: boolean;
    notes?: string;
  }): Promise<void> {
    const db = await getDb();

    if (data.encounterId) {
      // Edit existing slot
      const existing = await db.get('guestEncounterSlots', data.encounterId);
      if (!existing) return;

      // If changing from CAPTURED to something else, remove the caught pokemon
      if (existing.caughtPokemonId && data.outcome !== 'CAPTURED') {
        await db.delete('guestCaughtPokemon', existing.caughtPokemonId);
        existing.caughtPokemonId = null;
      }

      existing.outcome = data.outcome;
      existing.notes = data.notes ?? null;

      if (data.outcome === 'CAPTURED' && data.pokemon) {
        if (existing.caughtPokemonId) {
          // Update existing caught pokemon
          const cp = await db.get('guestCaughtPokemon', existing.caughtPokemonId);
          if (cp) {
            cp.originalPokemonId       = data.pokemon.id;
            cp.currentPokemonId        = data.pokemon.id;
            cp.currentPokemonName      = data.pokemon.name;
            cp.currentPokemonTypes     = data.pokemon.types;
            cp.currentPokemonSpriteUrl = data.pokemon.spriteUrl;
            cp.nickname                = data.nickname ?? null;
            cp.shiny                   = data.shiny ?? false;
            cp.chainId                 = data.pokemon.chainId;
            await db.put('guestCaughtPokemon', cp);
          }
        } else {
          const cpId = uuid();
          const cp: GuestCaughtPokemon = {
            id: cpId, runId, encounterId: data.encounterId,
            routeId: data.routeId, routeName: data.routeName,
            originalPokemonId: data.pokemon.id, currentPokemonId: data.pokemon.id,
            currentPokemonName: data.pokemon.name, currentPokemonTypes: data.pokemon.types,
            currentPokemonSpriteUrl: data.pokemon.spriteUrl,
            nickname: data.nickname ?? null, shiny: data.shiny ?? false,
            status: 'ACTIVE', caughtAt: now(), chainId: data.pokemon.chainId,
          };
          await db.put('guestCaughtPokemon', cp);
          existing.caughtPokemonId = cpId;
        }
      }

      await db.put('guestEncounterSlots', existing);
    } else {
      // New slot
      const slotId = uuid();
      let caughtPokemonId: string | null = null;

      if (data.outcome === 'CAPTURED' && data.pokemon) {
        const cpId = uuid();
        const cp: GuestCaughtPokemon = {
          id: cpId, runId, encounterId: slotId,
          routeId: data.routeId, routeName: data.routeName,
          originalPokemonId: data.pokemon.id, currentPokemonId: data.pokemon.id,
          currentPokemonName: data.pokemon.name, currentPokemonTypes: data.pokemon.types,
          currentPokemonSpriteUrl: data.pokemon.spriteUrl,
          nickname: data.nickname ?? null, shiny: data.shiny ?? false,
          status: 'ACTIVE', caughtAt: now(), chainId: data.pokemon.chainId,
        };
        await db.put('guestCaughtPokemon', cp);
        caughtPokemonId = cpId;
      }

      const slot: GuestEncounterSlot = {
        id: slotId, runId, routeId: data.routeId,
        outcome: data.outcome, notes: data.notes ?? null, caughtPokemonId,
      };
      await db.put('guestEncounterSlots', slot);
    }

    // Auto GAME_OVER: check if permadeath is on and no active pokemon remain
    const run = await db.get('guestRuns', runId);
    if (run && run.status === 'ACTIVE') {
      const permadeath = run.rules.find(r => r.ruleType === 'PERMADEATH' && r.enabled);
      if (permadeath) {
        const { active } = await getCounts(runId);
        if (active === 0) {
          const allCaught = await db.getAllFromIndex('guestCaughtPokemon', 'byRunId', runId);
          if (allCaught.some(p => p.status === 'FAINTED')) {
            await db.put('guestRuns', { ...run, status: 'GAME_OVER' });
          }
        }
      }
    }
  },

  async getByStatus(runId: string, status: 'ACTIVE' | 'BOXED' | 'FAINTED'): Promise<CaughtPokemonResponse[]> {
    const db = await getDb();
    const all = await db.getAllFromIndex('guestCaughtPokemon', 'byRunId', runId);
    return all.filter(p => p.status === status).map(toCaughtPokemon);
  },

  async updatePokemonStatus(
    runId: string,
    pokemonId: string,
    status: 'ACTIVE' | 'BOXED' | 'FAINTED',
  ): Promise<void> {
    const db = await getDb();
    const cp = await db.get('guestCaughtPokemon', pokemonId);
    if (!cp || cp.runId !== runId) return;
    await db.put('guestCaughtPokemon', { ...cp, status });

    // Auto GAME_OVER on permadeath
    if (status === 'FAINTED') {
      const run = await db.get('guestRuns', runId);
      if (run && run.status === 'ACTIVE') {
        const permadeath = run.rules.find(r => r.ruleType === 'PERMADEATH' && r.enabled);
        if (permadeath) {
          const { active } = await getCounts(runId);
          if (active === 0) {
            await db.put('guestRuns', { ...run, status: 'GAME_OVER' });
          }
        }
      }
    }
  },

  async deleteCaughtPokemon(runId: string, pokemonId: string): Promise<void> {
    const db = await getDb();
    const cp = await db.get('guestCaughtPokemon', pokemonId);
    if (!cp || cp.runId !== runId) return;

    await db.delete('guestEncounterSlots', cp.encounterId);
    await db.delete('guestCaughtPokemon', pokemonId);
  },

  async obtainBadge(runId: string, badge: RunBadgeResponse): Promise<void> {
    const db = await getDb();
    const run = await db.get('guestRuns', runId);
    if (!run) return;
    if (run.badges.some(b => b.badgeId === badge.badgeId)) return;
    await db.put('guestRuns', { ...run, badges: [...run.badges, badge] });
  },

  async removeBadge(runId: string, badgeId: number): Promise<void> {
    const db = await getDb();
    const run = await db.get('guestRuns', runId);
    if (!run) return;
    await db.put('guestRuns', { ...run, badges: run.badges.filter(b => b.badgeId !== badgeId) });
  },
};
