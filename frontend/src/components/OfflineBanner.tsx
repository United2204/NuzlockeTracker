import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="offline-banner" role="alert">
      📡 Sin conexión — los cambios se guardarán cuando vuelvas a conectarte
    </div>
  );
}
