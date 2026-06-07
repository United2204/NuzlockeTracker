import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { contributionsApi } from '../api/contributions';
import { Layout } from '../components/Layout';

export function ResubmitContributionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: contributions = [] } = useQuery({
    queryKey: ['me', 'contributions'],
    queryFn:  () => contributionsApi.listMine().then(r => r.data),
  });

  const contribution = contributions.find(c => c.id === Number(id));

  const [rawJson, setRawJson] = useState('');
  const [jsonError, setJsonError] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      if (!contribution) throw new Error('Contribución no encontrada');
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(rawJson); } catch { throw new Error('JSON inválido'); }
      return contributionsApi.resubmit(
        contribution.id,
        contribution.gameId,
        contribution.dataType,
        parsed
      );
    },
    onSuccess: () => navigate('/me/contributions'),
    onError: (err: Error) => setJsonError(err.message),
  });

  const initialJson = contribution
    ? JSON.stringify(contribution.dataJson, null, 2)
    : '';

  return (
    <Layout title="Corregir contribución" back="/me/contributions">
      <div className="page-content">
        {!contribution && contributions.length > 0 && (
          <div className="empty-state"><p>Contribución no encontrada.</p></div>
        )}

        {contribution && (
          <>
            {contribution.adminFeedback && (
              <div style={{
                background: 'rgba(245,158,11,.12)', border: '1px solid #f59e0b',
                borderRadius: 8, padding: '12px 16px', marginBottom: 20
              }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Feedback del admin:</p>
                <p style={{ fontSize: 14 }}>{contribution.adminFeedback}</p>
              </div>
            )}

            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Juego: <strong>{contribution.gameName}</strong> · Tipo: <strong>{contribution.dataType}</strong>
            </p>

            <div className="form-group">
              <label className="form-label">JSON corregido *</label>
              <textarea
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: 13, minHeight: 240, resize: 'vertical' }}
                defaultValue={initialJson}
                onChange={e => setRawJson(e.target.value)}
                spellCheck={false}
              />
            </div>

            {jsonError && <div className="error-banner">{jsonError}</div>}

            <button
              className="btn btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => { setJsonError(''); mutation.mutate(); }}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Enviando...' : 'Reenviar contribución'}
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
