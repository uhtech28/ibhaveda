/**
 * @file corruptionPatterns.ts
 * @description Programmatically-generated tileable pattern textures for
 *  the corruption overlay system. One motif per stage monster, drawn
 *  once as a small canvas (typically 32×32) and registered as a Phaser
 *  texture the CorruptionOverlay TileSprites reference.
 *
 *  Motifs match the spec (see "Stage Monsters" sheet):
 *    Village   → Fog of Vagueness         — pale-blue cloud puffs
 *    Forest    → Pathwarden Wraith        — brown tangled vines
 *    Arena     → Advocate of Comfortable Lies — orange heat shimmer
 *    Artisans  → Unfinished Golem         — grey scaffold grid
 *    Mine      → Collapse Specter         — dark-grey rubble chunks
 *    Harbour   → Harbourmaster of Hesitation — blue-grey storm fog
 *    Crossroads→ Babel Merchant           — black/white static
 *    Capital   → Iron Bureaucrat          — grey chain-link
 *
 *  Each generator function is idempotent: it registers exactly one
 *  texture with a stable key, or no-ops if the texture already exists.
 *  Safe to call from any scene's create() as often as you like.
 *
 *  Design constraint: keep every pattern within the 32×32 tile size and
 *  render at 100% opacity so the CorruptionOverlay's per-strip alpha
 *  controls all fading (spec: "the ONLY thing that changes at runtime
 *  is its opacity").
 */

import type * as Phaser from "phaser";

const TILE_SIZE = 32;

// ─── Public API ──────────────────────────────────────────────────────────

export type CorruptionMotif =
  | "fog"
  | "vines"
  | "heat"
  | "scaffold"
  | "rubble"
  | "storm"
  | "static"
  | "chain";

interface MotifSpec {
  key: string;
  draw: (g: Phaser.GameObjects.Graphics) => void;
}

const MOTIFS: Record<CorruptionMotif, MotifSpec> = {
  fog: { key: "corruption-tile-fog", draw: drawFog },
  vines: { key: "corruption-tile-vines", draw: drawVines },
  heat: { key: "corruption-tile-heat", draw: drawHeat },
  scaffold: { key: "corruption-tile-scaffold", draw: drawScaffold },
  rubble: { key: "corruption-tile-rubble", draw: drawRubble },
  storm: { key: "corruption-tile-storm", draw: drawStorm },
  static: { key: "corruption-tile-static", draw: drawStatic },
  chain: { key: "corruption-tile-chain", draw: drawChain },
};

/** Register one pattern texture for the given motif. Idempotent.
 *  Returns the texture key so callers can pass it into
 *  `new CorruptionOverlay({ patternTextureKey: ... })`. */
export function ensureCorruptionPattern(
  scene: Phaser.Scene,
  motif: CorruptionMotif,
): string {
  const spec = MOTIFS[motif];
  if (scene.textures.exists(spec.key)) return spec.key;
  const g = scene.make.graphics({ x: 0, y: 0 });
  spec.draw(g);
  g.generateTexture(spec.key, TILE_SIZE, TILE_SIZE);
  g.destroy();
  return spec.key;
}

/** Bulk-register every motif on scene boot to avoid a first-frame stall. */
export function ensureAllCorruptionPatterns(scene: Phaser.Scene): void {
  (Object.keys(MOTIFS) as CorruptionMotif[]).forEach((m) =>
    ensureCorruptionPattern(scene, m),
  );
}

/** Map a stage index (1-8) to its canonical motif per the spec. */
export function motifForStage(stage: number): CorruptionMotif {
  switch (stage) {
    case 1:
      return "fog"; // Village / Ideation / Fog of Vagueness
    case 2:
      return "vines"; // Forest / Research / Pathwarden Wraith
    case 3:
      return "heat"; // Arena / Validation / Advocate of Comfortable Lies
    case 4:
      return "scaffold"; // Artisan's Quarter / Offer Design / Unfinished Golem
    case 5:
      return "rubble"; // Mine / Build & Deliver / Collapse Specter
    case 6:
      return "storm"; // Harbour / Launch / Harbourmaster of Hesitation
    case 7:
      return "static"; // Crossroads / Iteration / Babel Merchant
    case 8:
      return "chain"; // Capital / Scale / Iron Bureaucrat
    default:
      return "fog";
  }
}

// ─── Pattern draw fns ────────────────────────────────────────────────────
// Each fn draws a 32×32 tile assuming (0,0) top-left. The tile must
// visually seam left-to-right and top-to-bottom when placed edge-to-edge
// on a TileSprite — that's why blobs are pushed inward from edges.

function drawFog(g: Phaser.GameObjects.Graphics): void {
  // Pale blue-grey cloud puffs — a few soft circles.
  g.fillStyle(0xa8b8c8, 0.55);
  g.fillCircle(9, 10, 6);
  g.fillCircle(20, 8, 5);
  g.fillCircle(14, 22, 7);
  g.fillCircle(26, 24, 4);
  // Softer secondary pass for haze depth.
  g.fillStyle(0xc4d0dc, 0.35);
  g.fillCircle(6, 26, 4);
  g.fillCircle(28, 14, 3);
}

function drawVines(g: Phaser.GameObjects.Graphics): void {
  // Brown tangled vine tile — thin criss-cross lines with knot dots.
  g.lineStyle(1, 0x6b4423, 0.85);
  g.beginPath();
  g.moveTo(0, 8);
  g.lineTo(32, 12);
  g.moveTo(0, 18);
  g.lineTo(32, 24);
  g.moveTo(4, 0);
  g.lineTo(10, 32);
  g.moveTo(22, 0);
  g.lineTo(26, 32);
  g.strokePath();
  g.fillStyle(0x4a3018, 0.9);
  g.fillCircle(8, 12, 1.5);
  g.fillCircle(24, 22, 1.5);
  g.fillCircle(6, 24, 1);
}

function drawHeat(g: Phaser.GameObjects.Graphics): void {
  // Orange heat-shimmer — horizontal wavy dither bands.
  const rows = [4, 10, 16, 22, 28];
  rows.forEach((y, i) => {
    const alpha = 0.35 + (i % 2) * 0.25;
    g.fillStyle(0xd97706, alpha);
    for (let x = 0; x < 32; x += 4) {
      const dy = (x % 8 === 0) ? 0 : 1;
      g.fillRect(x, y + dy, 3, 2);
    }
  });
}

function drawScaffold(g: Phaser.GameObjects.Graphics): void {
  // Grey scaffolding grid — horizontal + vertical thin bars.
  g.fillStyle(0x9ca3af, 0.7);
  // Verticals
  g.fillRect(6, 0, 2, 32);
  g.fillRect(18, 0, 2, 32);
  g.fillRect(28, 0, 2, 32);
  // Horizontals
  g.fillRect(0, 8, 32, 2);
  g.fillRect(0, 20, 32, 2);
  // Joint bolts (darker dots at intersections).
  g.fillStyle(0x6b7280, 0.9);
  [6, 18, 28].forEach((x) =>
    [8, 20].forEach((y) => g.fillRect(x, y, 2, 2)),
  );
}

function drawRubble(g: Phaser.GameObjects.Graphics): void {
  // Dark-grey rubble chunks — angular rock pixel clusters.
  g.fillStyle(0x4b5563, 0.85);
  g.fillTriangle(4, 4, 12, 6, 8, 14);
  g.fillTriangle(20, 8, 28, 12, 22, 18);
  g.fillTriangle(6, 20, 14, 22, 10, 30);
  g.fillTriangle(22, 24, 30, 26, 26, 32);
  // Dust flecks between chunks.
  g.fillStyle(0x374151, 0.7);
  g.fillRect(16, 4, 2, 2);
  g.fillRect(2, 16, 2, 2);
  g.fillRect(28, 20, 2, 2);
}

function drawStorm(g: Phaser.GameObjects.Graphics): void {
  // Blue-grey storm — cloud puffs over water-line pixels.
  g.fillStyle(0x64748b, 0.6);
  g.fillCircle(10, 8, 6);
  g.fillCircle(22, 12, 5);
  // Water lines below.
  g.fillStyle(0x334155, 0.55);
  for (let x = 0; x < 32; x += 6) {
    g.fillRect(x, 22, 4, 1);
    g.fillRect(x + 3, 28, 4, 1);
  }
}

function drawStatic(g: Phaser.GameObjects.Graphics): void {
  // TV static — pseudorandom black/white dither. Seeded so it's stable
  // (same tile every load, no visible seam flicker).
  const rng = mulberry32(0x5eed);
  for (let y = 0; y < 32; y += 1) {
    for (let x = 0; x < 32; x += 1) {
      const v = rng();
      if (v < 0.4) {
        g.fillStyle(0x000000, 0.6);
        g.fillRect(x, y, 1, 1);
      } else if (v > 0.7) {
        g.fillStyle(0xffffff, 0.5);
        g.fillRect(x, y, 1, 1);
      }
    }
  }
}

function drawChain(g: Phaser.GameObjects.Graphics): void {
  // Grey chain-link — small linked rings, tileable.
  g.lineStyle(2, 0x71717a, 0.9);
  g.strokeCircle(8, 8, 4);
  g.strokeCircle(20, 8, 4);
  g.strokeCircle(8, 24, 4);
  g.strokeCircle(20, 24, 4);
  // Connectors between rings.
  g.beginPath();
  g.moveTo(12, 8);
  g.lineTo(16, 8);
  g.moveTo(12, 24);
  g.lineTo(16, 24);
  g.moveTo(8, 12);
  g.lineTo(8, 20);
  g.moveTo(20, 12);
  g.lineTo(20, 20);
  g.strokePath();
}

// Deterministic PRNG for the static tile.
function mulberry32(seed: number): () => number {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
