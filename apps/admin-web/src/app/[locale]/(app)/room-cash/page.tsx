'use client';

import { useTranslations } from 'next-intl';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { RoomCashPanel } from '@/components/agent/room-cash-panel';

export default function RoomCashPage() {
  const t = useTranslations('roomCash');

  return (
    <>
      <AdminTopbar title={t('title')} subtitle={t('subtitle')} />
      <div className="admin-page">
        <RoomCashPanel />
      </div>
    </>
  );
}
