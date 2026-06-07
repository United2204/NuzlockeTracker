import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '../api/social';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn:  () => socialApi.getPublicProfile(username!).then(r => r.data),
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
              <div className="profile-avatar">{data.username.charAt(0).toUpperCase()}</div>
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
          </>
        )}
      </div>
    </Layout>
  );
}
