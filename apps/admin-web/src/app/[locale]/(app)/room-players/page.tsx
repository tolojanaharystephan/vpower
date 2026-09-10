'use client';

import { useTranslations } from 'next-intl';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { RoomPlayersPanel } from '@/components/agent/room-players-panel';

export default function RoomPlayersPage() {
  const t = useTranslations('roomPlayers');

  return (
    <>
      <AdminTopbar title={t('title')} subtitle={t('subtitle')} />
      <div className="admin-page">
        <RoomPlayersPanel />
      </div>
    </>
  );
}
