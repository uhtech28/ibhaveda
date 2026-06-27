"use client";

/**
 * SparkySvg
 *
 * The cute puppy mascot for the Duolingo-style tutorial. Hand-drawn
 * SVG (no external assets) so it loads instantly, scales cleanly, and
 * can be tinted/animated via framer-motion without sprite-sheet work.
 *
 * Sparky has 4 mood states driven by the `mood` prop:
 *   - "idle"        slow tail wag + soft breathing
 *   - "talking"     gentle head bob with mouth open/close
 *   - "pointing"    paw raised toward the right
 *   - "celebrating" mid-air jump + spinning sparkles
 *
 * Coordinate system is 100x100 viewBox so the parent can size Sparky
 * with `width`/`height` or a fixed CSS size and everything inside
 * (head, eyes, ears, tail) scales together. Animations live in this
 * file as motion.g segments so the SVG stays a single tree.
 */

import { motion } from "framer-motion";

export type SparkyMood = "idle" | "talking" | "pointing" | "celebrating";

interface SparkySvgProps {
  mood?: SparkyMood;
  /** Pixel size for the rendered SVG. Default 120. */
  size?: number;
  /** Mirror Sparky horizontally — useful if speech bubble sits on the left. */
  flip?: boolean;
}

export function SparkySvg({ mood = "idle", size = 120, flip = false }: SparkySvgProps) {
  // ── Tween presets per mood ────────────────────────────────────────────────
  // Animations kept subtle so eyes/tail/body never visually detach
  // during a frame. Previous values had high amplitude that caused
  // the head + tail to drift away from the body silhouette mid-tween.
  const headBob =
    mood === "talking"
      ? { y: [0, -1, 0], rotate: [-1, 1, -1] }
      : mood === "celebrating"
        ? { y: [0, -3, 0], rotate: [-3, 3, -3] }
        : { y: [0, -0.6, 0], rotate: [0, 0, 0] };
  const headBobDuration = mood === "talking" ? 0.55 : mood === "celebrating" ? 0.8 : 2.4;

  const tailWag =
    mood === "celebrating"
      ? { rotate: [-15, 15, -15] }
      : { rotate: [-8, 8, -8] };
  const tailWagDuration = mood === "celebrating" ? 0.35 : 0.9;

  const bodyBounce =
    mood === "celebrating"
      ? { y: [0, -4, 0] }
      : { y: [0, -0.4, 0] };
  const bodyBounceDuration = mood === "celebrating" ? 0.8 : 3.0;

  const pointingPaw =
    mood === "pointing"
      ? { rotate: [-40, -55, -40], x: [0, 1, 0] }
      : { rotate: [0, 0, 0], x: [0, 0, 0] };

  // Eye blink — much subtler so eyes never appear to vanish frame by
  // frame. Was scaleY 0.1 (eyes close almost entirely); now 0.6
  // (a softer wink that reads as friendly rather than missing).
  const blink =
    mood === "celebrating"
      ? { scaleY: [1, 1, 1] } // eyes wide open during cheer
      : { scaleY: [1, 1, 0.6, 1] };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: flip ? "scaleX(-1)" : undefined,
        // `visible` lets the tail wag + ears flop a few px outside the
        // viewBox without being clipped, which was making them appear to
        // "vanish" mid-animation.
        overflow: "visible",
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))",
      }}
      animate={bodyBounce}
      transition={{ duration: bodyBounceDuration, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* ── Soft ground shadow ─────────────────────────────────────────── */}
      <ellipse cx="50" cy="92" rx="22" ry="3.5" fill="rgba(0,0,0,0.25)" />

      {/* ── Tail (animates separately) — base path now starts well
          inside the body (x=58..68 instead of x=62..68) so even at the
          tail's swing extremes the base stays anchored to the body
          silhouette instead of detaching. ─────────────────────────── */}
      <motion.g
        style={{ originX: "68px", originY: "64px", transformBox: "fill-box" } as React.CSSProperties}
        animate={tailWag}
        transition={{ duration: tailWagDuration, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M 58 66 Q 82 52 88 34 Q 92 26 86 24 Q 80 26 76 36 Q 70 52 56 64 Z"
          fill="#c79555"
          stroke="#7a5128"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Lighter highlight to add roundness */}
        <path
          d="M 70 58 Q 80 46 84 34"
          stroke="#e8b574"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
      </motion.g>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <ellipse cx="50" cy="68" rx="22" ry="18" fill="#e8b574" stroke="#7a5128" strokeWidth="2" />
      <ellipse cx="50" cy="74" rx="14" ry="10" fill="#f6d2a1" opacity="0.7" />

      {/* ── Back legs ─────────────────────────────────────────────────── */}
      <ellipse cx="36" cy="86" rx="6" ry="4" fill="#c79555" stroke="#7a5128" strokeWidth="1.5" />
      <ellipse cx="64" cy="86" rx="6" ry="4" fill="#c79555" stroke="#7a5128" strokeWidth="1.5" />
      <ellipse cx="36" cy="87.5" rx="3.5" ry="1.6" fill="#5b3315" />
      <ellipse cx="64" cy="87.5" rx="3.5" ry="1.6" fill="#5b3315" />

      {/* ── Front legs (the right one animates for pointing) ──────────── */}
      <motion.g
        style={{ originX: "42px", originY: "74px" }}
        animate={{ rotate: 0 }}
      >
        <rect x="40" y="74" width="6" height="14" rx="3" fill="#e8b574" stroke="#7a5128" strokeWidth="1.5" />
        <ellipse cx="43" cy="89" rx="4" ry="2" fill="#5b3315" />
      </motion.g>

      <motion.g
        style={{ originX: "58px", originY: "74px" }}
        animate={pointingPaw}
        transition={{
          duration: mood === "pointing" ? 0.9 : 0.01,
          repeat: mood === "pointing" ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <rect x="55" y="74" width="6" height="14" rx="3" fill="#e8b574" stroke="#7a5128" strokeWidth="1.5" />
        <ellipse cx="58" cy="89" rx="4" ry="2" fill="#5b3315" />
      </motion.g>

      {/* ── Head (with bob animation) ─────────────────────────────────── */}
      <motion.g
        style={{ originX: "50px", originY: "44px" }}
        animate={headBob}
        transition={{ duration: headBobDuration, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Left ear */}
        <path
          d="M 32 28 Q 28 38 32 50 Q 36 52 38 48 Q 38 38 36 28 Z"
          fill="#7a5128"
          stroke="#5b3315"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Right ear */}
        <path
          d="M 68 28 Q 72 38 68 50 Q 64 52 62 48 Q 62 38 64 28 Z"
          fill="#7a5128"
          stroke="#5b3315"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Head main shape */}
        <ellipse cx="50" cy="42" rx="20" ry="18" fill="#e8b574" stroke="#7a5128" strokeWidth="2" />
        {/* Snout */}
        <ellipse cx="50" cy="50" rx="11" ry="8" fill="#f6d2a1" stroke="#7a5128" strokeWidth="1.5" />

        {/* Eyes — bigger so they're clearly visible at any zoom.
            Each eye = white sclera + dark pupil + sparkle highlight. */}
        <motion.g
          style={{ originY: "40px" }}
          animate={blink}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.5 }}
        >
          {/* Left eye */}
          <ellipse cx="42" cy="40" rx="4.5" ry="5" fill="white" stroke="#1a1a1a" strokeWidth="0.6" />
          <ellipse cx="42.7" cy="41" rx="2.8" ry="3.4" fill="#1a1a1a" />
          <circle cx="43.6" cy="39.6" r="1.3" fill="white" />
          {/* Right eye */}
          <ellipse cx="58" cy="40" rx="4.5" ry="5" fill="white" stroke="#1a1a1a" strokeWidth="0.6" />
          <ellipse cx="58.7" cy="41" rx="2.8" ry="3.4" fill="#1a1a1a" />
          <circle cx="59.6" cy="39.6" r="1.3" fill="white" />
        </motion.g>

        {/* Nose */}
        <ellipse cx="50" cy="48" rx="2.8" ry="2" fill="#1a1a1a" />
        <ellipse cx="49.5" cy="47.4" rx="0.8" ry="0.6" fill="white" opacity="0.8" />

        {/* Mouth — opens/closes on talking */}
        <motion.path
          d="M 50 50 Q 47 53 44 52 M 50 50 Q 53 53 56 52"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          animate={
            mood === "talking"
              ? { d: ["M 50 50 Q 47 53 44 52 M 50 50 Q 53 53 56 52", "M 50 50 Q 47 56 44 54 M 50 50 Q 53 56 56 54"] }
              : undefined
          }
          transition={{ duration: 0.3, repeat: Infinity, repeatType: "reverse" }}
        />

        {/* Tongue (only on celebrating) */}
        {mood === "celebrating" && (
          <motion.path
            d="M 47 54 Q 50 60 53 54 Q 53 56 50 57 Q 47 56 47 54 Z"
            fill="#ff6b8a"
            stroke="#c4365e"
            strokeWidth="1"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ originY: "54px" }}
          />
        )}

        {/* Eyebrows for personality */}
        <path d="M 38 34 Q 42 32 46 34" stroke="#5b3315" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M 54 34 Q 58 32 62 34" stroke="#5b3315" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </motion.g>

      {/* ── Celebration sparkles (only when celebrating) ──────────────── */}
      {mood === "celebrating" && (
        <>
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0], rotate: [0, 90, 180] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.4 }}
          >
            <path d="M 18 24 L 20 28 L 24 30 L 20 32 L 18 36 L 16 32 L 12 30 L 16 28 Z" fill="#fbbf24" />
          </motion.g>
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], rotate: [180, 90, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.4, delay: 0.3 }}
          >
            <path d="M 82 24 L 84 28 L 88 30 L 84 32 L 82 36 L 80 32 L 76 30 L 80 28 Z" fill="#a78bfa" />
          </motion.g>
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.0, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.5, delay: 0.6 }}
          >
            <circle cx="86" cy="50" r="2.5" fill="#34d399" />
          </motion.g>
        </>
      )}
    </motion.svg>
  );
}
