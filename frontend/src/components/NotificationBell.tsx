import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi, type Notification } from '../api/social';

const TYPE_LABELS: Record<string, string> = {
  POKEMON_CAPTURED: 'capturó un Pokémon',
  POKEMON_FAINTED:  'un Pokémon cayó',
  BADGE_OBTAINED:   'obtuvo una medalla',
  RUN_ENDED:        'terminó una run',
  NEW_FOLLOWER:     'te empezó a seguir',
  NEW_COMMENT:      'comentó en tu run',
  NEW_REACTION:     'reaccionó a tu run',
};

function NotificationItem({ n, onRead }: { n: Notification; onRead: (id: number) => void }) {
  return (
    <div
      className={`notif-item ${n.read ? '' : 'notif-item--unread'}`}
      onClick={() => !n.read && onRead(n.id)}
    >
      <span className="notif-text">{TYPE_LABELS[n.type] ?? n.type}</span>
      <span className="notif-date">
        {new Date(n.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
      </span>
    </div>
  );
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
