'use client';

type Point = { label: string; value: number };

export function PilotChart({
  points,
  seriesLabel,
}: {
  points: Point[];
  seriesLabel: string;
}) {
  const width = 640;
  const height = 240;
  const padX = 12;
  const padY = 18;
  const max = Math.max(...points.map((p) => p.value), 1);
  const min = Math.min(...points.map((p) => p.value), 0);
  const span = Math.max(max - min, 1);

  const coords = points.map((point, index) => {
    const x = padX + (index / Math.max(points.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - ((point.value - min) / span) * (height - padY * 2);
    return { x, y, ...point };
  });

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const area = `${line} L ${coords[coords.length - 1]?.x ?? padX} ${height - padY} L ${padX} ${height - padY} Z`;

  return (
    <div className="pilot-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full" role="img" aria-label={seriesLabel}>
        <defs>
          <linearGradient id="pilotFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(212,160,23,0.38)" />
            <stop offset="100%" stopColor="rgba(212,160,23,0)" />
          </linearGradient>
          <linearGradient id="pilotStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a67c0f" />
            <stop offset="50%" stopColor="#d4a017" />
            <stop offset="100%" stopColor="#f0c14a" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={padX}
            x2={width - padX}
            y1={padY + ratio * (height - padY * 2)}
            y2={padY + ratio * (height - padY * 2)}
            className="pilot-grid"
          />
        ))}

        <path d={area} fill="url(#pilotFill)" className="pilot-area" />
        <path d={line} fill="none" stroke="url(#pilotStroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pilot-line" />

        {coords.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" className="pilot-dot" />
            <circle cx={point.x} cy={point.y} r="8" className="pilot-dot-halo" />
          </g>
        ))}
      </svg>

      <div className="mt-2 flex justify-between gap-2 px-1">
        {points.map((point) => (
          <span key={point.label} className="text-[10px] uppercase tracking-[0.12em] text-[var(--vp-muted)]">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
