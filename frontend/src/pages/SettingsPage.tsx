import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';
import { Layout } from '../components/Layout';

export function SettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['me', 'settings'],
    queryFn: () => settingsApi.get().then(r => r.data),
  });

  const [allowFollowers, setAllowFollowers] = useState(true);
  const [language, setLanguage] = useState<'en' | 'es' | ''>('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setAllowFollowers(data.allowFollowers);
      setLanguage((data.language as 'en' | 'es') ?? '');
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () =>
      settingsApi.update({
        allowFollowers,
        language: language || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <Layout title="Configuración" back="/profile">
      <div className="page-content">
        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {data && (
          <form
            onSubmit={e => { e.preventDefault(); saveMut.mutate(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* Language */}
            <section className="stats-section">
              <h3 className="stats-section-title">Idioma</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                Idioma de la interfaz. Vacío = usar el idioma del navegador.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['', 'es', 'en'] as const).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    className={`btn ${language === lang ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1 }}
                    onClick={() => setLanguage(lang)}
                  >
                    {lang === '' ? 'Auto' : lang === 'es' ? 'Español' : 'English'}
                  </button>
                ))}
              </div>
            </section>

            {/* Allow followers */}
            <section className="stats-section">
              <h3 className="stats-section-title">Privacidad</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 0' }}>
                <div
                  onClick={() => setAllowFollowers(f => !f)}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: allowFollowers ? 'var(--accent)' : 'var(--border)',
                    position: 'relative', transition: 'background .2s', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2, left: allowFollowers ? 22 : 2,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    transition: 'left .2s',
                  }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>Permitir seguidores</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                    Si está desactivado, nadie nuevo podrá seguirte.
                  </p>
                </div>
              </label>
            </section>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saveMut.isPending}
            >
              {saveMut.isPending ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
            </button>

            {saveMut.isError && (
              <p className="error-banner">No se pudo guardar. Intentá de nuevo.</p>
            )}
          </form>
        )}
      </div>
    </Layout>
  );
}
