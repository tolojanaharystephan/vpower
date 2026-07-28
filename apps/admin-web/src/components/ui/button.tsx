import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vp-accent)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--vp-accent)] text-[#1a1205] hover:bg-[#e0b12a] shadow-[0_0_0_1px_rgba(212,160,23,0.35)]',
        secondary:
          'border border-[var(--vp-border)] bg-transparent text-[var(--vp-fg)] hover:border-[var(--vp-accent)] hover:text-[var(--vp-accent)]',
        ghost: 'text-[var(--vp-muted)] hover:bg-white/5 hover:text-[var(--vp-fg)]',
        danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6',
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
