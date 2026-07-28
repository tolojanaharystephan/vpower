'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--vp-bg)] px-4">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-[var(--vp-accent)]">!</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-xl text-[var(--vp-fg)]">
          {t('unexpectedTitle')}
        </h1>
        <p className="mt-2 text-sm text-[var(--vp-muted)]">{error.message || t('unexpectedBody')}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-[var(--vp-accent)] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
        >
          {t('retry')}
        </button>
      </div>
    </div>
  );
}
