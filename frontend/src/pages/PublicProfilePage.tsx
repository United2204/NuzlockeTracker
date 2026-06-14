import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '../api/social';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE:    'Activa',
  COMPLETED: 'Completada',
  GAME_OVER: 'Game Over',
  ABANDONED: 'Abandonada',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    'var(--success)',
  COMPLETED: 'var(--info)',
  GAME_OVER: 'var(--danger)',
  ABANDONED: 'var(--text-muted)',
};

const VISIBILITY_ICON: Record<string, string> = {
  PUBLIC:         '🌐',
  FOLLOWERS_ONLY: '👥',
  PRIVATE:        '🔒',
};

const VISIBILITY_LABEL: Record<string, string> = {
  PUBLIC:         'Pública',
  FOLLOWERS_ONLY: 'Solo seguidores',
  PRIVATE:        'Privada',
};

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn:  () => socialApi.getPublicProfile(username!).then(r => r.data),
    enabled:  !!username,
  });

  const { data: runs = [] } = useQuery({
    queryKey: ['profile', username, 'runs'],
    queryFn:  () => socialApi.getUserRuns(username!).then(r => r.data),
    enabled:  !!username,
  });

  const isOwnProfile = user?.username === username;

  const followMut = useMutation({
    mutationFn: () => data?.isFollowing
      ? socialApi.unfollow(data.userId)
      : socialApi.follow(data!.userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', username] }),
  });

  const blockMut = useMutation({
    mutationFn: () => data?.isBlocked
      ? socialApi.unblock(data.userId)
      : socialApi.block(data!.userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', username] }),
  });

  return (
    <Layout title={username ?? 'Perfil'} back="/feed">
      <div className="page-content">
        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {data && (
          <>
            <div className="profile-header">
              <div className="profile-avatar">
                {data.avatarUrl
                  ? <img src={data.avatarUrl} alt={data.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : data.username.charAt(0).toUpperCase()
                }
              </div>
              <div>
                <p className="profile-username">
                  {data.username}
                  {data.isVerified && <span className="verified-badge" title="Verificado"> ✓</span>}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                  {data.followerCount} seguidores · {data.followingCount} siguiendo
                </p>
              </div>
            </div>

            {!isOwnProfile && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  className={`btn ${data.isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ flex: 1 }}
                  onClick={() => followMut.mutate()}
                  disabled={followMut.isPending}
                >
                  {data.isFollowing ? 'Dejar de seguir' : 'Seguir'}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => blockMut.mutate()}
                  disabled={blockMut.isPending}
                >
                  {data.isBlocked ? 'Desbloquear' : 'Bloquear'}
                </button>
              </div>
            )}

            {runs.length > 0 && (
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-h)', marginBottom: 10 }}>
                  Runs
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {runs.map(run => (
                    <Link
                      key={run.id}
                      to={`/runs/${run.id}`}
                      className="run-card"
                      style={{ display: 'block', textDecoration: 'none' }}
                    >
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
                        {run.visibility && run.visibility !== 'PUBLIC' && (
                          <span
                            title={VISIBILITY_LABEL[run.visibility] ?? run.visibility}
                            style={{ marginLeft: 'auto', fontSize: 14 }}
                          >
                            {VISIBILITY_ICON[run.visibility]}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {runs.length === 0 && !isLoading && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginTop: 24 }}>
                No hay runs públicas todavía.
              </p>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
