'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { PORTAL_PROVIDERS } from '@/lib/portal';

/** Compact provider strip on home — bridges cinema home with the reference portal. */
export function HomeProvidersStrip() {
  const t = useTranslations('portal');

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--vp-accent)]">
            {t('servicesEyebrow')}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--vp-fg)] sm:text-3xl">
            {t('servicesTitle')}
          </h2>
        </div>
        <Link href="/providers">
          <Button variant="secondary">{t('ctaAdventure')}</Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {PORTAL_PROVIDERS.map((provider) => (
          <Link
            key={provider.slug}
            href="/providers"
            className="group overflow-hidden rounded-lg border border-[rgba(245,240,232,0.1)] bg-[rgba(20,20,26,0.7)] transition hover:border-[rgba(46,163,242,0.4)]"
          >
            <div className="relative aspect-[16/11]">
              <Image
                src={provider.imageUrl}
                alt={provider.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
              <p className="absolute bottom-3 left-3 font-[family-name:var(--font-display)] text-lg text-[var(--vp-fg)]">
                {provider.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
