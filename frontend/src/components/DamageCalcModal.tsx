import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { calcApi, type LearnsetEntry } from '../api/calc';
import { PokemonSearch } from './PokemonSearch';
import {
  calculateDamage,
  type AttackerConfig,
  type DefenderConfig,
  type MoveConfig,
} from '../utils/damageCalc';
import type { CaughtPokemonResponse } from '../types/api';

const NATURES = [
  'HARDY','LONELY','BRAVE','ADAMANT','NAUGHTY',
  'BOLD','DOCILE','RELAXED','IMPISH','LAX',
  'TIMID','HASTY','SERIOUS','JOLLY','NAIVE',
  'MODEST','MILD','QUIET','BASHFUL','RASH',
  'CALM','GENTLE','SASSY','CAREFUL','QUIRKY',
];

interface Props {
  runId: string;
  gameId: number;
  attacker: CaughtPokemonResponse;
  onClose: () => void;
}

export function DamageCalcModal({ runId, gameId, attacker, onClose }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [defenderPokemonId, setDefenderPokemonId] = useState<number | null>(null);

  // Attacker config (pre-filled with defaults)
  const [atkLevel,  setAtkLevel]  = useState(50);
  const [atkNature, setAtkNature] = useState('');
  const [atkEvAtk,  setAtkEvAtk]  = useState(0);
  const [atkIvAtk,  setAtkIvAtk]  = useState(31);
  const [atkEvSpA,  setAtkEvSpA]  = useState(0);
  const [atkIvSpA,  setAtkIvSpA]  = useState(31);

  // Defender config
  const [defLevel,  setDefLevel]  = useState(50);
  const [defNature, setDefNature] = useState('');
  const [defEvDef,  setDefEvDef]  = useState(0);
  const [defIvDef,  setDefIvDef]  = useState(31);
  const [defEvSpD,  setDefEvSpD]  = useState(0);
  const [defIvSpD,  setDefIvSpD]  = useState(31);
  const [defEvHp,   setDefEvHp]   = useState(0);
  const [defIvHp,   setDefIvHp]   = useState(31);

  // Move
  const [selectedMove, setSelectedMove] = useState<LearnsetEntry | null>(null);
  const [customPower,  setCustomPower]  = useState('');

  const { data: atkData } = useQuery({
    queryKey: ['calc-data', attacker.currentPokemonId, gameId],
    queryFn: () => calcApi.getPokemonCalcData(attacker.currentPokemonId, gameId).then(r => r.data),
  });

  const { data: defData } = useQuery({
    queryKey: ['calc-data', defenderPokemonId, gameId],
    queryFn: () => calcApi.getPokemonCalcData(defenderPokemonId!, gameId).then(r => r.data),
    enabled: defenderPokemonId !== null,
  });

  const { data: overrides } = useQuery({
    queryKey: ['stat-overrides', runId],
    queryFn: () => calcApi.listOverrides(runId).then(r => r.data),
  });

  // Apply stat override for attacker if it exists
  const atkBaseStats = useMemo(() => {
    if (!atkData?.baseStats) return null;
    const override = overrides?.find(o => o.pokemonId === attacker.currentPokemonId);
    return override ? {
      hp: override.hp, attack: override.attack, defense: override.defense,
      spAtk: override.spAtk, spDef: override.spDef, speed: override.speed,
    } : atkData.baseStats;
  }, [atkData, overrides, attacker.currentPokemonId]);

  const result = useMemo(() => {
    if (!atkBaseStats || !defData?.baseStats || !selectedMove) return null;
    const power = selectedMove.power ?? (customPower ? parseInt(customPower) : null);
    if (!power) return null;

    const move: MoveConfig = {
      power,
      type: selectedMove.type,
      category: selectedMove.category,
    };
    const attackerCfg: AttackerConfig = {
      baseStats: atkBaseStats,
      level: atkLevel,
      evAtk: atkEvAtk, ivAtk: atkIvAtk,
      evSpAtk: atkEvSpA, ivSpAtk: atkIvSpA,
      nature: atkNature || null,
      attackerTypes: atkData!.types,
    };
    const defenderCfg: DefenderConfig = {
      baseStats: defData.baseStats,
      level: defLevel,
      evDef: defEvDef, ivDef: defIvDef,
      evSpDef: defEvSpD, ivSpDef: defIvSpD,
      nature: defNature || null,
      defenderTypes: defData.types,
      hp: defData.baseStats.hp,
      evHp: defEvHp, ivHp: defIvHp,
    };
    return calculateDamage(attackerCfg, defenderCfg, move);
  }, [atkBaseStats, defData, selectedMove, customPower, atkLevel, atkNature, atkEvAtk, atkIvAtk, atkEvSpA, atkIvSpA, defLevel, defNature, defEvDef, defIvDef, defEvSpD, defIvSpD, defEvHp, defIvHp, atkData]);

  // Reset move when attacker data changes
  useEffect(() => { setSelectedMove(null); }, [attacker.currentPokemonId]);

  const effectLabel = result
    ? result.effectiveness === 0 ? t('calc.noEffect')
    : result.effectiveness >= 2  ? t('calc.superEffective', { x: result.effectiveness })
    : result.effectiveness < 1   ? t('calc.notVeryEffective', { x: result.effectiveness })
    : '1x'
    : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal calc-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('calc.title')}</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="calc-body">
          {/* Atacante */}
          <section className="calc-section">
            <h3>
              {attacker.currentPokemonSpriteUrl && (
                <img src={attacker.currentPokemonSpriteUrl} alt="" className="calc-sprite" />
              )}
              {attacker.nickname ?? attacker.currentPokemonName}
              <span className="calc-types">
                {attacker.currentPokemonTypes.map(t => (
                  <span key={t} className={`type-badge type-${t.toLowerCase()}`}>{t}</span>
                ))}
              </span>
            </h3>

            <div className="calc-row">
              <label>{t('calc.level')}
                <input type="number" min={1} max={100} value={atkLevel}
                  onChange={e => setAtkLevel(+e.target.value)} />
              </label>
              {expanded && (
                <label>{t('calc.nature')}
                  <select value={atkNature} onChange={e => setAtkNature(e.target.value)}>
                    <option value="">{t('calc.noNature')}</option>
                    {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              )}
            </div>

            {expanded && (
              <div className="calc-eviv">
                <div className="calc-stat-row">
                  <span>{t('calc.attack')}</span>
                  <label>EV<input type="number" min={0} max={252} value={atkEvAtk}
                    onChange={e => setAtkEvAtk(+e.target.value)} /></label>
                  <label>IV<input type="number" min={0} max={31} value={atkIvAtk}
                    onChange={e => setAtkIvAtk(+e.target.value)} /></label>
                </div>
                <div className="calc-stat-row">
                  <span>{t('calc.spAtk')}</span>
                  <label>EV<input type="number" min={0} max={252} value={atkEvSpA}
                    onChange={e => setAtkEvSpA(+e.target.value)} /></label>
                  <label>IV<input type="number" min={0} max={31} value={atkIvSpA}
                    onChange={e => setAtkIvSpA(+e.target.value)} /></label>
                </div>
              </div>
            )}

            {/* Stats base display */}
            {atkBaseStats && (
              <div className="calc-base-stats">
                <span>HP:{atkBaseStats.hp}</span>
                <span>Atk:{atkBaseStats.attack}</span>
                <span>Def:{atkBaseStats.defense}</span>
                <span>SpA:{atkBaseStats.spAtk}</span>
                <span>SpD:{atkBaseStats.spDef}</span>
                <span>Spe:{atkBaseStats.speed}</span>
              </div>
            )}
          </section>

          {/* Movimiento */}
          <section className="calc-section">
            <h3>{t('calc.move')}</h3>
            {atkData && atkData.learnset.length > 0 ? (
              <select
                value={selectedMove?.moveId ?? ''}
                onChange={e => {
                  const id = parseInt(e.target.value);
                  setSelectedMove(atkData.learnset.find(m => m.moveId === id) ?? null);
                }}
              >
                <option value="">{t('calc.chooseMove')}</option>
                {atkData.learnset
                  .filter(m => m.category !== 'STATUS')
                  .map(m => (
                    <option key={m.moveId} value={m.moveId}>
                      {m.name} ({m.type}, {m.category === 'PHYSICAL' ? t('calc.phys') : t('calc.sp')}, P:{m.power ?? '—'})
                    </option>
                  ))}
              </select>
            ) : (
              <p className="calc-hint">{t('calc.noLearnset')}</p>
            )}
            {(selectedMove || !atkData?.learnset.length) && (
              <div className="calc-row">
                {selectedMove && !selectedMove.power && (
                  <label>{t('calc.customPower')}
                    <input type="number" min={1} max={999} value={customPower}
                      onChange={e => setCustomPower(e.target.value)} placeholder="80" />
                  </label>
                )}
              </div>
            )}
          </section>

          {/* Defensor */}
          <section className="calc-section">
            <h3>{t('calc.defender')}</h3>
            <PokemonSearch
              placeholder={t('calc.searchDefender')}
              onSelect={p => setDefenderPokemonId(p.id)}
            />
            {defData && (
              <>
                <div className="calc-types">
                  {defData.types.map(type => (
                    <span key={type} className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
                  ))}
                </div>
                {defData.baseStats && (
                  <div className="calc-base-stats">
                    <span>HP:{defData.baseStats.hp}</span>
                    <span>Atk:{defData.baseStats.attack}</span>
                    <span>Def:{defData.baseStats.defense}</span>
                    <span>SpA:{defData.baseStats.spAtk}</span>
                    <span>SpD:{defData.baseStats.spDef}</span>
                    <span>Spe:{defData.baseStats.speed}</span>
                  </div>
                )}
                {expanded && (
                  <div className="calc-eviv">
                    <div className="calc-stat-row">
                      <span>HP</span>
                      <label>EV<input type="number" min={0} max={252} value={defEvHp}
                        onChange={e => setDefEvHp(+e.target.value)} /></label>
                      <label>IV<input type="number" min={0} max={31} value={defIvHp}
                        onChange={e => setDefIvHp(+e.target.value)} /></label>
                    </div>
                    <div className="calc-stat-row">
                      <span>{t('calc.defense')}</span>
                      <label>EV<input type="number" min={0} max={252} value={defEvDef}
                        onChange={e => setDefEvDef(+e.target.value)} /></label>
                      <label>IV<input type="number" min={0} max={31} value={defIvDef}
                        onChange={e => setDefIvDef(+e.target.value)} /></label>
                    </div>
                    <div className="calc-stat-row">
                      <span>{t('calc.spDef')}</span>
                      <label>EV<input type="number" min={0} max={252} value={defEvSpD}
                        onChange={e => setDefEvSpD(+e.target.value)} /></label>
                      <label>IV<input type="number" min={0} max={31} value={defIvSpD}
                        onChange={e => setDefIvSpD(+e.target.value)} /></label>
                    </div>
                    <label>{t('calc.defenderLevel')}
                      <input type="number" min={1} max={100} value={defLevel}
                        onChange={e => setDefLevel(+e.target.value)} />
                    </label>
                    <label>{t('calc.defenderNature')}
                      <select value={defNature} onChange={e => setDefNature(e.target.value)}>
                        <option value="">{t('calc.noNature')}</option>
                        {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Resultado */}
          {result && (
            <section className="calc-result">
              <div className="calc-result-header">
                <span className="calc-effectiveness">{effectLabel}</span>
                {result.stab && <span className="calc-stab">STAB</span>}
              </div>
              <div className="calc-damage-range">
                <span>{result.minDamage}–{result.maxDamage}</span>
                <span className="calc-percent">
                  ({result.minPercent}%–{result.maxPercent}%)
                </span>
              </div>
              {result.hitsToKO < Infinity && (
                <div className="calc-ko">
                  {result.hitsToKO > 1
                    ? t('calc.hitsToKO_plural', { n: result.hitsToKO })
                    : t('calc.hitsToKO', { n: result.hitsToKO })}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setExpanded(v => !v)}>
            {expanded ? t('calc.basicView') : t('calc.fullView')}
          </button>
          <button className="btn btn-primary" onClick={onClose}>{t('calc.close')}</button>
        </div>
      </div>
    </div>
  );
}
