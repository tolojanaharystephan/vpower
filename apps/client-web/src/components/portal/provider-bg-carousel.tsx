'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { PORTAL_HERO_IMAGE } from '@/lib/portal';
import { cn } from '@/lib/utils';

/** Hero background — hall image only (room cards are text, no tile art). */
export function ProviderBgCarousel({
  className,
  intervalMs = 5000,
}: {
  className?: string;
  intervalMs?: number;
}) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setPulse((v) => !v), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className="absolute inset-0">
        <Image
          src={PORTAL_HERO_IMAGE}
          alt=""
          fill
          priority
          className={cn(
            'object-cover transition-transform duration-[5000ms] ease-out will-change-transform',
            pulse ? 'scale-105' : 'scale-100',
          )}
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/70 to-black/35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(46,163,242,0.28),transparent_45%)]" />
    </div>
  );
}
