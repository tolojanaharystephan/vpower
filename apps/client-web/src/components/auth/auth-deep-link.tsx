'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthUi } from '@/components/auth/auth-ui-context';
import { usePathname, useRouter } from '@/i18n/navigation';

/** Opens auth modal from ?auth=login|register or /login|/register routes. */
export function AuthDeepLink() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { openAuth } = useAuthUi();

  useEffect(() => {
    const q = searchParams.get('auth');
    if (q === 'login' || q === 'register') {
      openAuth(q);
      router.replace(pathname);
      return;
    }
    if (pathname === '/login') {
      openAuth('login');
      router.replace('/');
      return;
    }
    if (pathname === '/register') {
      openAuth('register');
      router.replace('/');
    }
  }, [searchParams, pathname, openAuth, router]);

  return null;
}
