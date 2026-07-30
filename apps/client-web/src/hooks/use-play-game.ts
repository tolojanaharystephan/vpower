'use client';

import { useLocale } from 'next-intl';
import { useAuthUi } from '@/components/auth/auth-ui-context';
import { useSession } from '@/components/auth/session-provider';
import { launchGame } from '@/lib/api';
import { useRouter } from '@/i18n/navigation';

export function usePlayGame() {
  const locale = useLocale();
  const router = useRouter();
  const { openAuth } = useAuthUi();
  const { accessToken, isAuthenticated } = useSession();

  return async (gameId: string, slug: string) => {
    if (!isAuthenticated || !accessToken) {
      openAuth('login');
      return;
    }
    try {
      const session = await launchGame(accessToken, gameId, locale);
      try {
        const path =
          new URL(session.launchUrl).pathname.replace(/^\/(fr|en)/, '') || `/play/${session.slug}`;
        router.push(path);
      } catch {
        router.push(`/play/${session.slug || slug}`);
      }
    } catch {
      router.push(`/play/${slug}`);
    }
  };
}
