import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runsApi } from '../api/runs';
import { guestStore } from '../services/guestStore';
import { Layout } from '../components/Layout';
import { GlobalSearch } from '../components/GlobalSearch';
import { useAuth } from '../hooks/useAuth';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE:    'Activa',
  COMPLETED: 'Completada',
  GAME_OVER: 'Game Over',
  ABANDONED: 'Abandonada',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    '#22c55e',
  COMPLETED: '#3b82f6',
  GAME_OVER: '#ef4444',
  ABANDONED: '#6b7280',
};

const ACTIVE_RUN_KEY = 'nuzlocke_active_run_id';

export function RunsPage() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_RUN_KEY),
  );

  const apiQuery = useQuery({
    queryKey: ['runs'],
    queryFn: () => runsApi.list().then(r => r.data),
    enabled: !!user,
  });

  const guestQuery = useQuery({
    queryKey: ['guest', 'runs'],
    queryFn: () => guestStore.listRuns(),
    enabled: !user,
  });

  const { data = [], isLoading } = user ? apiQuery : guestQuery;

  // Fetch all caught Pokémon (team + box + graveyard) for the active run
  const { data: allCaught = [] } = useQuery({
    queryKey: ['all-caught', activeRunId],
    queryFn: async () => {
      const [team, box, grave] = await Promise.all([
        runsApi.team(activeRunId!).then(r => r.data),
        runsApi.box(activeRunId!).then(r => r.data),
        runsApi.graveyard(activeRunId!).then(r => r.data),
      ]);
      return [...team, ...box, ...grave];
    },
    enabled: !!activeRunId && !!user,
    staleTime: 30_000,
  });

  const caughtChainIds = useMemo(
    () => new Set(allCaught.map(p => p.chainId).filter(Boolean) as number[]),
    [allCaught],
  );
  const caughtPokemonIds = useMemo(
    () => new Set(allCaught.map(p => p.originalPokemonId)),
    [allCaught],
  );

  const archiveMut = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      if (user) { await runsApi.update(id, { archived }); }
      else { await guestStore.updateRun(id, { archived }); }
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: ['runs'] });
      else qc.invalidateQueries({ queryKey: ['guest', 'runs'] });
    },
  });

  function toggleActiveRun(id: string) {
    if (activeRunId === id) {
      localStorage.removeItem(ACTIVE_RUN_KEY);
      setActiveRunId(null);
    } else {
      localStorage.setItem(ACTIVE_RUN_KEY, id);
      setActiveRunId(id);
    }
  }

  // Clear active run if it no longer exists in the list
  if (activeRunId && data.length > 0 && !data.find(r => r.id === activeRunId)) {
    localStorage.removeItem(ACTIVE_RUN_KEY);
    setActiveRunId(null);
  }

  const visible  = data.filter(r => !r.archived);
  const archived = data.filter(r => r.archived);

  const sorted = [
    ...visible.filter(r => r.favorite),
    ...visible.filter(r => !r.favorite),
  ];

  function RunCard({ run, showArchiveLabel = true }: { run: typeof sorted[0]; showArchiveLabel?: boolean }) {
    const isActive = activeRunId === run.id;
    return (
      <div
        key={run.id}
        className={`run-card-wrapper${isActive ? ' run-card-wrapper--active' : ''}`}
      >
        <Link
          to={`/runs/${run.id}`}
          className={`run-card${isActive ? ' run-card--active' : ''}`}
        >
          <div className="run-card-header">
            <div>
              <div className="run-name">
                {run.favorite && <span style={{ marginRight: 6 }}>⭐</span>}
                {run.name}
              </div>
              <div className="run-game">
                {run.gameName}{run.gameVersion ? ` · ${run.gameVersion}` : ''}
              </div>
            </div>
            <span
              className="status-badge"
              style={{ background: STATUS_COLOR[run.status] ?? '#888' }}
            >
              {STATUS_LABEL[run.status] ?? run.status}
            </span>
          </div>
          <div className="run-card-stats">
            <span>⚔️ {run.activePokemon} activos</span>
            <span>💀 {run.faintedPokemon} muertos</span>
          </div>
          {isActive && (
            <div className="active-run-chip">📍 Run activa para búsqueda</div>
          )}
        </Link>
        <div className="run-card-actions">
          <button
            className={`btn run-pin-btn${isActive ? ' run-pin-btn--active' : ''}`}
            onClick={() => toggleActiveRun(run.id)}
            title={isActive ? 'Desactivar como run activa' : 'Definir como run activa para búsqueda'}
          >
            📍{isActive ? ' Activa' : ''}
          </button>
          {showArchiveLabel ? (
            <button
              className="btn btn-ghost run-archive-btn"
              onClick={() => archiveMut.mutate({ id: run.id, archived: true })}
              disabled={archiveMut.isPending}
              title="Archivar run"
            >
              📦 Archivar
            </button>
          ) : (
            <button
              className="btn btn-ghost run-archive-btn"
              onClick={() => archiveMut.mutate({ id: run.id, archived: false })}
              disabled={archiveMut.isPending}
              title="Desarchivar run"
            >
              ↩ Desarchivar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout
      title={user ? `@${user.username}` : 'Mis Runs'}
      action={user ? (
        <button className="btn btn-ghost" onClick={logout}>Salir</button>
      ) : undefined}
    >
      <div className="page-content">
        <GlobalSearch caughtChainIds={caughtChainIds} caughtPokemonIds={caughtPokemonIds} />

        <div className="page-header">
          <h2>Mis Runs</h2>
          <Link to="/runs/new" className="btn btn-primary">+ Nueva</Link>
        </div>

        {!user && (
          <div style={{
            background: 'var(--accent-bg)', border: '1px solid var(--accent)',
            borderRadius: 10, padding: '12px 16px',
            fontSize: 13, color: 'var(--text-muted)',
          }}>
            Tus runs se guardan en este dispositivo.{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Creá una cuenta
            </Link>{' '}
            para sincronizarlas en la nube y acceder desde cualquier lugar.
          </div>
        )}

        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {!isLoading && data.length === 0 && (
          <div className="empty-state">
            <p>Todavía no tenés runs.</p>
            <Link to="/runs/new" className="btn btn-primary">Crear tu primera run</Link>
          </div>
        )}

        <div className="runs-list">
          {sorted.map(run => <RunCard key={run.id} run={run} />)}
        </div>

        {archived.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <button
              className="btn btn-ghost btn-full"
              style={{ color: 'var(--text-muted)', fontSize: 13 }}
              onClick={() => setShowArchived(v => !v)}
            >
              {showArchived ? '▲' : '▼'} Archivadas ({archived.length})
            </button>

            {showArchived && (
              <div className="runs-list" style={{ marginTop: 8, opacity: 0.7 }}>
                {archived.map(run => <RunCard key={run.id} run={run} showArchiveLabel={false} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
