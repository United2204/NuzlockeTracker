import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  back?: string;
  action?: ReactNode;
  runId?: string;
}

export function Layout({ children, title, back, action, runId }: LayoutProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          {back ? (
            <Link to={back} className="back-btn" aria-label="Volver">←</Link>
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
            title={theme === 'firered' ? 'Cambiar a Esmeralda' : 'Cambiar a Rojo Fuego'}
            aria-label="Cambiar tema"
          >
            {theme === 'firered' ? '💚' : '🔴'}
          </button>
          {action}
          {user ? (
            <NotificationBell />
          ) : (
            <Link to="/register" className="btn btn-ghost" style={{ fontSize: 13 }}>
              Registrarse
            </Link>
          )}
        </div>
      </header>

      <main className="app-content">
        {children}
      </main>

      {runId ? (
        <nav className="bottom-nav">
          <Link
            to={`/runs/${runId}`}
            className={`nav-tab ${location.pathname === `/runs/${runId}` ? 'active' : ''}`}
          >
            <span>🗺️</span>
            <span>Rutas</span>
          </Link>
          <Link
            to={`/runs/${runId}/team`}
            className={`nav-tab ${location.pathname === `/runs/${runId}/team` ? 'active' : ''}`}
          >
            <span>⚔️</span>
            <span>Equipo</span>
          </Link>
          <Link
            to={`/runs/${runId}/stats`}
            className={`nav-tab ${location.pathname === `/runs/${runId}/stats` ? 'active' : ''}`}
          >
            <span>📊</span>
            <span>Stats</span>
          </Link>
        </nav>
      ) : (
        <nav className="bottom-nav">
          <Link
            to="/runs"
            className={`nav-tab ${location.pathname === '/runs' ? 'active' : ''}`}
          >
            <span>🎮</span>
            <span>Runs</span>
          </Link>
          {user ? (
            <>
              <Link
                to="/feed"
                className={`nav-tab ${location.pathname === '/feed' ? 'active' : ''}`}
              >
                <span>🌐</span>
                <span>Feed</span>
              </Link>
              <Link
                to="/profile"
                className={`nav-tab ${location.pathname === '/profile' ? 'active' : ''}`}
              >
                <span>👤</span>
                <span>Perfil</span>
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className={`nav-tab ${location.pathname === '/login' ? 'active' : ''}`}
            >
              <span>👤</span>
              <span>Ingresar</span>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
