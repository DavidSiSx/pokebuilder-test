export function PokeballIcon({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top half - Red */}
      <path
        d="M50 5C25.15 5 5 25.15 5 50h90C95 25.15 74.85 5 50 5Z"
        fill="currentColor"
        className="text-pokeball-red"
      />
      {/* Bottom half - White */}
      <path
        d="M5 50c0 24.85 20.15 45 45 45s45-20.15 45-45H5Z"
        fill="currentColor"
        className="text-pokeball-white"
      />
      {/* Center band */}
      <rect x="5" y="46" width="90" height="8" fill="currentColor" className="text-pokeball-band" />
      {/* Center circle outer */}
      <circle cx="50" cy="50" r="16" fill="currentColor" className="text-pokeball-band" />
      {/* Center circle inner */}
      <circle cx="50" cy="50" r="10" fill="currentColor" className="text-pokeball-white" />
      {/* Center dot */}
      <circle cx="50" cy="50" r="5" fill="currentColor" className="text-pokeball-band" />
      {/* Outline */}
      <circle cx="50" cy="50" r="45" stroke="currentColor" className="text-pokeball-band" strokeWidth="3" fill="none" />
    </svg>
  );
}

export function PokeballBgPattern({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Large faded pokeball top-right */}
      <svg
        width="400"
        height="400"
        viewBox="0 0 100 100"
        fill="none"
        className="absolute -top-32 -right-32 opacity-[0.03]"
      >
        <path d="M50 5C25.15 5 5 25.15 5 50h90C95 25.15 74.85 5 50 5Z" fill="#dc2626" />
        <path d="M5 50c0 24.85 20.15 45 45 45s45-20.15 45-45H5Z" fill="#f8fafc" />
        <rect x="5" y="46" width="90" height="8" fill="#1e293b" />
        <circle cx="50" cy="50" r="16" fill="#1e293b" />
        <circle cx="50" cy="50" r="10" fill="#f8fafc" />
        <circle cx="50" cy="50" r="45" stroke="#1e293b" strokeWidth="3" fill="none" />
      </svg>
      {/* Small faded pokeball bottom-left */}
      <svg
        width="200"
        height="200"
        viewBox="0 0 100 100"
        fill="none"
        className="absolute -bottom-16 -left-16 opacity-[0.02]"
      >
        <path d="M50 5C25.15 5 5 25.15 5 50h90C95 25.15 74.85 5 50 5Z" fill="#dc2626" />
        <path d="M5 50c0 24.85 20.15 45 45 45s45-20.15 45-45H5Z" fill="#f8fafc" />
        <rect x="5" y="46" width="90" height="8" fill="#1e293b" />
        <circle cx="50" cy="50" r="16" fill="#1e293b" />
        <circle cx="50" cy="50" r="10" fill="#f8fafc" />
        <circle cx="50" cy="50" r="45" stroke="#1e293b" strokeWidth="3" fill="none" />
      </svg>
    </div>
  );
}
