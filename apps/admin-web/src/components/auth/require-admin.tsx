'use client';

import { useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { usePathname, useRouter } from '@/i18n/navigation';

export function RequireAdmin({ children }: { children: ReactNode }) {
  const t = useTranslations('common');
  const { ready, isStaff } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!isStaff && pathname !== '/login') {
      router.replace('/login');
    }
  }, [ready, isStaff, pathname, router]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--vp-bg)] text-[var(--vp-muted)]">
        {t('loading')}
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--vp-bg)] text-[var(--vp-muted)]">
        {t('redirecting')}
      </div>
    );
  }

  return children;
}
