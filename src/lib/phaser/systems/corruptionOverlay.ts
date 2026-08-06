/**
 * @file corruptionOverlay.ts
 * @description Per-checkpoint procedural corruption overlay for the
 *  "Fog of Vagueness / Doubt and Loss of Direction" theme.
 *
 *  Key contract (unchanged from the original workbook spec — only the
 *  visual implementation was rewritten):
 *    - Each CP owns the path SEGMENT that runs from itself to the
 *      NEXT CP. Its task count controls that segment's corruption.
 *    - 0/3 or 1/3 done → full corruption. 2/3 → wispy residue.
 *      3/3 → cleared + shatter burst.
 *    - State is always LIVE — completing a stale task later fades
 *      that segment immediately, wherever the player is.
 *
 *  Visual system (per the new "Fog of Vagueness" spec):
 *    - **Procedural** branching cracks per zone, never tiled,
 *      seeded so each CP produces a UNIQUE crack pattern.
 *    - **Layered** stroke colours: outer edge (#1A1027), dark band
 *      (#3D1B55), inner glow (#6A2FB6), bright core (#B574FF),
 *      spark pixels (#D8A9FF).
 *    - **Ground infection** radial gradient underneath each crack
 *      network so grass darkens smoothly without hard edges.
 *    - **Localized fog patch** at each CP mid-segment.
 *    - **Local spore emitter** per zone (ADD-blend glowing pixels).
 *    - **Pulse tween** on each zone container (90% → 100% → 90%
 *      every 3 s), stopped when the zone hits retreat / cleared.
 *
 *  Global atmosphere layers (mapWidth/mapHeight/atmospherePalette
 *  required — see buildAtmosphere): full-map subtle dim wash, 8
 *  pulsing violet fog blobs, map-wide dust + spore emitters. Fades
 *  with TOTAL task progress across every CP.
 *
 *  Everything is overlay-only. The base pixel-art map is untouched;
 *  disabling the overlay should return the map to identical.
 */

import * as Phaser from "phaser";
import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";

/**
 * Ensure a 2×2 white pixel texture named "__corrPx" exists — used as
 * the source frame for the atmosphere particle emitters (dust +
 * spores). Recoloured per emitter via `tint`. Idempotent.
 */
function ensurePixelTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("__corrPx")) return;
  const g = scene.add.graphics({ x: 0, y: 0 });
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 2, 2);
  g.generateTexture("__corrPx", 2, 2);
  g.destroy();
}

/**
 * Legacy strip constants — no longer used by the current PROCEDURAL
 * corruption zones (they were part of the TileSprite-strip approach
 * that shipped before the "Fog of Vagueness / Doubt and Loss of
 * Direction" rewrite). Kept as `export`-ed reserved values so any
 * scene still importing them compiles until it's migrated.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const STRIP_WIDTH_PX = 160;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const STRIP_LENGTH_PAD_PX = 30;

/** Fade tween duration (spec: "roughly 1-1.5 seconds"). */
const FADE_DURATION_MS = 1200;

/**
 * Opacity levels per completion state — exact values from the spec
 * sheet's "Two completion states per checkpoint" section:
 *   0-1/3 tasks   → 100% overlay (full corruption on the segment)
 *   2/3 tasks     → ~10% opacity (thin visible residue) + weakened
 *                   monster at the segment's far edge
 *   3/3 tasks     → 0% overlay + 4-frame shatter burst on the
 *                   monster sprite
 * The visible density of the "100%" state is controlled by the tile
 * texture's own alphas in corruptionPatterns.ts — not by dropping
 * the strip's alpha here — so the biome art stays readable through
 * the fog. Alpha 1.0 = "use the tile's own drawn density."
 */
const OPACITY_FULL = 1.0;
const OPACITY_RETREAT = 0.1;
const OPACITY_SLAIN = 0.0;

// Weakened-monster constants were used by the workbook-spec placeholder
// sprite that sat at each segment's far edge at 2/3 tasks. That
// placeholder is disabled in the current model (the real Fog of
// Vagueness boss retreats via VillageMapScene.retreatBossTo), so
// these values are no longer referenced.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WEAKENED_SCALE = 0.5;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WEAKENED_ALPHA = 0.5;

export interface OverlayCheckpoint {
  /** World-space center of the CP marker (Phaser scene coords). */
  x: number;
  /** World-space center of the CP marker. */
  y: number;
}

export interface CorruptionOverlayConfig {
  /** Ordered CP positions. Strip N runs from cps[N] to cps[N+1]. */
  checkpoints: OverlayCheckpoint[];
  /** Legacy pattern-texture key for the retired TileSprite approach.
   *  The procedural crack renderer doesn't use it, but scenes that
   *  still pass it (Forest, Arena, etc.) keep compiling. */
  patternTextureKey?: string;
  /** Optional tint (0xrrggbb) applied to strips + shatter burst.
   *  Undefined = no tint (pattern renders in its native colors). */
  tint?: number;
  /** Optional texture key for the "weakened monster" sprite (any single
   *  frame image). If omitted, no monster is spawned at 2/3. */
  weakenedSpriteKey?: string;
  /** Frame size of the weakened sprite sheet (frameWidth × frameHeight)
   *  so we can slice frame 0 out of a horizontal spritesheet. Optional. */
  weakenedFrame?: { width: number; height: number };
  /** Depth layer — must be below the character but above the base map.
   *  Defaults to 40 (character usually renders at 100+). */
  depth?: number;
  /** Map bounds for the ATMOSPHERE layer (subtle dim + fog patches
   *  + drifting particles that theme the whole world without hiding
   *  the biome art). Omit to disable atmosphere and keep only the
   *  per-segment strips. */
  mapWidth?: number;
  mapHeight?: number;
  /**
   * Atmosphere palette — a set of purple/indigo colours used by the
   * global dim wash, fog patches, and particle emitters. Falls back
   * to a neutral cool palette if omitted. Per the "Doubt and Loss
   * of Direction" spec: #3B1A52, #51206E, #6E2CA4, #8D42D7, #B37CFF.
   */
  atmospherePalette?: {
    /** Base tint for the global dim wash. */
    dim: number;
    /** Soft fog patches (a few large blobs scattered around). */
    fog: number;
    /** Drifting dust particles. */
    dust: number;
    /** Glowing spore particles. */
    glow: number;
  };
}

interface Segment {
  /** Container holding every drawable in this CP's corruption zone —
   *  procedural crack Graphics, ground infection glow, localized fog
   *  patch, spore emitter. Alpha on the container drives the 100% →
   *  10% → 0% state transitions from the workbook spec, while the
   *  individual Graphics inside carry the hand-generated details
   *  (unique branching cracks, glow points, moss patches). */
  container: Phaser.GameObjects.Container;
  /** Pulse tween for the "everything slowly pulses 90% → 100% → 90%
   *  every 3 seconds" rule from the new spec. Killed on destroy. */
  pulseTween: Phaser.Tweens.Tween | null;
  /** Localized spore emitter — one per zone so intensity scales with
   *  the zone's own state, not the map-wide atmosphere. */
  sporeEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null;
  monster: Phaser.GameObjects.Image | null;
  midX: number;
  midY: number;
  angle: number;
  length: number;
  currentTasksDone: number;
}

/**
 * Purple corruption palette — from the new "Fog of Vagueness"
 * spec's colour block. Referenced by every procedural crack /
 * ground-infection routine so recolouring the palette in one place
 * cascades through the whole overlay.
 */
const CRACK_PALETTE = {
  outer: 0x1a1027,   // outer edge (deepest violet, drawn under everything)
  dark: 0x3d1b55,    // dark purple band around cracks
  glow: 0x6a2fb6,    // inner-crack glow
  core: 0xb574ff,    // bright core stroke
  spark: 0xd8a9ff,   // tiny glowing pixels along the crack
} as const;

/**
 * Simple xorshift-32 seeded RNG — used so each CP's crack network is
 * unique but stable across page refreshes. Same seed, same crack
 * pattern; different seed, different pattern. Guarantees the
 * "20-30 unique cracks, no copy-paste" rule from the spec.
 */
function seededRandom(seed: number): () => number {
  let state = seed | 0 || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 0xffffffff);
  };
}

export class CorruptionOverlay {
  private scene: Phaser.Scene;
  private cfg: Required<Omit<CorruptionOverlayConfig, "patternTextureKey" | "weakenedSpriteKey" | "weakenedFrame" | "mapWidth" | "mapHeight" | "atmospherePalette">> & {
    patternTextureKey?: string;
    weakenedSpriteKey?: string;
    weakenedFrame?: { width: number; height: number };
    mapWidth?: number;
    mapHeight?: number;
    atmospherePalette?: NonNullable<CorruptionOverlayConfig["atmospherePalette"]>;
  };
  private segments: Segment[] = [];
  // ── Atmosphere layers ─────────────────────────────────────────
  /** Full-map subtle dim wash — the "10% brightness reduction". */
  private atmosphereDim: Phaser.GameObjects.Rectangle | null = null;
  /** A handful of soft purple fog blobs scattered around the map. */
  private atmosphereFog: Phaser.GameObjects.Arc[] = [];
  /** Slow-drift dust particle emitter. */
  private atmosphereDust: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  /** Faster glowing spore emitter. */
  private atmosphereSpores: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private atmosphereMaxDimAlpha = 0.1;
  private atmosphereMaxFogAlpha = 0.28;
  private atmosphereCurrentPct = 0;

  constructor(scene: Phaser.Scene, config: CorruptionOverlayConfig) {
    this.scene = scene;
    this.cfg = {
      checkpoints: config.checkpoints,
      patternTextureKey: config.patternTextureKey,
      tint: config.tint ?? 0xffffff,
      depth: config.depth ?? 40,
      weakenedSpriteKey: config.weakenedSpriteKey,
      weakenedFrame: config.weakenedFrame,
      mapWidth: config.mapWidth,
      mapHeight: config.mapHeight,
      atmospherePalette: config.atmospherePalette,
    };

    this.buildAtmosphere();
    this.buildSegments();
  }

  /**
   * Global atmosphere layers — subtle purple dim + fog patches + a
   * drifting particle field that reads as "Doubt and Loss of
   * Direction" without touching any pixel of the base map. Skipped
   * entirely if `mapWidth`/`mapHeight`/palette aren't provided so
   * scenes that only want the per-segment strips (the original
   * corruption spec) keep working unchanged.
   */
  private buildAtmosphere(): void {
    const { mapWidth, mapHeight, atmospherePalette } = this.cfg;
    if (!mapWidth || !mapHeight || !atmospherePalette) return;
    const palette = atmospherePalette;
    const depth = this.cfg.depth - 2; // below the segment strips
    const scene = this.scene;

    // ── 1. Dim wash ─────────────────────────────────────────────
    // Retro Stardew-esque tint — a full-map rectangle at 10% alpha
    // that gently drops brightness / pushes hue purple, without
    // going dark enough to hide anything. Uses a plain Rectangle
    // (fill-only, no border) so it's cheap to render.
    const dim = scene.add.rectangle(
      mapWidth / 2,
      mapHeight / 2,
      mapWidth,
      mapHeight,
      palette.dim,
      this.atmosphereMaxDimAlpha,
    );
    dim.setOrigin(0.5, 0.5);
    dim.setDepth(depth);
    this.atmosphereDim = dim;

    // ── 2. Soft fog patches ─────────────────────────────────────
    // 8 large soft-edged purple circles at scattered positions.
    // These read as "corruption fog patches" without covering
    // roads (they're semi-transparent, the road art still shows
    // through). Positions are deterministic (seeded on map size)
    // so the corruption looks placed, not random.
    const fogSpots: Array<{ x: number; y: number; r: number }> = [
      { x: mapWidth * 0.12, y: mapHeight * 0.18, r: 180 },
      { x: mapWidth * 0.32, y: mapHeight * 0.42, r: 220 },
      { x: mapWidth * 0.58, y: mapHeight * 0.22, r: 200 },
      { x: mapWidth * 0.78, y: mapHeight * 0.4, r: 240 },
      { x: mapWidth * 0.18, y: mapHeight * 0.72, r: 210 },
      { x: mapWidth * 0.45, y: mapHeight * 0.82, r: 190 },
      { x: mapWidth * 0.72, y: mapHeight * 0.7, r: 220 },
      { x: mapWidth * 0.9, y: mapHeight * 0.88, r: 200 },
    ];
    for (const s of fogSpots) {
      const spot = scene.add.circle(s.x, s.y, s.r, palette.fog, this.atmosphereMaxFogAlpha);
      spot.setDepth(depth + 1);
      // Slow pulsing so the fog feels ALIVE, not painted on.
      scene.tweens.add({
        targets: spot,
        alpha: { from: this.atmosphereMaxFogAlpha * 0.6, to: this.atmosphereMaxFogAlpha },
        duration: 3200 + Math.random() * 1600,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
      this.atmosphereFog.push(spot);
    }

    // ── 3. Drifting dust + glowing spore particles ──────────────
    // Reuse the shared 2×2 pixel texture generated in this file if
    // it exists (see ensurePixelTexture below); otherwise generate
    // a tiny white square texture on the fly. Particles are
    // recoloured per emitter via `tint`.
    ensurePixelTexture(scene);

    // Dust: many, slow, low alpha — ambient particulate that reads
    // as motes drifting through the fog. Uses Phaser's keyframed
    // alpha `values: [...]` so particles fade IN from 0, hold at a
    // modest alpha, then fade OUT — no per-particle tween needed.
    const dust = scene.add.particles(0, 0, "__corrPx", {
      x: { min: 0, max: mapWidth },
      y: { min: 0, max: mapHeight },
      lifespan: { min: 8000, max: 14000 },
      speedX: { min: -8, max: 8 },
      speedY: { min: -4, max: -14 }, // drift upward
      scale: { min: 1, max: 2 },
      alpha: {
        values: [0, 0.5, 0.5, 0],
        interpolation: "linear",
      } as unknown as number,
      quantity: 1,
      frequency: 500,
      tint: palette.dust,
      blendMode: Phaser.BlendModes.SCREEN,
    });
    dust.setDepth(depth + 2);
    this.atmosphereDust = dust;

    // Spores: fewer, glowing, additive blend — brighter than dust,
    // reads as the "corrupted energy" motes described in the spec.
    const spores = scene.add.particles(0, 0, "__corrPx", {
      x: { min: 0, max: mapWidth },
      y: { min: 0, max: mapHeight },
      lifespan: { min: 6000, max: 11000 },
      speedX: { min: -14, max: 14 },
      speedY: { min: -22, max: -8 },
      scale: { min: 2, max: 3 },
      alpha: {
        values: [0, 0.8, 0.8, 0],
        interpolation: "linear",
      } as unknown as number,
      quantity: 1,
      frequency: 1200,
      tint: palette.glow,
      blendMode: Phaser.BlendModes.ADD,
    });
    spores.setDepth(depth + 3);
    this.atmosphereSpores = spores;
  }

  /** Build one PROCEDURAL corruption zone per CP-to-CP segment.
   *  Each zone is a container of hand-generated Graphics — branching
   *  crack tree + ground infection blob + local fog patch + glowing
   *  pixels + spore emitter — so no two zones look identical (the
   *  seed is the CP index times a large prime). Per new spec:
   *    - "20-30 different crack sprites" → one branching tree per
   *      CP, procedurally generated with per-branch jitter so every
   *      branch is unique even within one zone.
   *    - "Never tiled, never repeating" → no TileSprite; the crack
   *      is drawn line-by-line into a Graphics.
   *    - "Grows like roots" → recursive branching, each parent
   *      spawning 1-3 children at random angle deltas.
   *    - "Blend smoothly, no hard edges" → ground infection is a
   *      soft radial gradient of concentric ellipses.
   *    - "Everything slowly pulses 90% → 100% → 90% every 3s" →
   *      yoyo alpha tween on the whole container. */
  private buildSegments(): void {
    const cps = this.cfg.checkpoints;
    for (let i = 0; i < cps.length - 1; i += 1) {
      const a = cps[i];
      const b = cps[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      if (length < 4) continue; // duplicate CP — skip
      const midX = a.x + dx * 0.5;
      const midY = a.y + dy * 0.5;
      const angle = Math.atan2(dy, dx);

      // Container — all drawables go inside so a single alpha tween
      // on the container fades the whole crack + moss + fog + glow
      // package uniformly.
      const container = this.scene.add.container(0, 0);
      container.setDepth(this.cfg.depth);

      // Seeded RNG for this zone — same CP index → same crack
      // pattern across refreshes, different CP → different pattern.
      // Large prime multiplier prevents adjacent CPs from producing
      // visually similar cracks.
      const rand = seededRandom((i + 1) * 2654435761);

      // ── 1. Ground infection blob ────────────────────────────────
      // Soft radial gradient of dark purple painted under the whole
      // segment. Reads as "corrupted grass" without any hard edge.
      // Six concentric ellipses at decreasing alpha approximate a
      // real gradient without needing a shader.
      const groundLen = length * 1.1;
      const groundW = 260;
      const groundGfx = this.scene.add.graphics();
      for (let ring = 0; ring < 6; ring += 1) {
        const t = ring / 5;
        const rx = groundLen * (0.55 - t * 0.06);
        const ry = groundW * (0.55 - t * 0.12);
        const alpha = 0.14 * (1 - t);
        groundGfx.fillStyle(CRACK_PALETTE.outer, alpha);
        groundGfx.fillEllipse(midX, midY, rx * 2, ry * 2);
      }
      groundGfx.setDepth(this.cfg.depth - 1);
      container.add(groundGfx);

      // ── 2. Procedural crack tree ────────────────────────────────
      // Recursive branching walker: starts at CP_a, walks toward
      // CP_b in short segments with per-step angle jitter, spawns
      // side branches at random intervals. Each segment is stroked
      // 4× (outer edge, dark, glow, bright core) for the layered
      // "Crack Colors" look from the spec.
      const crackGfx = this.scene.add.graphics();
      crackGfx.setDepth(this.cfg.depth + 1);
      this.drawBranchingCrack(crackGfx, a.x, a.y, b.x, b.y, rand);
      container.add(crackGfx);

      // ── 3. Glowing pixel highlights along the crack ─────────────
      // 8-14 single-pixel bright dots scattered along the segment.
      // These read as the "tiny glowing pixels #D8A9FF" from the
      // spec's palette. Each dot has a soft glow ring underneath.
      const glowGfx = this.scene.add.graphics();
      glowGfx.setDepth(this.cfg.depth + 2);
      const glowCount = 8 + Math.floor(rand() * 6);
      for (let k = 0; k < glowCount; k += 1) {
        const t = rand();
        const perpJitter = (rand() - 0.5) * 80;
        const px = a.x + dx * t + Math.cos(angle + Math.PI / 2) * perpJitter;
        const py = a.y + dy * t + Math.sin(angle + Math.PI / 2) * perpJitter;
        glowGfx.fillStyle(CRACK_PALETTE.glow, 0.4);
        glowGfx.fillCircle(px, py, 3);
        glowGfx.fillStyle(CRACK_PALETTE.spark, 0.95);
        glowGfx.fillCircle(px, py, 1);
      }
      container.add(glowGfx);

      // ── 4. Localized fog patch ──────────────────────────────────
      // A single soft violet blob at the segment midpoint. Small
      // enough to feel LOCAL (per spec "Small localized patches,
      // Not global"). Map-wide ambient fog is handled by the
      // atmosphere layer above.
      const fogCircle = this.scene.add.circle(
        midX,
        midY,
        Math.min(length * 0.3, 180),
        CRACK_PALETTE.glow,
        0.18,
      );
      fogCircle.setDepth(this.cfg.depth);
      container.add(fogCircle);

      // ── 5. Local spore emitter ──────────────────────────────────
      // Slow glowing spores drifting up from random points along
      // the segment. Frequency scales with zone intensity via
      // updateSegment (below).
      // Spore emitter — the bounding box around the CP-CP line
      // (inflated 20px on each side) is close enough to the actual
      // segment shape for visual purposes, and avoids the fragile
      // `onEmit` callback typing.
      ensurePixelTexture(this.scene);
      const bbX = Math.min(a.x, b.x) - 20;
      const bbY = Math.min(a.y, b.y) - 20;
      const bbW = Math.abs(dx) + 40;
      const bbH = Math.abs(dy) + 40;
      const sporeEmitter = this.scene.add.particles(0, 0, "__corrPx", {
        x: { min: bbX, max: bbX + bbW },
        y: { min: bbY, max: bbY + bbH },
        lifespan: { min: 3200, max: 5600 },
        speedX: { min: -6, max: 6 },
        speedY: { min: -16, max: -4 },
        scale: { min: 1, max: 2.4 },
        alpha: {
          values: [0, 0.75, 0.75, 0],
          interpolation: "linear",
        } as unknown as number,
        quantity: 1,
        frequency: 1600,
        tint: CRACK_PALETTE.spark,
        blendMode: Phaser.BlendModes.ADD,
      });
      sporeEmitter.setDepth(this.cfg.depth + 3);
      container.add(sporeEmitter);

      // ── 6. Pulse tween ──────────────────────────────────────────
      // Per spec "Everything slowly pulses 90% → 100% → 90% every
      // 3 seconds". Yoyo alpha on the whole container synchronises
      // every child drawable's breath without per-object tweens.
      const pulseTween = this.scene.tweens.add({
        targets: container,
        alpha: { from: 0.9, to: 1 },
        duration: 1500,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });

      // Weakened-monster placeholder disabled — the real Fog boss
      // sprite retreats via retreatBossTo in VillageMapScene. We
      // still push null so downstream slot math is safe.
      const monster: Phaser.GameObjects.Image | null = null;

      this.segments.push({
        container,
        pulseTween,
        sporeEmitter,
        monster,
        midX,
        midY,
        angle,
        length,
        currentTasksDone: 0,
      });
    }
  }

  /**
   * Recursive branching crack drawer. Walks from (sx,sy) toward
   * (ex,ey) in short jittery segments, spawning side branches with
   * random length + angle deltas. Each segment is stroked 4× (outer
   * edge, dark band, glow, bright core) for the layered look from
   * the "Crack Colors" section of the spec.
   */
  private drawBranchingCrack(
    g: Phaser.GameObjects.Graphics,
    sx: number,
    sy: number,
    ex: number,
    ey: number,
    rand: () => number,
    depth = 0,
  ): void {
    const total = Math.hypot(ex - sx, ey - sy);
    if (total < 8 || depth > 3) return;
    const steps = Math.max(6, Math.floor(total / 22));
    let cx = sx;
    let cy = sy;
    const baseAngle = Math.atan2(ey - sy, ex - sx);
    let currAngle = baseAngle + (rand() - 0.5) * 0.4;
    const points: Array<{ x: number; y: number }> = [{ x: sx, y: sy }];

    for (let s = 0; s < steps; s += 1) {
      const stepLen = (total / steps) * (0.7 + rand() * 0.6);
      currAngle = currAngle * 0.75 + baseAngle * 0.15 + (rand() - 0.5) * 0.55;
      cx += Math.cos(currAngle) * stepLen;
      cy += Math.sin(currAngle) * stepLen;
      points.push({ x: cx, y: cy });
      // Side branches — 1 in ~4 chance, capped at depth 3.
      if (depth < 2 && s > 2 && s < steps - 2 && rand() < 0.3) {
        const branchAngle =
          currAngle + (rand() < 0.5 ? -1 : 1) * (0.7 + rand() * 0.8);
        const branchLen = stepLen * (3 + rand() * 5);
        const bx = cx + Math.cos(branchAngle) * branchLen;
        const by = cy + Math.sin(branchAngle) * branchLen;
        this.drawBranchingCrack(g, cx, cy, bx, by, rand, depth + 1);
      }
    }

    const wOuter = Math.max(1, 4 - depth);
    const wDark = Math.max(1, 3 - depth);
    const wCore = Math.max(1, 2 - depth);

    const stroke = (colour: number, width: number, alpha: number) => {
      g.lineStyle(width, colour, alpha);
      g.beginPath();
      g.moveTo(points[0].x, points[0].y);
      for (let k = 1; k < points.length; k += 1) {
        g.lineTo(points[k].x, points[k].y);
      }
      g.strokePath();
    };

    stroke(CRACK_PALETTE.outer, wOuter + 2, 0.75);
    stroke(CRACK_PALETTE.dark, wDark + 1, 0.9);
    stroke(CRACK_PALETTE.glow, wDark, 0.85);
    stroke(CRACK_PALETTE.core, wCore, 1);
  }

  /** Apply a full CheckpointState[] snapshot from Convex.
   *  Matches CP records to segments by array position — the ordered
   *  `checkpoints` config array must match the order the caller passes
   *  in from event-bridge. */
  applyCheckpointStates(states: CheckpointState[]): void {
    // Per spec: each CP's task count controls ONLY its own outgoing
    // segment (the stretch from CP_i to CP_{i+1}). Segment[i] index
    // matches CP[i] index. Last CP has no outgoing segment on this
    // scene (its fade continues into next stage's CP1 via the
    // stage-clear cinematic).
    const relevant = states.slice(0, this.segments.length);
    relevant.forEach((state, idx) => {
      const done =
        (state.t1 ? 1 : 0) + (state.t2 ? 1 : 0) + (state.t3 ? 1 : 0);
      this.updateSegment(idx, done);
    });

    // Atmosphere layers (dim + fog patches + particle emitters) fade
    // with TOTAL progress across every CP — the biome should feel
    // increasingly cleansed as the player clears the stage, not
    // reset back to full corruption after each CP. All layers hit
    // their max at 0% progress and fully clear at 100%.
    if (states.length === 0) return;
    const totalTasks = states.length * 3;
    const doneTasks = states.reduce(
      (acc, s) => acc + (s.t1 ? 1 : 0) + (s.t2 ? 1 : 0) + (s.t3 ? 1 : 0),
      0,
    );
    const pct = Math.max(0, Math.min(1, doneTasks / totalTasks));
    if (Math.abs(this.atmosphereCurrentPct - pct) > 0.001) {
      this.atmosphereCurrentPct = pct;
      const factor = 1 - pct;
      if (this.atmosphereDim) {
        this.scene.tweens.add({
          targets: this.atmosphereDim,
          alpha: this.atmosphereMaxDimAlpha * factor,
          duration: FADE_DURATION_MS,
          ease: "Sine.easeInOut",
        });
      }
      for (const fog of this.atmosphereFog) {
        this.scene.tweens.add({
          targets: fog,
          alpha: this.atmosphereMaxFogAlpha * factor,
          duration: FADE_DURATION_MS,
          ease: "Sine.easeInOut",
        });
      }
      // Emitters throttle their frequency instead of alpha so the
      // world doesn't suddenly go particle-less — a lower emit rate
      // reads as "fewer motes in the air" which matches the fade.
      if (this.atmosphereDust) {
        this.atmosphereDust.frequency = 500 + (1 - factor) * 4000;
      }
      if (this.atmosphereSpores) {
        this.atmosphereSpores.frequency = 1200 + (1 - factor) * 6000;
      }
    }
  }

  /** Update a single zone based on how many of the 3 tasks the CP
   *  that OWNS the zone has completed. Zone idx == CP idx.
   *
   *  Intensity levels per the new "Corruption Stages" spec:
   *    0-1/3 tasks (Stage 3 — heavy):  full container alpha, dense
   *                                    spores, pulse enabled.
   *    2/3 tasks (Stage 2 — medium):   container alpha ~10%
   *                                    (hairline residue), spore
   *                                    frequency doubled.
   *    3/3 tasks (Stage 1 — cleared):  container alpha 0 + shatter
   *                                    burst at midpoint. Spores off. */
  updateSegment(cpIdx: number, tasksDone: number): void {
    const seg = this.segments[cpIdx];
    if (!seg) return;
    if (seg.currentTasksDone === tasksDone) return; // no change
    seg.currentTasksDone = tasksDone;

    let targetAlpha = OPACITY_FULL;
    if (tasksDone >= 3) targetAlpha = OPACITY_SLAIN;
    else if (tasksDone >= 2) targetAlpha = OPACITY_RETREAT;

    // Fade the whole crack + moss + fog + glow container together.
    // Because the pulse tween below also writes to container.alpha,
    // we stop the pulse when the zone hits the retreat / slain
    // states so the two tweens don't fight — a wispy 10% residue
    // shouldn't pulse.
    if (tasksDone >= 2 && seg.pulseTween) {
      seg.pulseTween.stop();
      seg.pulseTween = null;
    }
    this.scene.tweens.add({
      targets: seg.container,
      alpha: targetAlpha,
      duration: FADE_DURATION_MS,
      ease: "Sine.easeInOut",
    });

    // Spore throttling — fewer spores as tasks complete. At 3/3 we
    // fully stop the emitter so the zone goes quiet.
    if (seg.sporeEmitter) {
      if (tasksDone >= 3) {
        seg.sporeEmitter.stop();
      } else if (tasksDone >= 2) {
        seg.sporeEmitter.frequency = 3200; // half rate
      } else {
        seg.sporeEmitter.frequency = 1600; // full rate
      }
    }

    // At 3/3 play the shared shatter burst at the zone midpoint —
    // this is the "corruption dies here" visual moment from the
    // workbook spec, still applicable to the new spec's Stage-1
    // cleared state.
    if (tasksDone >= 3) {
      this.playShatterBurst(seg.midX, seg.midY);
    }
  }

  /** Instant 4-frame shatter burst — small pixel-square particles that
   *  scatter and fade. Uses the shared "corruption-shatter-particle"
   *  texture (a 4×4 white square, registered by ensureShatterParticle). */
  private playShatterBurst(x: number, y: number): void {
    ensureShatterParticle(this.scene);
    const emitter = this.scene.add.particles(
      x,
      y,
      "corruption-shatter-particle",
      {
        speed: { min: 40, max: 140 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.2, end: 0.4 },
        alpha: { start: 1, end: 0 },
        lifespan: 500,
        gravityY: 30,
        quantity: 18,
        emitting: false,
        tint: this.cfg.tint,
        blendMode: Phaser.BlendModes.NORMAL,
      },
    );
    emitter.setDepth(this.cfg.depth + 2);
    emitter.explode(18, x, y);
    // Self-destruct once the last particle expires.
    this.scene.time.delayedCall(700, () => emitter.destroy());
  }

  /** Free all Phaser objects — call this on scene shutdown. */
  destroy(): void {
    this.segments.forEach((seg) => {
      seg.pulseTween?.stop();
      seg.sporeEmitter?.destroy();
      seg.container.destroy(true); // recursive → frees all children
      seg.monster?.destroy();
    });
    this.segments = [];
    this.atmosphereDim?.destroy();
    this.atmosphereFog.forEach((f) => f.destroy());
    this.atmosphereFog = [];
    this.atmosphereDust?.destroy();
    this.atmosphereSpores?.destroy();
  }
}

/** Register a small 4×4 white square as the shatter particle. Idempotent. */
function ensureShatterParticle(scene: Phaser.Scene): void {
  if (scene.textures.exists("corruption-shatter-particle")) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 4, 4);
  g.generateTexture("corruption-shatter-particle", 4, 4);
  g.destroy();
}
