/**
 * CorruptionRenderer.ts
 *
 * Applies universal corruption visuals per stage on the world map.
 * Works on any biome without asset swaps — overlays, particles, pulses, vignette.
 */

import * as Phaser from "phaser";
import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";
import {
  getMaxStageCorruption,
  getStageCorruptionLevel,
  resolveCorruptionProfile,
  type CorruptionProfile,
  type StageCorruptionInput,
} from "./corruptionSystem";
import {
  StageEnvironmentBlur,
  type CheckpointWorldPosition,
} from "./StageEnvironmentBlur";

/** Above map tiles/landmarks, below persona/checkpoints (game layer = 20) */
const LAYER_DEPTH = 18;
const TEXTURE_HOSTILE = "corruption_mote";
const TEXTURE_LIFE = "corruption_life_mote";

interface StageCorruptionLayer {
  stageId: number;
  container: Phaser.GameObjects.Container;
  darkOverlay: Phaser.GameObjects.Rectangle;
  hazeOverlay: Phaser.GameObjects.Rectangle;
  vignette: Phaser.GameObjects.Graphics;
  hostileEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  lifeEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  pulseTween: Phaser.Tweens.Tween | null;
  flickerTimer: Phaser.Time.TimerEvent | null;
  lastLevel: number;
}

export interface CorruptionRendererContext {
  ventureCorruption: number;
  checkpoints: CheckpointState[];
  currentStage: number;
  slainStages: ReadonlySet<number>;
  stageWidth: number;
  mapWidth: number;
  mapHeight: number;
  totalStages: number;
  /** Every stage that has checkpoints on the map (1..totalStages). */
  stageIds: readonly number[];
  checkpointPositions: CheckpointWorldPosition[];
  environmentBlur: StageEnvironmentBlur | null;
}

export class CorruptionRenderer {
  private readonly scene: Phaser.Scene;
  private readonly layers = new Map<number, StageCorruptionLayer>();
  private globalCracks: Phaser.GameObjects.Graphics | null = null;
  private lastGlobalLevel = -1;
  private mapWidth = 0;
  private mapHeight = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.ensureTextures();
  }

  private ensureTextures(): void {
    if (!this.scene.textures.exists(TEXTURE_HOSTILE)) {
      const g = this.scene.add.graphics();
      g.fillStyle(0x6b21a8, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture(TEXTURE_HOSTILE, 8, 8);
      g.destroy();
    }
    if (!this.scene.textures.exists(TEXTURE_LIFE)) {
      const g = this.scene.add.graphics();
      g.fillStyle(0xfde68a, 1);
      g.fillCircle(3, 3, 3);
      g.generateTexture(TEXTURE_LIFE, 6, 6);
      g.destroy();
    }
  }

  destroy(): void {
    for (const layer of this.layers.values()) {
      this.destroyStageLayer(layer);
    }
    this.layers.clear();
    this.globalCracks?.destroy();
    this.globalCracks = null;
  }

  private destroyStageLayer(layer: StageCorruptionLayer): void {
    layer.pulseTween?.stop();
    layer.flickerTimer?.destroy();
    layer.hostileEmitter?.stop();
    layer.lifeEmitter?.stop();
    layer.container.destroy(true);
  }

  ensureStage(stageId: number, stageWidth: number, mapHeight: number): void {
    if (this.layers.has(stageId)) return;

    const index = stageId - 1;
    const x = index * stageWidth;
    const container = this.scene.add.container(x, 0);
    container.setDepth(LAYER_DEPTH);
    container.setName(`corruption_stage_${stageId}`);

    const darkOverlay = this.scene.add.rectangle(
      stageWidth / 2,
      mapHeight / 2,
      stageWidth,
      mapHeight,
      0x120018,
      0,
    );
    darkOverlay.setBlendMode(Phaser.BlendModes.NORMAL);
    container.add(darkOverlay);

    const hazeOverlay = this.scene.add.rectangle(
      stageWidth / 2,
      mapHeight / 2,
      stageWidth,
      mapHeight,
      0x4c1d95,
      0,
    );
    hazeOverlay.setBlendMode(Phaser.BlendModes.ADD);
    container.add(hazeOverlay);

    const vignette = this.scene.add.graphics();
    container.add(vignette);

    const hostileEmitter = this.scene.add.particles(0, 0, TEXTURE_HOSTILE, {
      x: { min: 40, max: stageWidth - 40 },
      y: { min: 80, max: mapHeight - 80 },
      lifespan: 2200,
      speed: { min: 8, max: 48 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.55, end: 0 },
      frequency: -1,
      blendMode: Phaser.BlendModes.ADD,
    });
    hostileEmitter.stop();
    container.add(hostileEmitter);

    const lifeEmitter = this.scene.add.particles(0, 0, TEXTURE_LIFE, {
      x: { min: 0, max: stageWidth },
      y: { min: 0, max: mapHeight * 0.75 },
      lifespan: 6000,
      speedY: { min: -18, max: -6 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.4, end: 0 },
      frequency: -1,
      blendMode: Phaser.BlendModes.ADD,
    });
    lifeEmitter.stop();
    container.add(lifeEmitter);

    this.layers.set(stageId, {
      stageId,
      container,
      darkOverlay,
      hazeOverlay,
      vignette,
      hostileEmitter,
      lifeEmitter,
      pulseTween: null,
      flickerTimer: null,
      lastLevel: -1,
    });
  }

  sync(
    ctx: CorruptionRendererContext,
    parent: Phaser.GameObjects.Container,
  ): void {
    this.mapWidth = ctx.mapWidth;
    this.mapHeight = ctx.mapHeight;

    const baseInput: Omit<StageCorruptionInput, "stageId"> = {
      ventureCorruption: ctx.ventureCorruption,
      checkpoints: ctx.checkpoints,
      currentStage: ctx.currentStage,
      slainStages: ctx.slainStages,
      totalStages: ctx.totalStages,
    };

    const stageIds =
      ctx.stageIds.length > 0
        ? ctx.stageIds
        : Array.from({ length: ctx.totalStages }, (_, i) => i + 1);

    for (const stageId of stageIds) {
      this.ensureStage(stageId, ctx.stageWidth, ctx.mapHeight);
      const level = getStageCorruptionLevel({ ...baseInput, stageId });
      const layer = this.layers.get(stageId);
      if (layer) {
        layer.lastLevel = -1;
        if (layer.container.parentContainer !== parent) {
          parent.add(layer.container);
        }
      }
      this.applyStageProfile(stageId, level, ctx.stageWidth, ctx.mapHeight);
    }

    const globalLevel = Math.max(
      ctx.ventureCorruption,
      getMaxStageCorruption([...stageIds], baseInput),
    );
    this.lastGlobalLevel = globalLevel;
    this.applyGlobalEffects(globalLevel);

    if (ctx.environmentBlur) {
      for (const stageId of stageIds) {
        const level = getStageCorruptionLevel({ ...baseInput, stageId });
        ctx.environmentBlur.updateStage(
          stageId,
          level,
          ctx.checkpointPositions,
        );
      }
    }
  }

  private applyStageProfile(
    stageId: number,
    level: number,
    stageWidth: number,
    mapHeight: number,
  ): void {
    const layer = this.layers.get(stageId);
    if (!layer) return;

    if (Math.abs(level - layer.lastLevel) < 0.25 && layer.lastLevel >= 0) {
      return;
    }
    layer.lastLevel = level;

    const profile = resolveCorruptionProfile(level);

    if (level < 1) {
      layer.container.setVisible(false);
      layer.hostileEmitter.stop();
      layer.lifeEmitter.stop();
      layer.pulseTween?.stop();
      layer.flickerTimer?.remove(false);
      layer.flickerTimer = null;
      return;
    }

    layer.container.setVisible(true);
    layer.container.setAlpha(1);
    this.applyOverlay(layer, profile, stageWidth, mapHeight);
    this.applyVignette(layer, profile, stageWidth, mapHeight);
    this.applyParticles(layer, profile, stageWidth, mapHeight);
    this.applyPulse(layer, profile);
    this.applyFlicker(layer, profile);
  }

  private applyOverlay(
    layer: StageCorruptionLayer,
    profile: CorruptionProfile,
    stageWidth: number,
    mapHeight: number,
  ): void {
    layer.darkOverlay.setFillStyle(0x0a000f, profile.overlayAlpha);
    layer.darkOverlay.setSize(stageWidth, mapHeight);
    layer.darkOverlay.setPosition(stageWidth / 2, mapHeight / 2);
    layer.darkOverlay.setAlpha(1);

    layer.hazeOverlay.setFillStyle(profile.hazeColor, profile.hazeAlpha);
    layer.hazeOverlay.setSize(stageWidth, mapHeight);
    layer.hazeOverlay.setPosition(stageWidth / 2, mapHeight / 2);
    layer.hazeOverlay.setAlpha(1);
  }

  private applyVignette(
    layer: StageCorruptionLayer,
    profile: CorruptionProfile,
    stageWidth: number,
    mapHeight: number,
  ): void {
    const g = layer.vignette;
    g.clear();
    if (profile.vignetteIntensity <= 0.02) return;

    const edge = Math.min(stageWidth, mapHeight) * 0.28;
    const alpha = profile.vignetteIntensity * 0.72;
    g.fillStyle(0x000000, alpha);

    g.fillRect(0, 0, stageWidth, edge);
    g.fillRect(0, mapHeight - edge, stageWidth, edge);
    g.fillRect(0, 0, edge, mapHeight);
    g.fillRect(stageWidth - edge, 0, edge, mapHeight);
  }

  private applyParticles(
    layer: StageCorruptionLayer,
    profile: CorruptionProfile,
    stageWidth: number,
    mapHeight: number,
  ): void {
    const density = profile.particleDensity * profile.animationDensityMul;
    const hostileFreq = Math.max(40, 420 / density);
    const chaos = profile.particleChaos;

    if (profile.hostileMotion > 0.08) {
      layer.hostileEmitter.setConfig({
        x: { min: 24, max: stageWidth - 24 },
        y: { min: 60, max: mapHeight - 60 },
        lifespan: Math.round(lerp(3200, 1400, chaos)),
        speedX: {
          min: lerp(-12, -55, chaos),
          max: lerp(12, 55, chaos),
        },
        speedY: {
          min: lerp(-28, -70, chaos),
          max: lerp(8, 40, chaos),
        },
        angle: {
          min: chaos > 0.5 ? 0 : 250,
          max: chaos > 0.5 ? 360 : 290,
        },
        scale: { start: lerp(0.25, 0.7, chaos), end: 0 },
        alpha: { start: lerp(0.25, 0.65, chaos), end: 0 },
        frequency: hostileFreq,
        tint: profile.t > 0.65 ? 0x991b1b : 0x581c87,
      });
      if (!layer.hostileEmitter.emitting) layer.hostileEmitter.start();
    } else {
      layer.hostileEmitter.stop();
    }

    const lifeFreq = Math.max(120, 900 / (profile.wildlifeDensity * 2));
    if (profile.wildlifeDensity > 0.12) {
      layer.lifeEmitter.setConfig({
        x: { min: 0, max: stageWidth },
        y: { min: 40, max: mapHeight * 0.7 },
        lifespan: 7000,
        speedY: { min: -22, max: -8 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.35 * profile.wildlifeDensity, end: 0 },
        frequency: lifeFreq,
        tint: [0xfef3c7, 0xd9f99d, 0xffffff],
      });
      if (!layer.lifeEmitter.emitting) layer.lifeEmitter.start();
    } else {
      layer.lifeEmitter.stop();
    }
  }

  private applyPulse(layer: StageCorruptionLayer, profile: CorruptionProfile): void {
    layer.pulseTween?.stop();

    if (profile.hostileMotion < 0.2) {
      layer.darkOverlay.setAlpha(1);
      layer.hazeOverlay.setAlpha(1);
      return;
    }

    const baseAlpha = profile.overlayAlpha;
    layer.pulseTween = this.scene.tweens.add({
      targets: layer.darkOverlay,
      alpha: {
        from: 0.88,
        to: 1.08,
      },
      duration: profile.pulsePeriodMs / 2,
      yoyo: true,
      repeat: -1,
      ease: profile.hostileMotion > 0.6 ? "Sine.easeInOut" : "Quad.easeInOut",
    });
  }

  private applyFlicker(layer: StageCorruptionLayer, profile: CorruptionProfile): void {
    layer.flickerTimer?.remove(false);
    layer.flickerTimer = null;

    if (!profile.showFlicker) return;

    layer.flickerTimer = this.scene.time.addEvent({
      delay: Phaser.Math.Between(90, 220),
      loop: true,
      callback: () => {
        if (!layer.container.active) return;
        const spike = Phaser.Math.FloatBetween(0.92, 1.08);
        layer.hazeOverlay.setAlpha(spike);
      },
    });
  }

  private applyGlobalEffects(level: number): void {
    const profile = resolveCorruptionProfile(level);

    const canvasWrapper = document.querySelector(
      ".phaser-canvas-wrapper",
    ) as HTMLElement | null;
    if (canvasWrapper) {
      canvasWrapper.style.filter =
        profile.cssFilter === "none" ? "" : profile.cssFilter;
    }

    if (profile.showCracks) {
      this.drawGlobalCracks(level);
    } else {
      this.globalCracks?.clear();
    }
  }

  private drawGlobalCracks(level: number): void {
    if (!this.globalCracks) {
      this.globalCracks = this.scene.add.graphics();
      this.globalCracks.setDepth(19);
      this.globalCracks.setScrollFactor(1);
    }
    const g = this.globalCracks;
    g.clear();

    const numCracks = Math.floor(level / 12);
    g.lineStyle(1.5 + (level / 100) * 2.5, 0x11081a, 0.35 + (level / 100) * 0.35);

    const mapWidth = this.mapWidth || this.scene.scale.width * 4;
    const mapHeight = this.mapHeight || this.scene.scale.height;

    for (let i = 0; i < numCracks; i++) {
      const seedX = (Math.sin(i * 12345.67) * 0.5 + 0.5) * mapWidth;
      const seedY = (Math.cos(i * 98765.43) * 0.5 + 0.5) * mapHeight;
      g.beginPath();
      g.moveTo(seedX, seedY);
      let currX = seedX;
      let currY = seedY;
      const segments = 3 + Math.floor((level / 100) * 5);
      for (let s = 0; s < segments; s++) {
        const angle = Math.sin(i * 10 + s) * Math.PI * 2;
        const length = 18 + Math.floor(Math.cos(i * 5 + s) * 12) + level / 12;
        currX += Math.cos(angle) * length;
        currY += Math.sin(angle) * length;
        g.lineTo(currX, currY);
      }
      g.strokePath();
    }
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
