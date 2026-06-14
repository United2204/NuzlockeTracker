import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { runsApi } from '../api/runs';
import { guestStore } from '../services/guestStore';
import { Layout } from '../components/Layout';
import { GlobalSearch } from '../components/GlobalSearch';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    'var(--success)',
  COMPLETED: 'var(--info)',
  GAME_OVER: 'var(--danger)',
  ABANDONED: 'var(--text-muted)',
};

const VISIBILITY_ICON: Record<string, string> = {
  PUBLIC:         '🌐',
  FOLLOWERS_ONLY: '👥',
  PRIVATE:        '🔒',
};


const ACTIVE_RUN_KEY = 'nuzlocke_active_run_id';

export function RunsPage() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [showArchived, setShowArchived] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_RUN_KEY),
  );
  const [visEditId, setVisEditId] = useState<string | null>(null);

  const apiQuery = useQuery({
    queryKey: ['runs'],
    queryFn: () => runsApi.list().then(r => r.data),
    enabled: !!user,
  });

  const guestQuery = useQuery({
    queryKey: ['guest', 'runs'],
    queryFn: () => guestStore.listRuns(),
    enabled: !user,
  });

  const { data = [], isLoading } = user ? apiQuery : guestQuery;

  // Fetch all caught Pokémon (team + box + graveyard) for the active run
  const { data: allCaught = [] } = useQuery({
    queryKey: ['all-caught', activeRunId],
    queryFn: async () => {
      const [team, box, grave] = await Promise.all([
        runsApi.team(activeRunId!).then(r => r.data),
        runsApi.box(activeRunId!).then(r => r.data),
        runsApi.graveyard(activeRunId!).then(r => r.data),
      ]);
      return [...team, ...box, ...grave];
    },
    enabled: !!activeRunId && !!user,
    staleTime: 0,
  });

  function bestStatus(current: string | undefined, incoming: string): string {
    if (!current) return incoming;
    const rank = { ACTIVE: 2, BOXED: 1, FAINTED: 0 };
    return (rank[incoming as keyof typeof rank] ?? 0) > (rank[current as keyof typeof rank] ?? 0)
      ? incoming : current;
  }

  const caughtByChainId = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of allCaught) {
      if (p.chainId != null) map.set(p.chainId, bestStatus(map.get(p.chainId), p.status));
    }
    return map;
  }, [allCaught]);

  const caughtByPokemonId = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of allCaught) {
      if (p.chainId == null) map.set(p.originalPokemonId, bestStatus(map.get(p.originalPokemonId), p.status));
    }
    return map;
  }, [allCaught]);

  const archiveMut = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      if (user) { await runsApi.update(id, { archived }); }
      else { await guestStore.updateRun(id, { archived }); }
    },
    onSuccess: (_data, { archived }) => {
      if (user) qc.invalidateQueries({ queryKey: ['runs'] });
      else qc.invalidateQueries({ queryKey: ['guest', 'runs'] });
      showToast(archived ? 'Run archivada' : 'Run desarchivada');
    },
  });

  const visMut = useMutation({
    mutationFn: ({ id, visibility }: { id: string; visibility: string }) =>
      runsApi.update(id, { visibility }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] });
      setVisEditId(null);
    },
  });

  function toggleActiveRun(id: string) {
    if (activeRunId === id) {
      localStorage.removeItem(ACTIVE_RUN_KEY);
      setActiveRunId(null);
    } else {
      localStorage.setItem(ACTIVE_RUN_KEY, id);
      setActiveRunId(id);
    }
  }

  // Clear active run if it no longer exists in the list
  if (activeRunId && data.length > 0 && !data.find(r => r.id === activeRunId)) {
    localStorage.removeItem(ACTIVE_RUN_KEY);
    setActiveRunId(null);
  }

  const visible  = data.filter(r => !r.archived);
  const archived = data.filter(r => r.archived);

  const sorted = [
    ...visible.filter(r => r.favorite),
    ...visible.filter(r => !r.favorite),
  ];

  function RunCard({ run, showArchiveLabel = true }: { run: typeof sorted[0]; showArchiveLabel?: boolean }) {
    const isActive = activeRunId === run.id;
    return (
      <div
        key={run.id}
        className={`run-card-wrapper${isActive ? ' run-card-wrapper--active' : ''}`}
      >
        <Link
          to={`/runs/${run.id}`}
          className={`run-card${isActive ? ' run-card--active' : ''}`}
        >
          <div className="run-card-header">
            <div>
              <div className="run-name">
                {run.favorite && <span style={{ marginRight: 6 }}>⭐</span>}
                {run.name}
              </div>
              <div className="run-game">
                {run.gameName}{run.gameVersion ? ` · ${run.gameVersion}` : ''}
              </div>
            </div>
            <span
              className="status-badge"
              style={{ background: STATUS_COLOR[run.status] ?? '#888' }}
            >
              {t(`run.status.${run.status}`, run.status)}
            </span>
          </div>
          <div className="run-card-stats">
            <span>⚔️ {run.activePokemon} {t('run.active')}</span>
            <span>💀 {run.faintedPokemon} {t('run.fainted')}</span>
            {run.visibility && (
              <span
                title={t(`run.visibility.${run.visibility}`, run.visibility)}
                style={{ marginLeft: 'auto', fontSize: 14 }}
              >
                {VISIBILITY_ICON[run.visibility] ?? '🌐'}
              </span>
            )}
          </div>
        </Link>
        <div className="run-card-actions">
          <button
            className={`btn run-pin-btn${isActive ? ' run-pin-btn--active' : ''}`}
            onClick={() => toggleActiveRun(run.id)}
          >
            📍{isActive ? ` ${t('run.newRun').slice(2) ?? 'En búsqueda'}` : ''}
          </button>
          {user && (
            <button
              className="btn btn-ghost run-archive-btn"
              onClick={() => setVisEditId(run.id)}
            >
              {VISIBILITY_ICON[run.visibility ?? 'PUBLIC']}
            </button>
          )}
          {showArchiveLabel ? (
            <button
              className="btn btn-ghost run-archive-btn"
              onClick={() => archiveMut.mutate({ id: run.id, archived: true })}
              disabled={archiveMut.isPending}
            >
              {t('run.archive')}
            </button>
          ) : (
            <button
              className="btn btn-ghost run-archive-btn"
              onClick={() => archiveMut.mutate({ id: run.id, archived: false })}
              disabled={archiveMut.isPending}
            >
              {t('run.unarchive')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
    <Layout
      title={user ? `@${user.username}` : 'Mis Runs'}
      action={user ? (
        <button className="btn btn-ghost" onClick={logout}>Salir</button>
      ) : undefined}
    >
      <div className="page-content">
        <GlobalSearch caughtByChainId={caughtByChainId} caughtByPokemonId={caughtByPokemonId} />

        <div className="page-header">
          <h2>{t('run.myRuns')}</h2>
          <Link to="/runs/new" className="btn btn-primary">{t('run.newRun')}</Link>
        </div>

        {!user && (
          <div style={{
            background: 'var(--accent-bg)', border: '1px solid var(--accent)',
            borderRadius: 10, padding: '12px 16px',
            fontSize: 13, color: 'var(--text-muted)',
          }}>
            Tus runs se guardan en este dispositivo.{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Creá una cuenta
            </Link>{' '}
            para sincronizarlas en la nube y acceder desde cualquier lugar.
          </div>
        )}

        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {!isLoading && data.length === 0 && (
          <div className="empty-state">
            <p>{t('run.noRuns')}</p>
            <Link to="/runs/new" className="btn btn-primary">{t('run.createFirst')}</Link>
          </div>
        )}

        <div className="runs-list">
          {sorted.map(run => <RunCard key={run.id} run={run} />)}
        </div>

        {archived.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <button
              className="btn btn-ghost btn-full"
              style={{ color: 'var(--text-muted)', fontSize: 13 }}
              onClick={() => setShowArchived(v => !v)}
            >
              {showArchived ? '▲' : '▼'} {t('run.archived')} ({archived.length})
            </button>

            {showArchived && (
              <div className="runs-list" style={{ marginTop: 8, opacity: 0.7 }}>
                {archived.map(run => <RunCard key={run.id} run={run} showArchiveLabel={false} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>

    {visEditId && createPortal(
      <div className="modal-overlay" onClick={() => setVisEditId(null)}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 320 }}>
          <div className="modal-header">
            <h2 className="modal-title">Visibilidad de la run</h2>
            <button type="button" className="modal-close" onClick={() => setVisEditId(null)} aria-label="Cerrar">✕</button>
          </div>
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE'] as const).map(v => {
                const currentRun = data.find(r => r.id === visEditId);
                const isCurrent = currentRun?.visibility === v;
                return (
                  <button
                    key={v}
                    className={`btn ${isCurrent ? 'btn-primary' : 'btn-ghost'} btn-full`}
                    style={{ textAlign: 'left' }}
                    onClick={() => visMut.mutate({ id: visEditId, visibility: v })}
                    disabled={visMut.isPending || isCurrent}
                  >
                    {t(`run.visibility.${v}`, v)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
