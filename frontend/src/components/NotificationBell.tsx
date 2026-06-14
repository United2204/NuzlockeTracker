import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { socialApi, type Notification } from '../api/social';

function notifKey(type: string): string {
  const map: Record<string, string> = {
    NEW_FOLLOWER:     'notifications.newFollower',
    POKEMON_CAPTURED: 'notifications.pokemonCaptured',
    POKEMON_FAINTED:  'notifications.pokemonFainted',
    BADGE_OBTAINED:   'notifications.badgeObtained',
    RUN_ENDED:        'notifications.runEnded',
    NEW_COMMENT:      'notifications.newComment',
    NEW_REACTION:     'notifications.newReaction',
  };
  return map[type] ?? type;
}

function NotificationItem({
  n,
  onRead,
  onFollow,
  followed,
}: {
  n: Notification;
  onRead: (id: number) => void;
  onFollow: (actorId: string) => void;
  followed: Set<string>;
}) {
  const { t, i18n } = useTranslation();
  const isFollower = n.type === 'NEW_FOLLOWER' && n.actorUsername;
  const alreadyFollowed = n.actorId ? followed.has(n.actorId) : false;
  const date = new Date(n.createdAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  const content = (
    <div
      className={`notif-item ${n.read ? '' : 'notif-item--unread'}`}
      onClick={() => !n.read && onRead(n.id)}
    >
      <div className="notif-item-body">
        <span className="notif-text">
          {isFollower
            ? <><strong>@{n.actorUsername}</strong> {t('notifications.newFollower')}</>
            : t(notifKey(n.type))
          }
        </span>
        {isFollower && n.actorId && (
          <button
            className="btn btn-ghost notif-follow-btn"
            disabled={alreadyFollowed}
            onClick={e => { e.stopPropagation(); e.preventDefault(); onFollow(n.actorId!); }}
          >
            {alreadyFollowed ? t('notifications.following') : t('btn.follow')}
          </button>
        )}
      </div>
      <span className="notif-date">{date}</span>
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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
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

  const followMut = useMutation({
    mutationFn: (actorId: string) => socialApi.follow(actorId),
    onSuccess:  (_, actorId) => setFollowed(prev => new Set([...prev, actorId])),
    onError:    (_, actorId) => setFollowed(prev => new Set([...prev, actorId])),
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
      <button className="notif-bell-btn" onClick={handleOpen} aria-label={t('notifications.title')}>
        🔔
        {count > 0 && <span className="notif-badge">{count > 99 ? '99+' : count}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">{t('notifications.title')}</div>
          {!notifications && <div className="notif-empty">{t('notifications.loading')}</div>}
          {notifications && notifications.length === 0 && (
            <div className="notif-empty">{t('notifications.empty')}</div>
          )}
          {notifications && notifications.slice(0, 30).map(n => (
            <NotificationItem
              key={n.id}
              n={n}
              onRead={id => readMut.mutate(id)}
              onFollow={actorId => followMut.mutate(actorId)}
              followed={followed}
            />
          ))}
        </div>
      )}
    </div>
  );
}
