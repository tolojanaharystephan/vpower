'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { SupportAdminPanel } from '@/components/support/support-admin-panel';

export default function SupportPage() {
  const t = useTranslations('support');

  return (
    <>
      <AdminTopbar title={t('title')} />
      <div className="flex-1 p-5 sm:p-6 lg:p-8">
        <Suspense fallback={<p className="text-sm text-[var(--vp-muted)]">{t('loading')}</p>}>
          <SupportAdminPanel />
        </Suspense>
      </div>
    </>
  );
}
