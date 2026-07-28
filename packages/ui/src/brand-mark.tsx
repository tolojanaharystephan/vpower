import type { JSX } from 'react';

type BrandMarkProps = {
  className?: string;
};

/** Shared brand wordmark stub — visual system expands in Phase 4/5. */
export function BrandMark({ className }: BrandMarkProps): JSX.Element {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: '#D4A017',
      }}
    >
      VPower777
    </span>
  );
}
