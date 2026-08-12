'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuthUi } from '@/components/auth/auth-ui-context';
import { Button } from '@/components/ui/button';

export function HeroCtas() {
  const t = useTranslations('hero');
  const { openAuth } = useAuthUi();

  return (
    <div className="mt-8 flex flex-wrap gap-3 animate-fade-up animate-delay-2">
      <Link href="/providers">
        <Button size="lg" className="btn-shine">
          {t('ctaPrimary')}
        </Button>
      </Link>
      <Button size="lg" variant="secondary" onClick={() => openAuth('register')}>
        {t('ctaSecondary')}
      </Button>
    </div>
  );
}
