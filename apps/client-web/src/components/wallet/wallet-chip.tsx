'use client';

import { useEffect, useRef, useState } from 'react';
import { Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { useRoomWallets } from '@/components/wallet/use-room-wallets';
import { roomPlayHref } from '@/lib/portal';

/** Compact trigger: lists every room wallet. */
export function WalletChip() {
  const tw = useTranslations('wallet');
  const { isAuthenticated, ready } = useSession();
  const { wallets, isLoading } = useRoomWallets();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  if (!ready || !isAuthenticated) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={tw('walletsLabel')}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-[10rem] items-center gap-1.5 truncate rounded-md border border-[rgba(255,255,255,0.12)] bg-black/25 px-2.5 py-1.5 text-xs font-semibold text-[var(--vp-fg)] transition hover:border-[var(--vp-accent)]"
      >
        <Wallet className="h-3.5 w-3.5 shrink-0 text-[var(--vp-accent)]" />
        {tw('walletsLabel')}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.4rem)] z-50 w-64 overflow-hidden rounded-xl border border-[var(--vp-border)] bg-[rgba(12,14,18,0.97)] shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-md"
        >
          <p className="border-b border-[var(--vp-border)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)]">
            {tw('roomsTitle')}
          </p>
          <ul className="p-1.5">
            {(isLoading && wallets.length === 0
              ? [{ roomSlug: '…', name: '…', balance: '…' }]
              : wallets
            ).map((wallet) => (
              <li key={wallet.roomSlug}>
                <Link
                  href={wallet.roomSlug === '…' ? '/account' : roomPlayHref(wallet.roomSlug)}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm transition hover:bg-white/5"
                >
                  <span className="truncate text-[var(--vp-fg)]">{wallet.name}</span>
                  <span className="shrink-0 font-semibold text-[var(--vp-accent-bright)]">
                    ${wallet.balance}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/account#wallets"
            onClick={() => setOpen(false)}
            className="block border-t border-[var(--vp-border)] px-3 py-2.5 text-center text-xs font-medium text-[var(--vp-accent)] hover:text-[var(--vp-accent-bright)]"
          >
            {tw('manageWallets')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
