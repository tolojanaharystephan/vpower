'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuthUi } from '@/components/auth/auth-ui-context';
import { useSession } from '@/components/auth/session-provider';
import { BrandMark } from '@/components/brand/brand-mark';
import { BrandWordmark } from '@/components/brand/brand-wordmark';
import { UserMenu } from '@/components/layout/user-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { openAuth } = useAuthUi();
  const { ready, isAuthenticated } = useSession();
  const [open, setOpen] = useState(false);

  const switchLocale = () => {
    const next = locale === 'fr' ? 'en' : 'fr';
    router.replace(pathname, { locale: next });
  };

  const links = [
    { href: '/providers', label: t('providers') },
    { href: '/support', label: t('support') },
    { href: '/help', label: t('help') },
  ] as const;

  const overCarousel = pathname === '/' || pathname === '/providers';

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div
        className={cn(
          'mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8',
          overCarousel ? 'header-over-carousel' : 'header-glass',
        )}
      >
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <BrandMark className="h-8 w-8 shrink-0 transition group-hover:brightness-110 sm:h-9 sm:w-9" />
          <BrandWordmark
            name="VPower"
            className="truncate font-[family-name:var(--font-display)] text-xl tracking-[0.06em] text-[var(--vp-fg)] transition group-hover:text-[var(--vp-accent)] sm:text-2xl"
          />
        </Link>

        <nav
          className={cn(
            'nav-pill absolute left-1/2 hidden -translate-x-1/2 items-center md:flex',
            overCarousel && 'nav-pill-on-carousel',
          )}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn('nav-pill-item', pathname === link.href && 'nav-pill-item-active')}
            >
              {link.label}
            </Link>
          ))}
          <span className="nav-pill-item cursor-not-allowed opacity-45" title={t('comingSoon')}>
            {t('live')}
          </span>
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            onClick={switchLocale}
            className="rounded-md px-2 py-1 text-xs uppercase tracking-wider text-[var(--vp-muted)] transition hover:text-[var(--vp-fg)]"
          >
            {locale === 'fr' ? 'EN' : 'FR'}
          </button>
          <Link
            href="/providers"
            className="rounded-md p-2 text-[var(--vp-muted)] transition hover:bg-white/5 hover:text-[var(--vp-fg)]"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Link>
          {ready && isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => openAuth('login')}>
                {t('login')}
              </Button>
              <Button size="sm" onClick={() => openAuth('register')}>
                {t('register')}
              </Button>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 md:hidden">
          {ready && isAuthenticated ? <UserMenu avatarOnly /> : null}
          <button
            type="button"
            className="text-[var(--vp-fg)]"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'border-t border-[rgba(255,255,255,0.08)] bg-[rgba(11,11,15,0.97)] px-4 py-4 backdrop-blur-md md:hidden',
          open ? 'block animate-fade-up' : 'hidden',
        )}
      >
        <div className="flex flex-col gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'rounded-lg px-3 py-2 text-[var(--vp-fg)] transition hover:bg-white/5',
                pathname === link.href && 'bg-[rgba(46,163,242,0.12)] text-[var(--vp-accent)]',
              )}
            >
              {link.label}
            </Link>
          ))}
          <p className="text-sm text-[var(--vp-muted)]">
            {t('live')} — {t('comingSoon')}
          </p>
          <button
            type="button"
            onClick={switchLocale}
            className="mt-2 self-start rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)] transition hover:bg-white/5 hover:text-[var(--vp-fg)]"
          >
            {locale === 'fr' ? 'EN' : 'FR'}
          </button>
          {isAuthenticated ? null : (
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setOpen(false);
                  openAuth('login');
                }}
              >
                {t('login')}
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setOpen(false);
                  openAuth('register');
                }}
              >
                {t('register')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
