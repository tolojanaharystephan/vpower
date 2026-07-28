'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AdminMark } from '@/components/brand/admin-mark';
import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { useRouter } from '@/i18n/navigation';
import { BRAND } from '@vpower777/config';

export default function LoginPage() {
  const t = useTranslations('login');
  const { ready, isStaff } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && isStaff) router.replace('/');
  }, [ready, isStaff, router]);

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="login-brand-stage hidden min-h-screen flex-col justify-between p-12 lg:flex">
        <div className="relative z-10 flex items-center gap-3">
          <AdminMark className="h-10 w-10" />
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg tracking-wide text-[var(--vp-accent)]">{BRAND.name}</p>
            <p className="text-sm text-[var(--vp-muted)]">{t('staffConsole')}</p>
          </div>
        </div>
        <div className="relative z-10 max-w-xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--vp-accent)]">{t('eyebrow')}</p>
          <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[1.08] tracking-tight text-[var(--vp-fg)] xl:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--vp-muted)]">{t('subtitle')}</p>
        </div>
        <div className="login-float login-float-a rounded-xl px-4 py-3 text-sm text-[var(--vp-fg)]">
          <span className="mr-2 text-[var(--vp-accent)]">●</span>
          {t('floatServices')}
        </div>
        <div className="login-float login-float-b rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--vp-muted)]">{t('floatAccessLabel')}</p>
          <p className="mt-1 text-sm font-medium text-[var(--vp-fg)]">{t('floatAccessValue')}</p>
        </div>
        <div className="login-float login-float-c rounded-xl px-4 py-3">
          <p className="text-xs text-[var(--vp-muted)]">{t('floatSystemLabel')}</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--vp-accent)]">{t('floatSystemValue')}</p>
        </div>
      </section>
      <section className="relative flex min-h-screen items-center justify-center bg-[var(--vp-bg)] px-5 py-10 sm:px-8">
        <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
          <LocaleSwitcher />
        </div>
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <AdminMark className="h-10 w-10" />
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg tracking-wide text-[var(--vp-accent)]">{BRAND.name}</p>
              <p className="text-sm text-[var(--vp-muted)]">{t('staffConsole')}</p>
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--vp-accent)]">{t('formEyebrow')}</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--vp-fg)]">{t('formTitle')}</h2>
          <p className="mt-2 text-sm text-[var(--vp-muted)]">{t('formSubtitle')}</p>
          <div className="mt-8 rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6 shadow-2xl sm:p-8">
            <AdminLoginForm />
          </div>
          <p className="mt-5 text-xs leading-relaxed text-[var(--vp-muted)]">
            {t.rich('formHint', {
              code: (chunks) => <code>{chunks}</code>,
            })}
          </p>
        </div>
      </section>
    </main>
  );
}
