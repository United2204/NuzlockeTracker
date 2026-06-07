import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/auth';

const schema = z.object({
  email:    z.string().email('Email inválido'),
  username: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y _'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError('');
    try {
      await authApi.register(data.email, data.username, data.password);
      setDone(true);
    } catch (e: unknown) {
      const axiosError = e as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message ?? 'Error al registrarse. Intenta de nuevo.');
    }
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">📧</div>
          <h1 className="auth-title">¡Cuenta creada!</h1>
          <p className="auth-subtitle">Revisá tu email para verificar tu cuenta antes de iniciar sesión.</p>
          <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: '8px' }}>
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚡</div>
        <h1 className="auth-title">Crear cuenta</h1>

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
            <label className="form-label">Username</label>
            <input
              className="form-input"
              autoComplete="username"
              {...register('username')}
              placeholder="ej: ash_ketchum"
            />
            {errors.username && <span className="form-error">{errors.username.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              placeholder="Mínimo 8 caracteres"
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">¿Ya tenés cuenta? Iniciá sesión</Link>
        </div>
      </div>
    </div>
  );
}
