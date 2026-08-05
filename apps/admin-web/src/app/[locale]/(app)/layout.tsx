'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { RequireAdmin } from '@/components/auth/require-admin';
import { ADMIN_NAV, AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminMark } from '@/components/brand/admin-mark';
import { Link, usePathname } from '@/i18n/navigation';
import { BRAND } from '@vpower777/config';
import { cn } from '@/lib/utils';

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <RequireAdmin>
      <div className="admin-shell flex">
        <AdminSidebar />
        <div className="admin-shell-main">{children}</div>

        <button
          type="button"
          aria-label={open ? common('closeMenu') : common('openMenu')}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-2xl border border-[rgba(212,160,23,0.45)] bg-[linear-gradient(145deg,rgba(212,160,23,0.2),rgba(18,18,24,0.95))] text-[var(--vp-accent)] shadow-[0_12px_40px_rgba(0,0,0,0.45)] md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {open ? (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          >
            <aside
              className="flex h-full w-[18rem] flex-col border-r border-[var(--vp-border)] bg-[linear-gradient(180deg,#16161d,#0e0e12)] p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-[var(--vp-border)] pb-4">
                <AdminMark className="h-9 w-9" />
                <div>
                  <p className="font-[family-name:var(--font-display)] text-sm tracking-wide text-[var(--vp-accent)]">
                    {BRAND.name}
                  </p>
                  <p className="text-[11px] text-[var(--vp-muted)]">{common('staffConsole')}</p>
                </div>
              </div>
              <p className="mt-5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--vp-muted)]">
                {common('menu')}
              </p>
              <nav className="mt-2 space-y-1">
                {ADMIN_NAV.map((item) => {
                  const active =
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn('admin-nav-link', active && 'admin-nav-active')}
                    >
                      <Icon className="h-4 w-4" />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        ) : null}
      </div>
    </RequireAdmin>
  );
}
