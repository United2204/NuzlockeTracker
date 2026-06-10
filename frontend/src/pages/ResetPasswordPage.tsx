import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/auth';

const schema = z.object({
  password:        z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const token = params.get('token') ?? '';

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError('');
    try {
      await authApi.resetPassword(token, data.password);
      setDone(true);
    } catch {
      setError('El link expiró o ya fue usado. Pedí uno nuevo.');
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">❌</div>
          <h1 className="auth-title">Link inválido</h1>
          <Link to="/forgot-password" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
            Pedir nuevo link
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">✅</div>
          <h1 className="auth-title">Contraseña restablecida</h1>
          <p className="auth-subtitle">Ya podés iniciar sesión con tu nueva contraseña.</p>
          <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔑</div>
        <h1 className="auth-title">Nueva contraseña</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" style={{ marginTop: 16 }}>
          <div className="form-group">
            <label className="form-label">Nueva contraseña</label>
            <input
              className="form-input"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              placeholder="Mínimo 8 caracteres"
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <input
              className="form-input"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              placeholder="Repetí la contraseña"
            />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Restablecer contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
