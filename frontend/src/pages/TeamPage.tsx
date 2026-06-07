import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runsApi } from '../api/runs';
import { Layout } from '../components/Layout';
import { PokemonCard } from '../components/PokemonCard';
import { PokemonSearch } from '../components/PokemonSearch';
import type { CaughtPokemonResponse, PokemonSearchResponse } from '../types/api';

type Tab = 'team' | 'box' | 'graveyard';

const TAB_LABELS: Record<Tab, string> = {
  team:      '⚔️ Equipo',
  box:       '📦 Box',
  graveyard: '💀 Cementerio',
};

function EvolveModal({
  pokemon,
  runId,
  onClose,
}: {
  pokemon: CaughtPokemonResponse;
  runId: string;
  onClose: () => void;
}) {
  const [target, setTarget] = useState<PokemonSearchResponse | null>(null);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => runsApi.evolve(runId, pokemon.id, target!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs', runId, 'team'] });
      qc.invalidateQueries({ queryKey: ['runs', runId, 'box'] });
      qc.invalidateQueries({ queryKey: ['runs', runId] });
      onClose();
    },
    onError: () => setError('Error al evolucionar. Intenta de nuevo.'),
  });

  function confirm() {
    if (!target) { setError('Seleccioná la evolución'); return; }
    mutation.mutate();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            Evolucionar: {pokemon.nickname ?? pokemon.currentPokemonName}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Evolución *</label>
            <PokemonSearch onSelect={setTarget} />
          </div>
          {target && (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 12px' }}>
              → {target.name}
            </p>
          )}
          {error && <p className="form-error">{error}</p>}
          <button
            className="btn btn-primary btn-full"
            onClick={confirm}
            disabled={mutation.isPending || !target}
          >
            {mutation.isPending ? 'Evolucionando...' : 'Confirmar evolución'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TeamPage() {
  const { runId } = useParams<{ runId: string }>();
  const [tab, setTab] = useState<Tab>('team');
  const [selected, setSelected] = useState<CaughtPokemonResponse | null>(null);
  const [evolving, setEvolving] = useState<CaughtPokemonResponse | null>(null);
  const qc = useQueryClient();

  const teamQ = useQuery({
    queryKey: ['runs', runId, 'team'],
    queryFn:  () => runsApi.team(runId!).then(r => r.data),
    enabled:  !!runId,
  });

  const boxQ = useQuery({
    queryKey: ['runs', runId, 'box'],
    queryFn:  () => runsApi.box(runId!).then(r => r.data),
    enabled:  !!runId && tab === 'box',
  });

  const graveyardQ = useQuery({
    queryKey: ['runs', runId, 'graveyard'],
    queryFn:  () => runsApi.graveyard(runId!).then(r => r.data),
    enabled:  !!runId && tab === 'graveyard',
  });

  const statusMutation = useMutation({
    mutationFn: ({ pokemonId, status }: { pokemonId: string; status: string }) =>
      runsApi.updatePokemonStatus(runId!, pokemonId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs', runId, 'team'] });
      qc.invalidateQueries({ queryKey: ['runs', runId, 'box'] });
      qc.invalidateQueries({ queryKey: ['runs', runId, 'graveyard'] });
      qc.invalidateQueries({ queryKey: ['runs', runId] });
      setSelected(null);
    },
  });

  const currentData =
    tab === 'team'      ? teamQ.data :
    tab === 'box'       ? boxQ.data  :
                          graveyardQ.data;

  const isLoading =
    tab === 'team'      ? teamQ.isLoading :
    tab === 'box'       ? boxQ.isLoading  :
                          graveyardQ.isLoading;

  function toggleSelect(p: CaughtPokemonResponse) {
    setSelected(prev => prev?.id === p.id ? null : p);
  }

  return (
    <Layout title="Equipo" runId={runId}>
      <div className="tab-bar">
        {(['team', 'box', 'graveyard'] as Tab[]).map(t => (
          <button
            key={t}
            className={`tab-btn${tab === t ? ' active' : ''}`}
            onClick={() => { setTab(t); setSelected(null); }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="page-content">
        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {!isLoading && !currentData?.length && (
          <div className="empty-state">
            <p>Sin Pokémon aquí aún.</p>
          </div>
        )}

        <div className="pokemon-grid">
          {currentData?.map(p => (
            <PokemonCard
              key={p.id}
              pokemon={p}
              selected={selected?.id === p.id}
              onClick={() => toggleSelect(p)}
            />
          ))}
        </div>

        {selected && (
          <div className="pokemon-actions">
            <p className="pokemon-actions-title">
              <strong>{selected.nickname ?? selected.currentPokemonName}</strong>
            </p>
            <div className="actions-row">
              {selected.status !== 'ACTIVE' && (
                <button
                  className="btn btn-success"
                  onClick={() => statusMutation.mutate({ pokemonId: selected.id, status: 'ACTIVE' })}
                  disabled={statusMutation.isPending}
                >
                  ⚔️ Equipo
                </button>
              )}
              {selected.status !== 'BOXED' && (
                <button
                  className="btn btn-info"
                  onClick={() => statusMutation.mutate({ pokemonId: selected.id, status: 'BOXED' })}
                  disabled={statusMutation.isPending}
                >
                  📦 Box
                </button>
              )}
              {selected.status !== 'FAINTED' && (
                <button
                  className="btn btn-danger"
                  onClick={() => statusMutation.mutate({ pokemonId: selected.id, status: 'FAINTED' })}
                  disabled={statusMutation.isPending}
                >
                  💀 Muerto
                </button>
              )}
              {selected.status !== 'FAINTED' && (
                <button
                  className="btn btn-outline"
                  onClick={() => { setEvolving(selected); setSelected(null); }}
                >
                  🧬 Evolucionar
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {evolving && runId && (
        <EvolveModal
          pokemon={evolving}
          runId={runId}
          onClose={() => setEvolving(null)}
        />
      )}
    </Layout>
  );
}
