/**
 * @file time-of-day.ts
 * @description Shared time-of-day tinting system used by stage scenes to
 *  cycle through dawn / noon / dusk / night ambiances without duplicating
 *  the same tween logic per-scene.
 *
 *  Each biome exposes its own palette to keep the mood distinct:
 *   - Forest: cool green undertones, misty dawn, moonlit night
 *   - Harbor: warm salt-air noon, amber sunset, deep blue night
 *   - Artisans: forge-lit noon, ember dusk, indigo night
 *
 *  Usage inside a scene:
 *   ```ts
 *   private todController: TimeOfDayController | null = null;
 *
 *   create() {
 *     // ...
 *     this.todController = attachTimeOfDay(this, "forest", { startIndex: 1 });
 *   }
 *
 *   shutdown() {
 *     this.todController?.dispose();
 *   }
 *   ```
 *
 *  Depth: the tint overlay sits at depth 999 so it's above the map but
 *  BELOW any React-rendered overlays (which are separate DOM).
 */

import * as Phaser from "phaser";

export type BiomeTag = "forest" | "harbor" | "artisan";

export interface TodPhase {
  name: "dawn" | "noon" | "dusk" | "night";
  /** RGB hex color to tint the map with. */
  color: number;
  /** Overlay alpha (0-1). */
  alpha: number;
}

/**
 * Per-biome time-of-day palettes.
 *
 * Original alpha values (0.22-0.36 on dusk/night) turned out too heavy —
 * on biomes that are ALREADY dark by design (Forest canopy, Mine tunnels)
 * the tint stacks with the map's natural low luminance and makes the
 * whole scene unreadable.  Rebalanced so:
 *   - noon stays 0.0 (no tint at all — map reads at 100%)
 *   - dawn ~0.08 (subtle warm wash)
 *   - dusk ~0.12-0.14 (noticeable mood shift, still lets colours read)
 *   - night ~0.14-0.18 (atmospheric but never fully swallows the map)
 */
const BIOME_TOD_PALETTES: Record<BiomeTag, TodPhase[]> = {
  forest: [
    { name: "dawn", color: 0xffd6a5, alpha: 0.06 },
    { name: "noon", color: 0xffffff, alpha: 0.0 },
    { name: "dusk", color: 0x8b6f47, alpha: 0.12 },
    { name: "night", color: 0x1e2a4a, alpha: 0.14 },
  ],
  harbor: [
    { name: "dawn", color: 0xffe0b0, alpha: 0.08 },
    { name: "noon", color: 0xffffff, alpha: 0.0 },
    { name: "dusk", color: 0xff8c42, alpha: 0.14 },
    { name: "night", color: 0x0f2a4a, alpha: 0.16 },
  ],
  artisan: [
    { name: "dawn", color: 0xffcda5, alpha: 0.06 },
    { name: "noon", color: 0xffffff, alpha: 0.0 },
    { name: "dusk", color: 0xd6642a, alpha: 0.12 },
    { name: "night", color: 0x241638, alpha: 0.18 },
  ],
};

export interface TimeOfDayController {
  /** Advance to the next phase manually (skips the timer). */
  next(): void;
  /** Jump to a specific phase index. */
  setPhase(index: number): void;
  /** Current phase index (0-3). */
  currentIndex(): number;
  /** Cleanup — call from scene.shutdown(). */
  dispose(): void;
}

interface AttachOptions {
  /** Which phase to start in — 0=dawn, 1=noon, 2=dusk, 3=night. Default: 1 (noon). */
  startIndex?: number;
  /** How long each phase lasts in ms before cycling. Default: 24_000. */
  phaseDurationMs?: number;
  /** How long the tween between phases lasts. Default: 3_000. */
  transitionMs?: number;
  /** Map pixel width — used to size the tint overlay. */
  mapWidth: number;
  /** Map pixel height. */
  mapHeight: number;
}

/**
 * Attaches a time-of-day cycle to a Phaser scene. Returns a controller
 * for manual override + disposal.
 *
 * Implementation note: uses a single `Phaser.GameObjects.Rectangle`
 * sized to the full map bounds as the tint layer. Alpha and fillColor
 * are tweened between phases. Rectangle is added at depth 999 so it
 * sits above the map painting but below any interactive nodes (which
 * live at depth 50+ but should visually receive the tint too —
 * BLEND_MODE_MULTIPLY would look better for CP markers but MULTIPLY
 * makes bright markers look dead. We accept slight overlay on markers.)
 */
export function attachTimeOfDay(
  scene: Phaser.Scene,
  biome: BiomeTag,
  opts: AttachOptions,
): TimeOfDayController {
  const palette = BIOME_TOD_PALETTES[biome];
  const phaseDurationMs = opts.phaseDurationMs ?? 24_000;
  const transitionMs = opts.transitionMs ?? 3_000;
  let currentIndex = opts.startIndex ?? 1;

  const tint = scene.add
    .rectangle(0, 0, opts.mapWidth, opts.mapHeight, 0xffffff, 0)
    .setOrigin(0, 0)
    .setDepth(999)
    .setScrollFactor(1);

  // Apply initial phase (no tween)
  const initial = palette[currentIndex];
  tint.setFillStyle(initial.color, initial.alpha);
  tint.setAlpha(initial.alpha);

  let cycleTimer: Phaser.Time.TimerEvent | null = null;
  let activeTween: Phaser.Tweens.Tween | null = null;

  function tweenToPhase(nextIndex: number) {
    const next = palette[nextIndex % palette.length];
    // Kill any in-flight tween on the tint
    if (activeTween) {
      activeTween.stop();
      activeTween = null;
    }
    // Phaser doesn't tween fillColor directly on Rectangle. We tween a
    // helper object and update on each step.
    const from = {
      alpha: tint.alpha,
      r: (tint.fillColor >> 16) & 0xff,
      g: (tint.fillColor >> 8) & 0xff,
      b: tint.fillColor & 0xff,
    };
    const to = {
      alpha: next.alpha,
      r: (next.color >> 16) & 0xff,
      g: (next.color >> 8) & 0xff,
      b: next.color & 0xff,
    };
    activeTween = scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: transitionMs,
      ease: "Sine.easeInOut",
      onUpdate: (t) => {
        const p = t.getValue() ?? 0;
        const r = Math.round(from.r + (to.r - from.r) * p);
        const g = Math.round(from.g + (to.g - from.g) * p);
        const b = Math.round(from.b + (to.b - from.b) * p);
        const a = from.alpha + (to.alpha - from.alpha) * p;
        tint.setFillStyle((r << 16) | (g << 8) | b, a);
        tint.setAlpha(a);
      },
      onComplete: () => {
        activeTween = null;
      },
    });
    currentIndex = nextIndex % palette.length;
  }

  function scheduleNext() {
    cycleTimer = scene.time.addEvent({
      delay: phaseDurationMs,
      callback: () => {
        tweenToPhase(currentIndex + 1);
        scheduleNext();
      },
    });
  }

  scheduleNext();

  return {
    next: () => {
      if (cycleTimer) {
        cycleTimer.remove();
        cycleTimer = null;
      }
      tweenToPhase(currentIndex + 1);
      scheduleNext();
    },
    setPhase: (index) => {
      if (cycleTimer) {
        cycleTimer.remove();
        cycleTimer = null;
      }
      tweenToPhase(index);
      scheduleNext();
    },
    currentIndex: () => currentIndex,
    dispose: () => {
      cycleTimer?.remove();
      activeTween?.stop();
      tint.destroy();
    },
  };
}
