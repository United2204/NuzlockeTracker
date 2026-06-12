import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi } from '../api/catalog';
import { socialApi, type PublicProfile } from '../api/social';
import type { PokemonSearchResponse } from '../types/api';
import { typeColor } from '../utils/pokemonTypes';
import { useAuth } from '../hooks/useAuth';

interface Props {
  caughtChainIds: Set<number>;
  caughtPokemonIds: Set<number>;
}

export function GlobalSearch({ caughtChainIds, caughtPokemonIds }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [pokemonResults, setPokemonResults] = useState<PokemonSearchResponse[]>([]);
  const [userResults, setUserResults] = useState<PublicProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setPokemonResults([]);
      setUserResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [pokRes, userRes] = await Promise.all([
          catalogApi.searchPokemon(query).then(r => r.data).catch(() => [] as PokemonSearchResponse[]),
          socialApi.searchUsers(query).then(r => r.data).catch(() => [] as PublicProfile[]),
        ]);
        setPokemonResults(pokRes);
        setUserResults(userRes);
        setFollowingState(prev => {
          const next = { ...prev };
          userRes.forEach(u => { next[u.userId] = u.isFollowing; });
          return next;
        });
        setOpen(pokRes.length > 0 || userRes.length > 0);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  async function toggleFollow(userId: string) {
    const current = followingState[userId];
    setFollowingState(prev => ({ ...prev, [userId]: !current }));
    try {
      if (current) await socialApi.unfollow(userId);
      else await socialApi.follow(userId);
    } catch {
      setFollowingState(prev => ({ ...prev, [userId]: current }));
    }
  }

  function isCaught(p: PokemonSearchResponse): boolean {
    if (p.chainId != null && caughtChainIds.has(p.chainId)) return true;
    return caughtPokemonIds.has(p.id);
  }

  function goToProfile(username: string) {
    setOpen(false);
    setQuery('');
    navigate(`/u/${username}`);
  }

  const hasResults = pokemonResults.length > 0 || userResults.length > 0;

  return (
    <div className="global-search" ref={containerRef}>
      <div className="global-search-input-wrap">
        <span className="global-search-icon">🔍</span>
        <input
          className="global-search-input"
          value={query}
          onChange={e => { setQuery(e.target.value); }}
          onFocus={() => hasResults && setOpen(true)}
          placeholder="Buscar Pokémon o usuario..."
          autoComplete="off"
        />
        {loading && <span className="global-search-spinner" />}
        {query && !loading && (
          <button
            type="button"
            className="search-clear global-search-clear"
            onClick={() => { setQuery(''); setOpen(false); }}
            aria-label="Limpiar búsqueda"
          >✕</button>
        )}
      </div>

      {open && hasResults && (
        <div className="global-search-dropdown">
          {pokemonResults.length > 0 && (
            <>
              <div className="search-section-label">Pokémon</div>
              {pokemonResults.map(p => (
                <div key={p.id} className="search-item search-item--pokemon">
                  {p.spriteUrl
                    ? <img src={p.spriteUrl} alt={p.name} className="search-sprite" />
                    : <div className="search-sprite-placeholder" />
                  }
                  <span className="search-name">{p.name}</span>
                  <div className="type-badges search-types">
                    {p.types.map(t => (
                      <span key={t} className="type-badge" style={{ background: typeColor(t) }}>{t}</span>
                    ))}
                  </div>
                  {isCaught(p) && (
                    <span className="caught-badge">✓ Capturado</span>
                  )}
                </div>
              ))}
            </>
          )}

          {userResults.length > 0 && (
            <>
              <div className="search-section-label">Usuarios</div>
              {userResults.map(u => (
                <div key={u.userId} className="search-item search-item--user">
                  <button
                    type="button"
                    className="search-user-btn"
                    onClick={() => goToProfile(u.username)}
                  >
                    <span className="search-user-name">
                      @{u.username}
                      {u.isVerified && <span className="verified-badge">✓</span>}
                    </span>
                    <span className="search-user-followers">{u.followerCount} seguidores</span>
                  </button>
                  {user && !u.isBlocked && (
                    <button
                      type="button"
                      className={`btn ${followingState[u.userId] ? 'btn-ghost' : 'btn-primary'} search-follow-btn`}
                      onClick={() => void toggleFollow(u.userId)}
                    >
                      {followingState[u.userId] ? 'Siguiendo' : 'Seguir'}
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
