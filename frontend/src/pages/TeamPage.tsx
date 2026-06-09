import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runsApi } from '../api/runs';
import { catalogApi } from '../api/catalog';
import { Layout } from '../components/Layout';
import { PokemonCard } from '../components/PokemonCard';
import { PokemonSearch } from '../components/PokemonSearch';
import { DamageCalcModal } from '../components/DamageCalcModal';
import { typeColor } from '../utils/pokemonTypes';
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
  const [showFreeSearch, setShowFreeSearch] = useState(false);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const { data: evolutions = [], isLoading: loadingEvolutions } = useQuery({
    queryKey: ['pokemon', pokemon.currentPokemonId, 'evolutions'],
    queryFn: () => catalogApi.evolutionChain(pokemon.currentPokemonId).then(r => r.data),
  });

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
          {loadingEvolutions ? (
            <div className="spinner" style={{ margin: '24px auto' }} />
          ) : showFreeSearch ? (
            <>
              <div className="form-group">
                <label className="form-label">Evolución *</label>
                <PokemonSearch onSelect={setTarget} />
              </div>
              {target && (
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 12px' }}>
                  → {target.name}
                </p>
              )}
            </>
          ) : evolutions.length > 0 ? (
            <>
              <label className="form-label">Elegí la evolución</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {evolutions.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`btn btn-ghost btn-full${target?.id === p.id ? ' btn-primary' : ''}`}
                    style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
                    onClick={() => setTarget(p)}
                  >
                    {p.spriteUrl && <img src={p.spriteUrl} alt={p.name} style={{ width: 32, height: 32 }} />}
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                      {p.types.map(t => (
                        <span key={t} className="type-badge" style={{ background: typeColor(t) }}>{t}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginTop: 12, fontSize: 13 }}
                onClick={() => { setTarget(null); setShowFreeSearch(true); }}
              >
                No está en la lista (ROM hack / fangame)
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                Este Pokémon no tiene evoluciones registradas.
              </p>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: 13 }}
                onClick={() => setShowFreeSearch(true)}
              >
                Buscar manualmente (ROM hack / fangame)
              </button>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: 16 }}
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
  const [calcTarget, setCalcTarget] = useState<CaughtPokemonResponse | null>(null);
  const [pendingToTeam, setPendingToTeam] = useState<CaughtPokemonResponse | null>(null);
  const [swapTarget, setSwapTarget] = useState<CaughtPokemonResponse | null>(null);
  const qc = useQueryClient();

  const runQ = useQuery({
    queryKey: ['runs', runId],
    queryFn:  () => runsApi.get(runId!).then(r => r.data),
    enabled:  !!runId,
  });

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
    onError: () => alert('Error al cambiar el estado. Intentá de nuevo.'),
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

  async function confirmSwapToTeam() {
    if (!pendingToTeam || !swapTarget) return;
    try {
      await runsApi.updatePokemonStatus(runId!, swapTarget.id, { status: 'BOXED' });
      await runsApi.updatePokemonStatus(runId!, pendingToTeam.id, { status: 'ACTIVE' });
      qc.invalidateQueries({ queryKey: ['runs', runId, 'team'] });
      qc.invalidateQueries({ queryKey: ['runs', runId, 'box'] });
      qc.invalidateQueries({ queryKey: ['runs', runId, 'graveyard'] });
      qc.invalidateQueries({ queryKey: ['runs', runId] });
    } catch {
      alert('Error al hacer el cambio. Intentá de nuevo.');
    } finally {
      setPendingToTeam(null);
      setSwapTarget(null);
    }
  }

  function handleMoveToTeam(pokemon: CaughtPokemonResponse) {
    const teamCount = teamQ.data?.length ?? 0;
    if (teamCount >= 6) {
      setPendingToTeam(pokemon);
      setSelected(null);
    } else {
      statusMutation.mutate({ pokemonId: pokemon.id, status: 'ACTIVE' });
    }
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
                  onClick={() => handleMoveToTeam(selected)}
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
              <button
                className="btn btn-info"
                onClick={() => { setCalcTarget(selected); setSelected(null); }}
              >
                ⚡ Calcular daño
              </button>
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

      {calcTarget && runId && runQ.data && (
        <DamageCalcModal
          runId={runId}
          gameId={runQ.data.gameId}
          attacker={calcTarget}
          onClose={() => setCalcTarget(null)}
        />
      )}

      {pendingToTeam && (
        <div className="modal-overlay" style={{ zIndex: 210 }} onClick={() => { setPendingToTeam(null); setSwapTarget(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">⚔️ Equipo lleno</h2>
              <button type="button" className="modal-close" onClick={() => { setPendingToTeam(null); setSwapTarget(null); }} aria-label="Cerrar">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                Elegí quién va al box para hacerle lugar a <strong>{pendingToTeam.nickname ?? pendingToTeam.currentPokemonName}</strong>:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {teamQ.data?.map(p => (
                  <button
                    key={p.id}
                    className={`btn btn-ghost btn-full${swapTarget?.id === p.id ? ' btn-primary' : ''}`}
                    style={{ textAlign: 'left' }}
                    onClick={() => setSwapTarget(prev => prev?.id === p.id ? null : p)}
                  >
                    {p.nickname ?? p.currentPokemonName}
                  </button>
                ))}
              </div>
              {swapTarget && (
                <button
                  className="btn btn-primary btn-full"
                  style={{ marginTop: 12 }}
                  onClick={confirmSwapToTeam}
                >
                  ✅ Confirmar — {swapTarget.nickname ?? swapTarget.currentPokemonName} va al box
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
