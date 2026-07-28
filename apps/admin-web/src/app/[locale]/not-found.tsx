'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--vp-bg)] px-4">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-[var(--vp-accent)]">404</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-xl text-[var(--vp-fg)]">
          {t('notFoundTitle')}
        </h1>
        <p className="mt-2 text-sm text-[var(--vp-muted)]">{t('notFoundBody')}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-[var(--vp-accent)] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
        >
          {t('backDashboard')}
        </Link>
      </div>
    </div>
  );
}
