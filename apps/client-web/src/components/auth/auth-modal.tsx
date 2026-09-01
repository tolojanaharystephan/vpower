'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthUi } from '@/components/auth/auth-ui-context';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { BrandMark } from '@/components/brand/brand-mark';
import { BrandWordmark } from '@/components/brand/brand-wordmark';
import { cn } from '@/lib/utils';

export function AuthModal() {
  const { mode, closeAuth, switchAuth } = useAuthUi();
  const t = useTranslations('auth');
  const brand = useTranslations('brand');

  if (!mode) return null;

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <button type="button" className="auth-overlay-backdrop" aria-label="Close" onClick={closeAuth} />
      <div className="auth-panel auth-panel-split animate-modal-in">
        <div className="auth-panel-glow" aria-hidden />
        <button
          type="button"
          onClick={closeAuth}
          className="absolute right-3 top-3 rounded-md p-2 text-[var(--vp-muted)] transition hover:bg-white/5 hover:text-[var(--vp-fg)]"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <aside className="auth-brand-side">
          <div className="auth-brand-orb auth-brand-orb-a" aria-hidden />
          <div className="auth-brand-orb auth-brand-orb-b" aria-hidden />
          <div className="relative">
            <div className="flex items-center gap-3">
              <BrandMark className="h-10 w-10" />
              <BrandWordmark
                name="VPower"
                className="font-[family-name:var(--font-display)] text-lg tracking-[0.08em] text-[var(--vp-accent)]"
              />
            </div>
            <p className="mt-auto pt-16 font-[family-name:var(--font-display)] text-3xl leading-tight tracking-wide text-[var(--vp-fg)]">
              {t('panelHeadline')}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--vp-muted)]">
              {t('panelSub')}
            </p>
          </div>
        </aside>

        <div className="auth-form-side">
          <div className="mb-6 flex items-center gap-3">
            <BrandMark className="h-10 w-10 md:hidden" />
            <div>
              <p id="auth-modal-title" className="font-[family-name:var(--font-display)] text-xl tracking-wide text-[var(--vp-fg)]">
                {mode === 'login' ? t('loginTitle') : t('registerTitle')}
              </p>
              <p className="mt-1 text-sm text-[var(--vp-muted)]">{brand('tagline')}</p>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-black/35 p-1">
            <button
              type="button"
              className={cn('auth-tab', mode === 'login' && 'auth-tab-active')}
              onClick={() => switchAuth('login')}
            >
              {t('loginTitle')}
            </button>
            <button
              type="button"
              className={cn('auth-tab', mode === 'register' && 'auth-tab-active')}
              onClick={() => switchAuth('register')}
            >
              {t('registerTitle')}
            </button>
          </div>

          {mode === 'login' ? (
            <LoginForm embedded onSwitch={() => switchAuth('register')} onSuccess={closeAuth} />
          ) : (
            <RegisterForm embedded onSwitch={() => switchAuth('login')} onSuccess={closeAuth} />
          )}
        </div>
      </div>
    </div>
  );
}
