'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useAuthUi } from '@/components/auth/auth-ui-context';
import { useSession } from '@/components/auth/session-provider';
import { cn } from '@/lib/utils';

/** Persistent entry to the support chat (page still lives at /support). */
export function SupportChatLauncher() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const { openAuth } = useAuthUi();
  const { ready, isAuthenticated } = useSession();

  if (pathname === '/support') return null;

  const openSupport = () => {
    if (!ready) return;
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    router.push('/support');
  };

  return (
    <button
      type="button"
      onClick={openSupport}
      className={cn(
        'fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full px-4 py-3',
        'bg-[var(--vp-accent)] text-white shadow-[0_12px_32px_rgba(46,163,242,0.35)]',
        'transition hover:bg-[var(--vp-accent-muted)] hover:shadow-[0_16px_40px_rgba(46,163,242,0.45)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vp-accent-bright)]',
      )}
      aria-label={t('support')}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden text-sm font-semibold sm:inline">{t('support')}</span>
    </button>
  );
}
