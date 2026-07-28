import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-[var(--vp-border)] bg-[var(--vp-surface)] px-3 text-sm text-[var(--vp-fg)] placeholder:text-[var(--vp-muted)] outline-none transition focus:border-[var(--vp-accent)] focus:ring-1 focus:ring-[var(--vp-accent)]',
        className,
      )}
      {...props}
    />
  );
}
