import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { token } from '../utils/token';
import { authApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

// Página que recibe los tokens del redirect de Google OAuth2.
// El backend redirige a /oauth2/callback?access_token=...&refresh_token=...
export function OAuth2CallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login: _login } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      navigate('/login?error=oauth', { replace: true });
      return;
    }

    token.set(accessToken, refreshToken);

    authApi.me()
      .then(() => navigate('/runs', { replace: true }))
      .catch(() => {
        token.clear();
        navigate('/login?error=oauth', { replace: true });
      });
  }, []);

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Iniciando sesión con Google...</p>
    </div>
  );
}
