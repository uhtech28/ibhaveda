/**
 * SparkyCheerSvg — frozen pose: mid-jump, both paws up, big excited grin.
 *
 * Body lifted off ground. Both paws raised triumphantly. Tail straight up.
 * Tongue out. Eyes scrunched in happiness. Ears flying up from motion.
 *
 * Note: ground shadow is smaller + lower opacity to convey "in the air".
 */

interface Props {
  size?: number;
}

export function SparkyCheerSvg({ size = 170 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.4))" }}
    >
      {/* Tiny shadow far below — indicates Sparky is airborne */}
      <ellipse cx="100" cy="194" rx="30" ry="3" fill="rgba(0,0,0,0.18)" />

      {/* Tail straight up + slightly curved — excited */}
      <path
        d="M 132 124 Q 150 84 144 48 Q 142 36 132 38 Q 124 44 124 60 Q 126 96 122 122 Z"
        fill="#c79555"
        stroke="#7a5128"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Back legs tucked up in mid-jump */}
      <ellipse cx="78" cy="160" rx="16" ry="9" fill="#c79555" stroke="#7a5128" strokeWidth="2.5" />
      <ellipse cx="122" cy="160" rx="16" ry="9" fill="#c79555" stroke="#7a5128" strokeWidth="2.5" />
      <ellipse cx="78" cy="164" rx="9" ry="4" fill="#5b3315" />
      <ellipse cx="122" cy="164" rx="9" ry="4" fill="#5b3315" />

      {/* Body — same shape, no front-leg planting (paws are up) */}
      <ellipse cx="100" cy="128" rx="42" ry="34" fill="#e8b574" stroke="#7a5128" strokeWidth="3" />
      <ellipse cx="100" cy="140" rx="26" ry="18" fill="#f6d2a1" opacity="0.8" />

      {/* Front legs BOTH raised triumphantly */}
      <g transform="rotate(-50, 78, 110)">
        <rect x="72" y="72" width="14" height="46" rx="6" fill="#e8b574" stroke="#7a5128" strokeWidth="2.5" />
        <ellipse cx="79" cy="72" rx="10" ry="6" fill="#5b3315" />
      </g>
      <g transform="rotate(50, 122, 110)">
        <rect x="115" y="72" width="14" height="46" rx="6" fill="#e8b574" stroke="#7a5128" strokeWidth="2.5" />
        <ellipse cx="122" cy="72" rx="10" ry="6" fill="#5b3315" />
      </g>

      {/* Head — ears flying up from upward motion */}
      <path d="M 56 56 Q 40 80 50 100 Q 60 102 66 96 Q 70 80 66 56 Z" fill="#7a5128" stroke="#5b3315" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 144 56 Q 160 80 150 100 Q 140 102 134 96 Q 130 80 134 56 Z" fill="#7a5128" stroke="#5b3315" strokeWidth="2.5" strokeLinejoin="round" />

      <ellipse cx="100" cy="82" rx="42" ry="38" fill="#e8b574" stroke="#7a5128" strokeWidth="3" />
      <ellipse cx="100" cy="100" rx="22" ry="16" fill="#f6d2a1" stroke="#7a5128" strokeWidth="2.5" />

      {/* Eyes — scrunched in joy (closed-curve smile) */}
      <path d="M 75 80 Q 82 72 90 80" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 110 80 Q 118 72 125 80" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Eyebrows raised */}
      <path d="M 72 64 Q 82 58 92 64" stroke="#5b3315" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 108 64 Q 118 58 128 64" stroke="#5b3315" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      <ellipse cx="100" cy="96" rx="5" ry="4" fill="#1a1a1a" />
      <ellipse cx="99" cy="95" rx="1.5" ry="1.2" fill="white" opacity="0.85" />

      {/* Mouth WIDE open — excited */}
      <path
        d="M 82 108 Q 100 132 118 108 Q 118 120 100 124 Q 82 120 82 108 Z"
        fill="#5b1f2a"
        stroke="#1a1a1a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Big tongue */}
      <path
        d="M 86 116 Q 100 132 114 116 Q 114 124 100 126 Q 86 124 86 116 Z"
        fill="#ff6b8a"
        stroke="#c4365e"
        strokeWidth="1.5"
      />
      {/* Tooth */}
      <rect x="96" y="108" width="4" height="6" rx="1" fill="white" />

      {/* Joy sparkles around head */}
      <g fill="#fbbf24">
        <path d="M 28 38 L 30 44 L 36 46 L 30 48 L 28 54 L 26 48 L 20 46 L 26 44 Z" />
        <path d="M 168 32 L 170 38 L 176 40 L 170 42 L 168 48 L 166 42 L 160 40 L 166 38 Z" />
      </g>
      <g fill="#a78bfa">
        <circle cx="170" cy="68" r="3" />
        <circle cx="32" cy="78" r="3" />
      </g>
    </svg>
  );
}
