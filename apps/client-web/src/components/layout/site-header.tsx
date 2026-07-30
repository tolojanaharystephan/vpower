'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuthUi } from '@/components/auth/auth-ui-context';
import { useSession } from '@/components/auth/session-provider';
import { BrandMark } from '@/components/brand/brand-mark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const t = useTranslations('nav');
  const brand = useTranslations('brand');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { openAuth } = useAuthUi();
  const { ready, isAuthenticated, user, logout } = useSession();
  const [open, setOpen] = useState(false);

  const switchLocale = () => {
    const next = locale === 'fr' ? 'en' : 'fr';
    router.replace(pathname, { locale: next });
  };

  const links = [
    { href: '/games', label: t('games') },
    { href: '/promotions', label: t('promotions') },
    { href: '/help', label: t('help') },
  ] as const;

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="header-glass mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <BrandMark className="h-8 w-8 transition group-hover:brightness-110 sm:h-9 sm:w-9" />
          <span className="font-[family-name:var(--font-display)] text-xl tracking-[0.06em] text-[var(--vp-accent)] transition group-hover:text-[#e0b12a] sm:text-2xl">
            {brand('name')}
          </span>
        </Link>

        <nav className="nav-pill absolute left-1/2 hidden -translate-x-1/2 items-center md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'nav-pill-item',
                pathname === link.href && 'nav-pill-item-active',
              )}
            >
              {link.label}
            </Link>
          ))}
          <span
            className="nav-pill-item cursor-not-allowed opacity-45"
            title={t('comingSoon')}
          >
            {t('live')}
          </span>
          <span
            className="nav-pill-item cursor-not-allowed opacity-45"
            title={t('comingSoon')}
          >
            {t('walletSoon')}
          </span>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={switchLocale}
            className="rounded-md px-2 py-1 text-xs uppercase tracking-wider text-[var(--vp-muted)] transition hover:text-[var(--vp-fg)]"
          >
            {locale === 'fr' ? 'EN' : 'FR'}
          </button>
          <Link
            href="/games"
            className="rounded-md p-2 text-[var(--vp-muted)] transition hover:bg-white/5 hover:text-[var(--vp-fg)]"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Link>
          {ready && isAuthenticated ? (
            <>
              <Link href="/account">
                <Button variant="ghost" size="sm">
                  {user?.firstName || t('account')}
                </Button>
              </Link>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  void logout().then(() => router.push('/'));
                }}
              >
                {t('logout')}
              </Button>
            </>
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

        <button
          type="button"
          className="md:hidden text-[var(--vp-fg)]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <div
        className={cn(
          'border-t border-[rgba(245,240,232,0.08)] bg-[rgba(11,11,15,0.97)] px-4 py-4 backdrop-blur-md md:hidden',
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
                pathname === link.href && 'bg-[rgba(212,160,23,0.12)] text-[var(--vp-accent)]',
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-[var(--vp-fg)] transition hover:bg-white/5"
            >
              {t('account')}
            </Link>
          ) : null}
          <p className="text-sm text-[var(--vp-muted)]/60">
            {t('live')} / {t('walletSoon')} — {t('comingSoon')}
          </p>
          <button
            type="button"
            onClick={switchLocale}
            className="mt-2 self-start rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)] transition hover:bg-white/5 hover:text-[var(--vp-fg)]"
          >
            {locale === 'fr' ? 'EN' : 'FR'}
          </button>
          <div className="flex gap-2 pt-2">
            {isAuthenticated ? (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setOpen(false);
                  void logout().then(() => router.push('/'));
                }}
              >
                {t('logout')}
              </Button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
