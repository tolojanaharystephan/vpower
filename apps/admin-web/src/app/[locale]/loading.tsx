'use client';

import { useTranslations } from 'next-intl';

export default function GlobalLoading() {
  const t = useTranslations('common');

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--vp-bg)]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--vp-accent)] border-t-transparent" />
        <p className="text-sm text-[var(--vp-muted)]">{t('loading')}</p>
      </div>
    </div>
  );
}
