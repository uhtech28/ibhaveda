/**
 * SparkyTalkSvg — frozen pose: mouth open, gesturing with one raised paw.
 * Tongue is visible. Eyes engaged, looking forward. Friendly chat pose.
 *
 * No internal animation — single static illustration.
 */

interface Props {
  size?: number;
}

export function SparkyTalkSvg({ size = 170 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))" }}
    >
      <ellipse cx="100" cy="186" rx="48" ry="6" fill="rgba(0,0,0,0.25)" />

      {/* Tail — wagging slightly to the right */}
      <path
        d="M 140 130 Q 174 116 184 88 Q 188 74 178 70 Q 168 76 164 92 Q 156 116 134 124 Z"
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

      {/* Front legs: left raised in small wave gesture, right planted */}
      {/* Left paw raised + bent — drawn rotated up-left */}
      <g transform="rotate(-32, 78, 144)">
        <rect x="72" y="118" width="14" height="34" rx="6" fill="#e8b574" stroke="#7a5128" strokeWidth="2.5" />
        <ellipse cx="79" cy="116" rx="10" ry="6" fill="#5b3315" />
      </g>
      {/* Right paw planted */}
      <rect x="108" y="148" width="14" height="32" rx="6" fill="#e8b574" stroke="#7a5128" strokeWidth="2.5" />
      <ellipse cx="115" cy="180" rx="10" ry="5" fill="#5b3315" />

      {/* Head */}
      <path d="M 56 64 Q 48 86 56 110 Q 64 114 70 106 Q 70 86 66 64 Z" fill="#7a5128" stroke="#5b3315" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 144 64 Q 152 86 144 110 Q 136 114 130 106 Q 130 86 134 64 Z" fill="#7a5128" stroke="#5b3315" strokeWidth="2.5" strokeLinejoin="round" />

      <ellipse cx="100" cy="86" rx="42" ry="38" fill="#e8b574" stroke="#7a5128" strokeWidth="3" />
      <ellipse cx="100" cy="104" rx="22" ry="16" fill="#f6d2a1" stroke="#7a5128" strokeWidth="2.5" />

      {/* Eyes — bright + engaged, slightly looking up */}
      <ellipse cx="82" cy="80" rx="8" ry="9" fill="white" stroke="#1a1a1a" strokeWidth="1.2" />
      <ellipse cx="83" cy="80" rx="5" ry="6" fill="#1a1a1a" />
      <circle cx="85" cy="77" r="2.4" fill="white" />

      <ellipse cx="118" cy="80" rx="8" ry="9" fill="white" stroke="#1a1a1a" strokeWidth="1.2" />
      <ellipse cx="119" cy="80" rx="5" ry="6" fill="#1a1a1a" />
      <circle cx="121" cy="77" r="2.4" fill="white" />

      <path d="M 74 66 Q 82 62 90 66" stroke="#5b3315" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 110 66 Q 118 62 126 66" stroke="#5b3315" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      <ellipse cx="100" cy="100" rx="5" ry="4" fill="#1a1a1a" />
      <ellipse cx="99" cy="99" rx="1.5" ry="1.2" fill="white" opacity="0.85" />

      {/* Mouth OPEN — talking */}
      <path
        d="M 86 110 Q 100 124 114 110 Q 114 118 100 122 Q 86 118 86 110 Z"
        fill="#5b1f2a"
        stroke="#1a1a1a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Tongue */}
      <path
        d="M 92 116 Q 100 124 108 116 Q 108 120 100 122 Q 92 120 92 116 Z"
        fill="#ff6b8a"
        stroke="#c4365e"
        strokeWidth="1.5"
      />
    </svg>
  );
}
