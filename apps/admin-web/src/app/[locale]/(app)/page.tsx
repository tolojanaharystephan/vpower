'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AdminTopbar } from '@/components/layout/admin-topbar';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { useRouter } from '@/i18n/navigation';
import { BrandLoader } from '@/components/brand/brand-loader';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const common = useTranslations('common');
  const { user, isRoomAgent, ready } = useAdminAuth();
  const router = useRouter();
  const name = user?.firstName ?? user?.email?.split('@')[0] ?? t('helloFallback');

  useEffect(() => {
    if (ready && isRoomAgent) router.replace('/room-players');
  }, [ready, isRoomAgent, router]);

  if (!ready || isRoomAgent) {
    return <BrandLoader fullScreen size="md" label={common('redirecting')} />;
  }

  return (
    <>
      <AdminTopbar title={t('title')} subtitle={t('hello', { name })} />
      <div className="admin-page">
        <div className="mb-6 animate-fade-up rounded-2xl border border-[var(--vp-border)] bg-[linear-gradient(135deg,rgba(46,163,242,0.14),transparent_45%),var(--vp-surface)] px-5 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.25)] sm:px-6">
          <p className="admin-eyebrow">{t('commandEyebrow')}</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--vp-fg)] sm:text-[1.7rem]">
            {t('pulse')}
          </p>
        </div>
        <DashboardOverview />
      </div>
    </>
  );
}
