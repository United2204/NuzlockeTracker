import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog';
import { contributionsApi } from '../api/contributions';
import { Layout } from '../components/Layout';

const DATA_TYPES = ['ROUTE', 'ENCOUNTER_TABLE', 'POKEMON'] as const;

const PLACEHOLDERS: Record<string, string> = {
  ROUTE: JSON.stringify({ name: 'Ruta 1', order: 1, encounterType: 'RANDOM' }, null, 2),
  ENCOUNTER_TABLE: JSON.stringify({ routeName: 'Ruta 1', pokemon: [{ name: 'Rattata', rarity: 'COMMON' }] }, null, 2),
  POKEMON: JSON.stringify({ name: 'Fakemon', nationalDexNumber: null, types: ['NORMAL'], spriteUrl: '' }, null, 2),
};

export function ContributionFormPage() {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState('');
  const [dataType, setDataType] = useState<typeof DATA_TYPES[number]>('ROUTE');
  const [rawJson, setRawJson] = useState('');
  const [jsonError, setJsonError] = useState('');

  const { data: games = [] } = useQuery({
    queryKey: ['catalog', 'games'],
    queryFn:  () => catalogApi.games().then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: () => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        throw new Error('JSON inválido');
      }
      return contributionsApi.submit(Number(gameId), dataType, parsed);
    },
    onSuccess: () => navigate('/me/contributions'),
    onError: (err: Error) => setJsonError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError('');
    if (!gameId) { setJsonError('Seleccioná un juego'); return; }
    if (!rawJson.trim()) { setJsonError('El JSON no puede estar vacío'); return; }
    mutation.mutate();
  };

  return (
    <Layout title="Nueva contribución" back="/me/contributions">
      <div className="page-content">
        <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
          Enviá datos de rutas, tablas de encuentro o Pokémon para fangames.
          Un admin lo revisará antes de publicarlo.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Juego *</label>
            <select
              className="form-input"
              value={gameId}
              onChange={e => setGameId(e.target.value)}
              required
            >
              <option value="">Seleccioná un juego...</option>
              {games.filter(g => !g.official).map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            {games.filter(g => !g.official).length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Solo se aceptan contribuciones para fangames (juegos no oficiales).
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de dato *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {DATA_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`tab-btn ${dataType === t ? 'active' : ''}`}
                  style={{ flex: 1, fontSize: 13 }}
                  onClick={() => { setDataType(t); setRawJson(''); }}
                >
                  {t === 'ROUTE' ? 'Ruta' : t === 'ENCOUNTER_TABLE' ? 'Encuentros' : 'Pokémon'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Datos (JSON) *</label>
            <textarea
              className="form-input"
              style={{ fontFamily: 'monospace', fontSize: 13, minHeight: 200, resize: 'vertical' }}
              placeholder={PLACEHOLDERS[dataType]}
              value={rawJson}
              onChange={e => setRawJson(e.target.value)}
              spellCheck={false}
            />
          </div>

          {jsonError && (
            <div className="error-banner">{jsonError}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Enviando...' : 'Enviar contribución'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
