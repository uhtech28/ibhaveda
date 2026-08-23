/**
 * @file corruptionMapTint.ts
 * @description IN-SCENE Phaser corruption overlay for stage map scenes.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Why this exists (2026-08-23)
 * ─────────────────────────────────────────────────────────────────────
 * Historically, corruption was painted by the React component
 * `CorruptionViewportWash` (see
 * `src/components/corruption/CorruptionOverlayCanvas.tsx`). That
 * component mounts two full-viewport `<div>`s ABOVE the Phaser canvas
 * with CSS `mix-blend-mode` set to `color` / `darken`. Because a
 * single canvas hosts BOTH the map tiles AND the persona/boss sprites,
 * the CSS wash cannot discriminate — it tints (and often desaturates)
 * every sprite as well as the map. User feedback across three passes
 * confirmed:
 *
 *   "the color fade is covering the persona and boss instead of
 *    keeping their original color"
 *   "corruption should not effect the color of persona and boss"
 *
 * The only way to keep sprites at their native color while still
 * tinting the ground is to move the tint INSIDE Phaser's rendering
 * pipeline and paint it BETWEEN the map (depth 0) and the sprites
 * (persona depth 100, boss depth 60, CP disc depth 50). This helper
 * does exactly that:
 *
 *   1. LAYER A (`colorRect`) — a solid `Phaser.GameObjects.Rectangle`
 *      the size of the map, filled with the boss's profile color at
 *      `min(1, opacity * 1.5)`. Sits at `spriteDepth - 2`.
 *
 *   2. LAYER B (`patternTile`) — a `Phaser.GameObjects.TileSprite` the
 *      size of the map, textured from a procedurally-painted 96×96
 *      tile (using the SAME `paintPattern` drawer as the React
 *      overlay so tile art parity is preserved). Sits at
 *      `spriteDepth - 1` so it stacks on top of the color layer but
 *      still below every sprite.
 *
 * Both layers are children of the scene's world (they DO scroll with
 * the camera — they're painted over the map at map coordinates, not
 * pinned to the viewport). Every sprite whose depth is >= spriteDepth
 * renders above them.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Cleared zones
 * ─────────────────────────────────────────────────────────────────────
 * The React overlay used CSS `mask-image` with a stack of
 * `radial-gradient`s to punch holes around cleared CPs. Phaser has no
 * per-object mask equivalent for a single Rectangle, so v1 of this
 * helper STORES the cleared zones but does not visually punch them
 * out. See TODO in `setClearedZones`. When it lands, the approach will
 * be to render both layers via `Phaser.Display.Masks.BitmapMask` off
 * a Graphics that draws the zones with `erase` blend, giving parity
 * with the CSS mask.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Village exception
 * ─────────────────────────────────────────────────────────────────────
 * `VillageMapScene` owns a bespoke Phaser fog-cloud rendering that
 * product explicitly likes. This helper is deliberately NOT wired into
 * that scene — the fog cloud stays untouched.
 */

import * as Phaser from "phaser";
import {
  CORRUPTION_TILE_LOGICAL_SIZE,
  paintPattern,
} from "@/components/corruption/CorruptionOverlayCanvas";
import type {
  CorruptionPattern,
  CorruptionProfile,
} from "@/config/bossCorruptionProfiles";
import { eventBridge } from "@/lib/phaser/utils/event-bridge";

/**
 * Shape of the corruption state pushed into the helper by React via
 * the `CORRUPTION_STATE` event on the shared event-bridge. We accept
 * a `pattern: string` (rather than the strict `CorruptionPattern`
 * union) on the wire so the event payload remains framework-neutral;
 * the helper cross-checks it against the union at paint time.
 */
export interface CorruptionMapTintProfile {
  slug: string;
  label: string;
  /** Must be one of the CorruptionPattern literals. */
  pattern: string;
  /** Hex color string ("#RRGGBB"). */
  color: string;
}

/** A cleared-CP radial hole (normalized 0..1 in map coords). Stored
 *  for the pending mask-based implementation. */
export interface CorruptionMapTintClearedZone {
  xNorm: number;
  yNorm: number;
  /** Radius as a fraction of the SHORTER map dimension. */
  radiusNorm: number;
}

export interface CorruptionMapTintOptions {
  profile: CorruptionMapTintProfile | CorruptionProfile | null;
  /** Phase-scaled corruption intensity 0..1 (calm..critical). */
  opacity: number;
  mapWidth: number;
  mapHeight: number;
  /** Depth of the LOWEST sprite the overlay must stay under (typically
   *  the CP disc at 50, but callers can pass anything as long as it's
   *  above the map depth). The helper places its two layers at
   *  `spriteDepth - 2` (color) and `spriteDepth - 1` (pattern). */
  spriteDepth: number;
  clearedZones?: readonly CorruptionMapTintClearedZone[];
}

export interface CorruptionMapTintHandle {
  /** Update just the intensity — cheap path for phase transitions. */
  update(opacity: number): void;
  /** Swap the profile — regenerates the pattern texture. */
  setProfile(profile: CorruptionMapTintProfile | CorruptionProfile | null): void;
  /** Store cleared zones; v1 doesn't yet mask them out (see file
   *  header). Safe to call — future implementation will pick them up. */
  setClearedZones(zones: readonly CorruptionMapTintClearedZone[]): void;
  /** Free every Phaser object this helper created. Idempotent. */
  destroy(): void;
}

/** Multipliers that convert the caller's phase-scaled opacity
 *  (0.35..0.75) into the actual per-layer alpha. Tuned so calm phase
 *  produces a clearly visible tint on bright biome maps (product ask
 *  "cant se any corruption make sure corruption is on all maps") and
 *  critical phase reaches heavy-but-not-blackout coverage. */
const COLOR_LAYER_MULT = 1.5;
const PATTERN_LAYER_MULT = 2.0;
const MAX_COLOR_ALPHA = 0.95;
const MAX_PATTERN_ALPHA = 0.85;

/**
 * Namespace prefix for the offscreen Phaser textures this helper
 * generates. One texture per boss slug — reused across scene restarts
 * to keep the texture cache from ballooning as the player moves
 * between stages.
 */
const TEXTURE_KEY_PREFIX = "__corruptionMapTint__";

/** Valid CorruptionPattern strings — used to widen the payload's
 *  `string` back into the strict union at paint time. Kept in sync
 *  with `CorruptionPattern` in bossCorruptionProfiles.ts. */
const VALID_PATTERNS: readonly CorruptionPattern[] = [
  "crack",
  "grid",
  "chain",
  "barlock",
  "dither",
  "vine",
  "shard",
  "wave",
  "blob",
  "silhouette",
  "cloth",
  "outline",
  "zigzag",
  "block",
];
function toValidPattern(p: string): CorruptionPattern {
  return (VALID_PATTERNS as readonly string[]).includes(p)
    ? (p as CorruptionPattern)
    : "blob"; // safe fallback — soft blobs read on every biome
}

/**
 * Ensure a Phaser texture exists whose bitmap holds ONE full 96×96
 * tile of the given (pattern × color) combo painted on a transparent
 * background. The texture key encodes both so different bosses cache
 * separately and swapping profiles is instant on the second visit.
 *
 * Uses a plain HTMLCanvasElement (not a Phaser CanvasTexture) so we
 * can invoke the shared `paintPattern` drawer verbatim — same code
 * path the React overlay uses, guaranteeing tile art parity.
 */
function ensurePatternTexture(
  scene: Phaser.Scene,
  pattern: CorruptionPattern,
  color: string,
): string {
  const safeColor = color.replace("#", "").toLowerCase();
  const key = `${TEXTURE_KEY_PREFIX}${pattern}__${safeColor}`;
  if (scene.textures.exists(key)) return key;

  const size = CORRUPTION_TILE_LOGICAL_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return key; // very unlikely in a browser env
  ctx.imageSmoothingEnabled = false;
  // Transparent background so the color layer below shows through
  // between the pattern strokes — matches the React overlay's
  // approach where the pattern tile paints over the wash.
  ctx.clearRect(0, 0, size, size);
  // Use a transparent bg color for the drawer — many drawers fill
  // the background first; passing `rgba(0,0,0,0)` makes that fill a
  // no-op so only the strokes/shapes contribute.
  paintPattern(ctx, pattern, color, "rgba(0,0,0,0)");

  scene.textures.addCanvas(key, canvas);
  return key;
}

/**
 * Attach an in-scene corruption tint to `scene`. Call from the scene's
 * `create()` AFTER the map image is added (so `mapWidth`/`mapHeight`
 * are correct) but BEFORE — or independent of — any sprites. The
 * returned handle can be updated later; typically the scene subscribes
 * to the `CORRUPTION_STATE` event on the shared event-bridge and calls
 * `setProfile` / `update` from that listener.
 *
 * Safe to call with `profile: null` — the helper still creates the
 * two layers but leaves them at alpha 0 so a later `setProfile` can
 * fade them in without a create/destroy roundtrip.
 */
export function attachCorruptionMapTint(
  scene: Phaser.Scene,
  opts: CorruptionMapTintOptions,
): CorruptionMapTintHandle {
  const { mapWidth, mapHeight, spriteDepth } = opts;

  // ── Layer A — solid color tint ──────────────────────────────────
  // Origin (0,0) so the rectangle spans the ENTIRE map from (0,0) to
  // (mapWidth, mapHeight) — same coordinate system the map image uses
  // when added via `this.add.image(0,0,mapKey).setOrigin(0,0)`.
  const colorRect = scene.add.rectangle(
    0,
    0,
    mapWidth,
    mapHeight,
    0x000000,
    0,
  );
  colorRect.setOrigin(0, 0);
  colorRect.setDepth(spriteDepth - 2);
  colorRect.setScrollFactor(1); // scrolls with the camera / map

  // ── Layer B — repeating pattern tile ────────────────────────────
  // Start with an empty 1×1 placeholder texture so the TileSprite has
  // SOMETHING to sample before the first setProfile() call. Once a
  // real profile arrives we swap the texture via setTexture(key).
  const PLACEHOLDER_KEY = `${TEXTURE_KEY_PREFIX}__placeholder`;
  if (!scene.textures.exists(PLACEHOLDER_KEY)) {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    scene.textures.addCanvas(PLACEHOLDER_KEY, c);
  }
  const patternTile = scene.add.tileSprite(
    0,
    0,
    mapWidth,
    mapHeight,
    PLACEHOLDER_KEY,
  );
  patternTile.setOrigin(0, 0);
  patternTile.setDepth(spriteDepth - 1);
  patternTile.setScrollFactor(1);
  patternTile.setAlpha(0); // hidden until profile applied

  // ── Internal state ──────────────────────────────────────────────
  let currentProfile: CorruptionMapTintProfile | null =
    opts.profile as CorruptionMapTintProfile | null;
  let currentOpacity = opts.opacity;
  let clearedZones: readonly CorruptionMapTintClearedZone[] =
    opts.clearedZones ?? [];

  function paint(): void {
    if (!currentProfile) {
      colorRect.setAlpha(0);
      patternTile.setAlpha(0);
      return;
    }
    // Parse "#RRGGBB" to a 0xRRGGBB Phaser color number.
    const hex = currentProfile.color.replace("#", "");
    const colorNum = parseInt(hex, 16);
    colorRect.setFillStyle(colorNum, 1);
    const colorAlpha = Math.min(
      MAX_COLOR_ALPHA,
      Math.max(0, currentOpacity * COLOR_LAYER_MULT),
    );
    colorRect.setAlpha(colorAlpha);

    // Regenerate / reuse a texture for this (pattern × color) combo.
    const pattern = toValidPattern(currentProfile.pattern);
    const texKey = ensurePatternTexture(scene, pattern, currentProfile.color);
    patternTile.setTexture(texKey);
    // TileSprite scales its tile source to `tileScaleX/Y`; keep 1:1
    // so the procedural randomness reads at the same size the React
    // overlay used (56px repeats on the CSS side; keep parity here
    // by using the tile's native LOGICAL_SIZE).
    patternTile.setTileScale(1, 1);
    const patternAlpha = Math.min(
      MAX_PATTERN_ALPHA,
      Math.max(0, currentOpacity * PATTERN_LAYER_MULT),
    );
    patternTile.setAlpha(patternAlpha);
  }

  paint();

  return {
    update(opacity) {
      currentOpacity = opacity;
      paint();
    },
    setProfile(profile) {
      currentProfile = profile as CorruptionMapTintProfile | null;
      paint();
    },
    setClearedZones(zones) {
      // v1 stores but does not yet mask out — see file header. Kept
      // as a live setter so scenes can already push the data and the
      // future mask implementation will "just work" without a scene
      // rewiring pass.
      clearedZones = zones;
      void clearedZones; // silence unused until mask lands
    },
    destroy() {
      colorRect.destroy();
      patternTile.destroy();
    },
  };
}

/**
 * Convenience — attach the corruption tint AND subscribe it to the
 * `CORRUPTION_STATE` event on the shared event-bridge in one call.
 * Also auto-cleans-up on scene SHUTDOWN so callers don't have to
 * remember to unsubscribe.
 *
 * Returns the same handle as {@link attachCorruptionMapTint} in case
 * the scene wants to poke it directly (e.g. immediate feedback on a
 * task-completion animation before the next CORRUPTION_STATE arrives).
 */
export function attachCorruptionMapTintWithBridge(
  scene: Phaser.Scene,
  opts: CorruptionMapTintOptions,
): CorruptionMapTintHandle {
  const handle = attachCorruptionMapTint(scene, opts);
  const unsub = eventBridge.onPhaser(
    "CORRUPTION_STATE",
    (evt: {
      profile: CorruptionMapTintProfile | null;
      opacity: number;
      clearedZones?: readonly CorruptionMapTintClearedZone[];
    }) => {
      handle.setProfile(evt.profile);
      handle.update(evt.opacity);
      if (evt.clearedZones) handle.setClearedZones(evt.clearedZones);
    },
  );
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    unsub();
    handle.destroy();
  });
  return handle;
}
