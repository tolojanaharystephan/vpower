'use client';

import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { LOCALE_LABELS, LOCALE_LABELS_FR, SUPPORTED_LOCALES, type Locale } from '@vpower777/config';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export function LocaleMenu({
  className,
  variant = 'dropdown',
  onChosen,
}: {
  className?: string;
  variant?: 'dropdown' | 'panel';
  onChosen?: () => void;
}) {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (next: Locale) => {
    router.replace(pathname, { locale: next });
    setOpen(false);
    onChosen?.();
  };

  const option = (code: Locale) => (
    <button
      key={code}
      type="button"
      title={LOCALE_LABELS_FR[code]}
      aria-label={`${LOCALE_LABELS[code]} — ${LOCALE_LABELS_FR[code]}`}
      onClick={() => choose(code)}
      className={cn('locale-menu-option', code === locale && 'locale-menu-option-active')}
    >
      <span>{LOCALE_LABELS[code]}</span>
      <span className="locale-menu-fr">{LOCALE_LABELS_FR[code]}</span>
    </button>
  );

  if (variant === 'panel') {
    return (
      <div className={cn('locale-menu-panel', className)}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--vp-muted)]">
          {t('language')}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {SUPPORTED_LOCALES.map((code) => option(code))}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        className="locale-menu-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language')}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{LOCALE_LABELS[locale]}</span>
      </button>
      {open ? (
        <ul className="locale-menu-list" role="listbox" aria-label={t('language')}>
          {SUPPORTED_LOCALES.map((code) => (
            <li key={code} role="option" aria-selected={code === locale}>
              {option(code)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
