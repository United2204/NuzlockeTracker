import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    <Layout title={t('myProfile.title')} back="/runs">
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
            {t('myProfile.settings')}
          </button>
          <button
            className="btn btn-ghost btn-full"
            style={{ textAlign: 'left', padding: '12px 0', color: 'var(--danger)', borderRadius: 0 }}
            onClick={handleLogout}
          >
            {t('myProfile.logout')}
          </button>
        </div>

        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {data && (
          <>
            <section className="stats-section">
              <h3 className="stats-section-title">{t('myProfile.runsSection')}</h3>
              <div className="stat-cards-grid">
                <StatCard label={t('myProfile.stat.total')}     value={data.totalRuns} />
                <StatCard label={t('myProfile.stat.active')}    value={data.activeRuns}    color="var(--info)" />
                <StatCard label={t('myProfile.stat.completed')} value={data.completedRuns} color="var(--success)" />
                <StatCard label={t('myProfile.stat.gameOver')}  value={data.gameOverRuns}  color="var(--danger)" />
              </div>
            </section>

            <section className="stats-section">
              <h3 className="stats-section-title">{t('myProfile.statsSection')}</h3>
              <div className="stat-cards-grid">
                <StatCard label={t('myProfile.stat.totalCaptures')} value={data.totalCaptures} color="var(--success)" />
                <StatCard label={t('myProfile.stat.totalDeaths')}   value={data.totalDeaths}   color="var(--danger)" />
              </div>
            </section>

            {data.mostCaught.length > 0 && (
              <section className="stats-section">
                <h3 className="stats-section-title">{t('myProfile.mostCaught')}</h3>
                <div className="stats-list">
                  {data.mostCaught.map((entry, i) => (
                    <MostCaughtRow key={entry.pokemonId} entry={entry} rank={i + 1} />
                  ))}
                </div>
              </section>
            )}

            {data.totalCaptures === 0 && (
              <div className="empty-state">
                <p>{t('myProfile.noCaptures')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
