/**
 * gameplayIntegration.ts
 *
 * Phase 17 — Full System Integration Layer
 *
 * Wires all completed systems into the actual gameplay experience.
 * This module connects:
 *   - biomeEngine → WorldMapScene
 *   - audioManager → biome/corruption state
 *   - HUD → live game state
 *   - corruption → visual rendering
 *   - boss cinematics → progression events
 *   - particle systems → Phaser rendering
 *
 * INVARIANT: Does NOT rewrite existing systems. Only coordinates them.
 */

import {
  getBiomeConfig,
  getBiomeCSSFilter,
  getCorruptionVisualState,
} from "../config/biomeEngine";
import { audioManager, type BiomeId } from "@/lib/audio/audioManager";
import { eventBridge } from "../utils/event-bridge";
import type { TemplateId } from "@/config/templates";

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION STATE
// ─────────────────────────────────────────────────────────────────────────────

interface GameplayState {
  templateId: TemplateId;
  currentStage: number;
  corruptionLevel: number;
  isTransitioning: boolean;
  lastBiomeId: BiomeId | null;
}

let currentState: GameplayState = {
  templateId: "venture",
  currentStage: 1,
  corruptionLevel: 0,
  isTransitioning: false,
  lastBiomeId: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// BIOME INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update the Phaser scene + audio when the stage or corruption changes.
 * Called by the React layer when Convex data updates.
 */
export function updateBiomeState(
  scene: Phaser.Scene,
  templateId: TemplateId,
  stageNumber: number,
  corruptionLevel: number,
): void {
  const stageChanged = currentState.currentStage !== stageNumber;
  const templateChanged = currentState.templateId !== templateId;
  const corruptionChanged =
    Math.abs(currentState.corruptionLevel - corruptionLevel) > 5;

  if (!stageChanged && !templateChanged && !corruptionChanged) {
    return; // No significant change
  }

  currentState = {
    ...currentState,
    templateId,
    currentStage: stageNumber,
    corruptionLevel,
  };

  // ── 1. Resolve biome config ───────────────────────────────────────────────
  const biomeConfig = getBiomeConfig(templateId, stageNumber);

  // ── 2. Apply scene background color ───────────────────────────────────────
  scene.cameras.main.setBackgroundColor(biomeConfig.bgColor);

  // ── 3. Apply CSS filter to canvas wrapper ─────────────────────────────────
  const cssFilter = getBiomeCSSFilter(templateId, stageNumber, corruptionLevel);
  const canvasWrapper = document.querySelector(
    ".phaser-canvas-wrapper",
  ) as HTMLElement;
  if (canvasWrapper) {
    canvasWrapper.style.filter = cssFilter;
  }

  // ── 4. Apply corruption visual overlay ────────────────────────────────────
  applyCorruptionVisuals(scene, corruptionLevel);

  // ── 5. Update audio ambience (with crossfade) ─────────────────────────────
  if (stageChanged || templateChanged) {
    const biomeId = getBiomeIdForStage(templateId, stageNumber);
    if (biomeId !== currentState.lastBiomeId) {
      audioManager.playAmbience(biomeId); // Crossfade handled by audioManager
      currentState.lastBiomeId = biomeId;
    }
  }

  // ── 6. Layer corruption audio ─────────────────────────────────────────────
  // TODO: Implement corruption audio layering when dedicated SFX are available
}

/**
 * Apply corruption visual overlays to the Phaser scene.
 * Uses the corruptionVisualState config to set:
 *   - Vignette intensity
 *   - Desaturation filter
 *   - Crack texture overlays
 *   - Screen flicker effect
 */
function applyCorruptionVisuals(
  scene: Phaser.Scene,
  corruptionLevel: number,
): void {
  const visual = getCorruptionVisualState(corruptionLevel);

  // Remove existing corruption overlay if present
  const existing = scene.children.getByName("corruption_overlay") as
    | Phaser.GameObjects.Rectangle
    | undefined;
  if (existing) {
    existing.destroy();
  }

  // Remove existing vignette overlay if present
  const existingVignette = scene.children.getByName("corruption_vignette") as
    | Phaser.GameObjects.Graphics
    | undefined;
  if (existingVignette) {
    existingVignette.destroy();
  }

  // Add corruption overlay rectangle
  if (visual.overlayAlpha > 0) {
    const overlay = scene.add.rectangle(
      scene.cameras.main.centerX,
      scene.cameras.main.centerY,
      scene.cameras.main.width * 2,
      scene.cameras.main.height * 2,
      visual.overlayColor,
      visual.overlayAlpha,
    );
    overlay.setName("corruption_overlay");
    overlay.setScrollFactor(0); // Fixed to camera
    overlay.setDepth(9999); // Always on top
    overlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  // Apply vignette gradient graphics overlay (representing shadow closing in)
  if (corruptionLevel > 0) {
    const vignette = scene.add.graphics();
    vignette.setName("corruption_vignette");
    vignette.setScrollFactor(0);
    vignette.setDepth(9998); // just below overlay

    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    const steps = 8;
    const maxAlpha = (corruptionLevel / 100) * 0.65;
    for (let i = 0; i < steps; i++) {
      const scale = 1 - (i / steps);
      const alpha = (i / steps) * maxAlpha;
      vignette.lineStyle(w / steps, 0x000000, alpha);
      vignette.strokeRect(
        (w * (1 - scale)) / 2,
        (h * (1 - scale)) / 2,
        w * scale,
        h * scale
      );
    }
  }

  // Flicker effect for critical corruption (70%+)
  if (visual.showFlicker) {
    scene.tweens.add({
      targets: scene.cameras.main,
      alpha: 0.9,
      duration: 80,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
    });
  }
}

/**
 * Map template + stage to BiomeId for audio ambience.
 */
function getBiomeIdForStage(
  templateId: TemplateId,
  stageNumber: number,
): BiomeId {
  if (templateId === "venture") {
    const mapping: BiomeId[] = [
      "village",
      "forest",
      "arena",
      "artisan",
      "mine",
      "harbour",
      "crossroads",
      "capital",
    ];
    return mapping[stageNumber - 1] ?? "village";
  }

  if (templateId === "academic") {
    const mapping: BiomeId[] = [
      "reading_room",
      "archive_hall",
      "monastery_scriptorium",
      "cartographers_den",
      "council_chamber",
      "grand_archive",
    ];
    return mapping[stageNumber - 1] ?? "reading_room";
  }

  if (templateId === "lab") {
    const mapping: BiomeId[] = [
      "circuit_nexus",
      "clean_room",
      "field_station",
      "data_vault",
      "review_chamber",
      "publishing_reactor",
      "replication_engine",
    ];
    return mapping[stageNumber - 1] ?? "circuit_nexus";
  }

  if (templateId === "creative") {
    const mapping: BiomeId[] = [
      "sacred_grove",
      "dreamscape",
      "artisan_market",
      "gallery_entrance",
      "audience_sea",
      "festival_pinnacle",
    ];
    return mapping[stageNumber - 1] ?? "sacred_grove";
  }

  return "village";
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKPOINT FLOW INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckpointFlowOptions {
  checkpointId: string;
  stage: number;
  checkpoint: number;
  isGold: boolean;
  isStageComplete: boolean;
  corruptionLevel: number;
}

/**
 * Orchestrate the full checkpoint completion flow:
 *   1. Play crossing animation
 *   2. Trigger inter-checkpoint gameplay (if mid-stage)
 *   3. Resolve rewards (XP, gold, badges)
 *   4. Update HUD atoms
 *   5. Trigger biome transition (if stage boundary)
 *   6. Trigger boss reaction
 */
export async function executeCheckpointFlow(
  scene: Phaser.Scene,
  options: CheckpointFlowOptions,
): Promise<void> {
  const {
    checkpointId,
    stage,
    checkpoint,
    isGold,
    isStageComplete,
    corruptionLevel,
  } = options;

  // ── 1. Crossing Animation ──────────────────────────────────────────────────
  eventBridge.dispatchToPhaser({
    type: "PLAY_CHECKPOINT_ANIMATION",
    checkpointId,
    stage,
    variant: isGold ? "gold" : "standard",
  });

  await wait(1200); // Wait for animation to complete

  // ── 2. Play checkpoint SFX ─────────────────────────────────────────────────
  // TODO: Play checkpoint SFX when available
  // audioManager.playSFX(isGold ? "gold_checkpoint" : "checkpoint_clear");

  // ── 3. Inter-checkpoint gameplay (if not stage boundary) ──────────────────
  if (!isStageComplete) {
    // Trigger inter-checkpoint encounter
    // TODO: Implement inter-checkpoint events when system is ready
    // This would spawn henchmen, treasures, corruption shields, etc.

    await wait(800);
  }

  // ── 4. Reward resolution ───────────────────────────────────────────────────
  // XP, gold, badges are handled by Convex mutations in the React layer
  // This is just for visual feedback

  // ── 5. Biome transition (stage boundary) ───────────────────────────────────
  if (isStageComplete) {
    const nextStage = stage + 1;
    if (nextStage <= 8) {

      // Fade out current biome
      scene.cameras.main.fadeOut(600, 0, 0, 0);
      await wait(600);

      // Update biome state (will trigger audio crossfade)
      updateBiomeState(
        scene,
        currentState.templateId,
        nextStage,
        corruptionLevel,
      );

      // Fade in new biome
      scene.cameras.main.fadeIn(800);
      await wait(800);
    }
  }

  // ── 6. Boss reaction ───────────────────────────────────────────────────────
  if (isStageComplete && stage < 8) {
    // Trigger mini-boss retreat or slay cinematic
    // TODO: Implement boss reaction events when cinematics are ready
    console.log(
      `[GameplayIntegration] Boss reaction for stage ${stage} (corruption ${corruptionLevel}%)`,
    );

    await wait(1500);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE SYSTEM INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create and attach biome-specific particle emitters to the Phaser scene.
 * Called when the biome changes.
 */
export function applyBiomeParticles(
  scene: Phaser.Scene,
  templateId: TemplateId,
  stageNumber: number,
): void {
  const biomeConfig = getBiomeConfig(templateId, stageNumber);

  // Remove existing biome particles
  const existingEmitters = scene.children.getByName("biome_particles_emitter");
  if (existingEmitters) {
    (existingEmitters as Phaser.GameObjects.Particles.ParticleEmitter).stop();
    existingEmitters.destroy();
  }

  // Create particle graphics (simple colored circle)
  const graphics = scene.add.graphics();
  graphics.fillStyle(biomeConfig.particles.color, 1);
  graphics.fillCircle(
    biomeConfig.particles.size,
    biomeConfig.particles.size,
    biomeConfig.particles.size,
  );
  graphics.generateTexture(
    "biome_particle",
    biomeConfig.particles.size * 2,
    biomeConfig.particles.size * 2,
  );
  graphics.destroy();

  // Create particle emitter
  const emitter = scene.add.particles(0, 0, "biome_particle", {
    x: { min: 0, max: scene.cameras.main.width },
    y: -20,
    lifespan: biomeConfig.particles.lifetime,
    speedY: {
      min: biomeConfig.particles.speed[0],
      max: biomeConfig.particles.speed[1],
    },
    speedX: biomeConfig.particles.drift ? { min: -10, max: 10 } : 0,
    alpha: {
      start: biomeConfig.particles.alpha[1],
      end: biomeConfig.particles.alpha[0],
    },
    scale: { start: 1, end: 0.5 },
    frequency: 1000 / biomeConfig.particles.frequency,
    gravityY: biomeConfig.particles.gravity,
    blendMode: Phaser.BlendModes.ADD,
  });

  emitter.setName("biome_particles_emitter");
  emitter.setDepth(-10); // Behind everything
  emitter.setScrollFactor(0); // Fixed to camera
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize audio manager with user gesture.
 * Called on first click/tap in the game.
 */
export function initializeAudio(): void {
  // Audio is initialized by audioManager.init() in WorldMapScene.create()
}

/**
 * Update audio layers based on gameplay state.
 */
export function updateAudioLayers(
  corruptionLevel: number,
  bossProximity: number, // 0–1, how close player is to boss
): void {
  // Layer corruption ducking on ambient music
  if (corruptionLevel >= 60) {
    audioManager.setMusicVolume(0.4); // Duck music when corruption is high
  } else {
    audioManager.setMusicVolume(0.7); // Normal music volume
  }

  // Boss proximity audio cue (heartbeat, tension)
  // TODO: Implement boss proximity SFX when assets are available
}

// ─────────────────────────────────────────────────────────────────────────────
// HUD INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sync Phaser game state → HUD Jotai atoms.
 * Called whenever checkpoint state or corruption updates.
 */
export function syncHUDState(data: {
  templateId: TemplateId;
  stage: number;
  checkpoint: number;
  corruptionLevel: number;
  completedCheckpoints: number;
  totalCheckpoints: number;
  goldCheckpoints: number;
}): void {
  const {
    templateId,
    stage,
    checkpoint,
    corruptionLevel,
    completedCheckpoints,
    totalCheckpoints,
    goldCheckpoints,
  } = data;

  const biomeConfig = getBiomeConfig(templateId, stage);

  // HUD state is already synced via the React layer's useEffect hooks
  // that subscribe to Convex data. This function is for future use when
  // we need to push Phaser-side state updates to React.
}

// ─────────────────────────────────────────────────────────────────────────────
// BOSS LIVE EXPERIENCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update boss visual state based on corruption and insight fragments.
 */
export function updateBossVisuals(
  scene: Phaser.Scene,
  bossSlug: string,
  corruptionLevel: number,
  insightFragments: number,
): void {
  // Boss becomes more defined as corruption rises
  const bossOpacity = Math.min(1, corruptionLevel / 100 + 0.2);

  // Insight fragments weaken boss visually (reduce opacity, add cracks)
  const weakenedOpacity = Math.max(0.3, bossOpacity - insightFragments * 0.15);

  // Find boss sprite in scene
  const boss = scene.children.getByName(`boss_${bossSlug}`) as
    | Phaser.GameObjects.Sprite
    | undefined;
  if (boss) {
    boss.setAlpha(weakenedOpacity);

    // Add glitch effect if corruption > 80
    if (corruptionLevel > 80) {
      scene.tweens.add({
        targets: boss,
        x: boss.x + Phaser.Math.Between(-2, 2),
        y: boss.y + Phaser.Math.Between(-2, 2),
        duration: 50,
        yoyo: true,
        repeat: -1,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const gameplayIntegration = {
  updateBiomeState,
  executeCheckpointFlow,
  applyBiomeParticles,
  initializeAudio,
  updateAudioLayers,
  syncHUDState,
  updateBossVisuals,
};
