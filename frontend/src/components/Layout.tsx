import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

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
        </div>
      </header>

      <main className="app-content">
        {children}
      </main>

      {runId && (
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
        </nav>
      )}
    </div>
  );
}
