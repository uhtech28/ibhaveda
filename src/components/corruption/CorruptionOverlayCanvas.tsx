"use client";

/**
 * CorruptionOverlayCanvas — pixel-art overlay tile renderer.
 *
 * Consumes a `CorruptionProfile` (pattern + color, from
 * `src/config/bossCorruptionProfiles.ts`) and draws the corresponding
 * procedural tile onto a canvas. Mirrors the client's reference-HTML
 * canvas code 1:1 — so any swatch QA sees in-app matches the artist
 * reference sheet dated 2026-08-14.
 *
 * Usage patterns:
 *   1. As a small "tile" HUD element (48-96px) next to a checkpoint
 *      marker to signal which corruption family is active there.
 *   2. As a full-viewport wash (`fill`) over the whole map when the
 *      corruption engine reports critical phase — layered above the
 *      Phaser canvas but below the HUD.
 *
 * Opacity is caller-controlled — the engine's corruption level (0-100)
 * should scale it (level/100 gives you a proportional wash).
 */

import { useEffect, useRef } from "react";
import type {
  CorruptionPattern,
  CorruptionProfile,
} from "@/config/bossCorruptionProfiles";

interface Props {
  /** The profile to render. Determines pattern + tint. */
  profile: CorruptionProfile;
  /** Displayed CSS size in pixels — canvas will be square. Defaults 96. */
  size?: number;
  /** Overlay opacity 0-1. Caller scales with corruption level. Defaults 1. */
  opacity?: number;
  /** Background hex — the "unaffected land" behind the pattern.
   *  Defaults to the client's reference deep-navy. */
  bg?: string;
  /** aria-label override — defaults to `${profile.label} corruption`. */
  ariaLabel?: string;
  className?: string;
}

const DEFAULT_BG = "#111017";
/** Pixel-art logical resolution the client's spec used. Keep at 96
 *  so procedural randomness matches the reference visually. */
const LOGICAL_SIZE = 96;

// ─────────────────────────────────────────────────────────────────────
// Pattern drawers — 1:1 port of the client's reference HTML drawers.
// Every function takes (ctx, color, bg) and paints ONE full tile of
// LOGICAL_SIZE × LOGICAL_SIZE. Do not resize inside — the caller
// scales the canvas element via CSS width/height for display.
// ─────────────────────────────────────────────────────────────────────

function fillBG(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, LOGICAL_SIZE, LOGICAL_SIZE);
}

function drawCrack(ctx: CanvasRenderingContext2D, color: string, bg: string) {
  fillBG(ctx, bg);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    let x = 6 + Math.random() * (LOGICAL_SIZE - 12);
    let y = 0;
    ctx.beginPath();
    ctx.moveTo(x, y);
    while (y < LOGICAL_SIZE) {
      y += 10 + Math.random() * 10;
      x += (Math.random() - 0.5) * 22;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawGridSpaced(
  ctx: CanvasRenderingContext2D,
  color: string,
  bg: string,
  spacing: number,
) {
  fillBG(ctx, bg);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let x = 0; x <= LOGICAL_SIZE; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, LOGICAL_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= LOGICAL_SIZE; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(LOGICAL_SIZE, y);
    ctx.stroke();
  }
}

function drawBarLock(ctx: CanvasRenderingContext2D, color: string, bg: string) {
  fillBG(ctx, bg);
  ctx.fillStyle = color;
  for (let y = 8; y < LOGICAL_SIZE; y += 18) {
    ctx.fillRect(4, y, LOGICAL_SIZE - 8, 6);
  }
  // Lock icon at center
  ctx.fillRect(LOGICAL_SIZE / 2 - 10, LOGICAL_SIZE / 2 - 6, 20, 16);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(LOGICAL_SIZE / 2, LOGICAL_SIZE / 2 - 8, 8, Math.PI, 0);
  ctx.stroke();
}

function drawDither(ctx: CanvasRenderingContext2D, color: string, bg: string) {
  fillBG(ctx, bg);
  ctx.fillStyle = color;
  const cell = 6;
  for (let y = 0; y < LOGICAL_SIZE; y += cell) {
    for (let x = 0; x < LOGICAL_SIZE; x += cell) {
      if (Math.random() < 0.32) {
        ctx.fillRect(x, y, cell - 1, cell - 1);
      }
    }
  }
}

function drawVine(ctx: CanvasRenderingContext2D, color: string, bg: string) {
  fillBG(ctx, bg);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    let x = Math.random() * LOGICAL_SIZE;
    let y = Math.random() * LOGICAL_SIZE;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      x += (Math.random() - 0.5) * 24;
      y += (Math.random() - 0.5) * 24;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = color;
  for (let i = 0; i < 14; i++) {
    ctx.fillRect(
      Math.random() * LOGICAL_SIZE,
      Math.random() * LOGICAL_SIZE,
      4,
      4,
    );
  }
}

function drawShard(ctx: CanvasRenderingContext2D, color: string, bg: string) {
  fillBG(ctx, bg);
  ctx.fillStyle = color;
  for (let i = 0; i < 12; i++) {
    const cx = Math.random() * LOGICAL_SIZE;
    const cy = Math.random() * LOGICAL_SIZE;
    const r = 6 + Math.random() * 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r * 0.6);
    ctx.lineTo(cx - r, cy + r * 0.6);
    ctx.closePath();
    ctx.fill();
  }
}

function drawWave(ctx: CanvasRenderingContext2D, color: string, bg: string) {
  fillBG(ctx, bg);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (let y = 6; y < LOGICAL_SIZE; y += 14) {
    ctx.beginPath();
    for (let x = 0; x <= LOGICAL_SIZE; x += 4) {
      const yy = y + Math.sin((x / LOGICAL_SIZE) * Math.PI * 4) * 4;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
}

function drawBlob(ctx: CanvasRenderingContext2D, color: string, bg: string) {
  fillBG(ctx, bg);
  ctx.fillStyle = color;
  for (let i = 0; i < 9; i++) {
    const cx = Math.random() * LOGICAL_SIZE;
    const cy = Math.random() * LOGICAL_SIZE;
    const r = 8 + Math.random() * 14;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSilhouette(
  ctx: CanvasRenderingContext2D,
  color: string,
  bg: string,
) {
  fillBG(ctx, bg);
  ctx.fillStyle = color;
  const n = 4;
  for (let i = 0; i < n; i++) {
    const cx = (LOGICAL_SIZE / (n + 1)) * (i + 1) + (Math.random() - 0.5) * 8;
    const cy = LOGICAL_SIZE * 0.62;
    // Head
    ctx.beginPath();
    ctx.arc(cx, cy - 22, 7, 0, Math.PI * 2);
    ctx.fill();
    // Trapezoid body
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 24);
    ctx.lineTo(cx + 10, cy + 24);
    ctx.lineTo(cx + 6, cy - 14);
    ctx.lineTo(cx - 6, cy - 14);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCloth(
  ctx: CanvasRenderingContext2D,
  color: string,
  bg: string,
  outlineOnly: boolean,
) {
  fillBG(ctx, bg);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  const strips = 6;
  for (let i = 0; i < strips; i++) {
    const x = (LOGICAL_SIZE / strips) * i + 6;
    const w = LOGICAL_SIZE / strips - 10;
    const wobble = Math.sin(i * 1.7) * 4;
    if (outlineOnly) {
      ctx.strokeRect(x, 10 + wobble, w, LOGICAL_SIZE - 24);
    } else {
      ctx.globalAlpha = 0.75;
      ctx.fillRect(x, 10 + wobble, w, LOGICAL_SIZE - 24);
      ctx.globalAlpha = 1;
    }
  }
}

function drawZigzag(ctx: CanvasRenderingContext2D, color: string, bg: string) {
  fillBG(ctx, bg);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  for (let row = 0; row < 5; row++) {
    const y0 = 10 + row * 18;
    ctx.beginPath();
    let x = 0;
    ctx.moveTo(x, y0);
    let dir = 1;
    while (x < LOGICAL_SIZE) {
      x += 10 + Math.random() * 6;
      ctx.lineTo(x, y0 + dir * 8);
      dir *= -1;
    }
    ctx.stroke();
  }
}

function drawBlock(ctx: CanvasRenderingContext2D, color: string, bg: string) {
  fillBG(ctx, bg);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  const pad = 12;
  ctx.fillRect(pad, pad, LOGICAL_SIZE - pad * 2, LOGICAL_SIZE - pad * 2);
  ctx.globalAlpha = 1;
  // Subtle grid seams so it reads as "blocks" not one flat wash
  ctx.strokeStyle = bg;
  ctx.lineWidth = 2;
  for (let x = pad; x <= LOGICAL_SIZE - pad; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, pad);
    ctx.lineTo(x, LOGICAL_SIZE - pad);
    ctx.stroke();
  }
  for (let y = pad; y <= LOGICAL_SIZE - pad; y += 14) {
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(LOGICAL_SIZE - pad, y);
    ctx.stroke();
  }
}

/** LOGICAL_SIZE is the internal resolution every drawer targets — kept
 *  identical to the client's reference HTML so the procedural randomness
 *  matches visually. Exported so callers that build a full tile via
 *  {@link paintPattern} on their own offscreen canvas (e.g. the Phaser
 *  corruption-map-tint helper) know how big to make the canvas. */
export const CORRUPTION_TILE_LOGICAL_SIZE = LOGICAL_SIZE;

/** Framework-agnostic pattern painter — paints ONE full
 *  LOGICAL_SIZE × LOGICAL_SIZE tile of the given `pattern` in the
 *  given color over `bg`. Safe to call from React (see
 *  {@link CorruptionOverlayCanvas}) OR from any other canvas context
 *  (see Phaser corruption-map-tint helper for the map-scene port). */
export function paintPattern(
  ctx: CanvasRenderingContext2D,
  pattern: CorruptionPattern,
  color: string,
  bg: string,
) {
  switch (pattern) {
    case "crack":      return drawCrack(ctx, color, bg);
    case "grid":       return drawGridSpaced(ctx, color, bg, 14);
    case "chain":      return drawGridSpaced(ctx, color, bg, 20);
    case "barlock":    return drawBarLock(ctx, color, bg);
    case "dither":     return drawDither(ctx, color, bg);
    case "vine":       return drawVine(ctx, color, bg);
    case "shard":      return drawShard(ctx, color, bg);
    case "wave":       return drawWave(ctx, color, bg);
    case "blob":       return drawBlob(ctx, color, bg);
    case "silhouette": return drawSilhouette(ctx, color, bg);
    case "cloth":      return drawCloth(ctx, color, bg, false);
    case "outline":    return drawCloth(ctx, color, bg, true);
    case "zigzag":     return drawZigzag(ctx, color, bg);
    case "block":      return drawBlock(ctx, color, bg);
    default: {
      // Exhaustive: TS complains if a new pattern isn't handled above.
      const _exhaustive: never = pattern;
      void _exhaustive;
      fillBG(ctx, bg);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export function CorruptionOverlayCanvas({
  profile,
  size = 96,
  opacity = 1,
  bg = DEFAULT_BG,
  ariaLabel,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // The internal drawing resolution stays at LOGICAL_SIZE so the
    // random-heavy patterns visually match the client's reference
    // regardless of the caller's display size. CSS scales the canvas
    // element up/down (image-rendering: pixelated keeps the pixel-art
    // crispness that Phaser + our persona sprites share).
    canvas.width = LOGICAL_SIZE;
    canvas.height = LOGICAL_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    paintPattern(ctx, profile.pattern, profile.color, bg);
  }, [profile.pattern, profile.color, bg]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel ?? `${profile.label} corruption`}
      className={className}
      style={{
        width: size,
        height: size,
        opacity,
        imageRendering: "pixelated",
        borderRadius: 2,
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * Full-viewport wash variant — pins to the viewport and stretches the
 * tile across it. Use for the "critical corruption reached" state
 * where the whole map goes tinted. Non-interactive.
 */
/** A cleared-CP zone that punches a radial hole in the corruption
 *  wash. Coordinates are viewport percentages 0-100 (independent of
 *  Phaser camera transforms — the caller is responsible for
 *  converting map-space CP coords to viewport % via the game
 *  container's bounding rect). Product ask 2026-08-16: "when we
 *  complete 1 checkpoint then till checkpoint 1 area corruption
 *  disappears" — feed each cleared CP as one zone and it'll fade
 *  the wash to transparent within its radius. */
export interface CorruptionClearedZone {
  /** 0-100 — horizontal viewport %. */
  xPercent: number;
  /** 0-100 — vertical viewport %. */
  yPercent: number;
  /** 0-100 — halo radius as a % of the SHORTER viewport dimension
   *  so the halo shape stays a circle on all aspect ratios. */
  radiusPercent: number;
}

export function CorruptionViewportWash({
  profile,
  opacity = 0.5,
  bg = "transparent",
  zIndex = 12,
  clearedZones = [],
}: {
  profile: CorruptionProfile;
  opacity?: number;
  bg?: string;
  zIndex?: number;
  /** Zero or more radial halos to punch into the wash — each cleared
   *  CP contributes one. Left empty for the ambient super-boss layer
   *  (which paints the whole viewport uniformly). */
  clearedZones?: readonly CorruptionClearedZone[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = LOGICAL_SIZE;
    canvas.height = LOGICAL_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    // For the viewport wash we want the pattern on a transparent bg
    // so the map underneath shows through — draw a temp tile then use
    // the canvas as a repeating pattern via CSS.
    paintPattern(ctx, profile.pattern, profile.color, bg);
  }, [profile.pattern, profile.color, bg]);

  // Build the CSS mask-image string. When no zones are cleared, mask
  // is a single opaque layer (the wash paints fully). Each cleared
  // zone contributes a radial-gradient that fades from black (fully
  // hidden) at the center to transparent (fully visible) at the edge.
  // We stack them with source-out semantics via mask-composite so
  // multiple cleared CPs punch overlapping holes cleanly.
  const maskImage =
    clearedZones.length > 0
      ? [
          // Base fully-opaque layer.
          "linear-gradient(#000, #000)",
          // One black→transparent radial per cleared CP.
          ...clearedZones.map(
            (z) =>
              `radial-gradient(circle at ${z.xPercent}% ${z.yPercent}%, transparent 0%, transparent ${z.radiusPercent * 0.55}%, rgba(0,0,0,0.4) ${z.radiusPercent * 0.8}%, rgba(0,0,0,1) ${z.radiusPercent}%)`,
          ),
        ].join(", ")
      : undefined;
  // mask-composite: on the base layer keep everything (source-over),
  // then each radial layer subtracts its transparent region from what
  // was left. `subtract` isn't universally supported so we use
  // `source-in` on the radial layers which effectively intersects
  // the mask with the radial's alpha — the transparent center wins.
  const maskComposite =
    clearedZones.length > 0
      ? ["add", ...clearedZones.map(() => "subtract")].join(", ")
      : undefined;

  const tileUrl = canvasRef.current ? canvasRef.current.toDataURL() : undefined;

  return (
    <>
      {/* LAYER 1 — Flat color wash tinted with the boss's spec color.
          Density retuned 2026-08-21 pass 3 ("CORRUPTION IS VERY LESS
          VISIBLE"). With mix-blend-mode: multiply the wash TINTS
          instead of covering — multiply of a bright pixel × color ≈
          brightly-tinted pixel, so sprites stay legible while dark
          map areas get properly shaded. Multiply is inherently much
          subtler than normal blend, so multipliers must run hotter
          to reach the visual weight Village fog achieves:
            calm     0.07 × 1.2 = 0.084 color + 0.07 × 3.2 = 0.224 pattern
            critical 0.44 × 1.2 = 0.53  color + 0.44 × 3.2 = 1.00  pattern
          Sprites remain clear because multiply preserves bright
          luminance; only the map's mid-tones darken. */}
      {/* LAYER 0 removed 2026-08-23 pass 7 — backdrop-filter dimmed
          the entire Phaser canvas including persona/boss sprites,
          which the user explicitly rejected ("corruption should not
          effect the color of persona and boss"). Since sprites and
          map share one canvas we can't selectively filter — reverted
          to blend-mode-only approach. Multiply blend on the color
          layer + darken blend on the pattern layer preserve sprite
          luminance because bright sprite pixels dominate both blends. */}
      {/* LAYER 1 — Color tint. 2026-08-23 pass 7: blend changed from
          `multiply` (which darkens sprites too) to `color` — applies
          the HUE + SATURATION of the corruption color while preserving
          the LUMINANCE of whatever's underneath. Bright persona/boss
          sprites keep their brightness (only shift hue slightly);
          the map's colors shift to the corruption palette. User
          feedback: "corruption should not effect the color of persona
          and boss" — `color` blend is the closest single-canvas
          solution short of dynamic sprite-position masking. */}
      <div
        role="presentation"
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex,
          opacity: Math.min(1, opacity * 1.8),
          backgroundColor: profile.color,
          mixBlendMode: "color",
          maskImage,
          WebkitMaskImage: maskImage,
          maskComposite,
          WebkitMaskComposite: maskComposite,
        }}
      />
      {/* LAYER 2 — Pattern tile. Blend changed to `darken` so pattern
          strokes read as dark ink on bright biome maps (Sacred Grove,
          Ancient Library) where `multiply` was invisible. Darken =
          min(pattern, map) per channel → stroke color wins wherever
          it's darker than the map (~always for dark corruption
          strokes), and the map wins on transparent tile pixels. Also
          preserves persona/boss sprite luminance because bright sprite
          pixels dominate the transparent tile regions. */}
      <div
        role="presentation"
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: zIndex + 0.001,
          opacity: Math.min(1, opacity * 3.2),
          backgroundImage: tileUrl ? `url(${tileUrl})` : undefined,
          backgroundRepeat: "repeat",
          backgroundSize: `56px 56px`,
          imageRendering: "pixelated",
          mixBlendMode: "darken",
          maskImage,
          WebkitMaskImage: maskImage,
          maskComposite,
          WebkitMaskComposite: maskComposite,
        }}
      >
        {/* Hidden generator canvas — off-screen; only its toDataURL
            is used as the pattern above. */}
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", left: -9999, top: -9999 }}
        />
      </div>
    </>
  );
}
