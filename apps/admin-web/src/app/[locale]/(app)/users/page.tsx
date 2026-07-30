'use client';

import { useTranslations } from 'next-intl';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { UsersAdminPanel } from '@/components/users/users-admin-panel';

export default function UsersPage() {
  const t = useTranslations('users');

  return (
    <>
      <AdminTopbar title={t('title')} subtitle={t('subtitle')} />
      <div className="flex-1 p-5 sm:p-6 lg:p-8">
        <UsersAdminPanel />
      </div>
    </>
  );
}
