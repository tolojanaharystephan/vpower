'use client';

import { useLocale } from 'next-intl';
import { useAuthUi } from '@/components/auth/auth-ui-context';
import { useSession } from '@/components/auth/session-provider';
import { launchGame } from '@/lib/api';
import { useRouter } from '@/i18n/navigation';

const VBLINK_LAUNCH_KEY = 'vp-vblink-launch';

export type VblinkLaunchPayload = {
  title: string;
  slug: string;
  account: string;
  password: string;
  lobbyUrl: string;
  message: string;
};

export function readVblinkLaunchPayload(): VblinkLaunchPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(VBLINK_LAUNCH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VblinkLaunchPayload;
  } catch {
    return null;
  }
}

export function clearVblinkLaunchPayload() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(VBLINK_LAUNCH_KEY);
}

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

      if (session.mode === 'vblink' && session.externalLogin) {
        const payload: VblinkLaunchPayload = {
          title: session.title,
          slug: session.slug,
          account: session.externalLogin.account,
          password: session.externalLogin.password,
          lobbyUrl: session.externalLogin.lobbyUrl,
          message: session.message,
        };
        sessionStorage.setItem(VBLINK_LAUNCH_KEY, JSON.stringify(payload));
        router.push('/play/vblink');
        return;
      }

      try {
        const url = new URL(session.launchUrl);
        if (url.origin !== window.location.origin) {
          window.open(session.launchUrl, '_blank', 'noopener,noreferrer');
          return;
        }
        const path = url.pathname.replace(/^\/(fr|en)/, '') || `/play/${session.slug}`;
        router.push(path);
      } catch {
        router.push(`/play/${session.slug || slug}`);
      }
    } catch {
      router.push(`/play/${slug}`);
    }
  };
}
