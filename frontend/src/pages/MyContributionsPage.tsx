import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contributionsApi, type Contribution } from '../api/contributions';
import { Layout } from '../components/Layout';
import { useState } from 'react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:           { label: 'Pendiente',          color: 'var(--text-muted)' },
  APPROVED:          { label: 'Aprobada ✓',          color: 'var(--success)' },
  REJECTED:          { label: 'Rechazada ✗',         color: 'var(--danger)' },
  CHANGES_REQUESTED: { label: 'Cambios requeridos',  color: '#f59e0b' },
};

const TYPE_LABELS: Record<string, string> = {
  ROUTE: 'Ruta', ENCOUNTER_TABLE: 'Encuentros', POKEMON: 'Pokémon',
};

function ContributionCard({ c }: { c: Contribution }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_LABELS[c.status] ?? STATUS_LABELS.PENDING;

  return (
    <div className="feed-card" style={{ cursor: 'default' }}>
      <div className="feed-card-header">
        <span style={{ fontWeight: 600 }}>{c.gameName} · {TYPE_LABELS[c.dataType]}</span>
        <span style={{ color: cfg.color, fontSize: 13, fontWeight: 600 }}>{cfg.label}</span>
      </div>

      {c.adminFeedback && c.status === 'CHANGES_REQUESTED' && (
        <div style={{
          background: 'rgba(245,158,11,.12)', border: '1px solid #f59e0b',
          borderRadius: 8, padding: '8px 12px', fontSize: 13, marginTop: 8
        }}>
          <strong>Feedback del admin:</strong> {c.adminFeedback}
          <div style={{ marginTop: 8 }}>
            <Link to={`/contributions/${c.id}/resubmit`} className="btn btn-primary" style={{ fontSize: 13 }}>
              Corregir y reenviar
            </Link>
          </div>
        </div>
      )}

      <button
        className="btn btn-ghost"
        style={{ marginTop: 8, fontSize: 12, padding: '2px 8px' }}
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? 'Ocultar JSON' : 'Ver JSON'}
      </button>

      {expanded && (
        <pre style={{
          background: 'var(--bg)', borderRadius: 6, padding: 12, fontSize: 12,
          overflowX: 'auto', marginTop: 8, maxHeight: 200
        }}>
          {JSON.stringify(c.dataJson, null, 2)}
        </pre>
      )}

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
        {new Date(c.createdAt).toLocaleDateString('es')}
        {c.reviewedAt && ` · revisada ${new Date(c.reviewedAt).toLocaleDateString('es')}`}
      </div>
    </div>
  );
}

export function MyContributionsPage() {
  const { data: contributions = [], isLoading } = useQuery({
    queryKey: ['me', 'contributions'],
    queryFn:  () => contributionsApi.listMine().then(r => r.data),
  });

  return (
    <Layout title="Mis contribuciones" back="/profile">
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Link to="/contributions/new" className="btn btn-primary">+ Nueva contribución</Link>
        </div>

        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {!isLoading && contributions.length === 0 && (
          <div className="empty-state">
            <p>Aún no enviaste ninguna contribución.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>
              Podés contribuir datos de rutas o Pokémon para fangames.
            </p>
          </div>
        )}

        {contributions.map(c => <ContributionCard key={c.id} c={c} />)}
      </div>
    </Layout>
  );
}
