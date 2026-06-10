import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/auth';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    await authApi.forgotPassword(data.email);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">📧</div>
          <h1 className="auth-title">Revisá tu email</h1>
          <p className="auth-subtitle">Si existe una cuenta con ese email, te mandamos un link para restablecer tu contraseña. Expira en 1 hora.</p>
          <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔑</div>
        <h1 className="auth-title">Olvidé mi contraseña</h1>
        <p className="auth-subtitle">Ingresá tu email y te mandamos un link para restablecerla.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" style={{ marginTop: 16 }}>
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

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Volver al login</Link>
        </div>
      </div>
    </div>
  );
}
