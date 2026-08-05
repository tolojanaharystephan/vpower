'use client';

import { useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { BrandLoader } from '@/components/brand/brand-loader';
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
    return <BrandLoader fullScreen size="lg" label={t('loading')} />;
  }

  if (!isStaff) {
    return <BrandLoader fullScreen size="md" label={t('redirecting')} />;
  }

  return children;
}
