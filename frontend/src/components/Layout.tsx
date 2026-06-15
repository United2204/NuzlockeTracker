import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  back?: string | number;
  action?: ReactNode;
  runId?: string;
}

export function Layout({ children, title, back, action, runId }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggle } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          {back ? (
            typeof back === 'number'
              ? <button className="back-btn" aria-label="Volver" onClick={() => navigate(back)}>←</button>
              : <Link to={back} className="back-btn" aria-label="Volver">←</Link>
          ) : (
            <span className="app-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </span>
          )}
          <h1 className="header-title">{title ?? 'NuzlockeTracker'}</h1>
        </div>
        <div className="header-right">
          <button
            className="btn btn-ghost theme-toggle"
            onClick={toggle}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          {action}
          {user ? (
            <NotificationBell />
          ) : (
            <Link to="/register" className="btn btn-ghost" style={{ fontSize: 13 }}>
              {t('btn.register')}
            </Link>
          )}
        </div>
      </header>

      <main className="app-content">
        {children}
      </main>

      {runId ? (
        <nav className="bottom-nav">
          <Link to="/runs" className="sidebar-brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
            NuzlockeTracker
          </Link>
          <Link
            to={`/runs/${runId}`}
            className={`nav-tab ${location.pathname === `/runs/${runId}` ? 'active' : ''}`}
          >
            <span>🗺️</span>
            <span>{t('runNav.routes')}</span>
          </Link>
          <Link
            to={`/runs/${runId}/team`}
            className={`nav-tab ${location.pathname === `/runs/${runId}/team` ? 'active' : ''}`}
          >
            <span>⚔️</span>
            <span>{t('runNav.team')}</span>
          </Link>
          <Link
            to={`/runs/${runId}/stats`}
            className={`nav-tab ${location.pathname === `/runs/${runId}/stats` ? 'active' : ''}`}
          >
            <span>📊</span>
            <span>{t('runNav.stats')}</span>
          </Link>
        </nav>
      ) : (
        <nav className="bottom-nav">
          <Link to="/runs" className="sidebar-brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
            NuzlockeTracker
          </Link>
          <Link
            to="/runs"
            className={`nav-tab ${location.pathname === '/runs' ? 'active' : ''}`}
          >
            <span>🎮</span>
            <span>{t('nav.runs')}</span>
          </Link>
          {user ? (
            <>
              <Link
                to="/feed"
                className={`nav-tab ${location.pathname === '/feed' ? 'active' : ''}`}
              >
                <span>🌐</span>
                <span>{t('nav.feed')}</span>
              </Link>
              <Link
                to="/profile"
                className={`nav-tab ${location.pathname === '/profile' ? 'active' : ''}`}
              >
                <span>
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle' }} />
                    : '👤'
                  }
                </span>
                <span>{t('nav.profile')}</span>
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className={`nav-tab ${location.pathname === '/login' ? 'active' : ''}`}
            >
              <span>👤</span>
              <span>{t('nav.login')}</span>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
