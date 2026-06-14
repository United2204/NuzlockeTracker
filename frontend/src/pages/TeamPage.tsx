import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runsApi } from '../api/runs';
import { catalogApi } from '../api/catalog';
import { guestStore } from '../services/guestStore';
import { Layout } from '../components/Layout';
import { PokemonCard } from '../components/PokemonCard';
import { PokemonSearch } from '../components/PokemonSearch';
import { DamageCalcModal } from '../components/DamageCalcModal';
import { typeColor, typeLabel } from '../utils/pokemonTypes';
import { useAuth } from '../hooks/useAuth';
import type { CaughtPokemonResponse, PokemonSearchResponse, RunDetailResponse } from '../types/api';

type Tab = 'team' | 'box' | 'graveyard';

function EvolveModal({
  pokemon,
  runId,
  onClose,
}: {
  pokemon: CaughtPokemonResponse;
  runId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
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
      qc.invalidateQueries({ queryKey: ['runs', runId, 'routes'] });
      qc.invalidateQueries({ queryKey: ['all-caught', runId] });
      onClose();
    },
    onError: () => setError(t('team.evolve.error')),
  });

  function confirm() {
    if (!target) { setError(t('team.evolve.selectFirst')); return; }
    mutation.mutate();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {t('team.evolve.title', { name: pokemon.nickname ?? pokemon.currentPokemonName })}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">
          {loadingEvolutions ? (
            <div className="spinner" style={{ margin: '24px auto' }} />
          ) : showFreeSearch ? (
            <>
              <div className="form-group">
                <label className="form-label">{t('team.evolve.label')}</label>
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
              <label className="form-label">{t('team.evolve.choose')}</label>
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
                      {p.types.map(typeName => (
                        <span key={typeName} className="type-badge" style={{ background: typeColor(typeName) }}>{typeLabel(typeName, t)}</span>
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
                {t('team.evolve.notInList')}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                {t('team.evolve.none')}
              </p>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: 13 }}
                onClick={() => setShowFreeSearch(true)}
              >
                {t('team.evolve.searchManually')}
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
            {mutation.isPending ? t('team.evolve.evolving') : t('team.evolve.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TeamPage() {
  const { t, i18n } = useTranslation();
  const lang        = i18n.language?.split('-')[0] ?? 'en';
  const { runId }  = useParams<{ runId: string }>();
  const { user }   = useAuth();
  const isGuest    = !user;
  const [tab, setTab] = useState<Tab>('team');
  const [selected, setSelected]         = useState<CaughtPokemonResponse | null>(null);
  const [evolving, setEvolving]         = useState<CaughtPokemonResponse | null>(null);
  const [calcTarget, setCalcTarget]     = useState<CaughtPokemonResponse | null>(null);
  const [pendingToTeam, setPendingToTeam] = useState<CaughtPokemonResponse | null>(null);
  const [swapTarget, setSwapTarget]     = useState<CaughtPokemonResponse | null>(null);
  const qc = useQueryClient();

  // ── API queries ────────────────────────────────────────────────────────────
  const apiRunQ = useQuery({
    queryKey: ['runs', runId],
    queryFn:  () => runsApi.get(runId!).then(r => r.data),
    enabled:  !!runId && !isGuest,
  });

  const apiTeamQ = useQuery({
    queryKey: ['runs', runId, 'team', lang],
    queryFn:  () => runsApi.team(runId!, lang).then(r => r.data),
    enabled:  !!runId && !isGuest,
  });

  const apiBoxQ = useQuery({
    queryKey: ['runs', runId, 'box', lang],
    queryFn:  () => runsApi.box(runId!, lang).then(r => r.data),
    enabled:  !!runId && !isGuest && tab === 'box',
  });

  const apiGraveyardQ = useQuery({
    queryKey: ['runs', runId, 'graveyard', lang],
    queryFn:  () => runsApi.graveyard(runId!, lang).then(r => r.data),
    enabled:  !!runId && !isGuest && tab === 'graveyard',
  });

  // ── Guest queries ──────────────────────────────────────────────────────────
  const guestRunQ = useQuery({
    queryKey: ['guest', 'runs', runId],
    queryFn:  () => guestStore.getRun(runId!),
    enabled:  !!runId && isGuest,
  });

  const guestTabQ = useQuery({
    queryKey: ['guest', 'runs', runId, tab],
    queryFn:  () => guestStore.getByStatus(
      runId!,
      tab === 'team' ? 'ACTIVE' : tab === 'box' ? 'BOXED' : 'FAINTED',
    ),
    enabled:  !!runId && isGuest,
  });

  const run: RunDetailResponse | undefined = isGuest ? guestRunQ.data ?? undefined : apiRunQ.data;

  const currentData: CaughtPokemonResponse[] | undefined = isGuest
    ? guestTabQ.data
    : tab === 'team'      ? apiTeamQ.data
    : tab === 'box'       ? apiBoxQ.data
    :                       apiGraveyardQ.data;

  const isLoading = isGuest ? guestTabQ.isLoading : (
    tab === 'team'      ? apiTeamQ.isLoading :
    tab === 'box'       ? apiBoxQ.isLoading  :
                          apiGraveyardQ.isLoading
  );

  function invalidateAll() {
    if (isGuest) {
      qc.invalidateQueries({ queryKey: ['guest', 'runs', runId] });
      qc.invalidateQueries({ queryKey: ['guest', 'runs', runId, 'team'] });
      qc.invalidateQueries({ queryKey: ['guest', 'runs', runId, 'box'] });
      qc.invalidateQueries({ queryKey: ['guest', 'runs', runId, 'graveyard'] });
    } else {
      qc.invalidateQueries({ queryKey: ['runs', runId, 'team'] });
      qc.invalidateQueries({ queryKey: ['runs', runId, 'box'] });
      qc.invalidateQueries({ queryKey: ['runs', runId, 'graveyard'] });
      qc.invalidateQueries({ queryKey: ['runs', runId] });
      qc.invalidateQueries({ queryKey: ['runs', runId, 'routes'] });
      qc.invalidateQueries({ queryKey: ['all-caught', runId] });
    }
  }

  const statusMutation = useMutation({
    mutationFn: async ({ pokemonId, status }: { pokemonId: string; status: string }) => {
      if (isGuest) { await guestStore.updatePokemonStatus(runId!, pokemonId, status as 'ACTIVE' | 'BOXED' | 'FAINTED'); }
      else { await runsApi.updatePokemonStatus(runId!, pokemonId, { status }); }
    },
    onSuccess: () => { invalidateAll(); setSelected(null); },
    onError: () => alert(t('team.statusError')),
  });

  const devolveMutation = useMutation({
    mutationFn: (pokemonId: string) => runsApi.devolve(runId!, pokemonId),
    onSuccess: () => { invalidateAll(); setSelected(null); },
    onError: () => alert(t('team.revertError')),
  });

  function toggleSelect(p: CaughtPokemonResponse) {
    setSelected(prev => prev?.id === p.id ? null : p);
  }

  async function confirmSwapToTeam() {
    if (!pendingToTeam || !swapTarget) return;
    try {
      if (isGuest) {
        await guestStore.updatePokemonStatus(runId!, swapTarget.id, 'BOXED');
        await guestStore.updatePokemonStatus(runId!, pendingToTeam.id, 'ACTIVE');
      } else {
        await runsApi.updatePokemonStatus(runId!, swapTarget.id, { status: 'BOXED' });
        await runsApi.updatePokemonStatus(runId!, pendingToTeam.id, { status: 'ACTIVE' });
      }
      invalidateAll();
    } catch {
      alert(t('team.swapError'));
    } finally {
      setPendingToTeam(null);
      setSwapTarget(null);
    }
  }

  function handleMoveToTeam(pokemon: CaughtPokemonResponse) {
    const teamCount = isGuest ? guestTabQ.data?.length ?? 0 : apiTeamQ.data?.length ?? 0;
    if (teamCount >= 6) {
      setPendingToTeam(pokemon);
      setSelected(null);
    } else {
      statusMutation.mutate({ pokemonId: pokemon.id, status: 'ACTIVE' });
    }
  }

  const teamForSwap = isGuest
    ? (guestTabQ.data ?? [])
    : (apiTeamQ.data ?? []);

  return (
    <Layout title={t('team.title')} runId={runId}>
      <div className="tab-bar">
        {(['team', 'box', 'graveyard'] as Tab[]).map(tabKey => (
          <button
            key={tabKey}
            className={`tab-btn${tab === tabKey ? ' active' : ''}`}
            onClick={() => { setTab(tabKey); setSelected(null); }}
          >
            {t(`team.tab.${tabKey}`)}
          </button>
        ))}
      </div>

      <div className="page-content">
        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {!isLoading && !currentData?.length && (
          <div className="empty-state">
            <p>{t('team.empty')}</p>
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
                  {t('team.action.team')}
                </button>
              )}
              {selected.status !== 'BOXED' && (
                <button
                  className="btn btn-info"
                  onClick={() => statusMutation.mutate({ pokemonId: selected.id, status: 'BOXED' })}
                  disabled={statusMutation.isPending}
                >
                  {t('team.action.box')}
                </button>
              )}
              {selected.status !== 'FAINTED' && (
                <button
                  className="btn btn-danger"
                  onClick={() => statusMutation.mutate({ pokemonId: selected.id, status: 'FAINTED' })}
                  disabled={statusMutation.isPending}
                >
                  {t('team.action.fainted')}
                </button>
              )}
              {!isGuest && selected.status !== 'FAINTED' && (
                <button
                  className="btn btn-outline"
                  onClick={() => { setEvolving(selected); setSelected(null); }}
                >
                  {t('team.action.evolve')}
                </button>
              )}
              {!isGuest && selected.currentPokemonId !== selected.originalPokemonId && (
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 13 }}
                  onClick={() => devolveMutation.mutate(selected.id)}
                  disabled={devolveMutation.isPending}
                >
                  {t('team.action.revertEvolution')}
                </button>
              )}
              {!isGuest && (
                <button
                  className="btn btn-info"
                  onClick={() => { setCalcTarget(selected); setSelected(null); }}
                >
                  {t('team.action.damageCalc')}
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>
                {t('btn.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      {evolving && runId && !isGuest && (
        <EvolveModal
          pokemon={evolving}
          runId={runId}
          onClose={() => setEvolving(null)}
        />
      )}

      {calcTarget && runId && run && !isGuest && (
        <DamageCalcModal
          runId={runId}
          gameId={run.gameId}
          attacker={calcTarget}
          onClose={() => setCalcTarget(null)}
        />
      )}

      {pendingToTeam && (
        <div className="modal-overlay" style={{ zIndex: 210 }} onClick={() => { setPendingToTeam(null); setSwapTarget(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('team.teamFull')}</h2>
              <button type="button" className="modal-close" onClick={() => { setPendingToTeam(null); setSwapTarget(null); }} aria-label="Cerrar">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                {t('team.chooseSwap', { name: pendingToTeam.nickname ?? pendingToTeam.currentPokemonName })}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {teamForSwap.map(p => (
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
                  {t('team.confirmSwap', { name: swapTarget.nickname ?? swapTarget.currentPokemonName })}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
