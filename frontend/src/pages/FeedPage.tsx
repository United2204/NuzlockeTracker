import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { socialApi, type FeedEvent } from '../api/social';
import { Layout } from '../components/Layout';

const EVENT_LABELS: Record<string, string> = {
  POKEMON_CAPTURED: '¡Capturó un Pokémon!',
  POKEMON_EVOLVED:  '¡Evolucionó un Pokémon!',
  POKEMON_FAINTED:  'Un Pokémon cayó...',
  BADGE_OBTAINED:   '¡Obtuvo una medalla!',
  RUN_ENDED:        '¡Run terminada!',
};

const EVENT_COLORS: Record<string, string> = {
  POKEMON_CAPTURED: 'var(--success)',
  POKEMON_EVOLVED:  'var(--info)',
  POKEMON_FAINTED:  'var(--danger)',
  BADGE_OBTAINED:   'var(--warning, #f59e0b)',
  RUN_ENDED:        'var(--accent)',
};

function FeedCard({ event }: { event: FeedEvent }) {
  const date = new Date(event.occurredAt).toLocaleDateString('es', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  let pokemonName = '';
  try {
    const payload = JSON.parse(event.payload);
    pokemonName = payload.pokemonName ?? payload.toPokemonName ?? '';
  } catch { /* noop */ }

  return (
    <div className="feed-card">
      <div className="feed-card-header">
        <Link to={`/u/${event.username}`} className="feed-username">
          @{event.username}
        </Link>
        <span className="feed-date">{date}</span>
      </div>
      <div className="feed-event-label" style={{ color: EVENT_COLORS[event.eventType] }}>
        {EVENT_LABELS[event.eventType] ?? event.eventType}
      </div>
      {pokemonName && (
        <div className="feed-pokemon-name">{pokemonName}</div>
      )}
      <div className="feed-run-link">
        en <Link to={`/runs/${event.runId}`} className="link-subtle">{event.runName}</Link>
      </div>
    </div>
  );
}

export function FeedPage() {
  const [tab, setTab] = useState<'public' | 'following'>('public');

  const publicQ = useQuery({
    queryKey: ['feed', 'public'],
    queryFn:  () => socialApi.getPublicFeed().then(r => r.data),
    enabled:  tab === 'public',
  });

  const followingQ = useQuery({
    queryKey: ['feed', 'following'],
    queryFn:  () => socialApi.getFollowingFeed().then(r => r.data),
    enabled:  tab === 'following',
  });

  const { data, isLoading } = tab === 'public' ? publicQ : followingQ;

  return (
    <Layout title="Feed">
      <div className="page-content">
        <div className="tab-bar">
          <button
            className={`tab-btn ${tab === 'public' ? 'active' : ''}`}
            onClick={() => setTab('public')}
          >
            Global
          </button>
          <button
            className={`tab-btn ${tab === 'following' ? 'active' : ''}`}
            onClick={() => setTab('following')}
          >
            Siguiendo
          </button>
        </div>

        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {data && data.length === 0 && (
          <div className="empty-state">
            <p>
              {tab === 'following'
                ? 'Seguí a otros jugadores para ver su actividad aquí.'
                : 'No hay actividad pública aún.'}
            </p>
          </div>
        )}

        {data && data.map(e => <FeedCard key={e.eventId} event={e} />)}
      </div>
    </Layout>
  );
}
