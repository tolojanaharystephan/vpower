'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CreditCard, MessageSquare, Wallet } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { Button } from '@/components/ui/button';
import { useRoomWallets } from '@/components/wallet/use-room-wallets';
import { createAllscaleCheckout, devCreditWallet, getHealthFeatures } from '@/lib/api';
import { roomPlayHref } from '@/lib/portal';

const DEPOSIT_PRESETS_CENTS = [1_000, 2_500, 5_000, 10_000] as const;

export function RoomWalletsPanel() {
  const t = useTranslations('account');
  const tw = useTranslations('wallet');
  const { accessToken } = useSession();
  const queryClient = useQueryClient();
  const { wallets, isLoading } = useRoomWallets();
  const [depositRoom, setDepositRoom] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  const features = useQuery({
    queryKey: ['health-features'],
    queryFn: getHealthFeatures,
    staleTime: 60_000,
  });
  const paymentsEnabled = Boolean(features.data?.paymentsEnabled);

  const credit = useMutation({
    mutationFn: (roomSlug: string) => devCreditWallet(accessToken!, roomSlug, 10_000),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });

  const checkout = useMutation({
    mutationFn: ({ roomSlug, amountCents }: { roomSlug: string; amountCents: number }) =>
      createAllscaleCheckout(accessToken!, roomSlug, amountCents),
    onSuccess: (data) => {
      setDepositError(null);
      window.location.assign(data.checkoutUrl);
    },
    onError: (err: Error) => {
      setDepositError(err.message || tw('depositError'));
    },
  });

  return (
    <section id="wallets" className="mt-5 scroll-mt-24">
      <div className="mb-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vp-accent)]">
          {t('walletsEyebrow')}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--vp-fg)]">
          {t('walletsTitle')}
        </h2>
        <p className="mt-1 text-sm text-[var(--vp-muted)]">{t('walletsBody')}</p>
        {depositError ? (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {depositError}
          </p>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(isLoading && wallets.length === 0 ? [] : wallets).map((wallet) => (
          <article key={wallet.roomSlug} className="cinema-panel flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-[var(--vp-muted)]">
                  <Wallet className="h-4 w-4 text-[var(--vp-accent)]" />
                  {wallet.name}
                </p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--vp-fg)]">
                  ${wallet.balance}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={roomPlayHref(wallet.roomSlug)} className="flex-1">
                <Button variant="secondary" className="w-full" size="sm">
                  {tw('openRoom')}
                </Button>
              </Link>
              {paymentsEnabled ? (
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  disabled={!accessToken || checkout.isPending}
                  onClick={() => {
                    setDepositError(null);
                    setDepositRoom((cur) =>
                      cur === wallet.roomSlug ? null : wallet.roomSlug,
                    );
                  }}
                >
                  {tw('deposit')}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  disabled={!accessToken || credit.isPending}
                  title={tw('devCreditHint')}
                  onClick={() => credit.mutate(wallet.roomSlug)}
                >
                  {tw('devCredit')}
                </Button>
              )}
            </div>
            {paymentsEnabled && depositRoom === wallet.roomSlug ? (
              <div className="mt-3 space-y-3 border-t border-[rgba(255,255,255,0.08)] pt-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--vp-accent)]">
                    {tw('methodsAvailable')}
                  </p>
                  <ul className="mt-1.5 space-y-1 text-sm text-[var(--vp-fg)]">
                    <li className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-[var(--vp-accent)]" />
                      {tw('methodCard')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="grid h-3.5 w-3.5 place-items-center rounded-sm border border-[rgba(46,163,242,0.45)] text-[9px] font-semibold text-[var(--vp-accent)]"
                      >
                        $
                      </span>
                      {tw('methodCrypto')}
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-[var(--vp-muted)]">{tw('methodsHint')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEPOSIT_PRESETS_CENTS.map((cents) => (
                    <Button
                      key={cents}
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={!accessToken || checkout.isPending}
                      onClick={() =>
                        checkout.mutate({ roomSlug: wallet.roomSlug, amountCents: cents })
                      }
                    >
                      ${(cents / 100).toFixed(0)}
                    </Button>
                  ))}
                </div>
                <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-black/20 px-3 py-2.5">
                  <p className="text-xs text-[var(--vp-muted)]">{tw('methodsLater')}</p>
                  <Link
                    href="/support"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--vp-accent-bright)] hover:underline"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {tw('depositViaAgent')}
                  </Link>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function RoomWalletLine({ roomSlug }: { roomSlug: string }) {
  const tw = useTranslations('wallet');
  const { bySlug, isLoading } = useRoomWallets();
  const wallet = bySlug(roomSlug);
  if (!wallet && !isLoading) return null;

  return (
    <p className="mt-3 text-sm text-[var(--vp-accent-bright)]">
      {tw('thisRoom')}: ${wallet?.balance ?? '…'}
    </p>
  );
}
