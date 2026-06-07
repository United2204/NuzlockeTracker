import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { runsApi } from '../api/runs';
import { Layout } from '../components/Layout';
import { EncounterModal } from '../components/EncounterModal';
import type { RouteWithEncounterResponse } from '../types/api';

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
    if (group) {
      group.push(r);
    } else {
      groups.set(key, [r]);
    }
  }
  return groups;
}

export function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const [activeRoute, setActiveRoute] = useState<RouteWithEncounterResponse | null>(null);

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
    <Layout title={run?.name ?? 'Run'} back="/runs" runId={runId}>
      {run && (
        <div className="run-stats-bar">
          <span>⚔️ {run.activePokemon}</span>
          <span>📦 {run.boxedPokemon}</span>
          <span>💀 {run.faintedPokemon}</span>
          <span className="run-game-label">{run.gameName}{run.gameVersion ? ` · ${run.gameVersion}` : ''}</span>
        </div>
      )}

      {run && run.badges.length > 0 && (
        <div className="badges-row">
          {run.badges.map(b => (
            <div key={b.badgeId} className="badge-chip" title={b.badgeName}>
              🏅 {b.badgeName}
            </div>
          ))}
        </div>
      )}

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
