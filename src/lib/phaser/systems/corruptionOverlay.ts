/**
 * @file corruptionOverlay.ts
 * @description Per-checkpoint corruption overlay system, implementing the
 *  spec from "Ibhaveda_boss_corruption_table" (Sheet: "How Corruption Works").
 *
 *  The core rule (verbatim from the spec):
 *    Each checkpoint independently controls the overlay opacity for its
 *    OWN path segment — the stretch from that checkpoint through to the
 *    next one.
 *
 *    0/3 or 1/3 tasks done → overlay at 100% (fully corrupt)
 *    2/3 tasks done        → overlay at ~10% + weakened monster at far edge
 *    3/3 tasks done        → overlay at 0% + shatter burst + monster gone
 *
 *  State is always LIVE — completing the missing task on a CP later
 *  re-tweens that segment's opacity immediately, no matter where the
 *  player is now.
 *
 *  Art system:
 *    - 1 tileable pattern per stage (generated at runtime as a Phaser
 *      texture — see overlayPatterns.ts). Applied as a rotated TileSprite
 *      strip between consecutive CPs.
 *    - 1 monster sprite (any existing boss idle sheet frame 0), scaled to
 *      50% and half-transparent for the "weakened" pose.
 *    - 1 shared shatter burst — a runtime Phaser particle emitter recolored
 *      per monster tint. No PNGs required.
 *
 *  Segment definition:
 *    Segment_i runs from CP_i to CP_{i+1}.
 *    The FINAL segment on a stage (CP_last → next stage) is out of scope
 *    for a single-scene renderer — it's tracked in the venture manager
 *    (Stage 1 CP4 completion clears into Stage 2 CP1 via the stage-clear
 *    pan, not via an overlay strip). This is deliberate per the spec:
 *    "Finishing a stage's final checkpoint fades through to CP1 of the
 *    NEXT stage." That cross-stage fade is not visible on the current
 *    single-stage scene, so we simply skip drawing the last segment.
 */

import * as Phaser from "phaser";
import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";

/** How thick the corruption strip is, perpendicular to the CP→CP line. */
const STRIP_WIDTH_PX = 96;

/** Fade tween duration (spec: "roughly 1-1.5 seconds"). */
const FADE_DURATION_MS = 1200;

/** Opacity levels per completion state (spec). */
const OPACITY_FULL = 1.0;
const OPACITY_RETREAT = 0.1;
const OPACITY_SLAIN = 0.0;

/** Weakened-monster pose scale + alpha. */
const WEAKENED_SCALE = 0.5;
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
  /** Phaser texture key for the pre-registered tileable overlay pattern. */
  patternTextureKey: string;
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
}

interface Segment {
  strip: Phaser.GameObjects.TileSprite;
  monster: Phaser.GameObjects.Image | null;
  midX: number;
  midY: number;
  angle: number;
  length: number;
  currentTasksDone: number;
}

export class CorruptionOverlay {
  private scene: Phaser.Scene;
  private cfg: Required<Omit<CorruptionOverlayConfig, "weakenedSpriteKey" | "weakenedFrame">> & {
    weakenedSpriteKey?: string;
    weakenedFrame?: { width: number; height: number };
  };
  private segments: Segment[] = [];

  constructor(scene: Phaser.Scene, config: CorruptionOverlayConfig) {
    this.scene = scene;
    this.cfg = {
      checkpoints: config.checkpoints,
      patternTextureKey: config.patternTextureKey,
      tint: config.tint ?? 0xffffff,
      depth: config.depth ?? 40,
      weakenedSpriteKey: config.weakenedSpriteKey,
      weakenedFrame: config.weakenedFrame,
    };

    this.buildSegments();
  }

  /** Instantiate one TileSprite strip per (CP_i, CP_{i+1}) pair.
   *  All start at OPACITY_FULL — real state is applied via
   *  `applyCheckpointStates` after Convex data arrives. */
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

      // TileSprite is created axis-aligned then rotated to the segment
      // angle so the pattern texture tiles along its long axis (from
      // A to B). Width = segment length; height = strip perpendicular.
      const strip = this.scene.add.tileSprite(
        midX,
        midY,
        length,
        STRIP_WIDTH_PX,
        this.cfg.patternTextureKey,
      );
      strip.setOrigin(0.5, 0.5);
      strip.setRotation(angle);
      strip.setDepth(this.cfg.depth);
      strip.setAlpha(OPACITY_FULL);
      if (this.cfg.tint !== 0xffffff) strip.setTint(this.cfg.tint);
      // Slight base transparency so the painted map bleeds through even
      // at "full" corruption. Straight 1.0 flat-covers biome art.
      strip.setBlendMode(Phaser.BlendModes.MULTIPLY);

      // Weakened-monster sprite — created hidden, revealed only when
      // that CP transitions to 2/3. Position: 75% along the segment
      // (past the midpoint toward the NEXT cp) so it visually anchors
      // to the segment's far edge, per the spec.
      let monster: Phaser.GameObjects.Image | null = null;
      if (this.cfg.weakenedSpriteKey && this.scene.textures.exists(this.cfg.weakenedSpriteKey)) {
        const fx = a.x + dx * 0.72;
        const fy = a.y + dy * 0.72;
        // If the source is a spritesheet, use frame 0. Otherwise a plain image.
        const frame = this.cfg.weakenedFrame ? 0 : undefined;
        monster =
          frame !== undefined
            ? this.scene.add.image(fx, fy, this.cfg.weakenedSpriteKey, frame)
            : this.scene.add.image(fx, fy, this.cfg.weakenedSpriteKey);
        monster.setScale(WEAKENED_SCALE);
        monster.setAlpha(0); // hidden until CP hits 2/3
        monster.setDepth(this.cfg.depth + 1);
        if (this.cfg.tint !== 0xffffff) monster.setTint(this.cfg.tint);
      }

      this.segments.push({
        strip,
        monster,
        midX,
        midY,
        angle,
        length,
        currentTasksDone: 0,
      });
    }
  }

  /** Apply a full CheckpointState[] snapshot from Convex.
   *  Matches CP records to segments by array position — the ordered
   *  `checkpoints` config array must match the order the caller passes
   *  in from event-bridge. */
  applyCheckpointStates(states: CheckpointState[]): void {
    // Slice off states we don't have a segment for. This is normal —
    // the LAST CP has no segment (its clear-forward goes to the next
    // stage's CP1, handled by the stage-clear pan cinematic).
    const relevant = states.slice(0, this.segments.length);
    relevant.forEach((state, idx) => {
      const done =
        (state.t1 ? 1 : 0) + (state.t2 ? 1 : 0) + (state.t3 ? 1 : 0);
      this.updateSegment(idx, done);
    });
  }

  /** Update a single segment based on how many of the 3 tasks the CP
   *  that OWNS the segment has completed. Segment idx == CP idx. */
  updateSegment(cpIdx: number, tasksDone: number): void {
    const seg = this.segments[cpIdx];
    if (!seg) return;
    if (seg.currentTasksDone === tasksDone) return; // no change
    seg.currentTasksDone = tasksDone;

    let targetAlpha = OPACITY_FULL;
    if (tasksDone >= 3) targetAlpha = OPACITY_SLAIN;
    else if (tasksDone >= 2) targetAlpha = OPACITY_RETREAT;

    // Fade the overlay strip.
    this.scene.tweens.add({
      targets: seg.strip,
      alpha: targetAlpha,
      duration: FADE_DURATION_MS,
      ease: "Sine.easeInOut",
    });

    // Monster: reveal at 2/3, shatter at 3/3, hide otherwise.
    if (seg.monster) {
      if (tasksDone >= 3) {
        // Shatter burst then hide the monster permanently.
        this.playShatterBurst(seg.monster.x, seg.monster.y);
        this.scene.tweens.add({
          targets: seg.monster,
          alpha: 0,
          scale: WEAKENED_SCALE * 0.4,
          duration: 400,
          ease: "Sine.easeIn",
        });
      } else if (tasksDone >= 2) {
        // Reveal the weakened pose.
        this.scene.tweens.add({
          targets: seg.monster,
          alpha: WEAKENED_ALPHA,
          duration: FADE_DURATION_MS,
          ease: "Sine.easeInOut",
        });
      } else {
        // Re-hide (only relevant if the CP was reset).
        this.scene.tweens.add({
          targets: seg.monster,
          alpha: 0,
          duration: 400,
          ease: "Sine.easeIn",
        });
      }
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
      seg.strip.destroy();
      seg.monster?.destroy();
    });
    this.segments = [];
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
