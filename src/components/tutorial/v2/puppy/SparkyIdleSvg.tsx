/**
 * SparkyIdleSvg — frozen pose: sitting upright, calm friendly smile.
 *
 * No internal animation. Caller wraps this SVG and applies whole-image
 * transforms (bounce, tilt, scale) — never animates individual paths.
 * That's the architectural fix: each pose is a static illustration,
 * mood swaps replace one pose with another (like sprite frames),
 * never deforms one pose's internals.
 */

interface Props {
  size?: number;
}

export function SparkyIdleSvg({ size = 170 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))" }}
    >
      {/* Ground shadow */}
      <ellipse cx="100" cy="186" rx="48" ry="6" fill="rgba(0,0,0,0.25)" />

      {/* Tail (curved, frozen behind body) */}
      <path
        d="M 140 130 Q 168 110 174 78 Q 178 64 168 60 Q 158 64 156 80 Q 152 108 134 124 Z"
        fill="#c79555"
        stroke="#7a5128"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Back legs (sitting, tucked under) */}
      <ellipse cx="72" cy="172" rx="18" ry="10" fill="#c79555" stroke="#7a5128" strokeWidth="2.5" />
      <ellipse cx="128" cy="172" rx="18" ry="10" fill="#c79555" stroke="#7a5128" strokeWidth="2.5" />
      <ellipse cx="72" cy="176" rx="10" ry="4" fill="#5b3315" />
      <ellipse cx="128" cy="176" rx="10" ry="4" fill="#5b3315" />

      {/* Body */}
      <ellipse cx="100" cy="138" rx="44" ry="36" fill="#e8b574" stroke="#7a5128" strokeWidth="3" />
      {/* Belly highlight */}
      <ellipse cx="100" cy="150" rx="28" ry="20" fill="#f6d2a1" opacity="0.8" />

      {/* Front legs (both planted, calm pose) */}
      <rect x="78" y="148" width="14" height="32" rx="6" fill="#e8b574" stroke="#7a5128" strokeWidth="2.5" />
      <ellipse cx="85" cy="180" rx="10" ry="5" fill="#5b3315" />
      <rect x="108" y="148" width="14" height="32" rx="6" fill="#e8b574" stroke="#7a5128" strokeWidth="2.5" />
      <ellipse cx="115" cy="180" rx="10" ry="5" fill="#5b3315" />

      {/* Head */}
      {/* Left ear */}
      <path
        d="M 56 64 Q 48 86 56 110 Q 64 114 70 106 Q 70 86 66 64 Z"
        fill="#7a5128"
        stroke="#5b3315"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Right ear */}
      <path
        d="M 144 64 Q 152 86 144 110 Q 136 114 130 106 Q 130 86 134 64 Z"
        fill="#7a5128"
        stroke="#5b3315"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Head main shape */}
      <ellipse cx="100" cy="86" rx="42" ry="38" fill="#e8b574" stroke="#7a5128" strokeWidth="3" />
      {/* Snout */}
      <ellipse cx="100" cy="104" rx="22" ry="16" fill="#f6d2a1" stroke="#7a5128" strokeWidth="2.5" />

      {/* Eyes — big and bright, calm gaze */}
      <ellipse cx="82" cy="82" rx="8" ry="9" fill="white" stroke="#1a1a1a" strokeWidth="1.2" />
      <ellipse cx="83" cy="84" rx="5" ry="6" fill="#1a1a1a" />
      <circle cx="85" cy="81" r="2.4" fill="white" />

      <ellipse cx="118" cy="82" rx="8" ry="9" fill="white" stroke="#1a1a1a" strokeWidth="1.2" />
      <ellipse cx="119" cy="84" rx="5" ry="6" fill="#1a1a1a" />
      <circle cx="121" cy="81" r="2.4" fill="white" />

      {/* Eyebrows */}
      <path d="M 74 68 Q 82 64 90 68" stroke="#5b3315" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 110 68 Q 118 64 126 68" stroke="#5b3315" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <ellipse cx="100" cy="100" rx="5" ry="4" fill="#1a1a1a" />
      <ellipse cx="99" cy="99" rx="1.5" ry="1.2" fill="white" opacity="0.85" />

      {/* Mouth — calm closed smile */}
      <path
        d="M 100 104 Q 95 110 89 109 M 100 104 Q 105 110 111 109"
        stroke="#1a1a1a"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
