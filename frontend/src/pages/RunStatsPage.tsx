import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { statsApi, type PokemonTimeRecord, type DeathRecord } from '../api/stats';
import { Layout } from '../components/Layout';

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="stat-card">
      <span className="stat-value" style={color ? { color } : undefined}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function TimeRow({ record }: { record: PokemonTimeRecord }) {
  const statusColor =
    record.status === 'ACTIVE'  ? 'var(--success)' :
    record.status === 'FAINTED' ? 'var(--danger)'  : 'var(--text-muted)';

  return (
    <div className="stats-row">
      {record.spriteUrl && (
        <img src={record.spriteUrl} alt="" className="stats-sprite" />
      )}
      <div className="stats-row-info">
        <span className="stats-row-name">
          {record.nickname ?? record.name}
          {record.nickname && (
            <span className="stats-row-species"> ({record.name})</span>
          )}
        </span>
        <span className="stats-row-sub" style={{ color: statusColor }}>
          {record.status === 'ACTIVE' ? 'En equipo' :
           record.status === 'BOXED'  ? 'En box'    : 'Muerto'}
        </span>
      </div>
      <span className="stats-row-time">{formatTime(record.secondsInTeam)}</span>
    </div>
  );
}

function DeathRow({ record }: { record: DeathRecord }) {
  const date = record.faintedAt
    ? new Date(record.faintedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })
    : null;

  return (
    <div className="stats-row stats-row-death">
      {record.spriteUrl && (
        <img src={record.spriteUrl} alt="" className="stats-sprite" />
      )}
      <div className="stats-row-info">
        <span className="stats-row-name">
          {record.nickname ?? record.name}
          {record.nickname && (
            <span className="stats-row-species"> ({record.name})</span>
          )}
        </span>
        {record.notes && (
          <span className="stats-row-sub stats-death-notes">{record.notes}</span>
        )}
        {date && (
          <span className="stats-row-sub" style={{ color: 'var(--text-muted)' }}>{date}</span>
        )}
      </div>
    </div>
  );
}

export function RunStatsPage() {
  const { runId } = useParams<{ runId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['runs', runId, 'stats'],
    queryFn:  () => statsApi.getRunStats(runId!).then(r => r.data),
    enabled:  !!runId,
  });

  return (
    <Layout title="Estadísticas" back={`/runs/${runId}`} runId={runId}>
      <div className="page-content">
        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {data && (
          <>
            {/* Rutas */}
            <section className="stats-section">
              <h3 className="stats-section-title">Rutas</h3>
              <div className="stat-cards-grid">
                <StatCard label="Intentadas" value={data.routesAttempted} />
                <StatCard label="Capturadas" value={data.routesCaptured} color="var(--success)" />
                <StatCard label="Fallidas"   value={data.routesFailed}   color="var(--danger)" />
                <StatCard label="Pendientes" value={data.routesPending}  color="var(--text-muted)" />
              </div>
              {data.routesAttempted > 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                  Tasa de captura:{' '}
                  <strong style={{ color: 'var(--success)' }}>
                    {Math.round((data.routesCaptured / data.routesAttempted) * 100)}%
                  </strong>
                </p>
              )}
            </section>

            {/* Equipo */}
            <section className="stats-section">
              <h3 className="stats-section-title">Pokémon</h3>
              <div className="stat-cards-grid">
                <StatCard label="En equipo" value={data.activeCount}  color="var(--success)" />
                <StatCard label="En box"    value={data.boxedCount}   color="var(--info)" />
                <StatCard label="Muertos"   value={data.faintedCount} color="var(--danger)" />
              </div>
            </section>

            {/* Tiempo en equipo */}
            {data.teamTime.length > 0 && (
              <section className="stats-section">
                <h3 className="stats-section-title">Tiempo en equipo</h3>
                <div className="stats-list">
                  {data.teamTime.map(r => (
                    <TimeRow key={r.pokemonId} record={r} />
                  ))}
                </div>
              </section>
            )}

            {/* Cementerio */}
            {data.deaths.length > 0 && (
              <section className="stats-section">
                <h3 className="stats-section-title">💀 Cementerio</h3>
                <div className="stats-list">
                  {data.deaths.map(r => (
                    <DeathRow key={r.pokemonId} record={r} />
                  ))}
                </div>
              </section>
            )}

            {data.deaths.length === 0 && data.teamTime.length === 0 && (
              <div className="empty-state">
                <p>Todavía no hay Pokémon registrados en esta run.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
