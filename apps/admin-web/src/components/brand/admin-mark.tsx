export function AdminMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#0B0B0F" />
      <circle cx="32" cy="32" r="28" fill="none" stroke="#D4A017" strokeWidth="2.5" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontSize="18"
        fontWeight="800"
        fill="#D4A017"
      >
        777
      </text>
    </svg>
  );
}
