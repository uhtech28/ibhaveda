/**
 * corruptionSystem.ts
 *
 * Universal corruption profile (0–100%) for any biome or environment.
 * Asset-agnostic: drives overlays, particles, motion language, and lighting
 * through interpolated parameters — not texture swaps.
 */

import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";

export type CorruptionPhase =
  | "pure"
  | "calm"
  | "stressed"
  | "corrupted"
  | "critical";

export interface CorruptionProfile {
  /** Normalized 0–1 */
  t: number;
  phase: CorruptionPhase;
  /** Color wash over the stage (multiply blend) */
  overlayAlpha: number;
  overlayColor: number;
  /** Edge darkening 0–1 */
  vignetteIntensity: number;
  /** Color matrix: 0 = full color, 1 = fully desaturated */
  desaturate: number;
  /** Camera/scene brightness multiplier */
  brightness: number;
  contrast: number;
  /** 1.0 at 0% corruption → 4.0 at 100% (+300% animation density) */
  animationDensityMul: number;
  /** 0 = natural motion, 1 = hostile erratic motion */
  hostileMotion: number;
  /** Overlay pulse period (ms); lower = faster stress */
  pulsePeriodMs: number;
  /** Particle emit interval divisor (higher = more particles) */
  particleDensity: number;
  /** 0 = calm drift, 1 = chaotic vectors */
  particleChaos: number;
  /** Infection tint layer (ADD blend) */
  hazeAlpha: number;
  hazeColor: number;
  showFlicker: boolean;
  showCracks: boolean;
  showBossGlow: boolean;
  /** Ambient life particles 0–1 (pollen, motes) */
  wildlifeDensity: number;
  /** Global canvas CSS filter fragment */
  cssFilter: string;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export function getCorruptionPhase(level: number): CorruptionPhase {
  if (level <= 5) return "pure";
  if (level <= 25) return "calm";
  if (level <= 55) return "stressed";
  if (level <= 80) return "corrupted";
  return "critical";
}

/**
 * Continuous corruption profile for a given level (0–100).
 */
export function resolveCorruptionProfile(level: number): CorruptionProfile {
  const t = clamp01(level / 100);
  const s = smoothstep(t);
  const phase = getCorruptionPhase(level);

  const overlayColor =
    level >= 70
      ? 0x4a0008
      : level >= 45
        ? 0x2a0038
        : level >= 20
          ? 0x1a1028
          : 0x0a0810;

  const desaturate = clamp01(lerp(0, 0.85, s));
  const brightness = lerp(1, 0.62, s);
  const contrast = lerp(1, 1.18, s);

  const grayscalePct = Math.round(lerp(0, 88, s));
  const brightnessCss =
    level > 8 ? `brightness(${brightness.toFixed(2)})` : "";
  const contrastCss =
    level > 20 ? `contrast(${contrast.toFixed(2)})` : "";
  const sepiaCss = level > 45 ? `sepia(${lerp(0, 0.35, s).toFixed(2)})` : "";

  const cssParts = [
    grayscalePct > 0 ? `grayscale(${grayscalePct}%)` : "",
    brightnessCss,
    contrastCss,
    sepiaCss,
  ].filter(Boolean);

  return {
    t,
    phase,
    overlayAlpha: lerp(0.06, 0.72, s),
    overlayColor,
    vignetteIntensity: lerp(0, 0.95, s),
    desaturate,
    brightness,
    contrast,
    animationDensityMul: lerp(1, 4, s),
    hostileMotion: s,
    pulsePeriodMs: Math.round(lerp(4200, 680, s)),
    particleDensity: lerp(0.5, 3.2, s),
    particleChaos: s,
    /** Infection haze (ADD blend) — stronger at high corruption */
    hazeAlpha: lerp(0, 0.38, s),
    hazeColor: level >= 65 ? 0x7f1d1d : 0x4c1d95,
    showFlicker: level >= 55,
    showCracks: level >= 20,
    showBossGlow: level >= 78,
    wildlifeDensity: lerp(1, 0.05, s),
    cssFilter: cssParts.length > 0 ? cssParts.join(" ") : "none",
  };
}

export interface StageCorruptionInput {
  ventureCorruption: number;
  stageId: number;
  checkpoints: CheckpointState[];
  currentStage: number;
  slainStages: ReadonlySet<number>;
  totalStages: number;
}

/**
 * Per-stage effective corruption: venture meter + checkpoint healing + boss purification.
 */
export function getStageCorruptionLevel(input: StageCorruptionInput): number {
  const {
    ventureCorruption,
    stageId,
    checkpoints,
    currentStage,
    slainStages,
    totalStages,
  } = input;

  const base = Math.max(0, Math.min(100, ventureCorruption));

  if (slainStages.has(stageId)) {
    return Math.min(12, base * 0.08);
  }

  const stageCps = checkpoints.filter((cp) => cp.stage === stageId);
  if (stageCps.length === 0) {
    return base;
  }

  const allLocked = stageCps.every((cp) => cp.status === "locked");
  if (allLocked && stageId > currentStage) {
    const distance = stageId - currentStage;
    const futureDampen = Math.max(0.55, 1 - distance * 0.08);
    return base * futureDampen;
  }

  let progressHeal = 0;
  for (const cp of stageCps) {
    if (cp.status === "gold") {
      progressHeal += 1;
    } else if (cp.status === "completed") {
      progressHeal += 0.78;
    } else if (cp.status === "in_progress" || cp.status === "partial") {
      const tasks = (cp.t1 ? 1 : 0) + (cp.t2 ? 1 : 0) + (cp.t3 ? 1 : 0);
      progressHeal += tasks * 0.22;
    } else if (cp.status === "active") {
      progressHeal += 0.08;
    }
  }

  const healRatio = progressHeal / stageCps.length;
  const maxCpHeal = 0.68;
  let effective = base * (1 - healRatio * maxCpHeal);

  if (stageId < currentStage && !slainStages.has(stageId)) {
    effective *= 0.75;
  }

  if (stageId === totalStages && base >= 80) {
    effective = Math.max(effective, base * 0.95);
  }

  // Active stage should always reflect the venture meter (HUD alignment)
  if (stageId === currentStage) {
    effective = Math.max(effective, base * 0.92);
  }

  return Math.max(0, Math.min(100, effective));
}

export function getMaxStageCorruption(
  stages: number[],
  input: Omit<StageCorruptionInput, "stageId">,
): number {
  if (stages.length === 0) return input.ventureCorruption;
  return Math.max(
    ...stages.map((stageId) =>
      getStageCorruptionLevel({ ...input, stageId }),
    ),
  );
}
