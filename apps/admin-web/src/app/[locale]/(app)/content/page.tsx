'use client';

import { useTranslations } from 'next-intl';
import { Newspaper } from 'lucide-react';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { ComingSoon } from '@/components/layout/coming-soon';

export default function ContentPage() {
  const t = useTranslations('content');

  return (
    <>
      <AdminTopbar title={t('title')} />
      <div className="admin-page">
        <ComingSoon title={t('comingTitle')} body={t('comingBody')} icon={Newspaper} />
      </div>
    </>
  );
}
