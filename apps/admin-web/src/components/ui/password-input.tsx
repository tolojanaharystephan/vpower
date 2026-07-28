'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, ...props }, ref) {
    const t = useTranslations('common');
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn(
            'h-10 w-full rounded-md border border-[var(--vp-border)] bg-[var(--vp-surface)] px-3 pr-11 text-sm text-[var(--vp-fg)] placeholder:text-[var(--vp-muted)] outline-none transition focus:border-[var(--vp-accent)] focus:ring-1 focus:ring-[var(--vp-accent)]',
            className,
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-[var(--vp-muted)] transition hover:bg-white/5 hover:text-[var(--vp-fg)]"
          aria-label={visible ? t('hidePassword') : t('showPassword')}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
