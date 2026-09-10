'use client';

import { useTranslations } from 'next-intl';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { RoomChatPanel } from '@/components/agent/room-chat-panel';

export default function RoomChatPage() {
  const t = useTranslations('roomChat');

  return (
    <>
      <AdminTopbar title={t('title')} subtitle={t('subtitle')} />
      <div className="admin-page">
        <RoomChatPanel />
      </div>
    </>
  );
}
