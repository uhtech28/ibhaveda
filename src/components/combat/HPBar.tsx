"use client";

/**
 * Pixel-art HP bar used for both the boss and the player in the combat
 * panel. Renders as a chunky segmented bar with hard borders to match
 * the Undertale-inspired aesthetic — no gradients, no rounded corners.
 *
 * The fill animates smoothly when `current` changes (e.g. after a
 * damage exchange), but the colour shift is stepwise: green > 60%,
 * yellow > 30%, red below. Empty bar shows a thin red "danger" line.
 */

import React, { useEffect, useState } from "react";

interface Props {
  label: string;
  current: number;
  initial: number;
  /** "boss" tints the colour scheme red-ish; "player" tints green-ish. */
  side: "boss" | "player";
  /** Smaller bar in tight spaces (e.g. inline with the question). */
  compact?: boolean;
}

export function HPBar({ label, current, initial, side, compact }: Props) {
  const animated = useNumberAnimation(current, 400);
  const fraction = initial > 0 ? Math.max(0, animated / initial) : 0;
  // Undertale palette: yellow for player, red-orange for boss.
  // No green/yellow/red stepping — a single solid colour for the whole life
  // of the bar matches the original game's HUD exactly.
  const fillColour = side === "player" ? "#FFFF00" : "#FF6B6B";

  return (
    <div className="flex items-center gap-2">
      {/* Player gets the iconic red SOUL heart; boss gets a skull glyph. */}
      {side === "player" ? (
        <PlayerSoulInline />
      ) : (
        <span
          className="text-[14px] leading-none text-white"
          style={{ imageRendering: "pixelated" }}
          aria-hidden
        >
          ☠
        </span>
      )}
      <span
        className="font-mono text-[11px] uppercase tracking-widest text-white"
        style={{ fontFamily: "var(--font-pixel-display), monospace" }}
      >
        {label}
      </span>
      <div
        className="relative h-[14px] flex-1 border border-white bg-black"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={initial}
        aria-valuenow={Math.max(0, Math.round(animated))}
        aria-label={`${label} HP`}
        style={{ imageRendering: "pixelated" }}
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${fraction * 100}%`,
            background: fillColour,
            transition: "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
      <span
        className="font-mono text-[12px] tabular-nums text-white"
        style={{ fontFamily: "var(--font-pixel-display), monospace" }}
      >
        {Math.max(0, Math.round(animated))} / {initial}
      </span>
    </div>
  );
}

function PlayerSoulInline() {
  return (
    <svg
      viewBox="0 0 16 16"
      width={14}
      height={14}
      style={{ imageRendering: "pixelated" }}
      aria-label="Player soul"
    >
      <path
        d="M2 5h2v1h1v1h1V6h2v1h1V6h1V5h2v3h-1v1h-1v1h-1v1h-1v1h-1v-1H6v-1H5v-1H4V9H3V8H2V5z"
        fill="#7a0d0d"
      />
      <path
        d="M3 5h1v1h1v1h1V6h2v1h1V6h1V5h1v3h-1v1h-1v1h-1v1h-1v-1H6v-1H5v-1H4V8H3V5z"
        fill="#FF0033"
      />
      <rect x="4" y="6" width="1" height="1" fill="#FFB3B3" />
    </svg>
  );
}

/** Animate from previous → next over `durationMs`, ease-out cubic. */
function useNumberAnimation(to: number, durationMs: number): number {
  const [value, setValue] = useState(to);

  useEffect(() => {
    const from = value;
    if (from === to) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (to - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // We intentionally exclude `value` from deps — it would re-trigger
    // mid-animation. The eslint-disable is justified and confined.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, durationMs]);

  return value;
}
