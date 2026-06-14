import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { catalogApi } from '../api/catalog';
import { typeColor, typeLabel } from '../utils/pokemonTypes';

const STAT_CONFIG = [
  { key: 'hp',      label: 'HP',  color: '#ff5959' },
  { key: 'attack',  label: 'ATK', color: '#f5ac78' },
  { key: 'defense', label: 'DEF', color: '#fae078' },
  { key: 'spAtk',   label: 'SpA', color: '#9db7f5' },
  { key: 'spDef',   label: 'SpD', color: '#a7db8d' },
  { key: 'speed',   label: 'SPE', color: '#fa92b2' },
] as const;

interface Props {
  pokemonId: number;
}

export function PokemonDetailCard({ pokemonId }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] ?? 'en';
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pokemon-detail', pokemonId, lang],
    queryFn: () => catalogApi.getPokemon(pokemonId, lang).then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="pokemon-detail-card pokemon-detail-card--loading">
        <div className="spinner" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="pokemon-detail-card pokemon-detail-card--error">
        <span>{t('pokemon.loadError', 'No se pudo cargar el detalle')}</span>
      </div>
    );
  }

  return (
    <div className="pokemon-detail-card">
      <div className="pdc-header">
        {data.spriteUrl
          ? <img src={data.spriteUrl} alt={data.name} className="pdc-sprite" />
          : <div className="pdc-sprite-placeholder" />
        }
        <div className="pdc-info">
          <span className="pdc-name">{data.name}</span>
          {data.nationalDexNumber != null && (
            <span className="pdc-dex">#{String(data.nationalDexNumber).padStart(3, '0')}</span>
          )}
          <div className="type-badges pdc-types">
            {data.types.map(typeName => (
              <span key={typeName} className="type-badge" style={{ background: typeColor(typeName) }}>{typeLabel(typeName, t)}</span>
            ))}
          </div>
        </div>
      </div>

      {data.baseStats && (
        <div className="pdc-stats">
          {STAT_CONFIG.map(({ key, label, color }) => {
            const value = data.baseStats![key as keyof NonNullable<typeof data.baseStats>] as number;
            return (
              <div key={key} className="pdc-stat-row">
                <span className="pdc-stat-label">{label}</span>
                <span className="pdc-stat-value">{value}</span>
                <div className="pdc-stat-bar-bg">
                  <div
                    className="pdc-stat-bar-fill"
                    style={{ width: `${Math.min(100, (value / 255) * 100)}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data.abilities.length > 0 && (
        <div className="pdc-abilities">
          {data.abilities.map((a, i) => (
            <span key={i} className={`pdc-ability${a.hidden ? ' pdc-ability--hidden' : ''}`}>
              {a.name}{a.hidden ? ' (H)' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
