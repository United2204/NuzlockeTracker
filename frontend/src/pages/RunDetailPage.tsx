import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runsApi } from '../api/runs';
import { catalogApi } from '../api/catalog';
import { socialApi } from '../api/social';
import { Layout } from '../components/Layout';
import { EncounterModal } from '../components/EncounterModal';
import { RunSocialSection } from '../components/RunSocialSection';
import type { RouteWithEncounterResponse, RunDetailResponse } from '../types/api';

const OUTCOME_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:           { label: 'Pendiente',     color: '#6b7280' },
  DEFERRED:          { label: 'Postergado',    color: '#f59e0b' },
  CAPTURED:          { label: 'Capturado',     color: '#22c55e' },
  FAILED:            { label: 'Fallido',       color: '#ef4444' },
  DIED_IN_ENCOUNTER: { label: 'Murió',         color: '#ef4444' },
  NOT_FOUND:         { label: 'No encontrado', color: '#6b7280' },
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

function RunMenu({ runId, runStatus }: { runId: string; runStatus: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<'COMPLETED' | 'ABANDONED' | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: string) => runsApi.update(runId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs', runId] });
      qc.invalidateQueries({ queryKey: ['runs'] });
      navigate('/runs');
    },
  });

  if (runStatus !== 'ACTIVE') return null;

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-ghost" onClick={() => setOpen(o => !o)}>⋯</button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', right: 0, top: '100%', zIndex: 100,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 8, minWidth: 180, boxShadow: '0 4px 20px rgba(0,0,0,.4)',
          }}>
            <button
              className="btn btn-ghost btn-full"
              style={{ textAlign: 'left', color: 'var(--success)' }}
              onClick={() => { setOpen(false); setConfirm('COMPLETED'); }}
            >
              ✅ Completar run
            </button>
            <button
              className="btn btn-ghost btn-full"
              style={{ textAlign: 'left', color: 'var(--text-muted)' }}
              onClick={() => { setOpen(false); setConfirm('ABANDONED'); }}
            >
              🏳️ Abandonar run
            </button>
          </div>
        </>
      )}

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {confirm === 'COMPLETED' ? '✅ Completar run' : '🏳️ Abandonar run'}
              </h2>
              <button type="button" className="modal-close" onClick={() => setConfirm(null)} aria-label="Cerrar">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 20, color: 'var(--text-muted)' }}>
                {confirm === 'COMPLETED'
                  ? '¿Confirmás que terminaste esta run? Se guardará tu Hall of Fame.'
                  : '¿Seguro que querés abandonar esta run?'}
              </p>
              <div className="actions-row">
                <button
                  className={`btn ${confirm === 'COMPLETED' ? 'btn-success' : 'btn-danger'}`}
                  onClick={() => mutation.mutate(confirm)}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Guardando...' : 'Confirmar'}
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirm(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
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
  const qc = useQueryClient();

  const { data: subscribed = false } = useQuery({
    queryKey: ['runs', run.id, 'subscription'],
    queryFn: () => socialApi.isSubscribed(run.id).then(r => r.data),
  });

  const subMut = useMutation({
    mutationFn: () => subscribed ? socialApi.unsubscribe(run.id) : socialApi.subscribe(run.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['runs', run.id, 'subscription'] }),
  });

  const favMut = useMutation({
    mutationFn: () => run.favorite ? runsApi.update(run.id, { favorite: false }) : runsApi.update(run.id, { favorite: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs', run.id] });
      qc.invalidateQueries({ queryKey: ['runs'] });
    },
  });

  return (
    <div style={{ display: 'flex', gap: 8, padding: '0 16px 8px' }}>
      <button
        className={`btn ${run.favorite ? 'btn-primary' : 'btn-ghost'}`}
        style={{ flex: 1, fontSize: 13 }}
        onClick={() => favMut.mutate()}
        disabled={favMut.isPending}
      >
        {run.favorite ? '⭐ Favorita' : '☆ Favorita'}
      </button>
      <button
        className={`btn ${subscribed ? 'btn-primary' : 'btn-ghost'}`}
        style={{ flex: 1, fontSize: 13 }}
        onClick={() => subMut.mutate()}
        disabled={subMut.isPending}
      >
        {subscribed ? '🔔 Suscripto' : '🔕 Suscribirse'}
      </button>
    </div>
  );
}

export function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const [activeRoute, setActiveRoute] = useState<RouteWithEncounterResponse | null>(null);
  const [badgeModal, setBadgeModal] = useState(false);

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

  const groups = groupByBadge(routes);

  return (
    <Layout
      title={run?.name ?? 'Run'}
      back="/runs"
      runId={runId}
      action={run && runId ? <RunMenu runId={runId} runStatus={run.status} /> : undefined}
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
            <div key={b.badgeId} className="badge-chip" title={b.badgeName}>
              🏅 {b.badgeName}
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
                    <span className="route-type">{route.encounterType.toLowerCase()}</span>
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
          onClose={() => setActiveRoute(null)}
        />
      )}
    </Layout>
  );
}
