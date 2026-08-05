import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vp-bg)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--vp-accent)] text-[#261a00] hover:bg-[var(--vp-accent-bright)] shadow-[0_10px_30px_-10px_rgba(212,160,23,0.35)]',
        secondary:
          'border border-[rgba(212,160,23,0.45)] bg-transparent text-[var(--vp-accent)] hover:bg-[rgba(212,160,23,0.08)]',
        ghost: 'text-[var(--vp-muted)] hover:bg-white/5 hover:text-[var(--vp-fg)]',
        danger: 'border border-red-400/25 bg-transparent text-red-300 hover:bg-red-500/10',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 tracking-wide',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
