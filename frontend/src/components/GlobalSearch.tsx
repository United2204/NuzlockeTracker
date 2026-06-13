import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalogApi } from '../api/catalog';
import { socialApi, type PublicProfile } from '../api/social';
import type { PokemonSearchResponse } from '../types/api';
import { typeColor } from '../utils/pokemonTypes';
import { useAuth } from '../hooks/useAuth';
import { PokemonDetailCard } from './PokemonDetailCard';

// Map from chainId (or pokemonId when chain is null) → best status
interface Props {
  caughtByChainId: Map<number, string>;
  caughtByPokemonId: Map<number, string>;
}

const STATUS_CONFIG: Record<string, { emoji: string; key: string; bg: string; color: string }> = {
  ACTIVE:  { emoji: '●', key: 'ACTIVE',  bg: 'rgba(22,163,74,.12)',   color: '#16a34a' },
  BOXED:   { emoji: '●', key: 'BOXED',   bg: 'rgba(217,119,6,.12)',   color: '#d97706' },
  FAINTED: { emoji: '💀', key: 'FAINTED', bg: 'rgba(220,38,38,.12)',   color: '#dc2626' },
};

export function GlobalSearch({ caughtByChainId, caughtByPokemonId }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [pokemonResults, setPokemonResults] = useState<PokemonSearchResponse[]>([]);
  const [userResults, setUserResults] = useState<PublicProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonSearchResponse | null>(null);
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
      setSelectedPokemon(null);
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

  // Returns best status for this Pokémon (considers full evo chain via chainId)
  function getCaughtStatus(p: PokemonSearchResponse): string | null {
    if (p.chainId != null) {
      const s = caughtByChainId.get(p.chainId);
      if (s) return s;
    }
    return caughtByPokemonId.get(p.id) ?? null;
  }

  function selectPokemon(p: PokemonSearchResponse) {
    setSelectedPokemon(p);
    setOpen(false);
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
          onChange={e => setQuery(e.target.value)}
          onFocus={() => hasResults && setOpen(true)}
          placeholder={t('search.global')}
          autoComplete="off"
        />
        {loading && <span className="global-search-spinner" />}
        {query && !loading && (
          <button
            type="button"
            className="search-clear global-search-clear"
            onClick={() => { setQuery(''); setOpen(false); }}
            aria-label={t('search.clearSearch')}
          >✕</button>
        )}
      </div>

      {selectedPokemon && !open && (
        <div className="global-search-pokemon-detail">
          <PokemonDetailCard pokemonId={selectedPokemon.id} />
        </div>
      )}

      {open && hasResults && (
        <div className="global-search-dropdown">
          {pokemonResults.length > 0 && (
            <>
              <div className="search-section-label">{t('search.sectionPokemon')}</div>
              {pokemonResults.map(p => {
                const status = getCaughtStatus(p);
                const cfg = status ? STATUS_CONFIG[status] : null;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="search-item search-item--pokemon"
                    onClick={() => selectPokemon(p)}
                  >
                    {p.spriteUrl
                      ? <img src={p.spriteUrl} alt={p.name} className="search-sprite" />
                      : <div className="search-sprite-placeholder" />
                    }
                    <span className="search-name">{p.name}</span>
                    <div className="type-badges search-types">
                      {p.types.map(type => (
                        <span key={type} className="type-badge" style={{ background: typeColor(type) }}>{type}</span>
                      ))}
                    </div>
                    {cfg && (
                      <span
                        className="caught-badge"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.emoji} {t(`search.status.${cfg.key}`)}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {userResults.length > 0 && (
            <>
              <div className="search-section-label">{t('search.sectionUsers')}</div>
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
                    <span className="search-user-followers">{u.followerCount} {t('search.followers')}</span>
                  </button>
                  {user && !u.isBlocked && (
                    <button
                      type="button"
                      className={`btn ${followingState[u.userId] ? 'btn-ghost' : 'btn-primary'} search-follow-btn`}
                      onClick={() => void toggleFollow(u.userId)}
                    >
                      {followingState[u.userId] ? t('search.following') : t('btn.follow')}
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
