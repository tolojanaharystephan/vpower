'use client';

import {
  Facebook,
  Instagram,
  MessageCircle,
  Radio,
  Sparkles,
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
      <Link href={enterHref} className="portal-card-media">
        <img
          src={provider.imageUrl}
          alt=""
          className="portal-card-banner"
        />
        <div className="portal-card-media-fade" aria-hidden />
        <div className="portal-card-logo" aria-hidden>
          {provider.name.slice(0, 2)}
        </div>
        <div className="portal-card-badges">
          {provider.live ? (
            <span className="portal-chip portal-chip-live">
              <Radio className="h-3 w-3" />
              {t('live')}
            </span>
          ) : null}
          {provider.badge ? (
            <span className="portal-chip portal-chip-hot">
              <Sparkles className="h-3 w-3" />
              {t(provider.badge)}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex h-full flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={enterHref}>
              <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--vp-fg)] transition group-hover:text-[var(--vp-accent-bright)]">
                {provider.name}
              </h3>
            </Link>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-accent-gold)]">
              {t(provider.genreKey)}
            </p>
          </div>
        </div>

        <p className="mt-1 text-sm font-medium text-[var(--vp-accent)]">{t(provider.taglineKey)}</p>
        {wallet ? (
          <p className="mt-1.5 text-sm font-semibold text-[var(--vp-accent-bright)]">
            {tw('balanceLabel')}: ${wallet.balance}
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-relaxed text-[var(--vp-muted)]">{t(provider.bodyKey)}</p>

        <ul className="mt-3 space-y-1">
          {provider.highlightKeys.map((key) => (
            <li key={key} className="flex gap-2 text-sm text-[var(--vp-fg)]/90">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--portal-card-accent)]" />
              {t(key)}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)]">
          {t('previewLabel')}
        </p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {provider.previewFocus.map((focus, index) => (
            <Link
              key={`${provider.slug}-preview-${index}`}
              href={enterHref}
              className="portal-preview-tile"
              tabIndex={-1}
            >
              <img
                src={provider.imageUrl}
                alt=""
                style={{ objectPosition: focus }}
              />
            </Link>
          ))}
        </div>

        <div className="mt-5">
          <Link href={enterHref} className="block">
            <Button className="btn-shine h-12 w-full text-base" size="lg">
              {t('playNow')}
            </Button>
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {provider.phones[0] ? (
            <a href={`sms:${provider.phones[0]}`} className="portal-social-chip">
              <MessageCircle className="h-3.5 w-3.5" />
              {t('textUs')}
            </a>
          ) : null}
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
      </div>
    </article>
  );
}
