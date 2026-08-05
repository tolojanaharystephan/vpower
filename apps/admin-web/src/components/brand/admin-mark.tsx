'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

/** Casino chip + 777 jackpot mark — matches client BrandMark / favicon. */
export function AdminMark({
  className,
  title = 'VPower777',
}: {
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const goldId = `admin-gold-${uid}`;

  return (
    <svg viewBox="0 0 64 64" role="img" aria-label={title} className={cn('shrink-0', className)}>
      <title>{title}</title>
      <defs>
        <linearGradient id={goldId} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0C84A" />
          <stop offset="0.5" stopColor="#D4A017" />
          <stop offset="1" stopColor="#8A6010" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#0B0B0F" />
      <circle cx="32" cy="32" r="28" fill="none" stroke={`url(#${goldId})`} strokeWidth="2.5" />
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="none"
        stroke={`url(#${goldId})`}
        strokeWidth="1"
        strokeDasharray="3 4"
        opacity="0.55"
      />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="Arial Black, Helvetica Neue, sans-serif"
        fontSize="22"
        fontWeight="800"
        letterSpacing="-1"
        fill={`url(#${goldId})`}
      >
        777
      </text>
      <path d="M46 12 L42 20 H46 L43 28 L52 16 H47 Z" fill="#F0C84A" />
    </svg>
  );
}
