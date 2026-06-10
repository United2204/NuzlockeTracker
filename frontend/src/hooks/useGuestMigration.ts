import { getDb } from '../services/db';
import { syncApi } from '../api/sync';
import type { SyncRunPayload, SyncEncounterPayload, SyncCaughtPokemonPayload } from '../api/sync';

export async function migrateGuestData(): Promise<boolean> {
  const db = await getDb();
  const runs = await db.getAll('guestRuns');
  if (runs.length === 0) return false;

  const allEncounters = await db.getAll('guestEncounterSlots');
  const allCaughtPokemon = await db.getAll('guestCaughtPokemon');

  const syncRuns: SyncRunPayload[] = runs.map(r => ({
    id: r.id,
    gameId: r.gameId,
    name: r.name,
    slug: r.id,
    gameVersion: r.gameVersion,
    randomized: r.randomized,
    status: r.status,
    visibility: 'PRIVATE',
    favorite: r.favorite,
    archived: r.archived,
    displayOrder: 0,
    rules: r.rules.map(rule => ({
      ruleType: rule.ruleType,
      enabled: rule.enabled,
      value: rule.value ?? null,
    })),
  }));

  const syncEncounters: SyncEncounterPayload[] = allEncounters.map(e => ({
    id: e.id,
    runId: e.runId,
    routeId: e.routeId,
    outcome: e.outcome,
    notes: e.notes,
    encounteredAt: null,
  }));

  const syncCaughtPokemon: SyncCaughtPokemonPayload[] = allCaughtPokemon.map(cp => ({
    id: cp.id,
    runId: cp.runId,
    routeEncounterId: cp.encounterId,
    originalPokemonId: cp.originalPokemonId,
    currentPokemonId: cp.currentPokemonId,
    nickname: cp.nickname,
    shiny: cp.shiny,
    status: cp.status,
  }));

  await syncApi.batch({
    runs: syncRuns,
    encounters: syncEncounters,
    caughtPokemon: syncCaughtPokemon,
  });

  await db.clear('guestRuns');
  await db.clear('guestEncounterSlots');
  await db.clear('guestCaughtPokemon');

  return true;
}
