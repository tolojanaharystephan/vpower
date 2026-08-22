'use client';

import { cn } from '@/lib/utils';
import { AdminMark } from '@/components/brand/admin-mark';

const sizeMap = {
  sm: { box: 'h-14 w-14', coin: 'h-8 w-8', label: 'text-xs' },
  md: { box: 'h-24 w-24', coin: 'h-12 w-12', label: 'text-sm' },
  lg: { box: 'h-36 w-36', coin: 'h-16 w-16', label: 'text-sm' },
} as const;

export function BrandLoader({
  label,
  size = 'md',
  fullScreen = false,
  className,
}: {
  label?: string;
  size?: keyof typeof sizeMap;
  fullScreen?: boolean;
  className?: string;
}) {
  const s = sizeMap[size];

  const body = (
    <div
      className={cn('vp-loader flex flex-col items-center gap-4', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={cn('vp-loader-stage relative', s.box)}>
        <span className="vp-loader-glow" aria-hidden />
        <span className="vp-loader-ring vp-loader-ring-a" aria-hidden />
        <span className="vp-loader-ring vp-loader-ring-b" aria-hidden />
        <span className="vp-loader-ring vp-loader-ring-c" aria-hidden />
        <span className="vp-loader-orbit" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <div className="vp-loader-coin absolute inset-0 grid place-items-center">
          <AdminMark className={cn(s.coin, 'drop-shadow-[0_0_18px_rgba(46,163,242,0.45)]')} />
        </div>
      </div>
      {label ? (
        <p className={cn('font-medium tracking-wide text-[var(--vp-muted)]', s.label)}>{label}</p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );

  if (!fullScreen) return body;

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--vp-bg)] px-4">{body}</div>
  );
}
