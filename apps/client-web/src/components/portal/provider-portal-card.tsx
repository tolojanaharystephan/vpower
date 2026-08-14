'use client';

import Image from 'next/image';
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

export function ProviderPortalCard({ provider }: { provider: PortalProvider }) {
  const t = useTranslations('portal');
  // VBlink = live partner casino. Others pending their own FastAPI docs.
  const enterHref =
    provider.slug === 'vblink' ? '/play/vblink' : `/games?provider=${provider.slug}`;

  return (
    <article className="portal-provider-card group">
      <Link href={enterHref} className="relative block aspect-[16/11] overflow-hidden">
        <Image
          src={provider.imageUrl}
          alt={provider.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        {provider.live ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(252,185,0,0.55)] bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-accent-gold)] backdrop-blur">
            <Radio className="h-3 w-3" />
            {t('live')}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={enterHref}>
          <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--vp-fg)] transition group-hover:text-[var(--vp-accent-bright)]">
            {provider.name}
          </h3>
        </Link>
        <p className="mt-1 text-sm font-medium text-[var(--vp-accent)]">{t(provider.taglineKey)}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--vp-muted)]">
          {t(provider.bodyKey)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
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
