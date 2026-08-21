/**
 * @file TemplateMapScene.ts
 * @description Generic parametric Phaser scene for non-venture
 *   templates (Academic Paper, Lab Experiment, Creative Project).
 *
 *   Previously the map page rendered a plain CSS background-image
 *   for these templates — no persona, no boss, no zoom-follow.
 *   Product ask: "FOR ALL MAPS ADD CHECK POINT BOSS, MAKE THEM
 *   ZOOM LIKE VILLAGE MAP AND PERSONA WITH MOVEMENT".
 *
 *   Design:
 *   - init(data) receives the biome-specific config
 *       { mapKey, mapUrl, mapWidth, mapHeight, bossAsset, biomeLabel }
 *     so the same scene class can render every academic/lab/creative
 *     stage. No hardcoded coordinates.
 *   - Persona uses the shared persona-assets loader (idle / directional
 *     walks) and the free-roam WASD driver via attachEditorTestWalk
 *     with force:true — exactly the Village setup.
 *   - Camera follows the persona with a mild zoom that scales down
 *     on mobile so the whole scene reads.
 *   - One "moving boss" spawns near the map's east-center as a
 *     stand-in for a stage boss; scene consumers can retreat/dissolve
 *     it via public methods (advanceToNextCheckpoint / defeatBoss).
 *   - Reads persona + boss animation clips via the shared
 *     stageMapAnimations helpers so every template gets the same
 *     idle/attack/hurt/defeat/victory state machine as the Village.
 */

import * as Phaser from "phaser";
import { eventBridge } from "../utils/event-bridge";
import { attachEditorTestWalk } from "@/lib/phaser/systems/editorTestWalk";
import { getResponsiveZoom } from "@/lib/phaser/utils/responsive-zoom";
import {
  getCurrentPersonaId,
  loadPersonaSprites,
  registerPersonaAnimations,
  personaAnimKey,
  directionalWalkAnimKey,
} from "@/lib/phaser/persona-assets";
import {
  loadBossAssets,
  registerBossAnimations,
  spawnMovingBoss,
  retreatBossTo,
  dissolveBoss,
  spawnPersonaCharacter,
  walkPersonaTo,
  playBossState,
  playPersonaState,
  type MovingBossHandle,
  type PersonaHandle,
} from "@/lib/phaser/animations/stageMapAnimations";
import type { StageBoss } from "@/config/stage-bosses";

export interface TemplateMapSceneInit {
  /** Cache key for the map texture — keep unique per URL. */
  mapKey: string;
  mapUrl: string;
  mapWidth: number;
  mapHeight: number;
  /** Short label rendered in a top-left pill so users know which biome. */
  biomeLabel?: string;
  /** Optional stage number — drives which mini-boss ships. */
  stage?: number;
  /** Optional pre-built boss config. Falls back to a shared Fog stand-in. */
  boss?: StageBoss;
  /**
   * Ordered checkpoint list for this biome. Each entry gets a gold
   * disc + number badge painted on the map, and `advanceToNextCheckpoint`
   * walks the persona + retreats the boss along this path. When
   * omitted (older callers), the scene falls back to the old single-
   * hub layout for backwards compat.
   * Coordinates are in map-image pixels.
   */
  checkpoints?: ReadonlyArray<{ x: number; y: number; label: string }>;
}

/**
 * Generate a default checkpoint layout for a biome that hasn't been
 * hand-tuned yet. Positions N checkpoints in a gentle serpentine
 * curve from top-left to bottom-right of the painted area, leaving
 * a healthy margin so gold discs never sit against the map edge.
 *
 * Used by the React layer to fabricate a positions array when only
 * the CP COUNT is known (from the Convex template stage config) —
 * artist can later replace with hand-picked coordinates per biome.
 */
export function generateCheckpointLayout(
  mapWidth: number,
  mapHeight: number,
  count: number,
  labelPrefix: string = "CP",
): Array<{ x: number; y: number; label: string }> {
  if (count <= 0) return [];
  // Use MOST of the map area — old version had 12% X / 18% Y margins
  // which pinned everything to the middle-bottom band on tall biomes.
  // 8% margins let the serpentine cover top-to-bottom of the map.
  const marginX = mapWidth * 0.08;
  const marginY = mapHeight * 0.08;
  const usableW = mapWidth - marginX * 2;
  const usableH = mapHeight - marginY * 2;
  const out: Array<{ x: number; y: number; label: string }> = [];
  for (let i = 0; i < count; i++) {
    // Linear progress left → right.
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = marginX + usableW * t;
    // Serpentine sine wave — 1.5 full cycles across the map so the
    // path visibly weaves top→bottom→top instead of clustering low.
    // Amplitude 0.48 (was 0.35) uses ~96% of the vertical usable area.
    const y =
      marginY +
      usableH *
        (0.5 + 0.48 * Math.sin(t * Math.PI * 2.4));
    out.push({
      x: Math.round(x),
      y: Math.round(y),
      label: `${labelPrefix} ${i + 1}`,
    });
  }
  return out;
}

// Village-parity persona spawn offset (top-left of CP disc).
const CHAR_X_OFFSET = -60;
const CHAR_Y_OFFSET = -45;
const WALK_DURATION_MS = 1800;

// A single "hub checkpoint" per biome — center of the map, at the
// bottom-third so persona + boss both read against interesting art.
function hubCheckpoint(w: number, h: number): { x: number; y: number } {
  return { x: Math.round(w * 0.5), y: Math.round(h * 0.6) };
}

// Fallback boss — used when the caller doesn't supply one. Reuses the
// Village Fog spritesheets so the boss reads as an animated character
// rather than a still image on the map.
const FALLBACK_BOSS: StageBoss = {
  checkpointIndex: 0,
  name: "Guardian",
  family: "mist",
  idleAsset: "/assets/bosses/village/fog/idle.png",
  introLine: "* A guardian blocks the path.",
  idleClip: {
    asset: "/assets/bosses/village/fog/idle.png",
    frameCount: 9,
    frameWidth: 92,
    frameHeight: 92,
    fps: 6,
  },
  attackClip: {
    asset: "/assets/bosses/village/fog/attack.png",
    frameCount: 9,
    frameWidth: 92,
    frameHeight: 92,
    fps: 10,
  },
  hurtClip: {
    asset: "/assets/bosses/village/fog/hurt.png",
    frameCount: 9,
    frameWidth: 92,
    frameHeight: 92,
    fps: 10,
  },
  defeatClip: {
    asset: "/assets/bosses/village/fog/defeat.png",
    frameCount: 9,
    frameWidth: 92,
    frameHeight: 92,
    fps: 8,
  },
  victoryClip: {
    asset: "/assets/bosses/village/fog/victory.png",
    frameCount: 9,
    frameWidth: 92,
    frameHeight: 92,
    fps: 8,
  },
  spriteScale: 1.7,
  spriteYOffset: 62,
  spriteXOffset: 0,
};

export class TemplateMapScene extends Phaser.Scene {
  private cfg: TemplateMapSceneInit | null = null;
  private personaHandle: PersonaHandle | null = null;
  private movingBoss: MovingBossHandle | null = null;
  private isAnimating = false;
  /** Checkpoint state — mirrors VillageMapScene's model so React
   *  handlers advanceToNextCheckpoint / weakenActiveBoss / etc. can
   *  drive progression exactly the same way regardless of scene. */
  private checkpoints: ReadonlyArray<{ x: number; y: number; label: string }> = [];
  private currentIndex = 0;
  private checkpointNodes: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super({ key: "TemplateMapScene" });
  }

  init(data: TemplateMapSceneInit): void {
    // Guard: if we're re-entered with new config (biome swap), reset
    // internal state so the next create() starts clean.
    this.cfg = data;
    this.personaHandle = null;
    this.movingBoss = null;
    this.isAnimating = false;
  }

  preload(): void {
    // Phaser auto-starts the first registered scene with no data —
    // so on the initial boot this.cfg has no mapKey/mapUrl yet.
    // Guard EVERY field individually so a partial config (Phaser
    // passed us `{}` instead of undefined) doesn't crash the loader
    // with "Invalid File key: false".
    if (!this.cfg?.mapKey || !this.cfg?.mapUrl) return;
    if (!this.textures.exists(this.cfg.mapKey)) {
      this.load.image(this.cfg.mapKey, this.cfg.mapUrl);
    }
    // Persona sprites — shared cache so switching biomes doesn't re-download.
    loadPersonaSprites(this, getCurrentPersonaId());
    // Boss assets via shared loader (fallback chain handles missing clips).
    const boss = this.cfg.boss ?? FALLBACK_BOSS;
    loadBossAssets(this, this.cfg.stage ?? 0, boss);
  }

  create(): void {
    // Empty-config auto-start path — Phaser autostarts the first
    // registered scene with no data on Game creation, so we always
    // paint an empty canvas first. Fire PHASER_READY so the map
    // page's LoadingScreen dismisses and its scene-routing effect
    // can immediately restart us with the real biome data.
    if (!this.cfg?.mapKey || !this.cfg?.mapUrl) {
      eventBridge.dispatchToReact({ type: "PHASER_READY" });
      return;
    }
    const { mapKey, biomeLabel } = this.cfg;

    // Prefer the LOADED texture's actual dimensions over the config's
    // best-guess mapWidth/mapHeight. Every academic/lab/creative PNG
    // ships a slightly different aspect (1540×1156, 1412×1156, 1156×1412
    // for portrait, etc.) — but the caller passes a one-size default of
    // 1540×1412. That mismatch was the root cause of the green-stripe
    // torn-map bug on prod: camera bounds went 256px BELOW the actual
    // image, WebGL sampled the last texel row into the empty area, and
    // the GPU smeared it into vertical stripes. Reading from the
    // texture guarantees bounds exactly match painted pixels.
    let actualW = this.cfg.mapWidth;
    let actualH = this.cfg.mapHeight;
    if (this.textures.exists(mapKey)) {
      const src = this.textures.get(mapKey).getSourceImage() as
        | HTMLImageElement
        | { width: number; height: number };
      if (src && src.width > 0 && src.height > 0) {
        actualW = src.width;
        actualH = src.height;
      }
    }
    const mapWidth = actualW;
    const mapHeight = actualH;

    // Belt-and-suspenders backdrop: a large dark filled rectangle that
    // extends well past the map's own bounds. Even if the camera
    // somehow overshoots (rounding at fractional zoom, sub-pixel scroll
    // during a pan tween), the viewer sees a clean dark matte instead
    // of any GPU sampling garbage. Rendered at depth -10 so the map
    // and every other sprite paint on top.
    this.add
      .rectangle(
        mapWidth / 2,
        mapHeight / 2,
        mapWidth * 3,
        mapHeight * 3,
        0x0a0a10,
        1,
      )
      .setDepth(-10);

    // Map backdrop — pinned to (0,0) with origin top-left.
    this.add.image(0, 0, mapKey).setOrigin(0, 0).setDepth(0);

    // Camera — mirrors Village: responsive zoom, bounds set to ACTUAL
    // painted map size so follow-cam can't scroll past the image edge.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, mapWidth, mapHeight);
    // Also paint the camera clear color — belt on top of the suspenders
    // above. If the map dims ever fail to read, this at least keeps
    // the void a solid dark matte instead of a torn GPU strip.
    cam.setBackgroundColor(0x0a0a10);
    cam.setZoom(getResponsiveZoom());

    // Recompute CP positions against the ACTUAL painted map dims. The
    // caller may have passed positions computed for a default 1540×1412
    // bound, but the real image can be 1540×1156 (landscape) or
    // 1156×1412 (portrait). Using the caller's positions verbatim would
    // paint CPs beyond the visible map on landscape variants. Keep the
    // caller's CP COUNT + labels (the count reflects the template's
    // per-stage checkpoint spec), just re-derive the coordinates.
    const desiredCount =
      this.cfg.checkpoints && this.cfg.checkpoints.length > 0
        ? this.cfg.checkpoints.length
        : 0;
    if (desiredCount > 0) {
      const regen = generateCheckpointLayout(mapWidth, mapHeight, desiredCount);
      // Preserve any custom labels from the caller (e.g. "Boss Arena")
      // by copying label index-for-index; positions are always the
      // freshly-computed serpentine.
      this.checkpoints = regen.map((cp, i) => ({
        x: cp.x,
        y: cp.y,
        label: this.cfg?.checkpoints?.[i]?.label ?? cp.label,
      }));
    } else {
      this.checkpoints = [
        { ...hubCheckpoint(mapWidth, mapHeight), label: "Hub" },
      ];
    }
    this.currentIndex = 0;
    const hub = this.checkpoints[0];
    cam.centerOn(hub.x, hub.y);

    // Paint gold-disc markers for every CP. Sized smaller (14px vs 26)
    // so they read as pips at the wider mobile zoom brackets instead
    // of hero-sized medallions dominating the map. Fill + ring + number
    // still match Village's palette.
    this.checkpointNodes = [];
    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i];
      const disc = this.add
        .circle(cp.x, cp.y, 14, 0xd4af37, 0.95)
        .setStrokeStyle(2, 0x7a4a10, 1)
        .setDepth(50)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(cp.x, cp.y, String(i + 1), {
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#3a2010",
          fontStyle: "bold",
        } as unknown as Phaser.Types.GameObjects.Text.TextStyle)
        .setOrigin(0.5)
        .setDepth(51);
      disc.on("pointerdown", () => {
        eventBridge.dispatchToReact({
          type: "CHECKPOINT_CLICKED",
          checkpointId: `template-cp-${i}`,
          stage: this.cfg?.stage ?? 0,
          checkpoint: i + 1,
        });
      });
      this.checkpointNodes.push(disc);
    }

    // Drag-to-pan (mouse) — same UX as other stages.
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      dragging = true;
      lastX = p.x;
      lastY = p.y;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!dragging) return;
      cam.scrollX -= (p.x - lastX) / cam.zoom;
      cam.scrollY -= (p.y - lastY) / cam.zoom;
      lastX = p.x;
      lastY = p.y;
    });
    this.input.on("pointerup", () => {
      dragging = false;
    });

    // Optional biome badge — top-left, small, so the user knows where they are.
    if (biomeLabel) {
      const badge = this.add.text(20, 20, biomeLabel.toUpperCase(), {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#fde047",
        backgroundColor: "rgba(0,0,0,0.55)",
        padding: { left: 8, right: 8, top: 4, bottom: 4 },
      } as unknown as Phaser.Types.GameObjects.Text.TextStyle);
      badge.setScrollFactor(0);
      badge.setDepth(200);
    }

    // Persona + boss animations
    registerPersonaAnimations(this, getCurrentPersonaId());
    const boss = this.cfg.boss ?? FALLBACK_BOSS;
    registerBossAnimations(this, this.cfg.stage ?? 0, boss);

    // Persona spawn — at the FIRST checkpoint (top-left convention
    // matches Village and every other stage scene).
    this.personaHandle = spawnPersonaCharacter(this, hub, {
      xOffset: CHAR_X_OFFSET,
      yOffset: CHAR_Y_OFFSET,
    });

    // Boss spawn — at the FIRST checkpoint too, with the same
    // moving-boss model Village uses (one sprite walks the whole
    // path, retreating between CPs on advance). Boss sits ON the
    // CP disc so the persona at top-left doesn't overlap it.
    this.movingBoss = spawnMovingBoss(this, this.cfg.stage ?? 0, boss, {
      x: hub.x,
      y: hub.y,
    }, { showHpBar: false });
    this.movingBoss.sprite.setFlipX(true); // face the persona (which is to its left)

    // Camera follow — smooth follow of the persona so movement reads.
    if (this.personaHandle) {
      cam.startFollow(this.personaHandle.sprite, true, 0.08, 0.08);
      cam.setDeadzone(120, 100);
    }

    // Free-roam WASD — force:true so it drives the persona without
    // editor mode. Personas use namespaced anim keys like
    // `persona-anim:<id>:idle` and `persona-anim:<id>:walk-<dir>` — the
    // default `"persona-walk"` / `"persona-idle"` fallbacks in the
    // driver don't exist as registered anims, so previously WASD moved
    // the sprite through the map but never triggered any walk frames
    // and left the char stuck on its idle first-frame. Pass the correct
    // keys + directional resolver so we get 4-way walk cycles + a
    // proper idle-return on key release.
    const pid = getCurrentPersonaId();
    attachEditorTestWalk(this, {
      getCharacter: () => this.personaHandle?.sprite ?? null,
      // Movement enabled unconditionally (product ask 2026-08-21:
      // "walking animation changing direction working but its stuk
      // not going"). Previous viewer-mode-freeze check (isBlocked
      // returned true whenever registry.viewerMode was true) also
      // blocked owner movement whenever the flag got stuck true
      // between venture switches — animation still played because
      // the anim-swap runs BEFORE isBlocked in editorTestWalk, but
      // position updates were skipped, matching the "stuck" symptom
      // exactly. Owner-mode write protections (CP click, task
      // submission, boss combat) still refuse writes elsewhere in
      // this scene, so freeing up movement doesn't create a data
      // integrity risk — spectators can walk but can't touch state.
      isBlocked: () => false,
      mapWidth,
      mapHeight,
      force: true,
      idleAnimKey: personaAnimKey(pid, "idle"),
      walkAnimKey: personaAnimKey(pid, "walk-east"),
      resolveWalkAnimKey: (dx, dy) => directionalWalkAnimKey(pid, dx, dy),
    });

    // Let React know the scene is up.
    eventBridge.dispatchToReact({ type: "PHASER_READY" });
  }

  /** Public — called from React when the biome changes so the scene
   *  can reload with new map + boss without a full page reload. */
  public rebindTo(cfg: TemplateMapSceneInit): void {
    this.init(cfg);
    // Phaser will re-run preload + create when we restart the scene.
    this.scene.restart(cfg as unknown as Record<string, unknown>);
  }

  /** Public API — mirrors the venture-stage scenes so React's map
   *  page can call the same methods regardless of which scene is
   *  active (advanceToNextCheckpoint / weakenActiveBoss / etc). */
  public weakenActiveBoss(tasksDone: number, total: number = 3): void {
    if (this.movingBoss?.hpBar) {
      this.movingBoss.hpBar.setHp(Math.max(0, 1 - tasksDone / total));
    }
    if (this.movingBoss) playBossState(this, this.movingBoss, "hurt");
    if (this.personaHandle) playPersonaState(this, this.personaHandle, "attack");
  }

  public advanceToNextCheckpoint(): void {
    if (this.isAnimating || !this.cfg) return;
    // Village-parity: on final CP → dissolve the moving boss and
    // fire STAGE_COMPLETE so React advances to the next stage.
    if (this.currentIndex >= this.checkpoints.length - 1) {
      if (this.movingBoss) {
        dissolveBoss(this, this.movingBoss, {
          onComplete: () => {
            eventBridge.dispatchToReact({
              type: "STAGE_COMPLETE",
              stage: this.cfg?.stage ?? 0,
              nextStage: (this.cfg?.stage ?? 0) + 1,
            });
          },
        });
      } else {
        eventBridge.dispatchToReact({
          type: "STAGE_COMPLETE",
          stage: this.cfg?.stage ?? 0,
          nextStage: (this.cfg?.stage ?? 0) + 1,
        });
      }
      return;
    }
    this.isAnimating = true;
    this.currentIndex += 1;
    const to = this.checkpoints[this.currentIndex];

    // Retreat the boss to the next CP + walk persona in parallel.
    if (this.movingBoss) {
      if (this.movingBoss.hpBar) this.movingBoss.hpBar.setHp(1);
      retreatBossTo(
        this,
        this.movingBoss,
        { x: to.x, y: to.y },
        {
          durationMs: WALK_DURATION_MS,
          faceX: to.x + CHAR_X_OFFSET,
        },
      );
    }
    if (this.personaHandle) {
      walkPersonaTo(
        this,
        this.personaHandle,
        { x: to.x + CHAR_X_OFFSET, y: to.y + CHAR_Y_OFFSET },
        { durationMs: WALK_DURATION_MS },
      );
    }
    this.cameras.main.pan(to.x, to.y, WALK_DURATION_MS, "Sine.easeInOut");
    this.time.delayedCall(WALK_DURATION_MS + 100, () => {
      this.isAnimating = false;
    });
  }

  public defeatSuperBoss(): void {
    if (!this.movingBoss) return;
    dissolveBoss(this, this.movingBoss);
  }

  shutdown(): void {
    this.tweens.killAll();
    this.input.removeAllListeners();
  }
}
