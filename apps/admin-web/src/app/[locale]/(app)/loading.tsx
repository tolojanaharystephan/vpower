'use client';

import { useTranslations } from 'next-intl';
import { BrandLoader } from '@/components/brand/brand-loader';

export default function AppLoading() {
  const t = useTranslations('common');
  return <BrandLoader fullScreen size="lg" label={t('loading')} />;
}
