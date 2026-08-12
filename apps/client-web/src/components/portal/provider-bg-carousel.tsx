'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { PORTAL_HERO_IMAGE, PORTAL_PROVIDERS } from '@/lib/portal';
import { cn } from '@/lib/utils';

const SLIDES = [
  { src: PORTAL_HERO_IMAGE, alt: 'VPower777' },
  ...PORTAL_PROVIDERS.map((p) => ({ src: p.imageUrl, alt: p.name })),
];

/** Hero-only fading carousel (same slot as the previous single hero image). */
export function ProviderBgCarousel({
  className,
  intervalMs = 5000,
}: {
  className?: string;
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000 ease-out',
            i === index ? 'opacity-100' : 'opacity-0',
          )}
        >
          <Image
            src={slide.src}
            alt=""
            fill
            priority={i === 0}
            className={cn(
              'object-cover transition-transform duration-[5000ms] ease-out will-change-transform',
              i === index ? 'scale-105' : 'scale-100',
            )}
            sizes="100vw"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/70 to-black/35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(46,163,242,0.28),transparent_45%)]" />
    </div>
  );
}
