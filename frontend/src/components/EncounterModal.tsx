import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import type { RouteWithEncounterResponse, PokemonSearchResponse } from '../types/api';
import { PokemonSearch } from './PokemonSearch';
import { runsApi } from '../api/runs';

const OUTCOMES = [
  { value: 'CAPTURED',          label: '✅ Capturado',         color: '#22c55e' },
  { value: 'FAILED',            label: '❌ Fallido',           color: '#ef4444' },
  { value: 'DIED_IN_ENCOUNTER', label: '💀 Murió capturando',  color: '#ef4444' },
  { value: 'NOT_FOUND',         label: '🔍 No encontrado',     color: '#6b7280' },
  { value: 'DEFERRED',          label: '⏳ Postergar',         color: '#f59e0b' },
];

const schema = z.object({
  outcome:  z.string().min(1, 'Elegí un resultado'),
  nickname: z.string().max(50).optional(),
  shiny:    z.boolean().optional(),
  notes:    z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  route: RouteWithEncounterResponse;
  runId: string;
  onClose: () => void;
}

const FORCED_CAPTURE_TYPES = new Set(['STARTER', 'GIFT', 'FOSSIL']);

export function EncounterModal({ route, runId, onClose }: Props) {
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonSearchResponse | null>(null);
  const [submitError, setSubmitError] = useState('');
  const qc = useQueryClient();

  const isForced = FORCED_CAPTURE_TYPES.has(route.encounterType);

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { shiny: false, outcome: isForced ? 'CAPTURED' : '' },
  });

  const outcome = watch('outcome');
  const needsPokemon = outcome === 'CAPTURED';

  async function onSubmit(data: FormData) {
    if (needsPokemon && !selectedPokemon) {
      setSubmitError('Seleccioná un Pokémon');
      return;
    }
    try {
      await runsApi.recordEncounter(runId, {
        routeId:   route.routeId,
        outcome:   data.outcome,
        pokemonId: selectedPokemon?.id,
        nickname:  data.nickname || undefined,
        shiny:     data.shiny,
        notes:     data.notes || undefined,
      });
      await qc.invalidateQueries({ queryKey: ['runs', runId, 'routes'] });
      await qc.invalidateQueries({ queryKey: ['runs', runId] });
      onClose();
    } catch {
      setSubmitError('Error al registrar el encuentro. Intenta de nuevo.');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{route.routeName}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
          {isForced ? (
            <p className="form-label" style={{ marginBottom: 8, color: '#22c55e' }}>
              ✅ {route.encounterType === 'STARTER' ? 'Elegí tu Pokémon inicial' : 'Pokémon garantizado'}
            </p>
          ) : (
            <div className="form-group">
              <label className="form-label">Resultado *</label>
              <div className="outcome-grid">
                {OUTCOMES.map(o => (
                  <label key={o.value} style={{ display: 'contents' }}>
                    <input type="radio" value={o.value} {...register('outcome')} hidden />
                    <span
                      className={`outcome-btn${outcome === o.value ? ' selected' : ''}`}
                      style={outcome === o.value ? { borderColor: o.color, color: o.color } : undefined}
                      onClick={() => setValue('outcome', o.value)}
                    >
                      {o.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {needsPokemon && (
            <>
              <div className="form-group">
                <label className="form-label">
                  {route.encounterType === 'STARTER' ? 'Pokémon inicial *' : 'Pokémon capturado *'}
                </label>
                <PokemonSearch onSelect={setSelectedPokemon} />
              </div>
              <div className="form-group">
                <label className="form-label">Nickname (opcional)</label>
                <input
                  className="form-input"
                  {...register('nickname')}
                  placeholder="Dejar vacío para usar el nombre"
                />
              </div>
              <div className="form-check">
                <input type="checkbox" id="shiny" {...register('shiny')} />
                <label htmlFor="shiny">✨ Es shiny</label>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Notas (opcional)</label>
            <textarea
              className="form-input"
              rows={2}
              {...register('notes')}
              placeholder="Ej: elegí Charmander"
            />
          </div>

          {submitError && <p className="form-error">{submitError}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !outcome}
          >
            {isSubmitting ? 'Guardando...' : isForced ? 'Confirmar' : 'Registrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
