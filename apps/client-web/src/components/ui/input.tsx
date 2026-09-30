import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-md border border-[rgba(245,240,232,0.14)] bg-[rgba(20,20,26,0.85)] px-3 text-base text-[var(--vp-fg)] placeholder:text-[var(--vp-muted)] outline-none transition focus:border-[var(--vp-accent)] focus:ring-1 focus:ring-[var(--vp-accent)] md:h-11 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}
