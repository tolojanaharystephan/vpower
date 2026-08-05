'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { BrandLoader } from '@/components/brand/brand-loader';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { SupportAdminPanel } from '@/components/support/support-admin-panel';

export default function SupportPage() {
  const t = useTranslations('support');

  return (
    <>
      <AdminTopbar title={t('title')} />
      <div className="admin-page">
        <Suspense
          fallback={
            <div className="grid min-h-[24rem] place-items-center">
              <BrandLoader size="md" label={t('loading')} />
            </div>
          }
        >
          <SupportAdminPanel />
        </Suspense>
      </div>
    </>
  );
}
