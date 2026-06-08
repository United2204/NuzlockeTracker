import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RouteWithEncounterResponse, PokemonSearchResponse, CaughtPokemonResponse } from '../types/api';
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
  activePokemonCount: number;
  nicknameRequired?: boolean;
  firstEncounterOnly?: boolean;
  onClose: () => void;
}

const FORCED_CAPTURE_TYPES = new Set(['STARTER', 'GIFT', 'FOSSIL']);

const TERMINAL_OUTCOMES = new Set(['CAPTURED', 'FAILED', 'DIED_IN_ENCOUNTER', 'NOT_FOUND']);

export function EncounterModal({ route, runId, activePokemonCount, nicknameRequired, firstEncounterOnly, onClose }: Props) {
  const existingPokemon: PokemonSearchResponse | null = route.caughtPokemon ? {
    id: route.caughtPokemon.currentPokemonId,
    name: route.caughtPokemon.currentPokemonName,
    speciesId: 0,
    nationalDexNumber: null,
    types: route.caughtPokemon.currentPokemonTypes,
    spriteUrl: route.caughtPokemon.currentPokemonSpriteUrl,
    variant: null,
  } : null;

  const isEditing = TERMINAL_OUTCOMES.has(route.outcome);

  const [selectedPokemon, setSelectedPokemon] = useState<PokemonSearchResponse | null>(existingPokemon);
  const [submitError, setSubmitError] = useState('');
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [memberToBox, setMemberToBox] = useState<CaughtPokemonResponse | null>(null);
  const qc = useQueryClient();

  const teamFull = activePokemonCount >= 6;
  const showSwapModal = pendingData !== null;

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['runs', runId, 'team'],
    queryFn: () => runsApi.team(runId).then(r => r.data),
    enabled: showSwapModal,
  });

  const isForced = FORCED_CAPTURE_TYPES.has(route.encounterType);

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      shiny: route.caughtPokemon?.shiny ?? false,
      outcome: isForced ? 'CAPTURED' : (isEditing ? route.outcome : ''),
      notes: route.notes ?? '',
      nickname: route.caughtPokemon?.nickname ?? '',
    },
  });

  const outcome = watch('outcome');
  const needsPokemon = outcome === 'CAPTURED';

  async function doSubmit(data: FormData, swap: CaughtPokemonResponse | null | 'box') {
    try {
      if (swap && swap !== 'box') {
        await runsApi.updatePokemonStatus(runId, swap.id, { status: 'BOXED' });
      }
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
      await qc.invalidateQueries({ queryKey: ['runs', runId, 'team'] });
      onClose();
    } catch {
      setSubmitError('Error al registrar el encuentro. Intenta de nuevo.');
      setPendingData(null);
    }
  }

  async function onSubmit(data: FormData) {
    if (needsPokemon && !selectedPokemon) {
      setSubmitError('Seleccioná un Pokémon');
      return;
    }
    if (needsPokemon && nicknameRequired && !data.nickname?.trim()) {
      setSubmitError('Nickname obligatorio en esta run');
      return;
    }
    setSubmitError('');
    if (data.outcome === 'CAPTURED' && teamFull) {
      setPendingData(data);
      return;
    }
    await doSubmit(data, null);
  }

  return (
    <>
      <div className="modal-overlay" onClick={showSwapModal ? undefined : onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{route.routeName}</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
            {isEditing && (
              <div style={{
                background: 'var(--accent-bg)', border: '1px solid var(--accent)',
                borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13,
              }}>
                ✏️ Editando registro existente
                {firstEncounterOnly && (
                  <span style={{ color: 'var(--warning)', display: 'block', marginTop: 4 }}>
                    ⚠️ Nuzlocke clásico: solo vale el primer encuentro
                  </span>
                )}
              </div>
            )}
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
                  <PokemonSearch onSelect={setSelectedPokemon} initialPokemon={existingPokemon} />
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

      {showSwapModal && (
        <div className="modal-overlay" style={{ zIndex: 210 }} onClick={() => setPendingData(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">⚔️ Equipo lleno</h2>
              <button type="button" className="modal-close" onClick={() => setPendingData(null)} aria-label="Cerrar">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                Tu equipo tiene 6 Pokémon. ¿Qué hacemos con el nuevo?
              </p>
              <button
                className="btn btn-ghost btn-full"
                style={{ textAlign: 'left', marginBottom: 8 }}
                onClick={() => doSubmit(pendingData!, 'box')}
              >
                📦 Mandarlo directo al box
              </button>
              {teamMembers.length > 0 && (
                <>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '12px 0 8px' }}>
                    O elegí quién va al box para hacer lugar en el equipo:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {teamMembers.map(p => (
                      <button
                        key={p.id}
                        className={`btn btn-ghost btn-full ${memberToBox?.id === p.id ? 'btn-primary' : ''}`}
                        style={{ textAlign: 'left' }}
                        onClick={() => setMemberToBox(prev => prev?.id === p.id ? null : p)}
                      >
                        {p.nickname ?? p.currentPokemonName}
                      </button>
                    ))}
                  </div>
                  {memberToBox && (
                    <button
                      className="btn btn-primary btn-full"
                      style={{ marginTop: 12 }}
                      onClick={() => doSubmit(pendingData!, memberToBox)}
                    >
                      ✅ Confirmar — {memberToBox.nickname ?? memberToBox.currentPokemonName} va al box
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
