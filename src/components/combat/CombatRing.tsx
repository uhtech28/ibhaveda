"use client";

/**
 * Depleting timer ring for combat questions.
 *
 * Renders an SVG arc that empties over `durationMs`. No digits are
 * shown at any point — the user reads remaining time by arc length
 * and colour, per PRD 3.7.1. The arc colour shifts purple → gold →
 * red at configured thresholds; in the final ~10% it pulses unless
 * the user has reduced-motion enabled.
 *
 * Time is computed from a server-issued `servedAt` anchor so a tab
 * being briefly hidden or losing focus does not silently reset the
 * clock. The timer runs from question display through to either
 * answer-submit or expiry; on expiry, `onExpire` fires exactly once.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { COMBAT_THEME, phaseFor, ringColor, type RingPhase } from "@/lib/combat/theme";

interface Props {
  /** Server-time anchor (ms) when the question was served. */
  servedAt: number;
  /** Total duration for this question in ms. */
  durationMs: number;
  /** Fired exactly once when the ring empties. */
  onExpire: () => void;
  /** Diameter of the ring in pixels. */
  size?: number;
  /** Ring stroke thickness in pixels. */
  strokeWidth?: number;
}

export function CombatRing({
  servedAt,
  durationMs,
  onExpire,
  size = 128,
  strokeWidth = 10,
}: Props) {
  // Client-side anchor so the timer always reads fresh when a new
  // question mounts, regardless of server clock drift or the lag
  // between question persistence and React render. We reset the
  // anchor whenever `servedAt` (the question identity proxy) changes.
  const anchorRef = useRef<number>(Date.now());
  const lastServedAtRef = useRef<number>(servedAt);
  if (lastServedAtRef.current !== servedAt) {
    anchorRef.current = Date.now();
    lastServedAtRef.current = servedAt;
  }

  const [remainingMs, setRemainingMs] = useState(() => durationMs);
  const expiredRef = useRef(false);

  // RAF loop driven by the wall clock so tab-hide / blur do not
  // distort the timer.
  useEffect(() => {
    expiredRef.current = false;
    let frame = 0;
    const tick = () => {
      const remain = Math.max(0, anchorRef.current + durationMs - Date.now());
      setRemainingMs(remain);
      if (remain <= 0) {
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpire();
        }
        return; // stop scheduling
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [servedAt, durationMs, onExpire]);

  const fraction = durationMs > 0 ? remainingMs / durationMs : 0;
  const phase = phaseFor(fraction);
  const color = ringColor(phase);
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldPulse =
    fraction <= COMBAT_THEME.pulseAt && fraction > 0 && !prefersReducedMotion;

  // SVG geometry
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);

  return (
    <div
      role="timer"
      aria-label="Time remaining for this question"
      aria-live="off"
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={shouldPulse ? "combat-ring-pulse" : undefined}
      >
        <defs>
          <linearGradient id="combat-ring-glow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Depleting arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "center",
            transition: prefersReducedMotion
              ? "stroke 200ms linear"
              : "stroke 200ms linear, stroke-dashoffset 80ms linear",
            filter: `drop-shadow(0 0 6px ${color}66)`,
          }}
        />
      </svg>

      {/* Numeric countdown — centered inside the ring */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center font-mono leading-none"
        style={{
          fontFamily: "var(--font-pixel-display), monospace",
          color,
        }}
      >
        <span className="text-xl font-black tabular-nums">
          {Math.ceil(remainingMs / 1000)}
        </span>
        <span className="mt-0.5 text-[8px] uppercase tracking-widest opacity-70">
          sec
        </span>
      </div>

      <style jsx>{`
        .combat-ring-pulse {
          animation: combat-ring-pulse 900ms ease-in-out infinite;
        }
        @keyframes combat-ring-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          .combat-ring-pulse { animation: none; }
        }
      `}</style>
    </div>
  );
}

/** Lightweight hook — avoids importing the existing one to keep this drop-in. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Cast for TS users without `styled-jsx` types; safe at runtime in Next.js.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface StyleHTMLAttributes<T> {
    jsx?: boolean;
  }
}
