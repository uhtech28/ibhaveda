/**
 * biomeEngine.ts
 *
 * Phase 14 — Template-Aware Biome Engine
 *
 * Manages the visual and environmental state of the Phaser world map
 * based on the active template's biome configurations.
 *
 * Responsibilities:
 *  1. Resolve the correct BiomeThemeConfig for a given template + stage
 *  2. Apply particle systems (archive_dust, lab_sparks, brush_strokes, circuit_nodes)
 *  3. Apply post-processing shader/filter layers (parchment_grain, electricity, dream_fog)
 *  4. Apply weather overlays (dust_motes, rain, fog)
 *  5. Drive corruption visual overlay (desaturation + vignette + crack overlays)
 *
 * INVARIANT: This engine is a pure configuration resolver.
 * It does NOT modify WorldMapScene.ts directly.
 * WorldMapScene.ts should call biomeEngine.getBiomeConfig(templateId, stage)
 * and use the returned config to set Phaser scene properties.
 */

import {
  getTemplate,
  type TemplateId,
} from "@/config/templates";
import type { BiomeThemeConfig, ParticleStyle, ShaderType, WeatherEffect } from "@/config/templates/templateTypes";

// Inline corruption phase helpers (mirrors corruptionEngine.ts for client use)
export type CorruptionPhase = "calm" | "creeping" | "desaturated" | "urgent" | "critical";

export function getCorruptionPhase(level: number): CorruptionPhase {
  if (level >= 81) return "critical";
  if (level >= 61) return "urgent";
  if (level >= 41) return "desaturated";
  if (level >= 21) return "creeping";
  return "calm";
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE SYSTEM CONFIGS
// ─────────────────────────────────────────────────────────────────────────────

export interface ParticleSystemConfig {
  style: ParticleStyle;
  /** Phaser hex color for particles */
  color: number;
  /** Number of particles to emit per second */
  frequency: number;
  /** Particle lifetime in ms */
  lifetime: number;
  /** Particle size in pixels */
  size: number;
  /** Alpha range [min, max] */
  alpha: [number, number];
  /** Speed range [min, max] px/s */
  speed: [number, number];
  /** Gravity (y-direction, pixels/s²) */
  gravity: number;
  /** Whether particles drift with a sine wave */
  drift: boolean;
}

const PARTICLE_CONFIGS: Record<ParticleStyle, ParticleSystemConfig> = {
  circuit_nodes: {
    style: "circuit_nodes",
    color: 0x6366f1,
    frequency: 2,
    lifetime: 4000,
    size: 2,
    alpha: [0.2, 0.6],
    speed: [10, 30],
    gravity: 0,
    drift: true,
  },
  archive_dust: {
    style: "archive_dust",
    color: 0xd4a853,
    frequency: 4,
    lifetime: 6000,
    size: 1,
    alpha: [0.1, 0.4],
    speed: [5, 15],
    gravity: -2,  // Floats upward slowly
    drift: true,
  },
  lab_sparks: {
    style: "lab_sparks",
    color: 0x06d6a0,
    frequency: 6,
    lifetime: 800,
    size: 2,
    alpha: [0.5, 1.0],
    speed: [30, 80],
    gravity: 20,
    drift: false,
  },
  brush_strokes: {
    style: "brush_strokes",
    color: 0xffd166,
    frequency: 1,
    lifetime: 8000,
    size: 4,
    alpha: [0.05, 0.25],
    speed: [5, 12],
    gravity: -1,
    drift: true,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SHADER / POST-PROCESSING CONFIGS
// ─────────────────────────────────────────────────────────────────────────────

export interface ShaderConfig {
  type: ShaderType;
  /** CSS filter string to apply to the Phaser canvas wrapper div */
  cssFilter: string;
  /** Phaser post-FX pipeline key (if using Phaser pipeline) */
  phaserPipeline?: string;
  /** Intensity (0–1) */
  intensity: number;
}

const SHADER_CONFIGS: Record<ShaderType, ShaderConfig> = {
  none: {
    type: "none",
    cssFilter: "none",
    intensity: 0,
  },
  parchment_grain: {
    type: "parchment_grain",
    cssFilter: "sepia(0.15) contrast(1.05) brightness(0.95)",
    intensity: 0.3,
  },
  electricity: {
    type: "electricity",
    cssFilter: "hue-rotate(180deg) saturate(1.4) brightness(1.1)",
    intensity: 0.4,
  },
  dream_fog: {
    type: "dream_fog",
    cssFilter: "blur(0.3px) saturate(0.85) brightness(1.05)",
    intensity: 0.25,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WEATHER CONFIGS
// ─────────────────────────────────────────────────────────────────────────────

export interface WeatherConfig {
  type: WeatherEffect;
  /** CSS overlay gradient for weather visual */
  overlayGradient: string;
  /** Phaser particle config for weather particles */
  particleColor: number;
  particleCount: number;
  particleSpeed: [number, number];
  particleAlpha: [number, number];
  particleAngle: number; // degrees — direction of rain/dust
}

const WEATHER_CONFIGS: Record<WeatherEffect, WeatherConfig> = {
  none: {
    type: "none",
    overlayGradient: "none",
    particleColor: 0xffffff,
    particleCount: 0,
    particleSpeed: [0, 0],
    particleAlpha: [0, 0],
    particleAngle: 270,
  },
  dust_motes: {
    type: "dust_motes",
    overlayGradient: "radial-gradient(ellipse at center, rgba(212,168,83,0.03) 0%, rgba(0,0,0,0) 70%)",
    particleColor: 0xd4a853,
    particleCount: 20,
    particleSpeed: [2, 8],
    particleAlpha: [0.1, 0.3],
    particleAngle: 260,
  },
  rain: {
    type: "rain",
    overlayGradient: "linear-gradient(180deg, rgba(6,214,160,0.03) 0%, rgba(0,0,0,0) 100%)",
    particleColor: 0x87ceeb,
    particleCount: 80,
    particleSpeed: [100, 200],
    particleAlpha: [0.2, 0.5],
    particleAngle: 250, // Slight diagonal rain
  },
  fog: {
    type: "fog",
    overlayGradient: "radial-gradient(ellipse at center, rgba(255,209,102,0.06) 0%, rgba(0,0,0,0.2) 100%)",
    particleColor: 0xe8b4d0,
    particleCount: 5,
    particleSpeed: [3, 10],
    particleAlpha: [0.02, 0.08],
    particleAngle: 180,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CORRUPTION VISUAL OVERLAY
// ─────────────────────────────────────────────────────────────────────────────

export interface CorruptionVisualState {
  phase: CorruptionPhase;
  /** Phaser rectangle alpha for corruption overlay (0–0.8) */
  overlayAlpha: number;
  /** Phaser hex color of corruption overlay */
  overlayColor: number;
  /** Whether to show crack texture overlay */
  showCracks: boolean;
  /** Whether to animate screen flicker */
  showFlicker: boolean;
  /** Vignette intensity (0–1) */
  vignetteIntensity: number;
  /** CSS grayscale filter percentage (0–100) */
  grayscalePct: number;
  /** Whether boss glow aura is visible */
  showBossGlow: boolean;
  /** Boss glow color */
  bossGlowColor: number;
}

export function getCorruptionVisualState(corruptionLevel: number): CorruptionVisualState {
  const phase = getCorruptionPhase(corruptionLevel);
  const t = corruptionLevel / 100;

  return {
    phase,
    overlayAlpha: Math.min(0.6, t * 0.6),
    overlayColor: corruptionLevel >= 60 ? 0x800000 : 0x3b0060,
    showCracks: corruptionLevel >= 40,
    showFlicker: corruptionLevel >= 70,
    vignetteIntensity: Math.min(1, t * 1.2),
    grayscalePct: Math.max(0, (corruptionLevel - 30) * 1.5),
    showBossGlow: corruptionLevel >= 80,
    bossGlowColor: 0xff0000,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVED BIOME CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export interface ResolvedBiomeConfig {
  /** The raw biome theme from the template config */
  biome: BiomeThemeConfig;
  /** Particle system config */
  particles: ParticleSystemConfig;
  /** Post-processing shader */
  shader: ShaderConfig;
  /** Weather overlay */
  weather: WeatherConfig;
  /** Phaser scene background color (hex string) */
  bgColor: string;
  /** Primary color for Phaser tinting */
  primaryColor: number;
  /** Stage name */
  stageName: string;
  /** Biome name */
  biomeName: string;
  /** Stage icon */
  stageIcon: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BIOME ENGINE API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the complete biome configuration for a given template and stage.
 * The WorldMapScene calls this whenever the stage changes.
 *
 * @param templateId  Active template ID
 * @param stageNumber 1-indexed stage number
 * @returns Complete resolved biome config for Phaser
 */
export function getBiomeConfig(
  templateId: TemplateId,
  stageNumber: number,
): ResolvedBiomeConfig {
  const template = getTemplate(templateId);
  const stage = template.stages[stageNumber - 1] ?? template.stages[0];
  const biome = stage.biomeTheme;

  return {
    biome,
    particles: {
      ...PARTICLE_CONFIGS[biome.particleStyle],
      color: biome.primaryColor,
    },
    shader: SHADER_CONFIGS[biome.shaderType],
    weather: WEATHER_CONFIGS[biome.weatherEffect],
    bgColor: biome.bgColor,
    primaryColor: biome.primaryColor,
    stageName: stage.name,
    biomeName: stage.biomeName,
    stageIcon: stage.icon,
  };
}

/**
 * Get the CSS filter string to apply to the canvas wrapper for the current
 * template + corruption combination.
 */
export function getBiomeCSSFilter(
  templateId: TemplateId,
  stageNumber: number,
  corruptionLevel: number,
): string {
  const resolved = getBiomeConfig(templateId, stageNumber);
  const shaderFilter = resolved.shader.cssFilter;
  const corruptionVisual = getCorruptionVisualState(corruptionLevel);

  const grayscale = corruptionVisual.grayscalePct > 0
    ? `grayscale(${corruptionVisual.grayscalePct}%)`
    : "";

  const brightness = corruptionLevel > 60
    ? `brightness(${1 - (corruptionLevel - 60) / 200})`
    : "";

  const filters = [shaderFilter, grayscale, brightness].filter(
    (f) => f && f !== "none",
  );
  return filters.length > 0 ? filters.join(" ") : "none";
}

/**
 * Get the ambience BiomeId to play for a given template + stage.
 * Used by audioManager.playAmbience().
 */
export function getAmbienceForStage(
  templateId: TemplateId,
  stageNumber: number,
): string {
  const template = getTemplate(templateId);
  return template.audioProfile.ambienceMap[stageNumber] ?? "village";
}

/**
 * Get the music track ID to play for a given template + stage.
 * Used by audioManager.playMusic().
 */
export function getStageThemeForTemplate(
  templateId: TemplateId,
  stageNumber: number,
): string {
  const template = getTemplate(templateId);
  return template.audioProfile.stageThemes[stageNumber] ?? `stage_${stageNumber}`;
}
