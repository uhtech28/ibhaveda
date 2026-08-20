"use client";

/**
 * /dev/corruption/maps
 *
 * Live composite: each template × stage's painted map PNG with its
 * corruption wash overlaid at all 5 phases. One direct URL to see
 * corruption rendered on the actual maps (not just abstract swatches
 * — that's what /dev/corruption already covers).
 *
 * Layout: one row per (templateId, stage). Each row shows the
 * biome name + boss + 5 phase previews (calm → critical). Each
 * preview is a scaled-down clone of what map/world/page.tsx would
 * render for that venture at that corruption level.
 *
 * Not linked from anywhere — share the URL directly.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  SUPER_BOSS_CORRUPTION_PROFILES,
  STAGE_BOSS_CORRUPTION_PROFILES,
  getStageCorruptionProfile,
  type CorruptionProfile,
  type CorruptionPattern,
} from "@/config/bossCorruptionProfiles";

// Map asset paths per (templateId, stage). Mirrors the resolvers in
// map/world/page.tsx + stages.config.ts.
const MAP_ASSETS: Record<string, Record<number, { mapUrl: string; biomeName: string }>> = {
  venture: {
    1: { mapUrl: "/assets/maps-v2/village-painted/village-map.png", biomeName: "The Village" },
    2: { mapUrl: "/assets/maps-v2/forest/forest-map.png",           biomeName: "Forest of Perfectionism" },
    3: { mapUrl: "/assets/maps-v2/arena/arena-map.png",             biomeName: "The Arena" },
    4: { mapUrl: "/assets/maps-v2/artisans/artisans-map.png",       biomeName: "The Artisan's Quarter" },
    5: { mapUrl: "/assets/maps-v2/mine/mine-map.png",               biomeName: "The Mine" },
    6: { mapUrl: "/assets/maps-v2/golden-harbor/harbor-map.png",    biomeName: "The Harbour" },
    7: { mapUrl: "/assets/maps-v2/crossroads/crossroads-map.png",   biomeName: "The Crossroads Town" },
    // Stage 8 (The Capital) art pending — omitted so the preview
    // row for the missing PNG doesn't render as a broken image.
  },
  academic: {
    1: { mapUrl: "/assets/maps-v2/academic/library-map.png",              biomeName: "Ancient Library" },
    2: { mapUrl: "/assets/maps-v2/academic/ruins-map.png",                biomeName: "The Ruins" },
    3: { mapUrl: "/assets/maps-v2/academic/cartographer-tower-map.png",   biomeName: "Cartographer's Tower" },
    4: { mapUrl: "/assets/maps-v2/academic/scriptorium-map.png",          biomeName: "The Scriptorium" },
    5: { mapUrl: "/assets/maps-v2/academic/council-chamber-map.png",      biomeName: "Council Chamber" },
    6: { mapUrl: "/assets/maps-v2/academic/grand-archive-map.png",        biomeName: "Grand Archive" },
  },
  lab: {
    1: { mapUrl: "/assets/maps-v2/lab/observatory-map.png",               biomeName: "Observatory" },
    2: { mapUrl: "/assets/maps-v2/lab/library-map.png",                   biomeName: "Ancient Library" },
    3: { mapUrl: "/assets/maps-v2/lab/cartographer-tower-map.png",        biomeName: "Cartographer's Tower" },
    4: { mapUrl: "/assets/maps-v2/lab/forge-map.png",                     biomeName: "The Forge" },
    5: { mapUrl: "/assets/maps-v2/lab/alchemists-laboratory-map.png",     biomeName: "Alchemist's Laboratory" },
    6: { mapUrl: "/assets/maps-v2/lab/crossroads-map.png",                biomeName: "Crossroads Town" },
    7: { mapUrl: "/assets/maps-v2/lab/grand-hall-map.png",                biomeName: "Grand Hall" },
  },
  creative: {
    1: { mapUrl: "/assets/maps-v2/forest/forest-map.png",              biomeName: "Sacred Grove" },
    2: { mapUrl: "/assets/maps-v2/village-painted/village-map.png",    biomeName: "Gallery of Echoes" },
    3: { mapUrl: "/assets/maps-v2/forest/forest-map.png",              biomeName: "The Wilderness" },
    4: { mapUrl: "/assets/maps-v2/village-painted/village-map.png",    biomeName: "Village Square" },
    5: { mapUrl: "/assets/maps-v2/artisans/artisans-map.png",          biomeName: "Artisan's Workshop" },
    6: { mapUrl: "/assets/maps-v2/golden-harbor/harbor-map.png",       biomeName: "Harbour" },
  },
} as const;

// Runtime opacity ladder — must match map/world/page.tsx.
const PHASES = [
  { key: "calm",         label: "Calm",         range: "0–24",   opacity: 0.07 },
  { key: "creeping",     label: "Creeping",     range: "25–49",  opacity: 0.14 },
  { key: "desaturated",  label: "Desaturated",  range: "50–74",  opacity: 0.24 },
  { key: "urgent",       label: "Urgent",       range: "75–89",  opacity: 0.34 },
  { key: "critical",     label: "Critical",     range: "90–100", opacity: 0.44 },
] as const;

const TEMPLATE_ORDER: Array<{ id: "venture" | "academic" | "lab" | "creative"; label: string; accent: string }> = [
  { id: "venture",  label: "Venture",  accent: "text-amber-300" },
  { id: "academic", label: "Academic", accent: "text-sky-300"   },
  { id: "lab",      label: "Lab",      accent: "text-emerald-300" },
  { id: "creative", label: "Creative", accent: "text-pink-300"  },
];

/**
 * Build a 96×96 canvas tile of the corruption pattern in memory
 * once, return a data-URL. Cached per (pattern, color) so the same
 * tile is reused across every phase preview instead of re-painting.
 * Mirrors the technique CorruptionViewportWash uses internally so
 * what you see here is pixel-identical to production.
 */
const TILE_CACHE = new Map<string, string>();
function corruptionTileDataUrl(pattern: CorruptionPattern, color: string): string {
  const key = `${pattern}:${color}`;
  const cached = TILE_CACHE.get(key);
  if (cached) return cached;
  if (typeof document === "undefined") return "";
  const SIZE = 96;
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.imageSmoothingEnabled = false;
  drawPattern(ctx, pattern, color, SIZE);
  const url = c.toDataURL("image/png");
  TILE_CACHE.set(key, url);
  return url;
}

/**
 * Draw a corruption pattern onto a `size × size` canvas context.
 * Mini-port of the pattern drawers in CorruptionOverlayCanvas so we
 * can generate tileable PNGs without pulling that component's
 * rendering-side quirks (it draws a background fill under the
 * pattern, which we DON'T want here — we want transparent tiles).
 */
function drawPattern(
  ctx: CanvasRenderingContext2D,
  pattern: CorruptionPattern,
  color: string,
  N: number,
) {
  ctx.clearRect(0, 0, N, N);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  switch (pattern) {
    case "crack": {
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const x = 10 + i * 30 + Math.random() * 6;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        for (let y = 0; y < N; y += 8) {
          ctx.lineTo(x + (Math.random() - 0.5) * 8, y);
        }
        ctx.stroke();
      }
      break;
    }
    case "grid": {
      ctx.lineWidth = 1;
      for (let i = 0; i <= N; i += 12) {
        ctx.beginPath();
        ctx.moveTo(0, i); ctx.lineTo(N, i);
        ctx.moveTo(i, 0); ctx.lineTo(i, N);
        ctx.stroke();
      }
      break;
    }
    case "chain": {
      ctx.lineWidth = 2;
      for (let i = 0; i <= N; i += 24) {
        ctx.beginPath();
        ctx.moveTo(0, i); ctx.lineTo(N, i);
        ctx.moveTo(i, 0); ctx.lineTo(i, N);
        ctx.stroke();
      }
      break;
    }
    case "barlock": {
      ctx.lineWidth = 3;
      for (let y = 8; y < N; y += 14) {
        ctx.beginPath();
        ctx.moveTo(4, y); ctx.lineTo(N - 4, y);
        ctx.stroke();
      }
      break;
    }
    case "dither": {
      for (let i = 0; i < 120; i++) {
        const x = Math.random() * N, y = Math.random() * N;
        ctx.fillRect(x, y, 2, 2);
      }
      break;
    }
    case "vine": {
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const sx = Math.random() * N, sy = Math.random() * N;
        ctx.moveTo(sx, sy);
        for (let s = 0; s < 12; s++) {
          const nx = sx + Math.cos(s * 0.5) * s * 3;
          const ny = sy + Math.sin(s * 0.5) * s * 3;
          ctx.lineTo(nx, ny);
        }
        ctx.stroke();
      }
      break;
    }
    case "shard": {
      for (let i = 0; i < 8; i++) {
        const cx = Math.random() * N, cy = Math.random() * N, r = 6 + Math.random() * 10;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r, cy - r);
        ctx.lineTo(cx + r * 0.4, cy + r * 0.8);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "wave": {
      ctx.lineWidth = 2;
      for (let y = 8; y < N; y += 12) {
        ctx.beginPath();
        for (let x = 0; x < N; x += 4) {
          const yy = y + Math.sin(x / 6) * 3;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      break;
    }
    case "blob": {
      for (let i = 0; i < 9; i++) {
        const cx = Math.random() * N, cy = Math.random() * N;
        const r = 8 + Math.random() * 14;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "silhouette": {
      const cnt = 4;
      for (let i = 0; i < cnt; i++) {
        const cx = (N / (cnt + 1)) * (i + 1);
        const cy = N * 0.62;
        ctx.beginPath();
        ctx.arc(cx, cy - 22, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 12);
        ctx.lineTo(cx + 8, cy - 12);
        ctx.lineTo(cx + 12, cy + 20);
        ctx.lineTo(cx - 12, cy + 20);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "cloth": {
      for (let x = 4; x < N; x += 10) {
        ctx.fillRect(x, 0, 4, N);
      }
      break;
    }
    case "outline": {
      ctx.lineWidth = 1;
      for (let x = 4; x < N; x += 10) {
        ctx.strokeRect(x, 0, 4, N);
      }
      break;
    }
    case "zigzag": {
      ctx.lineWidth = 2;
      for (let y = 8; y < N; y += 12) {
        ctx.beginPath();
        for (let x = 0; x < N; x += 8) {
          const yy = y + (Math.floor(x / 8) % 2 === 0 ? -3 : 3);
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      break;
    }
    case "block": {
      for (let y = 0; y < N; y += 24) {
        for (let x = 0; x < N; x += 24) {
          ctx.fillRect(x, y, 20, 20);
        }
      }
      break;
    }
  }
}

/**
 * Renders one map preview at a specific corruption phase.
 *
 * Layers:
 *   1. Painted map PNG (object-cover, pixelated)
 *   2. FLAT COLOR WASH at the phase opacity — gives you the "everything
 *      is tinted" mood that the runtime wash provides.
 *   3. PATTERN TILE at 1.5x the wash opacity — the motif (blob / crack /
 *      grid / etc.) tiled at 48px so the pattern is legible at the
 *      preview scale.
 *
 * This composition matches what production paints (viewport wash =
 * color-tinted pattern tile at repeat) but the color-wash layer
 * makes the tint visible against busy pixel-art backgrounds even at
 * low phase opacities. Without it, 7% pattern-only alpha vanishes
 * against a colorful map.
 */
function MapPreview({
  mapUrl,
  profile,
  opacity,
  width,
  height,
}: {
  mapUrl: string;
  profile: CorruptionProfile;
  opacity: number;
  width: number;
  height: number;
}) {
  // Mount flag — server render is always `false`, client's first
  // render is also `false` (hydration matches), then useEffect flips
  // it to `true` in the SAME frame → pattern tile appears without
  // triggering a React hydration mismatch. Without this, SSR emitted
  // 2 layers (map + color wash) but client hydrated with 3 (adding
  // the tile div) — React flagged the child count difference as a
  // fatal mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tileUrl = useMemo(
    () =>
      mounted ? corruptionTileDataUrl(profile.pattern, profile.color) : "",
    [mounted, profile.pattern, profile.color],
  );

  return (
    <div
      className="relative overflow-hidden rounded border border-white/10"
      style={{ width, height }}
      aria-label={`${profile.label} at opacity ${opacity}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mapUrl}
        alt=""
        className="absolute inset-0 h-full w-full"
        style={{ objectFit: "cover", imageRendering: "pixelated" }}
        draggable={false}
      />
      {/* Flat color wash — makes the tint visible on any background.
          Alpha = phase opacity so the tint scales with severity. */}
      {opacity > 0 && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: profile.color, opacity: opacity * 0.9 }}
        />
      )}
      {/* Pattern tile — repeats at 48px so the motif reads at the
          260×140 preview scale. Alpha bumped above the wash so the
          shape is legible through the color layer. Rendered ONLY
          post-mount (mounted=true) to avoid SSR/client hydration
          mismatch — canvas isn't available on the server. Div is
          kept mounted with empty background so React child count
          matches during hydration.
          suppressHydrationWarning belts-and-braces in case any
          browser extension mutates the DOM between SSR + hydration. */}
      {opacity > 0 && (
        <div
          suppressHydrationWarning
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: tileUrl ? `url(${tileUrl})` : undefined,
            backgroundRepeat: "repeat",
            backgroundSize: "48px 48px",
            imageRendering: "pixelated",
            opacity: Math.min(1, opacity * 1.5),
          }}
        />
      )}
    </div>
  );
}

export default function DevCorruptionMapsPage() {
  const [bg, setBg] = useState<"dark" | "light">("dark");
  const bgColor = bg === "dark" ? "#111017" : "#f4f2ee";
  const textPrimary = bg === "dark" ? "text-white" : "text-black";
  const textMuted = bg === "dark" ? "text-white/60" : "text-black/60";
  const border = bg === "dark" ? "border-white/10" : "border-black/10";
  const cardBg = bg === "dark" ? "bg-black/40" : "bg-white/70";

  // Flatten every (templateId, stage) into a single ordered list.
  const rows = useMemo(() => {
    const out: Array<{
      templateId: "venture" | "academic" | "lab" | "creative";
      stage: number;
      mapUrl: string;
      biomeName: string;
      profile: CorruptionProfile;
    }> = [];
    for (const t of TEMPLATE_ORDER) {
      const stages = MAP_ASSETS[t.id] ?? {};
      const stageNums = Object.keys(stages)
        .map((n) => Number(n))
        .sort((a, b) => a - b);
      for (const stage of stageNums) {
        const asset = stages[stage];
        if (!asset) continue;
        const profile = getStageCorruptionProfile(t.id, stage);
        if (!profile) continue;
        out.push({
          templateId: t.id,
          stage,
          mapUrl: asset.mapUrl,
          biomeName: asset.biomeName,
          profile,
        });
      }
    }
    return out;
  }, []);

  const previewW = 260;
  const previewH = 140;

  return (
    <main
      className={`min-h-screen w-full ${textPrimary}`}
      style={{ backgroundColor: bgColor, fontFamily: "system-ui, sans-serif" }}
    >
      <header
        className={`sticky top-0 z-10 border-b ${border} backdrop-blur`}
        style={{ backgroundColor: `${bgColor}dd` }}
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-baseline justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Corruption on Maps
            </h1>
            <p className={`text-xs ${textMuted}`}>
              {rows.length} template/stage maps · each rendered at 5 phase
              opacities (calm → critical) exactly as they paint in production
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className={textMuted}>Background</span>
            <div className={`inline-flex overflow-hidden rounded-md border ${border}`}>
              <button
                type="button"
                onClick={() => setBg("dark")}
                className={`px-3 py-1 ${bg === "dark" ? "bg-white text-black" : ""}`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setBg("light")}
                className={`px-3 py-1 ${bg === "light" ? "bg-black text-white" : ""}`}
              >
                Light
              </button>
            </div>
            <Link
              href="/dev/corruption"
              className={`underline underline-offset-4 ${textMuted}`}
            >
              → profiles
            </Link>
          </div>
        </div>
        {/* Phase legend */}
        <div className={`mx-auto flex max-w-[1600px] items-center gap-6 border-t ${border} px-6 py-2 text-[11px] ${textMuted}`}>
          <span>Phase → opacity</span>
          {PHASES.map((p) => (
            <span key={p.key}>
              <span className={textPrimary}>{p.label}</span>{" "}
              <span className="opacity-60">
                ({p.range} · {p.opacity})
              </span>
            </span>
          ))}
        </div>
      </header>

      {/* One row per map */}
      <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-6">
        {TEMPLATE_ORDER.map((template) => {
          const templateRows = rows.filter((r) => r.templateId === template.id);
          if (templateRows.length === 0) return null;
          return (
            <section
              key={template.id}
              id={template.id}
              className="space-y-3"
            >
              <h2 className={`text-sm font-semibold tracking-widest ${template.accent}`}>
                {template.label.toUpperCase()} · {templateRows.length} stages
              </h2>
              <div className={`overflow-hidden rounded-lg border ${border} ${cardBg}`}>
                {templateRows.map((row) => (
                  <div
                    key={`${row.templateId}-${row.stage}`}
                    className={`flex flex-wrap items-center gap-4 border-b ${border} p-3 last:border-b-0`}
                  >
                    {/* Left column — biome + boss + pattern meta */}
                    <div className="w-[220px] shrink-0">
                      <p className={`font-mono text-[10px] ${textMuted}`}>
                        {row.templateId} · stage {row.stage}
                      </p>
                      <p className={`mt-0.5 text-sm font-semibold ${textPrimary}`}>
                        {row.biomeName}
                      </p>
                      <p className={`text-xs ${textMuted}`}>
                        {row.profile.label}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-block h-3 w-3 rounded border ${border}`}
                          style={{ backgroundColor: row.profile.color }}
                          aria-hidden
                        />
                        <span className={`font-mono text-[10px] ${textMuted}`}>
                          {row.profile.pattern} · {row.profile.color}
                        </span>
                      </div>
                    </div>

                    {/* Right column — 5 phase previews */}
                    <div className="flex flex-wrap gap-2">
                      {PHASES.map((phase) => (
                        <figure
                          key={phase.key}
                          className="flex flex-col items-center gap-1"
                        >
                          <MapPreview
                            mapUrl={row.mapUrl}
                            profile={row.profile}
                            opacity={phase.opacity}
                            width={previewW}
                            height={previewH}
                          />
                          <figcaption
                            className={`text-[9px] uppercase tracking-wider ${textMuted}`}
                          >
                            {phase.label}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className={`mx-auto max-w-[1600px] border-t ${border} px-6 py-6 text-[11px] ${textMuted}`}>
        <p>
          Sources: painted maps under <code>/public/assets/maps-v2/</code>,
          corruption profiles from <code>src/config/bossCorruptionProfiles.ts</code>,
          overlay renderer <code>src/components/corruption/CorruptionOverlayCanvas.tsx</code>.
          Village stage 1 in production replaces the viewport-wash with the
          Phaser fog cloud layer — this preview shows the wash-only fallback
          for that biome. Also relevant: {" "}
          <Link className="underline underline-offset-4" href="/dev/corruption?view=list">
            profile line-view
          </Link>{" "}
          for the swatches without map backdrops.
        </p>
      </footer>
    </main>
  );
}
