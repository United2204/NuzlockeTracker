import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { catalogApi } from '../api/catalog';
import type { PokemonSearchResponse } from '../types/api';
import { typeColor, typeLabel } from '../utils/pokemonTypes';
import { PokemonDetailCard } from './PokemonDetailCard';

interface Props {
  onSelect: (pokemon: PokemonSearchResponse) => void;
  placeholder?: string;
  initialPokemon?: PokemonSearchResponse | null;
}

export function PokemonSearch({ onSelect, placeholder, initialPokemon }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialPokemon?.name ?? '');
  const [results, setResults] = useState<PokemonSearchResponse[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PokemonSearchResponse | null>(initialPokemon ?? null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected) return;
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await catalogApi.searchPokemon(query);
        setResults(res.data);
        setOpen(res.data.length > 0);
      } catch {
        setResults([]);
      }
    }, 300);
  }, [query, selected]);

  function pick(p: PokemonSearchResponse) {
    setSelected(p);
    setQuery(p.name);
    setOpen(false);
    onSelect(p);
  }

  function clear() {
    setSelected(null);
    setQuery('');
    setResults([]);
  }

  return (
    <div className="pokemon-search">
      <div className="search-input-wrap">
        <input
          className="form-input"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null); }}
          placeholder={placeholder ?? t('search.pokemon')}
          autoComplete="off"
        />
        {selected && (
          <button type="button" className="search-clear" onClick={clear} aria-label="Limpiar">✕</button>
        )}
      </div>
      {open && (
        <div className="search-dropdown">
          {results.map(p => (
            <button key={p.id} type="button" className="search-item" onClick={() => pick(p)}>
              {p.spriteUrl && <img src={p.spriteUrl} alt={p.name} className="search-sprite" />}
              <span className="search-name">{p.name}</span>
              <div className="type-badges">
                {p.types.map(typeName => (
                  <span key={typeName} className="type-badge" style={{ background: typeColor(typeName) }}>{typeLabel(typeName, t)}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
      {selected && <PokemonDetailCard pokemonId={selected.id} />}
    </div>
  );
}
