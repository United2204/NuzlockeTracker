import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { statsApi, type MostCaughtEntry } from '../api/stats';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="stat-card">
      <span className="stat-value" style={color ? { color } : undefined}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function MostCaughtRow({ entry, rank }: { entry: MostCaughtEntry; rank: number }) {
  return (
    <div className="stats-row">
      <span className="stats-rank">#{rank}</span>
      {entry.spriteUrl && (
        <img src={entry.spriteUrl} alt="" className="stats-sprite" />
      )}
      <div className="stats-row-info">
        <span className="stats-row-name">{entry.name}</span>
      </div>
      <span className="stats-row-time">{entry.count}×</span>
    </div>
  );
}

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['me', 'stats'],
    queryFn:  () => statsApi.getUserStats().then(r => r.data),
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout title="Mi perfil" back="/runs">
      <div className="page-content">
        {user && (
          <div className="profile-header">
            <div className="profile-avatar">{user.username.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <p className="profile-username">{user.username}</p>
              <p className="profile-email" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
          <button
            className="btn btn-ghost btn-full"
            style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid var(--border)', borderRadius: 0 }}
            onClick={() => navigate('/settings')}
          >
            ⚙️ Configuración
          </button>
          <button
            className="btn btn-ghost btn-full"
            style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid var(--border)', borderRadius: 0 }}
            onClick={() => navigate('/me/contributions')}
          >
            📦 Mis contribuciones
          </button>
          <button
            className="btn btn-ghost btn-full"
            style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid var(--border)', borderRadius: 0 }}
            onClick={() => navigate('/contributions/new')}
          >
            ➕ Enviar contribución
          </button>
          {user?.role === 'ADMIN' && (
            <button
              className="btn btn-ghost btn-full"
              style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid var(--border)', borderRadius: 0, color: 'var(--accent)' }}
              onClick={() => navigate('/admin/contributions')}
            >
              🛡️ Panel admin — Contribuciones
            </button>
          )}
          <button
            className="btn btn-ghost btn-full"
            style={{ textAlign: 'left', padding: '12px 0', color: 'var(--danger)', borderRadius: 0 }}
            onClick={handleLogout}
          >
            🚪 Cerrar sesión
          </button>
        </div>

        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {data && (
          <>
            <section className="stats-section">
              <h3 className="stats-section-title">Runs</h3>
              <div className="stat-cards-grid">
                <StatCard label="Total"       value={data.totalRuns} />
                <StatCard label="Activas"     value={data.activeRuns}    color="var(--info)" />
                <StatCard label="Completadas" value={data.completedRuns} color="var(--success)" />
                <StatCard label="Game Over"   value={data.gameOverRuns}  color="var(--danger)" />
              </div>
            </section>

            <section className="stats-section">
              <h3 className="stats-section-title">Historial global</h3>
              <div className="stat-cards-grid">
                <StatCard label="Capturas totales" value={data.totalCaptures} color="var(--success)" />
                <StatCard label="Muertes totales"  value={data.totalDeaths}   color="var(--danger)" />
              </div>
            </section>

            {data.mostCaught.length > 0 && (
              <section className="stats-section">
                <h3 className="stats-section-title">Pokémon más capturados</h3>
                <div className="stats-list">
                  {data.mostCaught.map((entry, i) => (
                    <MostCaughtRow key={entry.pokemonId} entry={entry} rank={i + 1} />
                  ))}
                </div>
              </section>
            )}

            {data.totalCaptures === 0 && (
              <div className="empty-state">
                <p>Todavía no registraste capturas en ninguna run.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
