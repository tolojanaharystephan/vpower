'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        const next = locale === 'fr' ? 'en' : 'fr';
        router.replace(pathname, { locale: next });
      }}
      className={
        className ??
        'rounded-md px-2 py-1 text-xs uppercase tracking-wider text-[var(--vp-muted)] transition hover:text-[var(--vp-fg)]'
      }
    >
      {t('switchLocale')}
    </button>
  );
}
