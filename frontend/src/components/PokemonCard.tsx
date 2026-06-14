import { useTranslation } from 'react-i18next';
import type { CaughtPokemonResponse } from '../types/api';
import { typeColor } from '../utils/pokemonTypes';
import { spriteFor } from '../utils/sprites';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:  'var(--success)',
  BOXED:   'var(--info)',
  FAINTED: 'var(--danger)',
};

interface Props {
  pokemon: CaughtPokemonResponse;
  onClick?: () => void;
  selected?: boolean;
}

export function PokemonCard({ pokemon, onClick, selected }: Props) {
  const { t } = useTranslation();
  const displayName = pokemon.nickname
    ? `${pokemon.nickname}`
    : pokemon.currentPokemonName;

  const speciesLabel = pokemon.nickname ? pokemon.currentPokemonName : null;

  const spriteSrc = spriteFor(pokemon.currentPokemonSpriteUrl, pokemon.shiny);

  return (
    <div
      className={`pokemon-card${selected ? ' selected' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="pokemon-sprite">
        {spriteSrc ? (
          <img
            src={spriteSrc}
            alt={pokemon.currentPokemonName}
            onError={e => {
              if (pokemon.shiny && pokemon.currentPokemonSpriteUrl)
                (e.currentTarget).src = pokemon.currentPokemonSpriteUrl;
            }}
          />
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
            {t(`search.status.${pokemon.status}`, pokemon.status)}
          </span>
        </div>
        <div className="pokemon-route">📍 {pokemon.routeName}</div>
      </div>
    </div>
  );
}
