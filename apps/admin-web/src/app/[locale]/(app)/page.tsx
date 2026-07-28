'use client';

import { useTranslations } from 'next-intl';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { user } = useAdminAuth();
  const name = user?.firstName ?? user?.email?.split('@')[0] ?? t('helloFallback');

  return (
    <>
      <AdminTopbar title={t('title')} subtitle={t('hello', { name })} />
      <div className="flex-1 p-5 sm:p-6 lg:p-8">
        <div className="mb-6 animate-fade-up rounded-2xl border border-[var(--vp-border)] bg-[linear-gradient(135deg,rgba(212,160,23,0.12),transparent_42%),var(--vp-surface)] px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--vp-accent)]">
            {t('commandEyebrow')}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--vp-fg)] sm:text-[1.7rem]">
            {t('pulse')}
          </p>
        </div>
        <DashboardOverview />
      </div>
    </>
  );
}
