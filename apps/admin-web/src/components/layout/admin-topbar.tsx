'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { NotificationBell } from '@/components/notifications/notification-bell';
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
    <header className="admin-topbar sticky top-0 z-20 px-5 sm:px-6 lg:px-8">
      <div className="flex min-h-[4.5rem] items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <h1 className="admin-title truncate">{title}</h1>
          {subtitle ? <p className="admin-subtitle truncate">{subtitle}</p> : null}
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <LocaleSwitcher className="rounded-lg border border-[var(--vp-border)] bg-white/[0.03] px-2.5 py-1.5 text-xs uppercase tracking-wider text-[var(--vp-muted)] transition hover:border-[rgba(46,163,242,0.35)] hover:text-[var(--vp-fg)]" />

          <NotificationBell />

          <div className="flex items-center gap-2.5 rounded-xl border border-[var(--vp-border)] bg-white/[0.03] py-1.5 pl-1.5 pr-2 sm:pr-2.5">
            <span className="admin-avatar h-9 w-9 text-xs">
              {initials(user?.email, user?.firstName)}
            </span>
            <div className="hidden min-w-0 lg:block">
              <p className="max-w-[11rem] truncate text-sm text-[var(--vp-fg)]">
                {user?.firstName || user?.email || 'Admin'}
              </p>
              <p className="truncate text-[10px] uppercase tracking-[0.12em] text-[var(--vp-muted)]">
                {roles.join(' · ') || t('staffConsole')}
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
