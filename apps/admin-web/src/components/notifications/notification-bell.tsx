'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Bell } from 'lucide-react';
import {
  getAdminAccessToken,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
  type AppNotification,
} from '@/lib/api';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { connectSupportSocket } from '@/lib/support-socket';

export function NotificationBell() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const router = useRouter();
  const { accessToken } = useAdminAuth();
  const token = accessToken ?? getAdminAccessToken() ?? '';
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const countQuery = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => unreadNotificationCount(token),
    enabled: Boolean(token),
    refetchInterval: 60_000,
  });

  const listQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications(token),
    enabled: Boolean(token && open),
  });

  useEffect(() => {
    if (!token) return;
    const socket = connectSupportSocket(token);
    socket.on('notification:new', () => {
      void queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    });
    socket.on('message:new', () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-support-ticket'] });
    });
    socket.on('ticket:created', () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    });
    socket.on('ticket:updated', () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-support-ticket'] });
    });
    return () => {
      socket.disconnect();
    };
  }, [token, queryClient]);

  const count = countQuery.data ?? 0;
  const items = listQuery.data ?? [];
  const dateLocale = locale === 'en' ? 'en-US' : 'fr-FR';

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t('title')}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-[var(--vp-border)] bg-white/[0.03] text-[var(--vp-muted)] transition hover:border-[rgba(212,160,23,0.35)] hover:text-[var(--vp-fg)]"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-4 w-4" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--vp-accent)] px-1 text-[9px] font-bold text-[#1a1205]">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--vp-border)] bg-[var(--vp-bg)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--vp-border)] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--vp-muted)]">
              {t('title')}
            </p>
            <button
              type="button"
              className="text-[10px] text-[var(--vp-accent)] hover:underline"
              onClick={() => {
                void markAllNotificationsRead(token).then(() => {
                  void queryClient.invalidateQueries({ queryKey: ['notif-count'] });
                  void queryClient.invalidateQueries({ queryKey: ['notifications'] });
                });
              }}
            >
              {t('markAll')}
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[var(--vp-muted)]">{t('empty')}</li>
            ) : (
              items.map((n: AppNotification) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2.5 text-left hover:bg-white/[0.04] ${
                      n.readAt ? 'opacity-60' : ''
                    }`}
                    onClick={() => {
                      void markNotificationRead(token, n.id).then(() => {
                        void queryClient.invalidateQueries({ queryKey: ['notif-count'] });
                        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
                      });
                      const ticketId = n.data?.ticketId;
                      if (typeof ticketId === 'string') {
                        router.push(`/support?ticket=${ticketId}`);
                      }
                      setOpen(false);
                    }}
                  >
                    <p className="text-sm font-medium text-[var(--vp-fg)]">{n.title}</p>
                    <p className="truncate text-xs text-[var(--vp-muted)]">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--vp-muted)]">
                      {new Date(n.createdAt).toLocaleString(dateLocale)}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
