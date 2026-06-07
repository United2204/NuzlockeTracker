import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/runs');
    } catch {
      setError('Email o contraseña incorrectos');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚡</div>
        <h1 className="auth-title">NuzlockeTracker</h1>
        <p className="auth-subtitle">Iniciá sesión para continuar</p>

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

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Iniciando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/register">¿No tenés cuenta? Registrate</Link>
        </div>
      </div>
    </div>
  );
}
