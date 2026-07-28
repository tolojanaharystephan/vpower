'use client';

import {
  Gamepad2,
  Headphones,
  LayoutDashboard,
  Newspaper,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdminMark } from '@/components/brand/admin-mark';
import { Link, usePathname } from '@/i18n/navigation';
import { BRAND } from '@vpower777/config';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const pathname = usePathname();

  const nav = [
    { href: '/', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/users', label: t('users'), icon: Users },
    { href: '/games', label: t('games'), icon: Gamepad2 },
    { href: '/content', label: t('content'), icon: Newspaper },
    { href: '/support', label: t('support'), icon: Headphones },
  ] as const;

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--vp-border)] bg-[var(--vp-surface)] md:flex">
      <div className="flex items-center gap-2.5 border-b border-[var(--vp-border)] px-4 py-4">
        <AdminMark className="h-8 w-8" />
        <div>
          <p className="font-[family-name:var(--font-display)] text-sm tracking-wide text-[var(--vp-accent)]">
            {BRAND.name}
          </p>
          <p className="text-[11px] text-[var(--vp-muted)]">{common('admin')}</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--vp-muted)]">
          {common('menu')}
        </p>
        {nav.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition',
                active
                  ? 'admin-nav-active'
                  : 'text-[var(--vp-muted)] hover:bg-white/5 hover:text-[var(--vp-fg)]',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="border-t border-[var(--vp-border)] px-4 py-3 text-[10px] text-[var(--vp-muted)]">
        {common('staffConsole')}
      </p>
    </aside>
  );
}
