import type { BaseStats } from '../api/calc';

// Efectividad de tipos Gen 6+ (18×18). Filas = atacante, columnas = defensor.
const TYPES = [
  'NORMAL','FIRE','WATER','ELECTRIC','GRASS','ICE',
  'FIGHTING','POISON','GROUND','FLYING','PSYCHIC','BUG',
  'ROCK','GHOST','DRAGON','DARK','STEEL','FAIRY',
] as const;
type PokeType = typeof TYPES[number];

// [attacking][defending] = multiplier * 100  (100=1x, 200=2x, 50=0.5x, 0=immune)
const RAW: Record<PokeType, Record<PokeType, number>> = {
  NORMAL:   { NORMAL:100,FIRE:100,WATER:100,ELECTRIC:100,GRASS:100,ICE:100,FIGHTING:100,POISON:100,GROUND:100,FLYING:100,PSYCHIC:100,BUG:100,ROCK:50,GHOST:0,DRAGON:100,DARK:100,STEEL:50,FAIRY:100 },
  FIRE:     { NORMAL:100,FIRE:50,WATER:50,ELECTRIC:100,GRASS:200,ICE:200,FIGHTING:100,POISON:100,GROUND:100,FLYING:100,PSYCHIC:100,BUG:200,ROCK:50,GHOST:100,DRAGON:50,DARK:100,STEEL:200,FAIRY:100 },
  WATER:    { NORMAL:100,FIRE:200,WATER:50,ELECTRIC:100,GRASS:50,ICE:100,FIGHTING:100,POISON:100,GROUND:200,FLYING:100,PSYCHIC:100,BUG:100,ROCK:200,GHOST:100,DRAGON:50,DARK:100,STEEL:100,FAIRY:100 },
  ELECTRIC: { NORMAL:100,FIRE:100,WATER:200,ELECTRIC:50,GRASS:50,ICE:100,FIGHTING:100,POISON:100,GROUND:0,FLYING:200,PSYCHIC:100,BUG:100,ROCK:100,GHOST:100,DRAGON:50,DARK:100,STEEL:100,FAIRY:100 },
  GRASS:    { NORMAL:100,FIRE:50,WATER:200,ELECTRIC:100,GRASS:50,ICE:100,FIGHTING:100,POISON:50,GROUND:200,FLYING:50,PSYCHIC:100,BUG:50,ROCK:200,GHOST:100,DRAGON:50,DARK:100,STEEL:50,FAIRY:100 },
  ICE:      { NORMAL:100,FIRE:50,WATER:50,ELECTRIC:100,GRASS:200,ICE:50,FIGHTING:100,POISON:100,GROUND:200,FLYING:200,PSYCHIC:100,BUG:100,ROCK:100,GHOST:100,DRAGON:200,DARK:100,STEEL:50,FAIRY:100 },
  FIGHTING: { NORMAL:200,FIRE:100,WATER:100,ELECTRIC:100,GRASS:100,ICE:200,FIGHTING:100,POISON:50,GROUND:100,FLYING:50,PSYCHIC:50,BUG:50,ROCK:200,GHOST:0,DRAGON:100,DARK:200,STEEL:200,FAIRY:50 },
  POISON:   { NORMAL:100,FIRE:100,WATER:100,ELECTRIC:100,GRASS:200,ICE:100,FIGHTING:100,POISON:50,GROUND:50,FLYING:100,PSYCHIC:100,BUG:100,ROCK:50,GHOST:50,DRAGON:100,DARK:100,STEEL:0,FAIRY:200 },
  GROUND:   { NORMAL:100,FIRE:200,WATER:100,ELECTRIC:200,GRASS:50,ICE:100,FIGHTING:100,POISON:200,GROUND:100,FLYING:0,PSYCHIC:100,BUG:50,ROCK:200,GHOST:100,DRAGON:100,DARK:100,STEEL:200,FAIRY:100 },
  FLYING:   { NORMAL:100,FIRE:100,WATER:100,ELECTRIC:50,GRASS:200,ICE:100,FIGHTING:200,POISON:100,GROUND:100,FLYING:100,PSYCHIC:100,BUG:200,ROCK:50,GHOST:100,DRAGON:100,DARK:100,STEEL:50,FAIRY:100 },
  PSYCHIC:  { NORMAL:100,FIRE:100,WATER:100,ELECTRIC:100,GRASS:100,ICE:100,FIGHTING:200,POISON:200,GROUND:100,FLYING:100,PSYCHIC:50,BUG:100,ROCK:100,GHOST:100,DRAGON:100,DARK:0,STEEL:50,FAIRY:100 },
  BUG:      { NORMAL:100,FIRE:50,WATER:100,ELECTRIC:100,GRASS:200,ICE:100,FIGHTING:50,POISON:50,GROUND:100,FLYING:50,PSYCHIC:200,BUG:100,ROCK:100,GHOST:50,DRAGON:100,DARK:200,STEEL:50,FAIRY:50 },
  ROCK:     { NORMAL:100,FIRE:200,WATER:100,ELECTRIC:100,GRASS:100,ICE:200,FIGHTING:50,POISON:100,GROUND:50,FLYING:200,PSYCHIC:100,BUG:200,ROCK:100,GHOST:100,DRAGON:100,DARK:100,STEEL:50,FAIRY:100 },
  GHOST:    { NORMAL:0,FIRE:100,WATER:100,ELECTRIC:100,GRASS:100,ICE:100,FIGHTING:100,POISON:100,GROUND:100,FLYING:100,PSYCHIC:200,BUG:100,ROCK:100,GHOST:200,DRAGON:100,DARK:50,STEEL:100,FAIRY:100 },
  DRAGON:   { NORMAL:100,FIRE:100,WATER:100,ELECTRIC:100,GRASS:100,ICE:100,FIGHTING:100,POISON:100,GROUND:100,FLYING:100,PSYCHIC:100,BUG:100,ROCK:100,GHOST:100,DRAGON:200,DARK:100,STEEL:50,FAIRY:0 },
  DARK:     { NORMAL:100,FIRE:100,WATER:100,ELECTRIC:100,GRASS:100,ICE:100,FIGHTING:50,POISON:100,GROUND:100,FLYING:100,PSYCHIC:200,BUG:100,ROCK:100,GHOST:200,DRAGON:100,DARK:50,STEEL:50,FAIRY:50 },
  STEEL:    { NORMAL:100,FIRE:50,WATER:50,ELECTRIC:50,GRASS:100,ICE:200,FIGHTING:100,POISON:100,GROUND:100,FLYING:100,PSYCHIC:100,BUG:100,ROCK:200,GHOST:100,DRAGON:100,DARK:100,STEEL:50,FAIRY:200 },
  FAIRY:    { NORMAL:100,FIRE:50,WATER:100,ELECTRIC:100,GRASS:100,ICE:100,FIGHTING:200,POISON:50,GROUND:100,FLYING:100,PSYCHIC:100,BUG:100,ROCK:100,GHOST:100,DRAGON:200,DARK:200,STEEL:50,FAIRY:100 },
};

export function typeEffectiveness(attackType: string, defenderTypes: string[]): number {
  const atk = attackType.toUpperCase() as PokeType;
  return defenderTypes.reduce((mult, dt) => {
    const def = dt.toUpperCase() as PokeType;
    return mult * ((RAW[atk]?.[def] ?? 100) / 100);
  }, 1);
}

const NATURE_MODS: Record<string, [stat: string, up: number, down: string, downMod: number]> = {
  HARDY: ['attack',1,'attack',1], LONELY: ['attack',1.1,'defense',0.9],
  BRAVE: ['attack',1.1,'speed',0.9], ADAMANT: ['attack',1.1,'spAtk',0.9],
  NAUGHTY: ['attack',1.1,'spDef',0.9], BOLD: ['defense',1.1,'attack',0.9],
  DOCILE: ['attack',1,'attack',1], RELAXED: ['defense',1.1,'speed',0.9],
  IMPISH: ['defense',1.1,'spAtk',0.9], LAX: ['defense',1.1,'spDef',0.9],
  TIMID: ['speed',1.1,'attack',0.9], HASTY: ['speed',1.1,'defense',0.9],
  SERIOUS: ['attack',1,'attack',1], JOLLY: ['speed',1.1,'spAtk',0.9],
  NAIVE: ['speed',1.1,'spDef',0.9], MODEST: ['spAtk',1.1,'attack',0.9],
  MILD: ['spAtk',1.1,'defense',0.9], QUIET: ['spAtk',1.1,'speed',0.9],
  BASHFUL: ['attack',1,'attack',1], RASH: ['spAtk',1.1,'spDef',0.9],
  CALM: ['spDef',1.1,'attack',0.9], GENTLE: ['spDef',1.1,'defense',0.9],
  SASSY: ['spDef',1.1,'speed',0.9], CAREFUL: ['spDef',1.1,'spAtk',0.9],
  QUIRKY: ['attack',1,'attack',1],
};

function natureMod(nature: string | null | undefined, stat: keyof BaseStats): number {
  if (!nature) return 1;
  const entry = NATURE_MODS[nature.toUpperCase()];
  if (!entry) return 1;
  const [upStat, upMod, downStat, downMod] = entry;
  if (stat === upStat && stat !== downStat) return upMod;
  if (stat === downStat && stat !== upStat) return downMod;
  return 1;
}

function calcStat(
  base: number, iv: number, ev: number, level: number,
  nature: string | null | undefined, stat: keyof BaseStats
): number {
  if (stat === 'hp') {
    return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10;
  }
  return Math.floor(
    (Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5) * natureMod(nature, stat)
  );
}

export interface AttackerConfig {
  baseStats: BaseStats;
  level: number;
  evAtk: number; ivAtk: number;
  evSpAtk: number; ivSpAtk: number;
  nature: string | null | undefined;
  attackerTypes: string[];
}

export interface DefenderConfig {
  baseStats: BaseStats;
  level: number;
  evDef: number; ivDef: number;
  evSpDef: number; ivSpDef: number;
  nature: string | null | undefined;
  defenderTypes: string[];
  hp: number; evHp: number; ivHp: number;
}

export interface MoveConfig {
  power: number;
  type: string;
  category: 'PHYSICAL' | 'SPECIAL' | 'STATUS';
}

export interface DamageResult {
  minDamage: number;
  maxDamage: number;
  minPercent: number;
  maxPercent: number;
  effectiveness: number;
  stab: boolean;
  hitsToKO: number;
}

export function calculateDamage(
  attacker: AttackerConfig,
  defender: DefenderConfig,
  move: MoveConfig,
): DamageResult | null {
  if (move.category === 'STATUS' || !move.power) return null;

  const isPhysical = move.category === 'PHYSICAL';
  const atkStat = isPhysical ? 'attack' : 'spAtk';
  const defStat = isPhysical ? 'defense' : 'spDef';
  const atkBase = isPhysical ? attacker.baseStats.attack : attacker.baseStats.spAtk;
  const defBase = isPhysical ? defender.baseStats.defense : defender.baseStats.spDef;
  const atkEV = isPhysical ? attacker.evAtk : attacker.evSpAtk;
  const atkIV = isPhysical ? attacker.ivAtk : attacker.ivSpAtk;
  const defEV = isPhysical ? defender.evDef : defender.evSpDef;
  const defIV = isPhysical ? defender.ivDef : defender.ivSpDef;

  const atkValue = calcStat(atkBase, atkIV, atkEV, attacker.level, attacker.nature, atkStat as keyof BaseStats);
  const defValue = calcStat(defBase, defIV, defEV, defender.level, defender.nature, defStat as keyof BaseStats);
  const defHp    = calcStat(defender.baseStats.hp, defender.ivHp, defender.evHp, defender.level, defender.nature, 'hp');

  const effectiveness = typeEffectiveness(move.type, defender.defenderTypes);
  const stab = attacker.attackerTypes.map(t => t.toUpperCase()).includes(move.type.toUpperCase());

  const base = Math.floor(Math.floor(2 * attacker.level / 5 + 2) * move.power * atkValue / defValue / 50) + 2;

  // rolls: 0.85 to 1.00 in 1/16 steps = 16 values (85,86,...,100)
  const rolls = Array.from({ length: 16 }, (_, i) => Math.floor(base * (85 + i) / 100));
  const withMods = rolls.map(r => Math.floor(r * (stab ? 1.5 : 1) * effectiveness));

  const minDamage = withMods[0];
  const maxDamage = withMods[15];
  const minPercent = Math.round(minDamage / defHp * 1000) / 10;
  const maxPercent = Math.round(maxDamage / defHp * 1000) / 10;
  const hitsToKO = maxDamage > 0 ? Math.ceil(defHp / maxDamage) : Infinity;

  return { minDamage, maxDamage, minPercent, maxPercent, effectiveness, stab, hitsToKO };
}
