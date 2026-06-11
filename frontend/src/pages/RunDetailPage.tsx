import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runsApi } from '../api/runs';
import { catalogApi } from '../api/catalog';
import { socialApi } from '../api/social';
import { guestStore } from '../services/guestStore';
import { Layout } from '../components/Layout';
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

function RunMenu({
  runId,
  runStatus,
  runVisibility,
  onConfirm,
  onVisibilityModal,
  isGuest,
}: {
  runId: string;
  runStatus: string;
  runVisibility: string;
  onConfirm: (action: 'COMPLETED' | 'ABANDONED') => void;
  onVisibilityModal: () => void;
  isGuest: boolean;
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
            {!isGuest && (
              <button
                className="btn btn-ghost btn-full"
                style={{ textAlign: 'left' }}
                onClick={() => { setOpen(false); onVisibilityModal(); }}
              >
                {VISIBILITY_LABELS[runVisibility] ?? '🌐 Visibilidad'}
              </button>
            )}
            {runStatus === 'ACTIVE' && (
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

  const removeBadgeMut = useMutation({
    mutationFn: async (badgeId: number) => {
      if (isGuest) { await guestStore.removeBadge(runId!, badgeId); }
      else { await runsApi.deleteBadge(runId!, badgeId); }
    },
    onSuccess: () => {
      if (isGuest) qc.invalidateQueries({ queryKey: ['guest', 'runs', runId] });
      else qc.invalidateQueries({ queryKey: ['runs', runId] });
    },
    onError: () => alert('Error al quitar la medalla. Intentá de nuevo.'),
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
      back="/runs"
      runId={runId}
      action={run && runId ? (
        <RunMenu
          runId={runId}
          runStatus={run.status}
          runVisibility={run.visibility}
          onConfirm={setConfirmAction}
          onVisibilityModal={() => setVisModal(true)}
          isGuest={isGuest}
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

      {run && (
        <div className="badges-row">
          {run.badges.map(b => (
            <div key={b.badgeId} className="badge-chip badge-chip--removable" title={b.badgeName}>
              🏅 {b.badgeName}
              {run.status === 'ACTIVE' && (
                <button
                  className="badge-remove-btn"
                  onClick={() => removeBadgeMut.mutate(b.badgeId)}
                  disabled={removeBadgeMut.isPending}
                  aria-label={`Quitar ${b.badgeName}`}
                >×</button>
              )}
            </div>
          ))}
          {run.status === 'ACTIVE' && (
            <button
              className="btn btn-ghost badge-chip"
              style={{ fontSize: 13, padding: '4px 10px', cursor: 'pointer' }}
              onClick={() => setBadgeModal(true)}
            >
              + Medalla
            </button>
          )}
        </div>
      )}

      {run && <RunActions run={run} />}

      <div className="page-content">
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
              const canAddSlot = run?.status === 'ACTIVE' && route.encounterType === 'RANDOM'
                && maxCatches > 1 && slots.length < maxCatches && allTerminal;

              return (
                <div key={route.routeId} style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                  <button
                    className="route-card"
                    style={{ flex: 1 }}
                    onClick={() => setActiveEncounter({ route, slot: lastSlot })}
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
                            const label = cp.nickname ?? cp.currentPokemonName;
                            return cp.currentPokemonSpriteUrl ? (
                              <img
                                key={s.id}
                                src={cp.currentPokemonSpriteUrl}
                                alt={label}
                                title={label}
                                style={{ width: 36, height: 36, imageRendering: 'pixelated', objectFit: 'contain' }}
                              />
                            ) : (
                              <span key={s.id} className="route-pokemon">{label}</span>
                            );
                          })}
                      </span>
                      {maxCatches > 1 && hasSlots ? (
                        <span style={{ display: 'flex', gap: 3 }}>
                          {slots.map(s => {
                            const c = OUTCOME_CONFIG[s.outcome] ?? OUTCOME_CONFIG['PENDING'];
                            return (
                              <span
                                key={s.id}
                                style={{ fontSize: 10, color: c.color, border: `1px solid ${c.color}`,
                                  borderRadius: 4, padding: '1px 4px', cursor: 'pointer' }}
                                onClick={e => { e.stopPropagation(); setActiveEncounter({ route, slot: s }); }}
                              >
                                {c.label}
                              </span>
                            );
                          })}
                        </span>
                      ) : (
                        <span className="outcome-tag" style={{ color: cfg.color }}>{cfg.label}</span>
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
    </Layout>
  );
}
