'use client';

import { useAuthUi } from '@/components/auth/auth-ui-context';
import { useSession } from '@/components/auth/session-provider';
import { useRouter } from '@/i18n/navigation';

/**
 * Game tile click → go to play page.
 * The play page calls POST /api/v1/games/:id/launch and shows VBlink login UX.
 */
export function usePlayGame() {
  const router = useRouter();
  const { openAuth } = useAuthUi();
  const { isAuthenticated } = useSession();

  return async (gameId: string, slug: string) => {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    router.push(`/play/${slug}?id=${encodeURIComponent(gameId)}`);
  };
}
