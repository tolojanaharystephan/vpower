'use client';

import type { LucideIcon } from 'lucide-react';
import { Clock3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ComingSoon({
  title,
  body,
  icon: Icon = Clock3,
}: {
  title: string;
  body: string;
  icon?: LucideIcon;
}) {
  const t = useTranslations('common');

  return (
    <div className="empty-state p-6">
      <div className="max-w-md text-center animate-fade-up">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(46,163,242,0.14)] text-[var(--vp-accent)]">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--vp-accent)]">
          {t('comingSoon')}
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--vp-fg)]">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--vp-muted)]">{body}</p>
      </div>
    </div>
  );
}
