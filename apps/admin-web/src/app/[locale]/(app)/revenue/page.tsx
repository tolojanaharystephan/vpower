'use client';

import { useTranslations } from 'next-intl';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { RevenuePanel } from '@/components/agent/revenue-panel';

export default function RevenuePage() {
  const t = useTranslations('revenue');

  return (
    <>
      <AdminTopbar title={t('title')} subtitle={t('subtitle')} />
      <div className="admin-page">
        <RevenuePanel />
      </div>
    </>
  );
}
