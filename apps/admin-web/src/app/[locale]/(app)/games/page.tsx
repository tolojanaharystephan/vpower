'use client';

import { useTranslations } from 'next-intl';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { GamesAdminPanel } from '@/components/games/games-admin-panel';

export default function GamesPage() {
  const t = useTranslations('games');

  return (
    <>
      <AdminTopbar title={t('title')} subtitle={t('subtitle')} />
      <div className="admin-page">
        <GamesAdminPanel />
      </div>
    </>
  );
}
