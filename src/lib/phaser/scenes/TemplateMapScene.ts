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
import {
  getCurrentPersonaId,
  loadPersonaSprites,
  registerPersonaAnimations,
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
    const { mapKey, mapWidth, mapHeight, biomeLabel } = this.cfg;

    // Backdrop
    this.add.image(0, 0, mapKey).setOrigin(0, 0).setDepth(0);

    // Camera — mirrors Village: responsive zoom, bounds set to map size.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, mapWidth, mapHeight);
    const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
    const zoom = vw < 480 ? 0.5 : vw < 768 ? 0.7 : vw < 1024 ? 0.9 : 1.0;
    cam.setZoom(zoom);
    const hub = hubCheckpoint(mapWidth, mapHeight);
    cam.centerOn(hub.x, hub.y);

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

    // Persona spawn — at the hub
    this.personaHandle = spawnPersonaCharacter(this, hub, {
      xOffset: CHAR_X_OFFSET,
      yOffset: CHAR_Y_OFFSET,
    });

    // Boss spawn — slightly east + one CP-height down from the hub so
    // the boss reads as "guarding the path" and doesn't overlap the persona.
    this.movingBoss = spawnMovingBoss(this, this.cfg.stage ?? 0, boss, {
      x: hub.x + 140,
      y: hub.y,
    }, { showHpBar: true });
    this.movingBoss.sprite.setFlipX(true); // face the persona (which is to its left)

    // Camera follow — smooth follow of the persona so movement reads.
    if (this.personaHandle) {
      cam.startFollow(this.personaHandle.sprite, true, 0.08, 0.08);
      cam.setDeadzone(120, 100);
    }

    // Free-roam WASD — force:true so it drives the persona without editor mode.
    attachEditorTestWalk(this, {
      getCharacter: () => this.personaHandle?.sprite ?? null,
      isBlocked: () => false, // no per-map blockers yet on template scenes
      mapWidth,
      mapHeight,
      force: true,
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
    this.isAnimating = true;
    // Template maps only have one hub — the "advance" beat here just
    // retreats the boss slightly east + walks the persona forward as
    // a visual celebration, then resets busy. React drives the actual
    // stage progression via STAGE_COMPLETE for these templates.
    const hub = hubCheckpoint(this.cfg.mapWidth, this.cfg.mapHeight);
    const nextX = hub.x + 240;
    if (this.movingBoss) {
      retreatBossTo(this, this.movingBoss, { x: nextX, y: hub.y }, {
        durationMs: WALK_DURATION_MS,
      });
    }
    if (this.personaHandle) {
      walkPersonaTo(
        this,
        this.personaHandle,
        { x: hub.x + 40, y: hub.y + CHAR_Y_OFFSET },
        { durationMs: WALK_DURATION_MS },
      );
    }
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
