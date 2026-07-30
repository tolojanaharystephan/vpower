'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { getAdminAccessToken, listUsers } from '@/lib/api';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { Input } from '@/components/ui/input';

export function UsersAdminPanel() {
  const t = useTranslations('users');
  const locale = useLocale();
  const { accessToken } = useAdminAuth();
  const token = accessToken ?? getAdminAccessToken() ?? '';
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => listUsers(token, { search: search || undefined, limit: 50 }),
    enabled: Boolean(token),
  });

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const dateLocale = locale === 'en' ? 'en-US' : 'fr-FR';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vp-accent)]">
            {t('listEyebrow')}
          </p>
          <p className="mt-1 text-sm text-[var(--vp-muted)]">{t('listSubtitle', { count: total })}</p>
        </div>
        <label className="relative min-w-[14rem] w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vp-muted)]" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
          />
        </label>
      </div>

      {isError ? <p className="text-sm text-red-400">{t('loadError')}</p> : null}

      <div className="dash-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--vp-border)] text-[10px] uppercase tracking-[0.14em] text-[var(--vp-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('colUser')}</th>
                <th className="px-4 py-3 font-semibold">{t('colRoles')}</th>
                <th className="px-4 py-3 font-semibold">{t('colStatus')}</th>
                <th className="px-4 py-3 font-semibold">{t('colCreated')}</th>
                <th className="px-4 py-3 font-semibold">{t('colLastLogin')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--vp-muted)]">
                    {t('loading')}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--vp-muted)]">
                    {t('empty')}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const name =
                    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0];
                  const initials = name.slice(0, 2).toUpperCase();
                  return (
                    <tr key={user.id} className="border-b border-[var(--vp-border)] last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgba(212,160,23,0.14)] font-[family-name:var(--font-display)] text-xs text-[var(--vp-accent)]">
                            {initials}
                          </span>
                          <div>
                            <p className="font-medium text-[var(--vp-fg)]">{name}</p>
                            <p className="text-xs text-[var(--vp-muted)]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--vp-muted)]">
                        {user.roles.join(' · ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`status-pill ${user.isActive ? 'status-pill-on' : 'status-pill-off'}`}
                        >
                          {user.isActive ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--vp-muted)]">
                        {new Date(user.createdAt).toLocaleDateString(dateLocale)}
                      </td>
                      <td className="px-4 py-3 text-[var(--vp-muted)]">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString(dateLocale)
                          : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
