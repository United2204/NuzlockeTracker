import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runsApi } from '../api/runs';
import { catalogApi } from '../api/catalog';
import { socialApi } from '../api/social';
import { Layout } from '../components/Layout';
import { EncounterModal } from '../components/EncounterModal';
import { RunSocialSection } from '../components/RunSocialSection';
import { AuthContext } from '../contexts/AuthContext';
import type { RouteWithEncounterResponse, RunDetailResponse } from '../types/api';

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
}: {
  runId: string;
  runStatus: string;
  runVisibility: string;
  onConfirm: (action: 'COMPLETED' | 'ABANDONED') => void;
  onVisibilityModal: () => void;
}) {
  const [open, setOpen] = useState(false);

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
              onClick={() => { setOpen(false); onVisibilityModal(); }}
            >
              {VISIBILITY_LABELS[runVisibility] ?? '🌐 Visibilidad'}
            </button>
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

function BadgeModal({ run, onClose }: { run: RunDetailResponse; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: allBadges = [] } = useQuery({
    queryKey: ['catalog', 'badges', run.gameId],
    queryFn: () => catalogApi.badges(run.gameId).then(r => r.data),
  });

  const obtainedIds = new Set(run.badges.map(b => b.badgeId));
  const available = allBadges.filter(b => !obtainedIds.has(b.id));

  const obtainMut = useMutation({
    mutationFn: (badgeId: number) => runsApi.obtainBadge(run.id, badgeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs', run.id] });
      onClose();
    },
  });

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
                  onClick={() => obtainMut.mutate(b.id)}
                  disabled={obtainMut.isPending}
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
  const isOwner = auth?.user?.id === run.userId;
  const authLoading = !auth || auth.isLoading;

  const { data: subscribed = false } = useQuery({
    queryKey: ['runs', run.id, 'subscription'],
    queryFn: () => socialApi.isSubscribed(run.id).then(r => r.data),
    enabled: !isOwner && !authLoading,
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

  if (authLoading) return null;

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
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [activeRoute, setActiveRoute] = useState<RouteWithEncounterResponse | null>(null);
  const [badgeModal, setBadgeModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'COMPLETED' | 'ABANDONED' | null>(null);
  const [visModal, setVisModal] = useState(false);

  const { data: run } = useQuery({
    queryKey: ['runs', runId],
    queryFn:  () => runsApi.get(runId!).then(r => r.data),
    enabled:  !!runId,
  });

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['runs', runId, 'routes'],
    queryFn:  () => runsApi.routes(runId!).then(r => r.data),
    enabled:  !!runId,
  });

  const statusMut = useMutation({
    mutationFn: (status: string) => runsApi.update(runId!, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs', runId] });
      qc.invalidateQueries({ queryKey: ['runs'] });
      navigate('/runs');
    },
  });

  const removeBadgeMut = useMutation({
    mutationFn: (badgeId: number) => runsApi.deleteBadge(runId!, badgeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['runs', runId] }),
    onError: () => alert('Error al quitar la medalla. Intentá de nuevo.'),
  });

  const visMut = useMutation({
    mutationFn: (visibility: string) => runsApi.update(runId!, { visibility }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs', runId] });
      setVisModal(false);
    },
  });

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
              const cfg = OUTCOME_CONFIG[route.outcome] ?? OUTCOME_CONFIG['PENDING'];
              return (
                <button
                  key={route.routeId}
                  className="route-card"
                  onClick={() => setActiveRoute(route)}
                >
                  <div className="route-card-left">
                    <span className="route-name">{route.routeName}</span>
                    <span className="route-type">{ENCOUNTER_TYPE_LABELS[route.encounterType] ?? route.encounterType}</span>
                  </div>
                  <div className="route-card-right">
                    {route.caughtPokemon && (
                      <span className="route-pokemon">
                        {route.caughtPokemon.nickname ?? route.caughtPokemon.currentPokemonName}
                      </span>
                    )}
                    <span className="outcome-tag" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {runId && <RunSocialSection runId={runId} />}

      {badgeModal && run && (
        <BadgeModal run={run} onClose={() => setBadgeModal(false)} />
      )}

      {activeRoute && runId && (
        <EncounterModal
          route={activeRoute}
          runId={runId}
          activePokemonCount={run?.activePokemon ?? 0}
          nicknameRequired={run?.rules?.find(r => r.ruleType === 'NICKNAME_REQUIRED')?.enabled ?? false}
          firstEncounterOnly={run?.rules?.find(r => r.ruleType === 'FIRST_ENCOUNTER_ONLY')?.enabled ?? false}
          speciesClauseEnabled={run?.rules?.find(r => r.ruleType === 'SPECIES_CLAUSE')?.enabled ?? false}
          caughtChainIds={routes
            .filter(r => r.routeId !== activeRoute.routeId && r.outcome === 'CAPTURED' && r.caughtPokemon?.chainId != null)
            .map(r => r.caughtPokemon!.chainId as number)}
          onClose={() => setActiveRoute(null)}
        />
      )}

      {confirmModal}
      {visibilityModal}
    </Layout>
  );
}
