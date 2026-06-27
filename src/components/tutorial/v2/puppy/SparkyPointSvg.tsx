/**
 * SparkyPointSvg — frozen pose: paw extended pointing left, eyes focused.
 *
 * Left paw extended dramatically to the side. Eyes looking in the
 * direction of the point. Mouth closed in focused expression. Ears
 * slightly perked.
 */

interface Props {
  size?: number;
}

export function SparkyPointSvg({ size = 170 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))" }}
    >
      <ellipse cx="100" cy="186" rx="48" ry="6" fill="rgba(0,0,0,0.25)" />

      {/* Tail — held out behind for balance */}
      <path
        d="M 140 130 Q 168 116 176 90 Q 180 76 170 72 Q 160 78 156 92 Q 150 116 134 124 Z"
        fill="#c79555"
        stroke="#7a5128"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Back legs */}
      <ellipse cx="72" cy="172" rx="18" ry="10" fill="#c79555" stroke="#7a5128" strokeWidth="2.5" />
      <ellipse cx="128" cy="172" rx="18" ry="10" fill="#c79555" stroke="#7a5128" strokeWidth="2.5" />
      <ellipse cx="72" cy="176" rx="10" ry="4" fill="#5b3315" />
      <ellipse cx="128" cy="176" rx="10" ry="4" fill="#5b3315" />

      {/* Body */}
      <ellipse cx="100" cy="138" rx="44" ry="36" fill="#e8b574" stroke="#7a5128" strokeWidth="3" />
      <ellipse cx="100" cy="150" rx="28" ry="20" fill="#f6d2a1" opacity="0.8" />

      {/* Front legs: LEFT extended pointing dramatically, RIGHT planted */}
      {/* Left paw extended forward-left (toward viewer's left = highlight target) */}
      <g transform="rotate(-78, 78, 138)">
        <rect x="72" y="100" width="14" height="48" rx="6" fill="#e8b574" stroke="#7a5128" strokeWidth="2.5" />
        {/* Pointing paw at the tip */}
        <ellipse cx="79" cy="100" rx="12" ry="7" fill="#5b3315" />
        {/* Single toe sticking out for pointing emphasis */}
        <ellipse cx="73" cy="94" rx="3" ry="4" fill="#5b3315" />
      </g>
      <rect x="108" y="148" width="14" height="32" rx="6" fill="#e8b574" stroke="#7a5128" strokeWidth="2.5" />
      <ellipse cx="115" cy="180" rx="10" ry="5" fill="#5b3315" />

      {/* Head — slightly turned toward the point direction */}
      <path d="M 56 60 Q 46 86 56 110 Q 64 114 70 106 Q 70 84 66 60 Z" fill="#7a5128" stroke="#5b3315" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 144 64 Q 152 86 144 110 Q 136 114 130 106 Q 130 86 134 64 Z" fill="#7a5128" stroke="#5b3315" strokeWidth="2.5" strokeLinejoin="round" />

      <ellipse cx="100" cy="86" rx="42" ry="38" fill="#e8b574" stroke="#7a5128" strokeWidth="3" />
      <ellipse cx="100" cy="104" rx="22" ry="16" fill="#f6d2a1" stroke="#7a5128" strokeWidth="2.5" />

      {/* Eyes — looking left (toward the point) */}
      <ellipse cx="82" cy="82" rx="8" ry="9" fill="white" stroke="#1a1a1a" strokeWidth="1.2" />
      <ellipse cx="80" cy="83" rx="5" ry="6" fill="#1a1a1a" />
      <circle cx="82" cy="80" r="2.4" fill="white" />

      <ellipse cx="118" cy="82" rx="8" ry="9" fill="white" stroke="#1a1a1a" strokeWidth="1.2" />
      <ellipse cx="116" cy="83" rx="5" ry="6" fill="#1a1a1a" />
      <circle cx="118" cy="80" r="2.4" fill="white" />

      {/* Eyebrows — slightly furrowed, focused */}
      <path d="M 74 70 Q 82 67 90 71" stroke="#5b3315" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M 110 71 Q 118 67 126 70" stroke="#5b3315" strokeWidth="2.6" fill="none" strokeLinecap="round" />

      <ellipse cx="100" cy="100" rx="5" ry="4" fill="#1a1a1a" />
      <ellipse cx="99" cy="99" rx="1.5" ry="1.2" fill="white" opacity="0.85" />

      {/* Mouth — small focused "o" */}
      <ellipse cx="100" cy="112" rx="3.5" ry="2.5" fill="#1a1a1a" />
    </svg>
  );
}
