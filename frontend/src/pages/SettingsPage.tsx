import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { settingsApi } from '../api/settings';
import { authApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../components/Layout';

function daysUntilUsernameChange(lastChanged: string | null): number | null {
  if (!lastChanged) return null;
  const cooldownEnd = new Date(lastChanged);
  cooldownEnd.setDate(cooldownEnd.getDate() + 30);
  const remaining = Math.ceil((cooldownEnd.getTime() - Date.now()) / 86_400_000);
  return remaining > 0 ? remaining : null;
}

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();

  // ── Settings (language + privacy) ─────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['me', 'settings'],
    queryFn: () => settingsApi.get().then(r => r.data),
  });

  const [allowFollowers, setAllowFollowers] = useState(true);
  const [language, setLanguage] = useState<'en' | 'es' | ''>('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setAllowFollowers(data.allowFollowers);
      setLanguage((data.language as 'en' | 'es') ?? '');
    }
  }, [data]);

  const settingsMut = useMutation({
    mutationFn: () => settingsApi.update({ allowFollowers, language: language || null }),
    onSuccess: () => {
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
      const lang = language || navigator.language.split('-')[0] || 'es';
      i18n.changeLanguage(lang);
      if (language) localStorage.setItem('language', language);
      else localStorage.removeItem('language');
    },
  });

  // ── Profile (username + avatar) ────────────────────────────────────────
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setAvatarUrl(user.avatarUrl ?? '');
    }
  }, [user]);

  const cooldownDays = daysUntilUsernameChange(user?.lastUsernameChangedAt ?? null);
  const usernameChanged = username !== (user?.username ?? '');

  const profileMut = useMutation({
    mutationFn: () => authApi.updateProfile({
      username: usernameChanged ? username : undefined,
      avatarUrl: avatarUrl.trim() || null,
    }),
    onSuccess: () => {
      setProfileError(null);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
      refreshUser();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setProfileError(msg ?? 'No se pudo guardar. Intentá de nuevo.');
    },
  });

  return (
    <Layout title={t('settings.title')} back="/profile">
      <div className="page-content">
        {isLoading && <div className="spinner" style={{ margin: '48px auto' }} />}

        {/* ── Profile section ── */}
        {user && (
          <form
            onSubmit={e => { e.preventDefault(); profileMut.mutate(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}
          >
            <section className="stats-section">
              <h3 className="stats-section-title">{t('settings.profile')}</h3>

              {/* Avatar preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div className="profile-avatar" style={{ width: 56, height: 56, fontSize: 22, flexShrink: 0 }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    : user.username.charAt(0).toUpperCase()
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                    {t('settings.avatarUrl')}
                  </label>
                  <input
                    className="input"
                    type="url"
                    placeholder="https://..."
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Username */}
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                {t('settings.username')}
              </label>
              <input
                className="input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={cooldownDays != null}
                minLength={3}
                maxLength={50}
                pattern="^[a-zA-Z0-9_]+$"
              />
              {cooldownDays != null && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {t('settings.usernameCooldown', { days: cooldownDays })}
                </p>
              )}
            </section>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={profileMut.isPending}
            >
              {profileMut.isPending ? t('btn.saving') : profileSaved ? t('btn.saved') : t('settings.saveProfile')}
            </button>

            {profileError && <p className="error-banner">{profileError}</p>}
          </form>
        )}

        {/* ── Settings section ── */}
        {data && (
          <form
            onSubmit={e => { e.preventDefault(); settingsMut.mutate(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* Language */}
            <section className="stats-section">
              <h3 className="stats-section-title">{t('settings.language')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                {t('settings.languageDesc')}
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
                    {lang === '' ? t('settings.auto') : lang === 'es' ? 'Español' : 'English'}
                  </button>
                ))}
              </div>
            </section>

            {/* Allow followers */}
            <section className="stats-section">
              <h3 className="stats-section-title">{t('settings.privacy')}</h3>
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
                  <p style={{ margin: 0, fontWeight: 600 }}>{t('settings.allowFollowers')}</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                    {t('settings.allowFollowersDesc')}
                  </p>
                </div>
              </label>
            </section>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={settingsMut.isPending}
            >
              {settingsMut.isPending ? t('btn.saving') : settingsSaved ? t('btn.saved') : t('btn.save')}
            </button>

            {settingsMut.isError && (
              <p className="error-banner">No se pudo guardar. Intentá de nuevo.</p>
            )}
          </form>
        )}
      </div>
    </Layout>
  );
}
