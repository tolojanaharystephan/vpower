'use client';

import { BrandMark } from '@/components/brand/brand-mark';
import { cn } from '@/lib/utils';

/** Soft organic atmosphere inspired by calm coaching UIs — branded for VPower777. */
export function CareAtmosphere({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn('care-visual', className)} aria-hidden={!label}>
      {label ? <span className="sr-only">{label}</span> : null}
      <span className="care-blob care-blob-a" />
      <span className="care-blob care-blob-b" />
      <span className="care-blob care-blob-c" />
      <span className="care-ring care-ring-outer" />
      <span className="care-ring care-ring-inner" />
      <div className="care-visual-core">
        <BrandMark className="h-20 w-20 sm:h-24 sm:w-24" />
      </div>
      <span className="care-petal care-petal-1" />
      <span className="care-petal care-petal-2" />
      <span className="care-petal care-petal-3" />
    </div>
  );
}
