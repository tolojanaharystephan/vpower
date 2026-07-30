'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export function PlayDemoScreen({
  slug,
  title,
}: {
  slug: string;
  title?: string;
}) {
  const t = useTranslations('play');

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[rgba(212,160,23,0.14)] text-[var(--vp-accent)]">
        <Gamepad2 className="h-7 w-7" />
      </span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--vp-accent)]">
        {t('eyebrow')}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--vp-fg)] sm:text-4xl">
        {title ?? slug}
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--vp-muted)] sm:text-base">
        {t('body')}
      </p>
      <p className="mt-2 text-xs text-[var(--vp-muted)]">{t('hint')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/games">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('backCatalog')}
          </Button>
        </Link>
        <Link href="/">
          <Button>{t('backHome')}</Button>
        </Link>
      </div>
    </div>
  );
}
