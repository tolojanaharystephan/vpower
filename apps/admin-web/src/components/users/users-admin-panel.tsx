'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Search, Users } from 'lucide-react';
import { getAdminAccessToken, listUsers } from '@/lib/api';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { BrandLoader } from '@/components/brand/brand-loader';
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
    <div className="space-y-5 animate-fade-up">
      <div className="admin-section-head">
        <div>
          <p className="admin-eyebrow">{t('listEyebrow')}</p>
          <p className="admin-subtitle">{t('listSubtitle', { count: total })}</p>
        </div>
        <div className="admin-toolbar w-full sm:w-auto">
          <label className="relative min-w-[14rem] flex-1 sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vp-muted)]" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
            />
          </label>
        </div>
      </div>

      {isError ? <p className="text-sm text-red-400">{t('loadError')}</p> : null}

      <div className="dash-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('colUser')}</th>
                <th>{t('colRoles')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colCreated')}</th>
                <th>{t('colLastLogin')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14">
                    <BrandLoader size="sm" label={t('loading')} className="mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(212,160,23,0.12)] text-[var(--vp-accent)]">
                      <Users className="h-5 w-5" />
                    </span>
                    <p className="text-sm text-[var(--vp-muted)]">{t('empty')}</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const name =
                    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
                    user.email.split('@')[0] ||
                    'VP';
                  const initials = name.slice(0, 2).toUpperCase();
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="admin-avatar h-10 w-10 text-xs">{initials}</span>
                          <div>
                            <p className="font-medium text-[var(--vp-fg)]">{name}</p>
                            <p className="text-xs text-[var(--vp-muted)]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          {(user.roles.length ? user.roles : ['—']).map((role) => (
                            <span key={role} className="admin-chip">
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${user.isActive ? 'status-pill-on' : 'status-pill-off'}`}
                        >
                          {user.isActive ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td className="text-[var(--vp-muted)]">
                        {new Date(user.createdAt).toLocaleDateString(dateLocale)}
                      </td>
                      <td className="text-[var(--vp-muted)]">
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
