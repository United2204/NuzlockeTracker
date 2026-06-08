import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { catalogApi } from '../api/catalog';
import { runsApi } from '../api/runs';
import { Layout } from '../components/Layout';
import type { GameResponse } from '../types/api';

const PRESETS = [
  { id: 1, label: '🏆 Clásico', desc: 'Primer encuentro por ruta, permadeath, nicknames obligatorios' },
  { id: 2, label: '💀 Hardcore', desc: 'Clásico + sin ítems en combate + level cap por gym' },
  { id: 3, label: '📝 Libre', desc: 'Sin restricciones — solo registrar lo que capturás' },
];

const schema = z.object({
  gameId:      z.string().min(1, 'Elegí un juego'),
  name:        z.string().min(1, 'Requerido').max(150, 'Máximo 150 caracteres'),
  gameVersion: z.string().optional(),
  randomized:  z.boolean().optional(),
  visibility:  z.string().optional(),
  presetId:    z.number().optional(),
});

type FormData = z.infer<typeof schema>;

export function NewRunPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameResponse[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameResponse | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(1);

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { randomized: false, visibility: 'PRIVATE', presetId: 1 },
  });

  useEffect(() => {
    catalogApi.games().then(r => setGames(r.data)).catch(() => {});
  }, []);

  const gameId = watch('gameId');
  useEffect(() => {
    const game = games.find(g => g.id === Number(gameId));
    setSelectedGame(game ?? null);
  }, [gameId, games]);

  async function onSubmit(data: FormData) {
    setSubmitError('');
    try {
      const res = await runsApi.create({
        gameId:      parseInt(data.gameId, 10),
        name:        data.name,
        gameVersion: data.gameVersion || undefined,
        randomized:  data.randomized ?? false,
        visibility:  data.visibility ?? 'PRIVATE',
        presetId:    selectedPreset,
      });
      navigate(`/runs/${res.data.id}`);
    } catch {
      setSubmitError('Error al crear la run. Intenta de nuevo.');
    }
  }

  return (
    <Layout title="Nueva Run" back="/runs">
      <div className="page-content">
        <form onSubmit={handleSubmit(onSubmit)} className="form-card">
          <div className="form-group">
            <label className="form-label">Juego *</label>
            <select className="form-input" {...register('gameId')}>
              <option value="">Elegí un juego...</option>
              {games.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            {errors.gameId && <span className="form-error">{errors.gameId.message}</span>}
          </div>

          {selectedGame?.versions && selectedGame.versions.length > 0 && (
            <div className="form-group">
              <label className="form-label">Versión</label>
              <select className="form-input" {...register('gameVersion')}>
                <option value="">Todas las versiones</option>
                {selectedGame.versions.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nombre de la run *</label>
            <input
              className="form-input"
              {...register('name')}
              placeholder="Ej: Mi primera Nuzlocke"
            />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Modo de juego</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedPreset(p.id); setValue('presetId', p.id); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${selectedPreset === p.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: selectedPreset === p.id ? 'var(--accent-bg)' : 'var(--bg-card)',
                    textAlign: 'left', gap: 2,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{p.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Visibilidad</label>
            <select className="form-input" {...register('visibility')}>
              <option value="PRIVATE">🔒 Privada</option>
              <option value="PUBLIC">🌍 Pública</option>
              <option value="FOLLOWERS_ONLY">👥 Solo seguidores</option>
            </select>
          </div>

          <div className="form-check">
            <input type="checkbox" id="randomized" {...register('randomized')} />
            <label htmlFor="randomized">🎲 Run randomizer (Pokémon aleatorios)</label>
          </div>

          {submitError && <p className="form-error">{submitError}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear run'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
