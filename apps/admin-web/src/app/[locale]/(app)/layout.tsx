'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { RequireAdmin } from '@/components/auth/require-admin';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminMark } from '@/components/brand/admin-mark';
import { Link, usePathname } from '@/i18n/navigation';
import { BRAND } from '@vpower777/config';
import { cn } from '@/lib/utils';

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const mobileNav = [
    ['/', t('dashboard')],
    ['/users', t('users')],
    ['/games', t('games')],
    ['/content', t('content')],
    ['/support', t('support')],
  ] as const;

  return (
    <RequireAdmin>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        <button
          type="button"
          aria-label={open ? common('closeMenu') : common('openMenu')}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-[rgba(212,160,23,0.4)] bg-[var(--vp-surface)] text-[var(--vp-accent)] shadow-xl md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {open && (
          <div className="fixed inset-0 z-30 bg-black/55 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)}>
            <aside
              className="h-full w-72 border-r border-[var(--vp-border)] bg-[var(--vp-surface)] p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-[var(--vp-border)] pb-4">
                <AdminMark className="h-9 w-9" />
                <div>
                  <p className="font-[family-name:var(--font-display)] text-sm tracking-wide text-[var(--vp-accent)]">{BRAND.name}</p>
                  <p className="text-[11px] text-[var(--vp-muted)]">{common('staffConsole')}</p>
                </div>
              </div>
              <p className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--vp-muted)]">
                {common('menu')}
              </p>
              <nav className="mt-2 space-y-1">
                {mobileNav.map(([href, label]) => {
                  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'block rounded-md px-3 py-2.5 text-sm transition',
                        active ? 'admin-nav-active' : 'text-[var(--vp-muted)] hover:bg-white/5 hover:text-[var(--vp-fg)]',
                      )}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}
      </div>
    </RequireAdmin>
  );
}
