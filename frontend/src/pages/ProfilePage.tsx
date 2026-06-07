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
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['me', 'stats'],
    queryFn:  () => statsApi.getUserStats().then(r => r.data),
  });

  return (
    <Layout title="Mi perfil" back="/runs">
      <div className="page-content">
        {user && (
          <div className="profile-header">
            <div className="profile-avatar">{user.username.charAt(0).toUpperCase()}</div>
            <div>
              <p className="profile-username">{user.username}</p>
              <p className="profile-email" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {user.email}
              </p>
            </div>
          </div>
        )}

        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {data && (
          <>
            {/* Runs */}
            <section className="stats-section">
              <h3 className="stats-section-title">Runs</h3>
              <div className="stat-cards-grid">
                <StatCard label="Total"       value={data.totalRuns} />
                <StatCard label="Activas"     value={data.activeRuns}    color="var(--info)" />
                <StatCard label="Completadas" value={data.completedRuns} color="var(--success)" />
                <StatCard label="Game Over"   value={data.gameOverRuns}  color="var(--danger)" />
              </div>
            </section>

            {/* Global */}
            <section className="stats-section">
              <h3 className="stats-section-title">Historial global</h3>
              <div className="stat-cards-grid">
                <StatCard label="Capturas totales" value={data.totalCaptures} color="var(--success)" />
                <StatCard label="Muertes totales"  value={data.totalDeaths}   color="var(--danger)" />
              </div>
            </section>

            {/* Más capturados */}
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
