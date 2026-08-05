'use client';

import { useTranslations } from 'next-intl';
import { BrandLoader } from '@/components/brand/brand-loader';

export default function LocaleLoading() {
  const t = useTranslations('common');
  return <BrandLoader fullScreen size="lg" label={t('loading')} />;
}
