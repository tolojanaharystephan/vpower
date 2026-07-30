'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { updateMe } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
});

type FormValues = z.infer<typeof schema>;

export function AccountPanel() {
  const t = useTranslations('account');
  const router = useRouter();
  const { ready, user, accessToken, isAuthenticated, logout, refresh } = useSession();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

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
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-[var(--vp-muted)]">
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--vp-accent)]">
        {t('eyebrow')}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--vp-fg)]">
        {t('title')}
      </h1>
      <p className="mt-2 text-sm text-[var(--vp-muted)]">{t('subtitle')}</p>

      <form
        className="mt-8 space-y-4 rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6"
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
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--vp-muted)]">
            {t('email')}
          </label>
          <Input value={user.email} disabled readOnly />
        </div>
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
        {errors.root ? <p className="text-sm text-red-400">{errors.root.message}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('saving') : t('save')}
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        className="mt-4 w-full"
        onClick={async () => {
          await logout();
          router.push('/');
        }}
      >
        {t('logout')}
      </Button>
    </div>
  );
}
