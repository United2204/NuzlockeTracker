import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  back?: string;
  action?: ReactNode;
  runId?: string;
}

export function Layout({ children, title, back, action, runId }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          {back ? (
            <Link to={back} className="back-btn" aria-label="Volver">←</Link>
          ) : (
            <span className="app-logo">⚡</span>
          )}
          <h1 className="header-title">{title ?? 'NuzlockeTracker'}</h1>
        </div>
        <div className="header-right">
          {action}
          <NotificationBell />
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
        </nav>
      )}
    </div>
  );
}
