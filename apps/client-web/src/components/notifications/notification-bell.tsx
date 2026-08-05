'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
} from '@/lib/api';
import { connectSupportSocket } from '@/lib/support-socket';

export function NotificationBell() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const { accessToken, isAuthenticated, ready } = useSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const enabled = Boolean(ready && isAuthenticated && accessToken);

  const countQuery = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => unreadNotificationCount(accessToken!),
    enabled,
    refetchInterval: 60_000,
  });

  const listQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications(accessToken!),
    enabled: enabled && open,
  });

  useEffect(() => {
    if (!accessToken || !isAuthenticated) return;
    const socket = connectSupportSocket(accessToken);
    socket.on('notification:new', () => {
      void queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    return () => {
      socket.disconnect();
    };
  }, [accessToken, isAuthenticated, queryClient]);

  if (!enabled) return null;

  const count = countQuery.data ?? 0;
  const items = listQuery.data ?? [];
  const dateLocale = locale === 'en' ? 'en-US' : 'fr-FR';

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t('title')}
        className="relative rounded-md p-2 text-[var(--vp-muted)] transition hover:bg-white/5 hover:text-[var(--vp-fg)]"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-4 w-4" />
        {count > 0 ? (
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--vp-accent)]" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[var(--vp-border)] bg-[var(--vp-bg)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--vp-border)] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--vp-muted)]">
              {t('title')}
            </p>
            <button
              type="button"
              className="text-[10px] text-[var(--vp-accent)]"
              onClick={() => {
                void markAllNotificationsRead(accessToken!).then(() => {
                  void queryClient.invalidateQueries({ queryKey: ['notif-count'] });
                  void queryClient.invalidateQueries({ queryKey: ['notifications'] });
                });
              }}
            >
              {t('markAll')}
            </button>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[var(--vp-muted)]">{t('empty')}</li>
            ) : (
              items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={
                      typeof n.data?.ticketId === 'string'
                        ? `/support`
                        : '/support'
                    }
                    className="block px-3 py-2.5 hover:bg-white/[0.04]"
                    onClick={() => {
                      void markNotificationRead(accessToken!, n.id);
                      setOpen(false);
                    }}
                  >
                    <p className="text-sm font-medium text-[var(--vp-fg)]">{n.title}</p>
                    <p className="truncate text-xs text-[var(--vp-muted)]">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--vp-muted)]">
                      {new Date(n.createdAt).toLocaleString(dateLocale)}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
