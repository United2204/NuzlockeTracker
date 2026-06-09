import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contributionsApi, type Contribution } from '../api/contributions';
import { Layout } from '../components/Layout';

const TYPE_LABELS: Record<string, string> = {
  ROUTE: 'Ruta', ENCOUNTER_TABLE: 'Encuentros', POKEMON: 'Pokémon',
};

function ReviewPanel({ c, onDone }: { c: Contribution; onDone: () => void }) {
  const [feedback, setFeedback] = useState('');
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const reviewMut = useMutation({
    mutationFn: (action: string) =>
      contributionsApi.review(c.id, action, action === 'CHANGES_REQUESTED' ? feedback : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'contributions', 'pending'] });
      onDone();
    },
  });

  return (
    <div className="feed-card" style={{ cursor: 'default' }}>
      <div className="feed-card-header">
        <span style={{ fontWeight: 600 }}>#{c.id} — {c.gameName} · {TYPE_LABELS[c.dataType]}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>@{c.contributorUsername}</span>
      </div>

      <button
        className="btn btn-ghost"
        style={{ margin: '8px 0', fontSize: 12, padding: '2px 8px' }}
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? 'Ocultar JSON' : 'Ver JSON'}
      </button>

      {expanded && (
        <pre style={{
          background: 'var(--bg)', borderRadius: 6, padding: 12, fontSize: 12,
          overflowX: 'auto', maxHeight: 240, marginBottom: 12
        }}>
          {JSON.stringify(c.dataJson, null, 2)}
        </pre>
      )}

      <textarea
        className="form-input"
        placeholder="Feedback (requerido si pedís cambios)"
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        style={{ minHeight: 70, fontSize: 13, resize: 'vertical', marginBottom: 8 }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-success"
          style={{ flex: 1 }}
          onClick={() => reviewMut.mutate('APPROVED')}
          disabled={reviewMut.isPending}
        >
          ✓ Aprobar
        </button>
        <button
          className="btn"
          style={{ flex: 1, background: '#f59e0b', color: '#000' }}
          onClick={() => reviewMut.mutate('CHANGES_REQUESTED')}
          disabled={reviewMut.isPending || !feedback.trim()}
        >
          ⚠ Cambios
        </button>
        <button
          className="btn btn-danger"
          style={{ flex: 1 }}
          onClick={() => reviewMut.mutate('REJECTED')}
          disabled={reviewMut.isPending}
        >
          ✗ Rechazar
        </button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Enviada: {new Date(c.createdAt).toLocaleDateString('es')}
      </div>
    </div>
  );
}

export function AdminContributionsPage() {
  const [, setSelected] = useState<number | null>(null);

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['admin', 'contributions', 'pending'],
    queryFn:  () => contributionsApi.listPending().then(r => r.data),
  });

  return (
    <Layout title="Admin — Contribuciones" back="/profile">
      <div className="page-content">
        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {!isLoading && pending.length === 0 && (
          <div className="empty-state"><p>No hay contribuciones pendientes. ✓</p></div>
        )}

        {pending.map(c => (
          <ReviewPanel
            key={c.id}
            c={c}
            onDone={() => setSelected(null)}
          />
        ))}
      </div>
    </Layout>
  );
}
