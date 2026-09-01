'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays, Heart, Headphones, Mail, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import { dateTagFor } from '@vpower777/config';
import { Link, useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { BrandLoader } from '@/components/brand/brand-loader';
import { RoomWalletsPanel } from '@/components/wallet/room-wallets-panel';
import { listFavorites, updateMe } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
});

type FormValues = z.infer<typeof schema>;

function initials(first?: string | null, last?: string | null, email?: string) {
  const a = first?.trim()?.[0];
  const b = last?.trim()?.[0];
  if (a || b) return `${a ?? ''}${b ?? ''}`.toUpperCase();
  return (email ?? 'VP').slice(0, 2).toUpperCase();
}

export function AccountPanel() {
  const t = useTranslations('account');
  const locale = useLocale();
  const router = useRouter();
  const { ready, user, accessToken, isAuthenticated, logout, refresh } = useSession();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: () => listFavorites(accessToken!),
    enabled: Boolean(ready && isAuthenticated && accessToken),
  });

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace('/');
      return;
    }
    reset({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    });
  }, [ready, isAuthenticated, user, reset, router]);

  if (!ready || !user) {
    return (
      <div className="mx-auto grid max-w-5xl place-items-center px-4 py-24">
        <BrandLoader size="md" label={t('loading')} />
      </div>
    );
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0];
  const dateLocale = dateTagFor(locale);
  const memberSince = new Date(user.createdAt).toLocaleDateString(dateLocale, {
    month: 'short',
    year: 'numeric',
  });
  const favoritesCount = favoritesQuery.data?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      {/* Profile hero */}
      <section className="profile-hero cinema-panel overflow-hidden">
        <div className="profile-hero-band px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-20 w-20 place-items-center rounded-xl border border-[rgba(46,163,242,0.4)] bg-[rgba(11,11,15,0.55)] font-[family-name:var(--font-display)] text-2xl text-[var(--vp-accent-bright)] shadow-[0_0_24px_rgba(46,163,242,0.2)] backdrop-blur">
                {initials(user.firstName, user.lastName, user.email)}
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--vp-accent)]">
                  {t('eyebrow')}
                </p>
                <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--vp-fg)] sm:text-4xl">
                  {displayName}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--vp-muted)]">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[rgba(65,181,116,0.35)] bg-[rgba(65,181,116,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#8fd9ad]">
                {t('badgeActive')}
              </span>
              <span className="rounded-full border border-[var(--vp-border)] bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--vp-muted)]">
                {user.emailVerifiedAt ? t('badgeVerified') : t('badgeUnverified')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="profile-stat cinema-panel p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[rgba(46,163,242,0.12)] text-[var(--vp-accent)]">
              <Heart className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--vp-muted)]">{t('statFavorites')}</p>
              <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--vp-fg)]">{favoritesCount}</p>
            </div>
          </div>
        </div>
        <div className="profile-stat cinema-panel p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[rgba(46,163,242,0.12)] text-[var(--vp-accent)]">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--vp-muted)]">{t('statMember')}</p>
              <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--vp-fg)]">{memberSince}</p>
            </div>
          </div>
        </div>
        <div className="profile-stat cinema-panel p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[rgba(46,163,242,0.12)] text-[var(--vp-accent)]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--vp-muted)]">{t('statRoles')}</p>
              <p className="truncate font-[family-name:var(--font-display)] text-lg text-[var(--vp-fg)]">
                {user.roles?.join(' · ') || 'CUSTOMER'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <RoomWalletsPanel />

      {/* Personal info card */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <form
          className="cinema-panel p-6 sm:p-7"
          onSubmit={handleSubmit(async (values) => {
            if (!accessToken) return;
            try {
              await updateMe(accessToken, {
                firstName: values.firstName,
                lastName: values.lastName,
              });
              await refresh();
            } catch (err) {
              setError('root', {
                message: err instanceof Error ? err.message : t('error'),
              });
            }
          })}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vp-accent)]">
            {t('infoEyebrow')}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--vp-fg)]">
            {t('infoTitle')}
          </h2>
          <p className="mt-1 text-sm text-[var(--vp-muted)]">{t('subtitle')}</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--vp-muted)]">
                {t('email')}
              </label>
              <Input value={user.email} disabled readOnly />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--vp-muted)]">
                  {t('firstName')}
                </label>
                <Input {...register('firstName')} />
                {errors.firstName ? (
                  <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--vp-muted)]">
                  {t('lastName')}
                </label>
                <Input {...register('lastName')} />
                {errors.lastName ? (
                  <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>
                ) : null}
              </div>
            </div>
            {errors.root ? <p className="text-sm text-red-400">{errors.root.message}</p> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('saving') : t('save')}
            </Button>
          </div>
        </form>

        <aside className="cinema-panel p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vp-accent)]">
            {t('sessionEyebrow')}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--vp-fg)]">
            {t('sessionTitle')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--vp-muted)]">{t('sessionBody')}</p>
          <Link
            href="/support"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--vp-accent)] hover:text-[var(--vp-accent-bright)] hover:underline"
          >
            <Headphones className="h-4 w-4" />
            {t('supportLink')}
          </Link>
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
          >
            {t('logout')}
          </Button>
        </aside>
      </div>
    </div>
  );
}
