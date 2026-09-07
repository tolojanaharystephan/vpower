'use client';

import {
  Facebook,
  Instagram,
  MessageCircle,
  Radio,
  Gamepad2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import type { PortalProvider } from '@/lib/portal';
import { roomPlayHref } from '@/lib/portal';
import { useRoomWallets } from '@/components/wallet/use-room-wallets';

export function ProviderPortalCard({ provider }: { provider: PortalProvider }) {
  const t = useTranslations('portal');
  const tw = useTranslations('wallet');
  const { bySlug } = useRoomWallets();
  const wallet = bySlug(provider.slug);
  const enterHref = roomPlayHref(provider.slug);

  return (
    <article
      className="portal-provider-card group h-full"
      style={{ ['--portal-card-accent' as string]: provider.accent }}
    >
      <div className="flex h-full flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <Link href={enterHref} className="min-w-0 flex-1">
            <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--vp-fg)] transition group-hover:text-[var(--vp-accent-bright)]">
              {provider.name}
            </h3>
          </Link>
          {provider.live ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[rgba(252,185,0,0.55)] bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-accent-gold)]">
              <Radio className="h-3 w-3" />
              {t('live')}
            </span>
          ) : null}
        </div>

        <p className="mt-1 text-sm font-medium text-[var(--vp-accent)]">{t(provider.taglineKey)}</p>
        {wallet ? (
          <p className="mt-2 text-sm font-semibold text-[var(--vp-accent-bright)]">
            {tw('balanceLabel')}: ${wallet.balance}
          </p>
        ) : null}
        <p className="mt-3 min-h-[3.25rem] text-sm leading-relaxed text-[var(--vp-muted)]">
          {t(provider.bodyKey)}
        </p>

        <div className="mt-4 flex-1">
          {provider.phones.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)]">
                {t('contactEyebrow')}
              </p>
              <ul className="mt-2 space-y-1.5">
                {provider.phones.map((phone) => (
                  <li key={`${provider.slug}-${phone}`}>
                    <a
                      href={`sms:${phone}`}
                      className="inline-flex items-center gap-2 text-sm text-[var(--vp-accent-bright)] transition hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {t('textLine', { phone })}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex min-h-[2rem] flex-wrap gap-2">
          {provider.facebook ? (
            <a
              href={provider.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="portal-social-chip"
              aria-label={`${provider.name} Facebook`}
            >
              <Facebook className="h-3.5 w-3.5" />
              Facebook
            </a>
          ) : null}
          {provider.instagram ? (
            <a
              href={provider.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="portal-social-chip"
              aria-label={`${provider.name} Instagram`}
            >
              <Instagram className="h-3.5 w-3.5" />
              Instagram
            </a>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={enterHref} className="min-w-[10rem] flex-1">
            <Button className="w-full">
              <Gamepad2 className="h-4 w-4" />
              {provider.slug === 'vblink' ? t('enterCasino') : t('enterGames')}
            </Button>
          </Link>
          {provider.phones[0] ? (
            <a href={`sms:${provider.phones[0]}`} className="flex-1">
              <Button variant="secondary" className="w-full">
                <MessageCircle className="h-4 w-4" />
                {t('textUs')}
              </Button>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
