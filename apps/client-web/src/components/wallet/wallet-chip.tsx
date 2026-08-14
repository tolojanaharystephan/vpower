'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSession } from '@/components/auth/session-provider';
import { Button } from '@/components/ui/button';
import { devCreditWallet, getWallet } from '@/lib/api';

/** Shows VPower cash balance; dev credit until Stripe. */
export function WalletChip() {
  const t = useTranslations('wallet');
  const { accessToken, isAuthenticated, ready } = useSession();
  const queryClient = useQueryClient();

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet(accessToken!),
    enabled: Boolean(ready && isAuthenticated && accessToken),
  });

  const credit = useMutation({
    mutationFn: () => devCreditWallet(accessToken!, 10_000),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  if (!ready || !isAuthenticated) return null;

  const balance = walletQuery.data?.balance ?? '…';

  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(255,255,255,0.12)] bg-black/25 px-2.5 py-1.5 text-xs font-semibold text-[var(--vp-fg)]">
        <Wallet className="h-3.5 w-3.5 text-[var(--vp-accent)]" />
        ${balance}
      </span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="hidden text-[10px] uppercase tracking-wider lg:inline-flex"
        disabled={credit.isPending}
        onClick={() => credit.mutate()}
        title={t('devCreditHint')}
      >
        {t('devCredit')}
      </Button>
    </div>
  );
}
