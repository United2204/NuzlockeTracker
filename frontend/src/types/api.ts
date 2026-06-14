export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface MeResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  role: string;
  emailVerified: boolean;
  verified: boolean;
  language: string | null;
  lastUsernameChangedAt: string | null;
  createdAt: string;
}

export interface GameResponse {
  id: number;
  name: string;
  generation: number;
  official: boolean;
  versions: string[] | null;
  coverImageUrl: string | null;
}

export interface RouteResponse {
  id: number;
  name: string;
  displayOrder: number;
  encounterType: string;
  requiredBadgeId: number | null;
  requiredBadgeName: string | null;
}

export interface BadgeResponse {
  id: number;
  name: string;
  displayOrder: number;
  imageUrl: string | null;
}

export interface PokemonSearchResponse {
  id: number;
  speciesId: number;
  nationalDexNumber: number | null;
  types: string[];
  spriteUrl: string | null;
  variant: string | null;
  name: string;
  chainId: number | null;
}

export interface RunSummaryResponse {
  id: string;
  name: string;
  slug: string;
  gameId: number;
  gameName: string;
  gameVersion: string | null;
  randomized: boolean;
  status: string;
  visibility: string;
  favorite: boolean;
  archived: boolean;
  displayOrder: number;
  activePokemon: number;
  faintedPokemon: number;
  startedAt: string;
  lastActivityAt: string | null;
}

export interface RunRuleResponse {
  ruleType: string;
  enabled: boolean;
  value: string | null;
}

export interface RunBadgeResponse {
  badgeId: number;
  badgeName: string;
  badgeImageUrl: string | null;
  obtainedAt: string;
}

export interface RunDetailResponse {
  id: string;
  userId: string;
  name: string;
  slug: string;
  gameId: number;
  gameName: string;
  gameVersion: string | null;
  randomized: boolean;
  status: string;
  visibility: string;
  favorite: boolean;
  displayOrder: number;
  basePresetName: string | null;
  rules: RunRuleResponse[];
  badges: RunBadgeResponse[];
  activePokemon: number;
  faintedPokemon: number;
  boxedPokemon: number;
  startedAt: string;
  endedAt: string | null;
  lastActivityAt: string | null;
}

export interface CaughtPokemonResponse {
  id: string;
  originalPokemonId: number;
  currentPokemonId: number;
  currentPokemonName: string;
  currentPokemonTypes: string[];
  currentPokemonSpriteUrl: string | null;
  nickname: string | null;
  shiny: boolean;
  status: string;
  caughtAt: string;
  routeId: number;
  routeName: string;
  chainId: number | null;
}

export interface PokemonDetailResponse {
  id: number;
  speciesId: number;
  nationalDexNumber: number | null;
  types: string[];
  spriteUrl: string | null;
  variant: string | null;
  name: string;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  } | null;
  abilities: Array<{
    name: string;
    slot: string;
    hidden: boolean;
  }>;
}

export interface RouteEncounterSlot {
  id: string;
  outcome: string;
  caughtPokemon: CaughtPokemonResponse | null;
  notes: string | null;
  encounteredAt: string | null;
}

export interface RouteWithEncounterResponse {
  routeId: number | null;
  routeName: string;
  encounterType: string;
  routeOrder: number;
  requiredBadgeId: number | null;
  requiredBadgeName: string | null;
  isCustom: boolean;
  slots: RouteEncounterSlot[];
}
