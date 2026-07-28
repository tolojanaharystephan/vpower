'use client';

import { useTranslations } from 'next-intl';
import { Headphones } from 'lucide-react';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { ComingSoon } from '@/components/layout/coming-soon';

export default function SupportPage() {
  const t = useTranslations('support');

  return (
    <>
      <AdminTopbar title={t('title')} />
      <div className="flex-1 p-5 sm:p-6 lg:p-8">
        <ComingSoon title={t('comingTitle')} body={t('comingBody')} icon={Headphones} />
      </div>
    </>
  );
}
