import { client } from './client';

export interface DeathRecord {
  pokemonId: string;
  name: string;
  nickname: string | null;
  spriteUrl: string | null;
  notes: string | null;
  faintedAt: string | null;
}

export interface PokemonTimeRecord {
  pokemonId: string;
  name: string;
  nickname: string | null;
  spriteUrl: string | null;
  secondsInTeam: number;
  status: 'ACTIVE' | 'BOXED' | 'FAINTED';
}

export interface RunStats {
  routesAttempted: number;
  routesCaptured: number;
  routesFailed: number;
  routesPending: number;
  activeCount: number;
  boxedCount: number;
  faintedCount: number;
  deaths: DeathRecord[];
  teamTime: PokemonTimeRecord[];
}

export interface MostCaughtEntry {
  pokemonId: number;
  name: string;
  spriteUrl: string | null;
  count: number;
}

export interface UserStats {
  totalRuns: number;
  activeRuns: number;
  completedRuns: number;
  gameOverRuns: number;
  abandonedRuns: number;
  totalCaptures: number;
  totalDeaths: number;
  mostCaught: MostCaughtEntry[];
}

export const statsApi = {
  getRunStats: (runId: string) =>
    client.get<RunStats>(`/api/runs/${runId}/stats`),

  getUserStats: () =>
    client.get<UserStats>('/api/me/stats'),
};
