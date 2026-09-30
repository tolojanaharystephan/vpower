'use client';

import { useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function isMobilePortrait(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 932px) and (orientation: portrait)').matches;
}

export function RotateToPlay({
  onContinue,
  onDismiss,
}: {
  onContinue: () => void;
  onDismiss: () => void;
}) {
  const t = useTranslations('play');

  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)');
    const onChange = () => {
      if (mq.matches) onContinue();
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [onContinue]);

  return (
    <div className="rotate-gate" role="dialog" aria-modal="true" aria-labelledby="rotate-gate-title">
      <button type="button" className="rotate-gate-backdrop" aria-label={t('backHome')} onClick={onDismiss} />
      <div className="rotate-gate-panel animate-modal-in">
        <div className="rotate-gate-phone" aria-hidden>
          <Smartphone className="h-10 w-10" />
        </div>
        <h2 id="rotate-gate-title" className="mt-4 font-[family-name:var(--font-display)] text-xl text-[var(--vp-fg)]">
          {t('rotateTitle')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--vp-muted)]">{t('rotateBody')}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button className="w-full" size="lg" onClick={onContinue}>
            {t('rotateReady')}
          </Button>
          <Button className="w-full" variant="secondary" onClick={onContinue}>
            {t('rotateAnyway')}
          </Button>
        </div>
      </div>
    </div>
  );
}
