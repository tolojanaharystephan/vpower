import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-[0.75rem] border border-[var(--vp-border)] bg-[rgba(8,8,12,0.45)] px-3 text-sm text-[var(--vp-fg)] placeholder:text-[var(--vp-muted)] outline-none transition focus:border-[rgba(212,160,23,0.5)] focus:bg-[rgba(212,160,23,0.04)] focus:shadow-[0_0_0_3px_rgba(212,160,23,0.1)]',
        className,
      )}
      {...props}
    />
  );
}
