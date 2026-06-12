import { useState, useEffect, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runsApi } from '../api/runs';
import { catalogApi } from '../api/catalog';
import { socialApi } from '../api/social';
import { guestStore } from '../services/guestStore';
import { Layout } from '../components/Layout';
import { GlobalSearch } from '../components/GlobalSearch';
import { EncounterModal } from '../components/EncounterModal';
import { RunSocialSection } from '../components/RunSocialSection';
import { AuthContext } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import type {
  RouteWithEncounterResponse,
  RouteEncounterSlot,
  RunDetailResponse,
} from '../types/api';
import type { GuestEncounterSaveData } from '../components/EncounterModal';

type ActiveEncounter = { route: RouteWithEncounterResponse; slot: RouteEncounterSlot | null };

const OUTCOME_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:           { label: 'Pendiente',     color: '#6b7280' },
  DEFERRED:          { label: 'Postergado',    color: '#f59e0b' },
  CAPTURED:          { label: 'Capturado',     color: '#22c55e' },
  FAILED:            { label: 'Fallido',       color: '#ef4444' },
  DIED_IN_ENCOUNTER: { label: 'Murió',         color: '#ef4444' },
  NOT_FOUND:         { label: 'No encontrado', color: '#6b7280' },
};

const ENCOUNTER_TYPE_LABELS: Record<string, string> = {
  RANDOM:     'Aleatorio',
  STATIC:     'Estático',
  GIFT:       'Regalo',
  STARTER:    'Inicial',
  FOSSIL:     'Fósil',
  LEGENDARY:  'Legendario',
  TRADE:      'Intercambio',
};

function Pokeball({ size = 20, golden = false }: { size?: number; golden?: boolean }) {
  const small = size <= 16;
  return (
    <span
      className={[
        'pokeball',
        golden ? 'pokeball--shiny' : '',
        small  ? 'pokeball--sm'    : '',
      ].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  );
}

function toShinySpriteUrl(url: string): string {
  return url.replace(/\/sprites\/pokemon\/(\d+\.png)$/, '/sprites/pokemon/shiny/$1');
}

function groupByBadge(routes: RouteWithEncounterResponse[]): Map<string, RouteWithEncounterResponse[]> {
  const groups = new Map<string, RouteWithEncounterResponse[]>();
  for (const r of routes) {
    const key = r.requiredBadgeName ?? 'Sin medalla requerida';
    const group = groups.get(key);
    if (group) group.push(r);
    else groups.set(key, [r]);
  }
  return groups;
}

const VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: '🌐 Pública',
  FOLLOWERS_ONLY: '👥 Solo seguidores',
  PRIVATE: '🔒 Privada',
};

type RuleKey =
  | 'FIRST_ENCOUNTER_ONLY' | 'PERMADEATH' | 'NICKNAME_REQUIRED'
  | 'SPECIES_CLAUSE' | 'DUPLICATE_CLAUSE' | 'ITEM_CLAUSE'
  | 'REGIONAL_VARIANT_CLAUSE' | 'LEVEL_CAP' | 'MAX_CATCHES_PER_ROUTE';

const RULE_DEFS: { key: RuleKey; label: string; desc: string; hasValue?: 'levelCap' | 'maxCatches' }[] = [
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

function RulesModal({ run, onClose }: { run: RunDetailResponse; onClose: () => void }) {
  const qc = useQueryClient();
  type RulesState = Record<RuleKey, { enabled: boolean; value: string }>;

  const [rules, setRules] = useState<RulesState>(() => {
    const state = {} as RulesState;
    for (const def of RULE_DEFS) {
      const existing = run.rules?.find(r => r.ruleType === def.key);
      let value = '';
      if (existing?.value) {
        try {
          const parsed = JSON.parse(existing.value);
          value = String(parsed.modifierPercent ?? parsed.max ?? '');
        } catch { value = ''; }
      }
      state[def.key] = { enabled: existing?.enabled ?? false, value };
    }
    return state;
  });

  const mut = useMutation({
    mutationFn: () => {
      const payload = (Object.entries(rules) as [RuleKey, { enabled: boolean; value: string }][])
        .map(([ruleType, r]) => {
          let value: string | null = null;
          if (ruleType === 'LEVEL_CAP' && r.enabled && r.value !== '')
            value = `{"modifierPercent":${parseInt(r.value, 10) || 0}}`;
          if (ruleType === 'MAX_CATCHES_PER_ROUTE' && r.enabled && r.value !== '')
            value = `{"max":${parseInt(r.value, 10) || 1}}`;
          return { ruleType, enabled: r.enabled, value };
        });
      return runsApi.updateRules(run.id, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs', run.id] });
      onClose();
    },
  });

  function toggleRule(key: RuleKey) {
    setRules(prev => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  }

  function setRuleValue(key: RuleKey, value: string) {
    setRules(prev => ({ ...prev, [key]: { ...prev[key], value } }));
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 className="modal-title">Reglas de la run</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                    type="number" min={-20} max={50}
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
                  type="number" min={1} max={10}
                  value={rules[def.key].value}
                  onChange={e => setRuleValue(def.key, e.target.value)}
                  style={{ width: 52, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, flexShrink: 0 }}
                  placeholder="1"
                />
              )}
            </div>
          ))}
          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: 8 }}
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
          >
            {mut.isPending ? 'Guardando...' : 'Guardar reglas'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function RunMenu({
  runId,
  runStatus,
  runVisibility,
  onConfirm,
  onVisibilityModal,
  onRulesModal,
  isGuest,
  isOwner,
}: {
  runId: string;
  runStatus: string;
  runVisibility: string;
  onConfirm: (action: 'COMPLETED' | 'ABANDONED') => void;
  onVisibilityModal: () => void;
  onRulesModal: () => void;
  isGuest: boolean;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e: Event) => {
      if ((e as CustomEvent).detail !== 'runmenu') setOpen(false);
    };
    window.addEventListener('panel:open', close);
    return () => window.removeEventListener('panel:open', close);
  }, []);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) window.dispatchEvent(new CustomEvent('panel:open', { detail: 'runmenu' }));
  };

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-ghost" onClick={handleOpen}>⋯</button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', right: 0, top: '100%', zIndex: 300,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 8, minWidth: 200, boxShadow: '0 4px 20px rgba(0,0,0,.4)',
          }}>
            <button
              className="btn btn-ghost btn-full"
              style={{ textAlign: 'left' }}
              onClick={() => { setOpen(false); navigate(`/runs/${runId}/stats`); }}
            >
              📊 Estadísticas
            </button>
            {!isGuest && isOwner && (
              <>
                <button
                  className="btn btn-ghost btn-full"
                  style={{ textAlign: 'left' }}
                  onClick={() => { setOpen(false); onRulesModal(); }}
                >
                  📋 Reglas
                </button>
                <button
                  className="btn btn-ghost btn-full"
                  style={{ textAlign: 'left' }}
                  onClick={() => { setOpen(false); onVisibilityModal(); }}
                >
                  {VISIBILITY_LABELS[runVisibility] ?? '🌐 Visibilidad'}
                </button>
              </>
            )}
            {isOwner && runStatus === 'ACTIVE' && (
              <>
                <button
                  className="btn btn-ghost btn-full"
                  style={{ textAlign: 'left', color: 'var(--success)' }}
                  onClick={() => { setOpen(false); onConfirm('COMPLETED'); }}
                >
                  ✅ Completar run
                </button>
                <button
                  className="btn btn-ghost btn-full"
                  style={{ textAlign: 'left', color: 'var(--text-muted)' }}
                  onClick={() => { setOpen(false); onConfirm('ABANDONED'); }}
                >
                  🏳️ Abandonar run
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BadgeModal({
  run,
  onClose,
  onObtain,
}: {
  run: RunDetailResponse;
  onClose: () => void;
  onObtain: (badgeId: number, badgeName: string) => Promise<void>;
}) {
  const { data: allBadges = [] } = useQuery({
    queryKey: ['catalog', 'badges', run.gameId],
    queryFn: () => catalogApi.badges(run.gameId).then(r => r.data),
  });

  const [pending, setPending] = useState(false);
  const obtainedIds = new Set(run.badges.map(b => b.badgeId));
  const available   = allBadges.filter(b => !obtainedIds.has(b.id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <h2 className="modal-title">Obtener medalla</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">
          {available.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              Ya obtuviste todas las medallas.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {available.map(b => (
                <button
                  key={b.id}
                  className="btn btn-ghost btn-full"
                  style={{ textAlign: 'left', padding: '10px 12px' }}
                  onClick={async () => {
                    setPending(true);
                    await onObtain(b.id, b.name);
                    setPending(false);
                    onClose();
                  }}
                  disabled={pending}
                >
                  🏅 {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RunActions({ run }: { run: RunDetailResponse }) {
  const auth = useContext(AuthContext);
  const qc = useQueryClient();
  const isOwner     = auth?.user?.id === run.userId || run.userId === 'guest';
  const authLoading = !auth || auth.isLoading;

  const { data: subscribed = false } = useQuery({
    queryKey: ['runs', run.id, 'subscription'],
    queryFn: () => socialApi.isSubscribed(run.id).then(r => r.data),
    enabled: !isOwner && !authLoading && run.userId !== 'guest',
  });

  const subMut = useMutation({
    mutationFn: () => subscribed ? socialApi.unsubscribe(run.id) : socialApi.subscribe(run.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['runs', run.id, 'subscription'] }),
  });

  const favMut = useMutation({
    mutationFn: () => runsApi.update(run.id, { favorite: !run.favorite }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs', run.id] });
      qc.invalidateQueries({ queryKey: ['runs'] });
    },
  });

  if (authLoading || run.userId === 'guest') return null;

  return (
    <div style={{ display: 'flex', gap: 8, padding: '0 16px 8px' }}>
      {isOwner && (
        <button
          className={`btn ${run.favorite ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1, fontSize: 13 }}
          onClick={() => favMut.mutate()}
          disabled={favMut.isPending}
        >
          {run.favorite ? '⭐ Favorita' : '☆ Favorita'}
        </button>
      )}
      {!isOwner && (
        <button
          className={`btn ${subscribed ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1, fontSize: 13 }}
          onClick={() => subMut.mutate()}
          disabled={subMut.isPending}
        >
          {subscribed ? '🔔 Suscripto' : '🔕 Suscribirse'}
        </button>
      )}
    </div>
  );
}

export function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const { user }  = useAuth();
  const isGuest   = !user;

  const [activeEncounter, setActiveEncounter] = useState<ActiveEncounter | null>(null);
  const [badgeModal, setBadgeModal]   = useState(false);
  const [confirmAction, setConfirmAction] = useState<'COMPLETED' | 'ABANDONED' | null>(null);
  const [visModal, setVisModal] = useState(false);
  const [rulesModal, setRulesModal] = useState(false);

  // ── API queries (logged-in) ────────────────────────────────────────────────
  const apiRunQ = useQuery({
    queryKey: ['runs', runId],
    queryFn:  () => runsApi.get(runId!).then(r => r.data),
    enabled:  !!runId && !isGuest,
  });

  const apiRoutesQ = useQuery({
    queryKey: ['runs', runId, 'routes'],
    queryFn:  () => runsApi.routes(runId!).then(r => r.data),
    enabled:  !!runId && !isGuest,
  });

  // ── Guest queries ──────────────────────────────────────────────────────────
  const guestRunQ = useQuery({
    queryKey: ['guest', 'runs', runId],
    queryFn:  () => guestStore.getRun(runId!),
    enabled:  !!runId && isGuest,
  });

  const guestCatalogRoutesQ = useQuery({
    queryKey: ['catalog', 'routes', guestRunQ.data?.gameId],
    queryFn:  () => catalogApi.routes(guestRunQ.data!.gameId).then(r => r.data),
    enabled:  isGuest && !!guestRunQ.data?.gameId,
  });

  const guestRoutesQ = useQuery({
    queryKey: ['guest', 'runs', runId, 'routes'],
    queryFn:  () => guestStore.buildRoutesWithEncounters(runId!, guestCatalogRoutesQ.data!),
    enabled:  isGuest && !!guestCatalogRoutesQ.data,
  });

  const guestTeamQ = useQuery({
    queryKey: ['guest', 'runs', runId, 'team'],
    queryFn:  () => guestStore.getByStatus(runId!, 'ACTIVE'),
    enabled:  isGuest && !!runId,
  });

  const run: RunDetailResponse | undefined     = isGuest ? guestRunQ.data ?? undefined : apiRunQ.data;
  const routes: RouteWithEncounterResponse[]   = isGuest ? (guestRoutesQ.data ?? []) : (apiRoutesQ.data ?? []);
  const isLoading = isGuest
    ? guestRunQ.isLoading || guestCatalogRoutesQ.isLoading || guestRoutesQ.isLoading
    : apiRoutesQ.isLoading;
  const isOwner = isGuest ? true : (user?.id === run?.userId);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const statusMut = useMutation({
    mutationFn: async (status: string) => {
      if (isGuest) { await guestStore.updateRun(runId!, { status: status as 'COMPLETED' | 'ABANDONED' }); }
      else { await runsApi.update(runId!, { status }); }
    },
    onSuccess: () => {
      if (isGuest) {
        qc.invalidateQueries({ queryKey: ['guest', 'runs', runId] });
        qc.invalidateQueries({ queryKey: ['guest', 'runs'] });
      } else {
        qc.invalidateQueries({ queryKey: ['runs', runId] });
        qc.invalidateQueries({ queryKey: ['runs'] });
      }
      navigate('/runs');
    },
  });


  const visMut = useMutation({
    mutationFn: (visibility: string) => runsApi.update(runId!, { visibility }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs', runId] });
      setVisModal(false);
    },
  });

  // ── Guest encounter handler ────────────────────────────────────────────────
  async function handleGuestEncounter(data: GuestEncounterSaveData) {
    if (data.swapPokemonId) {
      await guestStore.updatePokemonStatus(runId!, data.swapPokemonId, 'BOXED');
    }
    await guestStore.recordEncounter(runId!, {
      routeId:     data.routeId,
      routeName:   data.routeName,
      outcome:     data.outcome,
      encounterId: data.encounterId,
      pokemon:     data.pokemon,
      nickname:    data.nickname,
      shiny:       data.shiny,
      notes:       data.notes,
    });
    await qc.invalidateQueries({ queryKey: ['guest', 'runs', runId, 'routes'] });
    await qc.invalidateQueries({ queryKey: ['guest', 'runs', runId] });
    await qc.invalidateQueries({ queryKey: ['guest', 'runs', runId, 'team'] });
  }

  async function handleBadgeObtain(badgeId: number, badgeName: string) {
    if (isGuest) {
      await guestStore.obtainBadge(runId!, {
        badgeId,
        badgeName,
        badgeImageUrl: null,
        obtainedAt: new Date().toISOString(),
      });
      qc.invalidateQueries({ queryKey: ['guest', 'runs', runId] });
    } else {
      await runsApi.obtainBadge(runId!, badgeId);
      qc.invalidateQueries({ queryKey: ['runs', runId] });
    }
  }

  const maxCatches = (() => {
    const firstEncounterOnly = run?.rules?.find(r => r.ruleType === 'FIRST_ENCOUNTER_ONLY' && r.enabled);
    if (firstEncounterOnly) return 1;
    const rule = run?.rules?.find(r => r.ruleType === 'MAX_CATCHES_PER_ROUTE' && r.enabled);
    if (!rule?.value) return Infinity;
    try { return JSON.parse(rule.value).max ?? Infinity; } catch { return Infinity; }
  })();

  const groups = groupByBadge(routes);

  // Derived from already-loaded routes — no extra API calls
  // Priority: ACTIVE > BOXED > FAINTED (keeps best status when same chain appears multiple times)
  function bestStatus(current: string | undefined, incoming: string): string {
    if (!current) return incoming;
    const rank = { ACTIVE: 2, BOXED: 1, FAINTED: 0 };
    return (rank[incoming as keyof typeof rank] ?? 0) > (rank[current as keyof typeof rank] ?? 0)
      ? incoming : current;
  }

  const caughtByChainId = useMemo(() => {
    const map = new Map<number, string>();
    for (const route of routes) {
      for (const slot of route.slots) {
        const p = slot.caughtPokemon;
        if (p?.chainId != null) map.set(p.chainId, bestStatus(map.get(p.chainId), p.status));
      }
    }
    return map;
  }, [routes]);

  const caughtByPokemonId = useMemo(() => {
    const map = new Map<number, string>();
    for (const route of routes) {
      for (const slot of route.slots) {
        const p = slot.caughtPokemon;
        if (p != null && p.chainId == null) {
          map.set(p.originalPokemonId, bestStatus(map.get(p.originalPokemonId), p.status));
        }
      }
    }
    return map;
  }, [routes]);

  const confirmModal = confirmAction ? createPortal(
    <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {confirmAction === 'COMPLETED' ? '✅ Completar run' : '🏳️ Abandonar run'}
          </h2>
          <button type="button" className="modal-close" onClick={() => setConfirmAction(null)} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-muted)' }}>
            {confirmAction === 'COMPLETED'
              ? '¿Confirmás que terminaste esta run? Se guardará tu Hall of Fame.'
              : '¿Seguro que querés abandonar esta run?'}
          </p>
          <div className="actions-row">
            <button
              className={`btn ${confirmAction === 'COMPLETED' ? 'btn-success' : 'btn-danger'}`}
              onClick={() => statusMut.mutate(confirmAction)}
              disabled={statusMut.isPending}
            >
              {statusMut.isPending ? 'Guardando...' : 'Confirmar'}
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirmAction(null)}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  const visibilityModal = visModal ? createPortal(
    <div className="modal-overlay" onClick={() => setVisModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 320 }}>
        <div className="modal-header">
          <h2 className="modal-title">Visibilidad de la run</h2>
          <button type="button" className="modal-close" onClick={() => setVisModal(false)} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE'] as const).map(v => (
              <button
                key={v}
                className={`btn ${run?.visibility === v ? 'btn-primary' : 'btn-ghost'} btn-full`}
                style={{ textAlign: 'left' }}
                onClick={() => visMut.mutate(v)}
                disabled={visMut.isPending || run?.visibility === v}
              >
                {VISIBILITY_LABELS[v]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <Layout
      title={run?.name ?? 'Run'}
      back={isOwner ? '/runs' : -1}
      runId={runId}
      action={run && runId ? (
        <RunMenu
          runId={runId}
          runStatus={run.status}
          runVisibility={run.visibility}
          onConfirm={setConfirmAction}
          onVisibilityModal={() => setVisModal(true)}
          onRulesModal={() => setRulesModal(true)}
          isGuest={isGuest}
          isOwner={isOwner}
        />
      ) : undefined}
    >
      {run && (
        <div className="run-stats-bar">
          <span>⚔️ {run.activePokemon}</span>
          <span>📦 {run.boxedPokemon}</span>
          <span>💀 {run.faintedPokemon}</span>
          <span className="run-game-label">{run.gameName}{run.gameVersion ? ` · ${run.gameVersion}` : ''}</span>
        </div>
      )}

      {run && <RunActions run={run} />}

      <div className="page-content">
        <GlobalSearch caughtByChainId={caughtByChainId} caughtByPokemonId={caughtByPokemonId} />

        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {!isLoading && routes.length === 0 && (
          <div className="empty-state">
            <p>Este juego no tiene rutas cargadas aún.</p>
          </div>
        )}

        {Array.from(groups.entries()).map(([badge, groupRoutes]) => (
          <div key={badge} className="route-group">
            <h3 className="route-group-title">🏅 {badge}</h3>
            {groupRoutes.map(route => {
              const slots      = route.slots;
              const hasSlots   = slots.length > 0;
              const lastSlot   = hasSlots ? slots[slots.length - 1] : null;
              const displayOutcome = lastSlot?.outcome ?? 'PENDING';
              const cfg        = OUTCOME_CONFIG[displayOutcome] ?? OUTCOME_CONFIG['PENDING'];
              const allTerminal = hasSlots && slots.every(s =>
                ['CAPTURED','FAILED','DIED_IN_ENCOUNTER','NOT_FOUND'].includes(s.outcome)
              );
              const canAddSlot = isOwner && run?.status === 'ACTIVE' && route.encounterType === 'RANDOM'
                && maxCatches > 1 && slots.length < maxCatches && allTerminal;

              return (
                <div key={route.routeId} style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                  <button
                    className="route-card"
                    style={{ flex: 1, cursor: isOwner ? 'pointer' : 'default' }}
                    onClick={() => isOwner && setActiveEncounter({ route, slot: lastSlot })}
                    disabled={!isOwner}
                  >
                    <div className="route-card-left">
                      <span className="route-name">{route.routeName}</span>
                      <span className="route-type">{ENCOUNTER_TYPE_LABELS[route.encounterType] ?? route.encounterType}</span>
                    </div>
                    <div className="route-card-right">
                      <span style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {slots
                          .filter(s => s.outcome === 'CAPTURED' && s.caughtPokemon)
                          .map(s => {
                            const cp    = s.caughtPokemon!;
                            const label = (cp.nickname ?? cp.currentPokemonName) + (cp.shiny ? ' ✨' : '');
                            const src   = cp.currentPokemonSpriteUrl
                              ? (cp.shiny ? toShinySpriteUrl(cp.currentPokemonSpriteUrl) : cp.currentPokemonSpriteUrl)
                              : null;
                            return src ? (
                              <img
                                key={s.id}
                                src={src}
                                alt={label}
                                title={label}
                                onError={e => { if (cp.shiny && cp.currentPokemonSpriteUrl) (e.currentTarget).src = cp.currentPokemonSpriteUrl; }}
                                style={{ width: 36, height: 36, imageRendering: 'pixelated', objectFit: 'contain' }}
                              />
                            ) : (
                              <span key={s.id} className="route-pokemon">{label}</span>
                            );
                          })}
                      </span>
                      {maxCatches > 1 && hasSlots ? (
                        <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                          {slots.map(s => {
                            const c = OUTCOME_CONFIG[s.outcome] ?? OUTCOME_CONFIG['PENDING'];
                            return s.outcome === 'CAPTURED' ? (
                              <span
                                key={s.id}
                                style={{ cursor: isOwner ? 'pointer' : 'default', lineHeight: 0 }}
                                onClick={e => { if (!isOwner) return; e.stopPropagation(); setActiveEncounter({ route, slot: s }); }}
                              >
                                <Pokeball size={16} golden={s.caughtPokemon?.shiny ?? false} />
                              </span>
                            ) : (
                              <span
                                key={s.id}
                                style={{ fontSize: 10, color: c.color, border: `1px solid ${c.color}`,
                                  borderRadius: 4, padding: '1px 4px', cursor: isOwner ? 'pointer' : 'default' }}
                                onClick={e => { if (!isOwner) return; e.stopPropagation(); setActiveEncounter({ route, slot: s }); }}
                              >
                                {c.label}
                              </span>
                            );
                          })}
                        </span>
                      ) : (
                        displayOutcome === 'CAPTURED'
                          ? <Pokeball size={20} golden={lastSlot?.caughtPokemon?.shiny ?? false} />
                          : <span className="outcome-tag" style={{ color: cfg.color }}>{cfg.label}</span>
                      )}
                    </div>
                  </button>

                  {canAddSlot && (
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0 10px', fontSize: 18, alignSelf: 'center', flexShrink: 0 }}
                      title="Agregar otro encuentro"
                      onClick={() => setActiveEncounter({ route, slot: null })}
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {runId && !isGuest && <RunSocialSection runId={runId} />}

      {badgeModal && run && (
        <BadgeModal
          run={run}
          onClose={() => setBadgeModal(false)}
          onObtain={handleBadgeObtain}
        />
      )}

      {activeEncounter && runId && (
        <EncounterModal
          route={activeEncounter.route}
          slot={activeEncounter.slot}
          runId={runId}
          activePokemonCount={run?.activePokemon ?? 0}
          nicknameRequired={run?.rules?.find(r => r.ruleType === 'NICKNAME_REQUIRED')?.enabled ?? false}
          firstEncounterOnly={run?.rules?.find(r => r.ruleType === 'FIRST_ENCOUNTER_ONLY')?.enabled ?? false}
          speciesClauseEnabled={run?.rules?.find(r => r.ruleType === 'SPECIES_CLAUSE')?.enabled ?? false}
          caughtChainIds={routes
            .filter(r => r.routeId !== activeEncounter.route.routeId)
            .flatMap(r => r.slots
              .filter(s => s.outcome === 'CAPTURED' && s.caughtPokemon?.chainId != null && s.caughtPokemon.status !== 'FAINTED')
              .map(s => s.caughtPokemon!.chainId as number)
            )}
          onSave={isGuest ? handleGuestEncounter : undefined}
          guestTeamMembers={isGuest ? (guestTeamQ.data ?? []) : undefined}
          onClose={() => setActiveEncounter(null)}
        />
      )}

      {confirmModal}
      {visibilityModal}
      {rulesModal && run && isOwner && (
        <RulesModal run={run} onClose={() => setRulesModal(false)} />
      )}
    </Layout>
  );
}
