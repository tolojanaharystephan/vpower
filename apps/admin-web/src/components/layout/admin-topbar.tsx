'use client';

import { Bell, LogOut, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { Button } from '@/components/ui/button';

function initials(email?: string | null, firstName?: string | null) {
  if (firstName?.trim()) return firstName.trim().slice(0, 2).toUpperCase();
  if (!email) return 'VP';
  return email.slice(0, 2).toUpperCase();
}

export function AdminTopbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const t = useTranslations('common');
  const { user, roles, logout } = useAdminAuth();

  return (
    <header className="admin-topbar sticky top-0 z-20 border-b border-[var(--vp-border)] px-5 sm:px-6 lg:px-8">
      <div className="flex min-h-[4.75rem] items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--vp-accent)]">
            {t('operations')}
          </p>
          <h1 className="truncate font-[family-name:var(--font-display)] text-xl tracking-wide text-[var(--vp-fg)] sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-sm text-[var(--vp-muted)]">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <label className="admin-search hidden md:flex">
            <Search className="h-4 w-4 shrink-0 text-[var(--vp-muted)]" aria-hidden />
            <input
              type="search"
              placeholder={t('searchPlaceholder')}
              className="w-44 bg-transparent text-sm text-[var(--vp-fg)] outline-none placeholder:text-[var(--vp-muted)] lg:w-56"
            />
          </label>

          <LocaleSwitcher className="rounded-lg border border-[var(--vp-border)] bg-white/[0.03] px-2.5 py-1.5 text-xs uppercase tracking-wider text-[var(--vp-muted)] transition hover:border-[rgba(212,160,23,0.35)] hover:text-[var(--vp-fg)]" />

          <button
            type="button"
            aria-label={t('notifications')}
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-[var(--vp-border)] bg-white/[0.03] text-[var(--vp-muted)] transition hover:border-[rgba(212,160,23,0.35)] hover:text-[var(--vp-fg)]"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[var(--vp-accent)] shadow-[0_0_8px_var(--vp-accent)]" />
          </button>

          <div className="flex items-center gap-2.5 rounded-xl border border-[var(--vp-border)] bg-white/[0.03] py-1.5 pl-1.5 pr-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[rgba(212,160,23,0.16)] font-[family-name:var(--font-display)] text-xs text-[var(--vp-accent)]">
              {initials(user?.email, user?.firstName)}
            </span>
            <div className="hidden min-w-0 lg:block">
              <p className="max-w-[10rem] truncate text-sm text-[var(--vp-fg)]">{user?.email}</p>
              <p className="truncate text-[10px] uppercase tracking-[0.12em] text-[var(--vp-muted)]">
                {roles.join(' · ') || '—'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => void logout()}
              aria-label={t('logout')}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
