import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth';

const GOOGLE_OAUTH_URL =
  (import.meta.env.VITE_API_URL ?? 'http://localhost:8080') + '/oauth2/authorization/google';

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(
    searchParams.get('error') === 'oauth' ? 'No se pudo iniciar sesión con Google. Intentá de nuevo.' : ''
  );
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError('');
    setUnverifiedEmail('');
    try {
      await login(data.email, data.password);
      navigate('/runs');
    } catch (err: unknown) {
      let detail = '';
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: { detail?: string } } }).response;
        detail = res?.data?.detail ?? '';
      }
      if (detail.toLowerCase().includes('not verified')) {
        setUnverifiedEmail(data.email);
        setError('Tu email no está verificado. Revisá tu bandeja de entrada.');
      } else {
        setError('Email o contraseña incorrectos');
      }
    }
  }

  async function handleResend() {
    setResendStatus('sending');
    try {
      await authApi.resendVerification(unverifiedEmail);
    } catch { /* silently fail — backend always responds 202 */ }
    setResendStatus('sent');
  }

  return (
    <div className="auth-page">
      <button
        className="btn btn-ghost"
        onClick={() => navigate(-1)}
        style={{ position: 'absolute', top: 12, left: 12, fontSize: 20, lineHeight: 1 }}
        aria-label="Volver"
      >
        ←
      </button>
      <div className="auth-card">
        <h1 className="auth-title logo-brand">
          NUZL<span className="pokeball pokeball--logo" aria-hidden="true" />CKETRACKER
        </h1>
        <p className="auth-subtitle">Iniciá sesión para continuar</p>

        <a
          href={GOOGLE_OAUTH_URL}
          className="btn btn-ghost btn-full"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, border: '1px solid var(--border)' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>o</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              autoComplete="email"
              {...register('email')}
              placeholder="tu@email.com"
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              placeholder="••••••••"
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          {error && <p className="form-error">{error}</p>}

          {unverifiedEmail && (
            <button
              type="button"
              className="btn btn-ghost btn-full"
              style={{ fontSize: 13 }}
              onClick={handleResend}
              disabled={resendStatus !== 'idle'}
            >
              {resendStatus === 'sending' ? 'Enviando...'
                : resendStatus === 'sent' ? '✅ Email reenviado — revisá tu bandeja'
                : '📧 Reenviar email de verificación'}
            </button>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Iniciando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          <Link to="/register">¿No tenés cuenta? Registrate</Link>
        </div>
      </div>
    </div>
  );
}
