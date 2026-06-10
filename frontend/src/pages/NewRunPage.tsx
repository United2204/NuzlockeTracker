import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { catalogApi } from '../api/catalog';
import { runsApi } from '../api/runs';
import { guestStore } from '../services/guestStore';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import type { GameResponse } from '../types/api';

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = [
  { id: 1, label: '🏆 Clásico',  desc: 'Primer encuentro por ruta, permadeath, species clause' },
  { id: 2, label: '💀 Hardcore', desc: 'Clásico + sin ítems en combate + level cap por gym' },
  { id: 3, label: '📝 Libre',    desc: 'Sin restricciones — solo registrar lo que capturás' },
];

type RuleKey =
  | 'FIRST_ENCOUNTER_ONLY' | 'PERMADEATH' | 'NICKNAME_REQUIRED'
  | 'SPECIES_CLAUSE' | 'DUPLICATE_CLAUSE' | 'ITEM_CLAUSE'
  | 'REGIONAL_VARIANT_CLAUSE' | 'LEVEL_CAP' | 'MAX_CATCHES_PER_ROUTE';

interface RuleDef {
  key: RuleKey;
  label: string;
  desc: string;
  hasValue?: 'levelCap' | 'maxCatches';
}

const RULE_DEFS: RuleDef[] = [
  { key: 'FIRST_ENCOUNTER_ONLY',    label: 'Solo primer encuentro',      desc: 'Una captura por ruta' },
  { key: 'PERMADEATH',              label: 'Permadeath',                 desc: 'Si muere, va al cementerio' },
  { key: 'SPECIES_CLAUSE',          label: 'Species clause',             desc: 'No repetir línea evolutiva' },
  { key: 'DUPLICATE_CLAUSE',        label: 'Duplicate clause',           desc: 'No repetir Pokémon exacto' },
  { key: 'ITEM_CLAUSE',             label: 'Sin ítems en combate',       desc: 'No usar Pociones/X-items en batalla' },
  { key: 'REGIONAL_VARIANT_CLAUSE', label: 'Variantes regionales = dup', desc: 'Raichu-Kanto y Raichu-Alola cuentan como mismo' },
  { key: 'LEVEL_CAP',               label: 'Level cap',                  desc: 'Límite de nivel por el siguiente gym', hasValue: 'levelCap' },
  { key: 'MAX_CATCHES_PER_ROUTE',   label: 'Máx. capturas por ruta',     desc: 'Límite de intentos por zona', hasValue: 'maxCatches' },
  { key: 'NICKNAME_REQUIRED',       label: 'Nickname obligatorio',       desc: 'Recordar asignar apodo (solo aviso)' },
];

type RulesState = Record<RuleKey, { enabled: boolean; value: string }>;

function defaultRulesForPreset(presetId: number): RulesState {
  const isHardcore = presetId === 2;
  const isLibre    = presetId === 3;
  return {
    FIRST_ENCOUNTER_ONLY:    { enabled: !isLibre,    value: '' },
    PERMADEATH:              { enabled: !isLibre,    value: '' },
    NICKNAME_REQUIRED:       { enabled: false,       value: '' },
    SPECIES_CLAUSE:          { enabled: !isLibre,    value: '' },
    DUPLICATE_CLAUSE:        { enabled: false,       value: '' },
    ITEM_CLAUSE:             { enabled: isHardcore,  value: '' },
    REGIONAL_VARIANT_CLAUSE: { enabled: false,       value: '' },
    LEVEL_CAP:               { enabled: isHardcore,  value: isHardcore ? '0' : '' },
    MAX_CATCHES_PER_ROUTE:   { enabled: false,       value: '' },
  };
}

// ─── Form ─────────────────────────────────────────────────────────────────────

const schema = z.object({
  gameId:      z.string().min(1, 'Elegí un juego'),
  name:        z.string().min(1, 'Requerido').max(150, 'Máximo 150 caracteres'),
  gameVersion: z.string().optional(),
  randomized:  z.boolean().optional(),
  visibility:  z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Component ────────────────────────────────────────────────────────────────

export function NewRunPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [games, setGames] = useState<GameResponse[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameResponse | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(1);
  const [showCustom, setShowCustom] = useState(false);
  const [rules, setRules] = useState<RulesState>(() => defaultRulesForPreset(1));

  const { register, handleSubmit, watch, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { randomized: false, visibility: 'PRIVATE' },
  });

  useEffect(() => {
    catalogApi.games().then(r => setGames(r.data)).catch(() => {});
  }, []);

  const gameId = watch('gameId');
  useEffect(() => {
    const game = games.find(g => g.id === Number(gameId));
    setSelectedGame(game ?? null);
  }, [gameId, games]);

  function selectPreset(id: number) {
    setSelectedPreset(id);
    setRules(defaultRulesForPreset(id));
  }

  function toggleRule(key: RuleKey) {
    setRules(prev => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  }

  function setRuleValue(key: RuleKey, value: string) {
    setRules(prev => ({ ...prev, [key]: { ...prev[key], value } }));
  }

  async function onSubmit(data: FormData) {
    setSubmitError('');
    try {
      const rulesOverride = (Object.entries(rules) as [RuleKey, { enabled: boolean; value: string }][])
        .map(([ruleType, r]) => {
          let value: string | null = null;
          if (ruleType === 'LEVEL_CAP' && r.enabled && r.value !== '') {
            value = `{"modifierPercent":${parseInt(r.value, 10) || 0}}`;
          }
          if (ruleType === 'MAX_CATCHES_PER_ROUTE' && r.enabled && r.value !== '') {
            value = `{"max":${parseInt(r.value, 10) || 1}}`;
          }
          return { ruleType, enabled: r.enabled, value };
        });

      const game = games.find(g => g.id === parseInt(data.gameId, 10));

      let runId: string;
      if (user) {
        const res = await runsApi.create({
          gameId:      parseInt(data.gameId, 10),
          name:        data.name,
          gameVersion: data.gameVersion || undefined,
          randomized:  data.randomized ?? false,
          visibility:  data.visibility ?? 'PRIVATE',
          presetId:    selectedPreset,
          rulesOverride,
        });
        runId = res.data.id;
      } else {
        const res = await guestStore.createRun({
          gameId:      parseInt(data.gameId, 10),
          gameName:    game?.name ?? '',
          gameVersion: data.gameVersion || undefined,
          name:        data.name,
          randomized:  data.randomized ?? false,
          rules:       rulesOverride,
        });
        runId = res.id;
      }

      navigate(`/runs/${runId}`);
    } catch {
      setSubmitError('Error al crear la run. Intenta de nuevo.');
    }
  }

  const presetDefaults = defaultRulesForPreset(selectedPreset);
  const isCustomized = (Object.keys(rules) as RuleKey[]).some(
    k => rules[k].enabled !== presetDefaults[k].enabled
  );

  return (
    <Layout title="Nueva Run" back="/runs">
      <div className="page-content">
        <form onSubmit={handleSubmit(onSubmit)} className="form-card">

          {/* Juego */}
          <div className="form-group">
            <label className="form-label">Juego *</label>
            <select className="form-input" {...register('gameId')}>
              <option value="">Elegí un juego...</option>
              {games.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            {errors.gameId && <span className="form-error">{errors.gameId.message}</span>}
          </div>

          {selectedGame?.versions && selectedGame.versions.length > 0 && (
            <div className="form-group">
              <label className="form-label">Versión</label>
              <select className="form-input" {...register('gameVersion')}>
                <option value="">Todas las versiones</option>
                {selectedGame.versions.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}

          {/* Nombre */}
          <div className="form-group">
            <label className="form-label">Nombre de la run *</label>
            <input
              className="form-input"
              {...register('name')}
              placeholder="Ej: Mi primera Nuzlocke"
            />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          {/* Modo de juego */}
          <div className="form-group">
            <label className="form-label">Modo de juego</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPreset(p.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${selectedPreset === p.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: selectedPreset === p.id ? 'var(--accent-bg)' : 'var(--bg-card)',
                    textAlign: 'left', gap: 2,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{p.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Personalizar reglas */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <button
              type="button"
              onClick={() => setShowCustom(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: isCustomized ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 600, padding: '4px 0', display: 'flex',
                alignItems: 'center', gap: 6,
              }}
            >
              {showCustom ? '▲' : '▼'} Personalizar reglas
              {isCustomized && <span style={{ fontSize: 11, background: 'var(--accent)', color: '#fff', borderRadius: 4, padding: '1px 5px' }}>modificado</span>}
            </button>

            {showCustom && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {RULE_DEFS.map(def => (
                  <div
                    key={def.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 8,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleRule(def.key)}
                      style={{
                        flexShrink: 0, width: 36, height: 20, borderRadius: 10,
                        border: 'none', cursor: 'pointer',
                        background: rules[def.key].enabled ? 'var(--accent)' : 'var(--border)',
                        position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 2,
                        left: rules[def.key].enabled ? 18 : 2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#fff', transition: 'left 0.2s',
                      }} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{def.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{def.desc}</div>
                    </div>
                    {def.hasValue === 'levelCap' && rules[def.key].enabled && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <input
                          type="number"
                          min={-20} max={50}
                          value={rules[def.key].value}
                          onChange={e => setRuleValue(def.key, e.target.value)}
                          style={{ width: 52, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
                          placeholder="0"
                        />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>%</span>
                      </div>
                    )}
                    {def.hasValue === 'maxCatches' && rules[def.key].enabled && (
                      <input
                        type="number"
                        min={1} max={10}
                        value={rules[def.key].value}
                        onChange={e => setRuleValue(def.key, e.target.value)}
                        style={{ width: 52, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, flexShrink: 0 }}
                        placeholder="1"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visibilidad — solo para usuarios con cuenta */}
          {user && (
            <div className="form-group">
              <label className="form-label">Visibilidad</label>
              <select className="form-input" {...register('visibility')}>
                <option value="PRIVATE">🔒 Privada</option>
                <option value="PUBLIC">🌍 Pública</option>
                <option value="FOLLOWERS_ONLY">👥 Solo seguidores</option>
              </select>
            </div>
          )}

          <div className="form-check">
            <input type="checkbox" id="randomized" {...register('randomized')} />
            <label htmlFor="randomized">🎲 Run randomizer (Pokémon aleatorios)</label>
          </div>

          {submitError && <p className="form-error">{submitError}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear run'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
