import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runsApi } from '../api/runs';
import { Layout } from '../components/Layout';
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

export function RunsPage() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => runsApi.list().then(r => r.data),
  });

  const archiveMut = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      runsApi.update(id, { archived }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['runs'] }),
  });

  const visible = data.filter(r => !r.archived);
  const archived = data.filter(r => r.archived);

  const sorted = [
    ...visible.filter(r => r.favorite),
    ...visible.filter(r => !r.favorite),
  ];

  return (
    <Layout
      title={`@${user?.username ?? '...'}`}
      action={
        <button className="btn btn-ghost" onClick={logout}>Salir</button>
      }
    >
      <div className="page-content">
        <div className="page-header">
          <h2>Mis Runs</h2>
          <Link to="/runs/new" className="btn btn-primary">+ Nueva</Link>
        </div>

        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {!isLoading && data.length === 0 && (
          <div className="empty-state">
            <p>Todavía no tenés runs.</p>
            <Link to="/runs/new" className="btn btn-primary">Crear tu primera run</Link>
          </div>
        )}

        <div className="runs-list">
          {sorted.map(run => (
            <div key={run.id} style={{ position: 'relative' }}>
              <Link to={`/runs/${run.id}`} className="run-card">
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
              </Link>
              <button
                className="btn btn-ghost"
                style={{
                  position: 'absolute', bottom: 8, right: 8,
                  fontSize: 11, padding: '2px 8px', color: 'var(--text-muted)',
                }}
                onClick={() => archiveMut.mutate({ id: run.id, archived: true })}
                disabled={archiveMut.isPending}
                title="Archivar run"
              >
                📦 Archivar
              </button>
            </div>
          ))}
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
                {archived.map(run => (
                  <div key={run.id} style={{ position: 'relative' }}>
                    <Link to={`/runs/${run.id}`} className="run-card">
                      <div className="run-card-header">
                        <div>
                          <div className="run-name">{run.name}</div>
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
                    </Link>
                    <button
                      className="btn btn-ghost"
                      style={{
                        position: 'absolute', bottom: 8, right: 8,
                        fontSize: 11, padding: '2px 8px', color: 'var(--text-muted)',
                      }}
                      onClick={() => archiveMut.mutate({ id: run.id, archived: false })}
                      disabled={archiveMut.isPending}
                      title="Desarchivar run"
                    >
                      ↩ Desarchivar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
