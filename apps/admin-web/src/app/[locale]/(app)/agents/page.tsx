'use client';

import { useTranslations } from 'next-intl';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { AgentsPanel } from '@/components/agent/agents-panel';

export default function AgentsPage() {
  const t = useTranslations('agentsPage');

  return (
    <>
      <AdminTopbar title={t('title')} subtitle={t('subtitle')} />
      <div className="admin-page">
        <AgentsPanel />
      </div>
    </>
  );
}
