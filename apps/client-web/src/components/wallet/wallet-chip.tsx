'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSession } from '@/components/auth/session-provider';
import { getWallet } from '@/lib/api';

/** Compact VPower cash balance (dev credit lives in the user menu). */
export function WalletChip() {
  const { accessToken, isAuthenticated, ready } = useSession();

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet(accessToken!),
    enabled: Boolean(ready && isAuthenticated && accessToken),
  });

  if (!ready || !isAuthenticated) return null;

  const balance = walletQuery.data?.balance ?? '…';

  return (
    <span className="inline-flex max-w-[7.5rem] items-center gap-1.5 truncate rounded-md border border-[rgba(255,255,255,0.12)] bg-black/25 px-2.5 py-1.5 text-xs font-semibold text-[var(--vp-fg)]">
      <Wallet className="h-3.5 w-3.5 shrink-0 text-[var(--vp-accent)]" />
      ${balance}
    </span>
  );
}
