import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';

type Status = 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const t = params.get('token');
    if (!t) { setStatus('error'); return; }
    authApi.verifyEmail(t)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [params]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        {status === 'loading' && (
          <>
            <div className="spinner" style={{ margin: '32px auto' }} />
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Verificando tu email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="auth-logo">✅</div>
            <h1 className="auth-title">¡Email verificado!</h1>
            <p className="auth-subtitle">Ya podés iniciar sesión con tu cuenta.</p>
            <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: '8px' }}>
              Iniciar sesión
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="auth-logo">❌</div>
            <h1 className="auth-title">Link inválido</h1>
            <p className="auth-subtitle">El link expiró o ya fue usado. Pedí uno nuevo.</p>
            <Link to="/login" className="btn btn-outline btn-full" style={{ marginTop: '8px' }}>
              Volver al login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
