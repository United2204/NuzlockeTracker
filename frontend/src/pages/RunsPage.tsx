import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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

  const { data, isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => runsApi.list().then(r => r.data),
  });

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

        {!isLoading && data?.length === 0 && (
          <div className="empty-state">
            <p>Todavía no tenés runs.</p>
            <Link to="/runs/new" className="btn btn-primary">Crear tu primera run</Link>
          </div>
        )}

        <div className="runs-list">
          {data?.map(run => (
            <Link key={run.id} to={`/runs/${run.id}`} className="run-card">
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
          ))}
        </div>
      </div>
    </Layout>
  );
}
