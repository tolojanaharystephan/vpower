'use client';

import {
  Facebook,
  Instagram,
  MessageCircle,
  Youtube,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  PORTAL_GLOBAL_SOCIALS,
  PORTAL_PROVIDERS,
  PORTAL_YOUTUBE_EMBED,
} from '@/lib/portal';
import { ProviderBgCarousel } from '@/components/portal/provider-bg-carousel';
import { ProviderPortalCard } from '@/components/portal/provider-portal-card';

function SocialIcon({ network }: { network: string }) {
  if (network === 'facebook') return <Facebook className="h-4 w-4" />;
  if (network === 'instagram') return <Instagram className="h-4 w-4" />;
  if (network === 'youtube') return <Youtube className="h-4 w-4" />;
  return (
    <span className="grid h-4 w-4 place-items-center text-[10px] font-bold" aria-hidden>
      X
    </span>
  );
}

export function PortalHub() {
  const t = useTranslations('portal');

  return (
    <div className="portal-hub">
      <section className="relative min-h-[85svh] overflow-hidden pt-20 sm:pt-24">
        <ProviderBgCarousel />

        <div className="relative z-10 mx-auto flex min-h-[85svh] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--vp-accent-bright)]">
            {t('eyebrow')}
          </p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl tracking-wide text-[var(--vp-fg)] sm:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--vp-accent-gold)]">
            {t('providersLine')}
          </p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {t('subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#providers">
              <Button size="lg">{t('ctaAdventure')}</Button>
            </Link>
            <Link href="#contact">
              <Button
                size="lg"
                variant="secondary"
                className="border-white/35 text-white hover:border-[var(--vp-accent-bright)] hover:text-[var(--vp-accent-bright)]"
              >
                {t('ctaJoin')}
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-2 [&_.portal-social-chip]:border-white/25 [&_.portal-social-chip]:bg-white/10 [&_.portal-social-chip]:text-white/85 [&_.portal-social-chip:hover]:border-[var(--vp-accent-bright)] [&_.portal-social-chip:hover]:text-[var(--vp-accent-bright)]">
            {PORTAL_GLOBAL_SOCIALS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="portal-social-chip"
              >
                <SocialIcon network={social.network} />
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="providers" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--vp-accent)]">
            {t('servicesEyebrow')}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-wide text-[var(--vp-fg)]">
            {t('servicesTitle')}
          </h2>
          <p className="mt-3 text-[var(--vp-muted)]">{t('servicesBody')}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {PORTAL_PROVIDERS.map((provider) => (
            <ProviderPortalCard key={provider.slug} provider={provider} />
          ))}
        </div>
      </section>

      <section className="border-y border-[rgba(255,255,255,0.08)] bg-[rgba(12,14,18,0.85)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--vp-accent)]">
              {t('mediaEyebrow')}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-wide text-[var(--vp-fg)]">
              {t('mediaTitle')}
            </h2>
            <p className="mt-3 max-w-xl text-[var(--vp-muted)]">{t('mediaBody')}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {PORTAL_GLOBAL_SOCIALS.map((social) => (
                <a
                  key={`media-${social.href}`}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portal-social-chip"
                >
                  <SocialIcon network={social.network} />
                  {social.label}
                </a>
              ))}
            </div>
          </div>
          <div className="portal-video overflow-hidden rounded-xl border border-[var(--vp-border)] bg-black shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <iframe
              title={t('mediaTitle')}
              src={PORTAL_YOUTUBE_EMBED}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--vp-accent)]">
            {t('contactEyebrow')}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-wide text-[var(--vp-fg)]">
            {t('contactTitle')}
          </h2>
          <p className="mt-3 text-[var(--vp-muted)]">{t('contactBody')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {PORTAL_PROVIDERS.map((provider) => (
            <div key={`contact-${provider.slug}`} className="cinema-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--vp-fg)]">
                    {provider.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--vp-muted)]">{t(provider.taglineKey)}</p>
                </div>
                {provider.facebook ? (
                  <a
                    href={provider.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portal-social-chip"
                  >
                    <Facebook className="h-3.5 w-3.5" />
                    Ads / Page
                  </a>
                ) : null}
              </div>
              <ul className="mt-4 space-y-2">
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
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/games?provider=${provider.slug}`} className="flex-1">
                  <Button className="w-full">{t('enterGames')}</Button>
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
          ))}
        </div>
      </section>
    </div>
  );
}
