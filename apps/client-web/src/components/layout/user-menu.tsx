'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LogOut, UserRound } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { WalletChip } from '@/components/wallet/wallet-chip';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { devCreditWallet, getWallet } from '@/lib/api';

function initials(first?: string | null, last?: string | null, email?: string) {
  const a = first?.trim()?.[0];
  const b = last?.trim()?.[0];
  if (a || b) return `${a ?? ''}${b ?? ''}`.toUpperCase();
  return (email ?? 'VP').slice(0, 2).toUpperCase();
}

export function UserMenu({ avatarOnly = false }: { avatarOnly?: boolean }) {
  const t = useTranslations('nav');
  const tw = useTranslations('wallet');
  const router = useRouter();
  const { user, logout, accessToken } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet(accessToken!),
    enabled: Boolean(accessToken),
  });

  const credit = useMutation({
    mutationFn: () => devCreditWallet(accessToken!, 10_000),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0];

  return (
    <div ref={rootRef} className="relative flex items-center gap-1.5">
      {avatarOnly ? null : (
        <>
          <WalletChip />
          <NotificationBell />
        </>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('account')}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(46,163,242,0.22)] text-xs font-semibold tracking-wide text-white transition hover:border-[var(--vp-accent)] hover:bg-[rgba(46,163,242,0.35)]"
      >
        {initials(user.firstName, user.lastName, user.email)}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 overflow-hidden rounded-xl border border-[var(--vp-border)] bg-[rgba(12,14,18,0.97)] shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-md"
        >
          <div className="border-b border-[var(--vp-border)] px-4 py-3">
            <p className="truncate font-semibold text-[var(--vp-fg)]">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-[var(--vp-muted)]">{user.email}</p>
            <p className="mt-2 text-xs text-[var(--vp-accent-bright)]">
              {tw('balanceLabel')}: ${walletQuery.data?.balance ?? '…'}
            </p>
          </div>
          <div className="flex flex-col p-2">
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--vp-fg)] transition hover:bg-white/5"
            >
              <UserRound className="h-4 w-4 text-[var(--vp-muted)]" />
              {t('account')}
            </Link>
            <button
              type="button"
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--vp-muted)] transition hover:bg-white/5 hover:text-[var(--vp-fg)]"
              disabled={credit.isPending}
              title={tw('devCreditHint')}
              onClick={() => credit.mutate()}
            >
              {tw('devCredit')}
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 transition hover:bg-white/5"
              onClick={() => {
                setOpen(false);
                void logout().then(() => router.push('/'));
              }}
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
