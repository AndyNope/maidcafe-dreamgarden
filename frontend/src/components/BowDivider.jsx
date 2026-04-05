/** Decorative bow SVG divider between sections */
export default function BowDivider({ color = '#FFB7D5', size = 48 }) {
  return (
    <div className="flex items-center justify-center py-2">
      <svg viewBox="0 0 160 50" width={size * 2} height={size * 0.625} fill="none">
        {/* Left line */}
        <line x1="0" y1="25" x2="48" y2="25" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" />
        {/* Left wing */}
        <ellipse cx="62" cy="25" rx="22" ry="10" fill={color} opacity="0.7" transform="rotate(-8 62 25)" />
        {/* Right wing */}
        <ellipse cx="98" cy="25" rx="22" ry="10" fill={color} opacity="0.7" transform="rotate(8 98 25)" />
        {/* Knot */}
        <circle cx="80" cy="25" r="8" fill={color} />
        <circle cx="80" cy="25" r="4.5" fill="white" opacity="0.6" />
        {/* Right line */}
        <line x1="112" y1="25" x2="160" y2="25" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" />
      </svg>
    </div>
  )
}
