import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi, type Notification } from '../api/social';

function notifText(n: Notification): string {
  if (n.type === 'NEW_FOLLOWER') return 'te empezó a seguir';
  if (n.type === 'POKEMON_CAPTURED') return 'capturó un Pokémon';
  if (n.type === 'POKEMON_FAINTED') return 'un Pokémon cayó';
  if (n.type === 'BADGE_OBTAINED') return 'obtuvo una medalla';
  if (n.type === 'RUN_ENDED') return 'terminó una run';
  if (n.type === 'NEW_COMMENT') return 'comentó en tu run';
  if (n.type === 'NEW_REACTION') return 'reaccionó a tu run';
  return n.type;
}

function NotificationItem({ n, onRead }: { n: Notification; onRead: (id: number) => void }) {
  const isFollower = n.type === 'NEW_FOLLOWER' && n.actorUsername;

  const content = (
    <div
      className={`notif-item ${n.read ? '' : 'notif-item--unread'}`}
      onClick={() => !n.read && onRead(n.id)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {isFollower ? (
          <span className="notif-text">
            <strong>@{n.actorUsername}</strong> {notifText(n)}
          </span>
        ) : (
          <span className="notif-text">{notifText(n)}</span>
        )}
      </div>
      <span className="notif-date">
        {new Date(n.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
      </span>
    </div>
  );

  if (isFollower) {
    return (
      <Link to={`/u/${n.actorUsername}`} style={{ textDecoration: 'none', display: 'block' }}>
        {content}
      </Link>
    );
  }
  return content;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn:  () => socialApi.getUnreadCount().then(r => r.data),
    refetchInterval: 60_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => socialApi.getNotifications().then(r => r.data),
    enabled:  open,
  });

  const seenMut = useMutation({
    mutationFn: socialApi.markSeen,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications', 'count'] }),
  });

  const readMut = useMutation({
    mutationFn: (id: number) => socialApi.markRead(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'count'] });
    },
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    const close = (e: Event) => {
      if ((e as CustomEvent).detail !== 'notifications') setOpen(false);
    };
    window.addEventListener('panel:open', close);
    return () => window.removeEventListener('panel:open', close);
  }, []);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      window.dispatchEvent(new CustomEvent('panel:open', { detail: 'notifications' }));
      seenMut.mutate();
    }
  };

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button className="notif-bell-btn" onClick={handleOpen} aria-label="Notificaciones">
        🔔
        {count > 0 && <span className="notif-badge">{count > 99 ? '99+' : count}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">Notificaciones</div>
          {!notifications && <div className="notif-empty">Cargando...</div>}
          {notifications && notifications.length === 0 && (
            <div className="notif-empty">Sin notificaciones</div>
          )}
          {notifications && notifications.slice(0, 30).map(n => (
            <NotificationItem key={n.id} n={n} onRead={id => readMut.mutate(id)} />
          ))}
        </div>
      )}
    </div>
  );
}
