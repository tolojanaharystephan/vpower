'use client';

import {
  Gamepad2,
  Headphones,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Users,
  Wallet,
  ChartColumn,
  UserCog,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdminMark } from '@/components/brand/admin-mark';
import { Link, usePathname } from '@/i18n/navigation';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { BRAND } from '@vpower777/config';
import { cn } from '@/lib/utils';

const MASTER_NAV = [
  { href: '/', labelKey: 'dashboard' as const, icon: LayoutDashboard },
  { href: '/revenue', labelKey: 'revenue' as const, icon: ChartColumn },
  { href: '/users', labelKey: 'users' as const, icon: Users },
  { href: '/room-players', labelKey: 'roomPlayers' as const, icon: Users },
  { href: '/room-chat', labelKey: 'roomChat' as const, icon: MessageSquare },
  { href: '/room-cash', labelKey: 'roomCash' as const, icon: Wallet },
  { href: '/agents', labelKey: 'agents' as const, icon: UserCog },
  { href: '/games', labelKey: 'games' as const, icon: Gamepad2 },
  { href: '/content', labelKey: 'content' as const, icon: Newspaper },
  { href: '/support', labelKey: 'support' as const, icon: Headphones },
];

const AGENT_NAV = [
  { href: '/room-players', labelKey: 'roomPlayers' as const, icon: Users },
  { href: '/room-chat', labelKey: 'roomChat' as const, icon: MessageSquare },
  { href: '/room-cash', labelKey: 'roomCash' as const, icon: Wallet },
];

/** @deprecated use getStaffNav — kept for mobile shell compatibility */
export const ADMIN_NAV = MASTER_NAV;

export function getStaffNav(isRoomAgent: boolean) {
  return isRoomAgent ? AGENT_NAV : MASTER_NAV;
}

export function AdminSidebar() {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const pathname = usePathname();
  const { isMasterAdmin, isRoomAgent } = useAdminAuth();
  const nav = getStaffNav(isRoomAgent);

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <AdminMark className="h-9 w-9" />
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.12em] text-[var(--vp-accent-bright)]">
            {BRAND.name}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--vp-muted)]">
            {isRoomAgent ? common('agentPortal') : common('adminPortal')}
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--vp-muted)]">
          {common('menu')}
        </p>
        {nav.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('admin-nav-link', active && 'admin-nav-active')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--vp-border)] p-4">
        <div className="rounded-lg border border-[var(--vp-border)] bg-black/20 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)]">
            {common('platformStatus')}
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-xs text-[var(--vp-fg)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--vp-success)] shadow-[0_0_8px_rgba(81,199,125,0.8)]" />
            {isMasterAdmin ? common('operational') : common('agentMode')}
          </p>
        </div>
      </div>
    </aside>
  );
}
