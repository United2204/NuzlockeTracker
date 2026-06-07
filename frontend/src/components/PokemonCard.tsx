import type { CaughtPokemonResponse } from '../types/api';
import { typeColor } from '../utils/pokemonTypes';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE:  'Activo',
  BOXED:   'Box',
  FAINTED: 'Muerto',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:  '#22c55e',
  BOXED:   '#3b82f6',
  FAINTED: '#ef4444',
};

interface Props {
  pokemon: CaughtPokemonResponse;
  onClick?: () => void;
  selected?: boolean;
}

export function PokemonCard({ pokemon, onClick, selected }: Props) {
  const displayName = pokemon.nickname
    ? `${pokemon.nickname}`
    : pokemon.currentPokemonName;

  const speciesLabel = pokemon.nickname ? pokemon.currentPokemonName : null;

  return (
    <div
      className={`pokemon-card${selected ? ' selected' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="pokemon-sprite">
        {pokemon.currentPokemonSpriteUrl ? (
          <img src={pokemon.currentPokemonSpriteUrl} alt={pokemon.currentPokemonName} />
        ) : (
          <div className="sprite-placeholder">?</div>
        )}
        {pokemon.shiny && <span className="shiny-badge">✨</span>}
      </div>
      <div className="pokemon-info">
        <div className="pokemon-name">{displayName}</div>
        {speciesLabel && <div className="pokemon-species">{speciesLabel}</div>}
        <div className="pokemon-meta">
          <div className="type-badges">
            {pokemon.currentPokemonTypes.map(type => (
              <span
                key={type}
                className="type-badge"
                style={{ background: typeColor(type) }}
              >
                {type}
              </span>
            ))}
          </div>
          <span
            className="status-badge"
            style={{ background: STATUS_COLOR[pokemon.status] ?? '#888' }}
          >
            {STATUS_LABEL[pokemon.status] ?? pokemon.status}
          </span>
        </div>
        <div className="pokemon-route">📍 {pokemon.routeName}</div>
      </div>
    </div>
  );
}
