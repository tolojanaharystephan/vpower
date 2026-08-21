import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-md border border-[rgba(255,255,255,0.12)] bg-[rgba(20,20,26,0.85)] px-3 text-[var(--vp-fg)] placeholder:text-[var(--vp-muted)] outline-none transition focus:border-[var(--vp-accent)] focus:ring-1 focus:ring-[var(--vp-accent)]',
        className,
      )}
      {...props}
    />
  );
}
