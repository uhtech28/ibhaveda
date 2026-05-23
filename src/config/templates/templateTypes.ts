/**
 * templateTypes.ts
 *
 * Shared interfaces for the config-driven template engine.
 * All four templates (Venture, Academic, Lab, Creative) implement ProjectTemplate.
 *
 * ARCHITECTURE INVARIANT:
 *  - Only configs change per template.
 *  - The checkpoint engine, boss engine, corruption engine, XP system,
 *    HUD, Phaser map engine, animation system, and AI scoring system
 *    are all shared and driven by these configs.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE ID
// ─────────────────────────────────────────────────────────────────────────────

export type TemplateId = "venture" | "academic" | "lab" | "creative";

// ─────────────────────────────────────────────────────────────────────────────
// METRIC CONFIG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Direction of the quality metric:
 *  - "higher_is_better": Venture (Valuation), Academic (JIF), Creative (Fan Score)
 *  - "lower_is_better":  Lab (p-value — must reach ≤0.05)
 */
export type MetricDirection = "higher_is_better" | "lower_is_better";

export type MetricDisplayFormat = "currency" | "decimal" | "percent" | "score";

export interface MetricThresholds {
  /** Low tier boundary (inclusive lower bound) */
  low: number;
  /** Standard tier boundary */
  standard: number;
  /** High tier boundary */
  high: number;
}

export interface QualityMetricConfig {
  /** Unique identifier, e.g. "valuation_score" */
  id: string;
  /** User-visible label in HUD, e.g. "Valuation Score" */
  label: string;
  /** Short suffix shown in HUD, e.g. "₹" | "JIF" | "p" | "fans" */
  unit: string;
  /** Which direction constitutes improvement */
  direction: MetricDirection;
  /** Starting value when a venture is first created */
  startValue: number;
  /** How to format for display */
  displayFormat: MetricDisplayFormat;
  /**
   * Quality tier thresholds.
   * For higher_is_better: score >= high → High, >= standard → Standard, else Low
   * For lower_is_better:  score <= high → High, <= standard → Standard, else Low
   */
  thresholds: MetricThresholds;
  /** HUD icon (emoji or icon id) */
  icon: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BIOME / VISUAL THEME
// ─────────────────────────────────────────────────────────────────────────────

export type ParticleStyle =
  | "circuit_nodes"   // Venture
  | "archive_dust"    // Academic
  | "lab_sparks"      // Lab
  | "brush_strokes";  // Creative

export type ShaderType =
  | "none"
  | "parchment_grain"   // Academic
  | "electricity"       // Lab
  | "dream_fog";        // Creative

export type WeatherEffect =
  | "none"
  | "dust_motes"   // Academic
  | "rain"         // Lab
  | "fog";         // Creative

export interface BiomeThemeConfig {
  /** Phaser hex color — stage primary tint */
  primaryColor: number;
  /** Phaser hex color — stage secondary accent */
  secondaryColor: number;
  /** Particle system style for this biome */
  particleStyle: ParticleStyle;
  /**
   * AudioManager BiomeId to use for ambient loop.
   * Maps to the existing AUDIO_PATHS.ambience keys.
   */
  ambientBiomeId: string;
  /** Optional post-processing shader */
  shaderType: ShaderType;
  /** Optional weather overlay */
  weatherEffect: WeatherEffect;
  /** Phaser background color (hex string) */
  bgColor: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MONSTER CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export type MonsterRole = "henchman" | "mini_boss" | "super_boss";

export interface MonsterConfig {
  /** Unique machine id */
  id: string;
  /** Display name shown in encounters */
  name: string;
  /** Which stage this monster guards (1-indexed) */
  stageId: number;
  /** In-world lore blurb */
  lore: string;
  /** What this monster represents thematically */
  represents: string;
  /** Monster role in the encounter system */
  role: MonsterRole;
  /** Phaser sprite key (or "procedural" to use drawn silhouette) */
  spriteKey: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export interface StageConfig {
  /** Stage number (1-indexed) */
  id: number;
  /** Stage name shown in HUD (e.g. "Topic & Question") */
  name: string;
  /** Biome/world location name (e.g. "Ancient Library") */
  biomeName: string;
  /** HUD subtitle text */
  subtitle: string;
  /** Number of checkpoints in this stage */
  checkpoints: number;
  /** Monster guarding this stage */
  monster: MonsterConfig;
  /** Emoji icon for this stage */
  icon: string;
  /** Visual / audio theme for this stage */
  biomeTheme: BiomeThemeConfig;
  /** Phaser world x-position of this biome segment */
  worldX: number;
  /** Width in Phaser world units */
  worldWidth: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export interface AudioProfile {
  /** Map from stage number → music track id (must exist in audioManager) */
  stageThemes: Record<number, string>;
  /** Boss encounter music track id */
  bossTheme: string;
  /** Map from stage number → ambience BiomeId */
  ambienceMap: Record<number, string>;
  /** Optional corruption audio layer (distortion effect id) */
  corruptionLayerId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export type CheckpointAnimStyle =
  | "seal_break"       // Venture
  | "parchment_stamp"  // Academic
  | "reactor_pulse"    // Lab
  | "brushstroke";     // Creative

export interface AnimationProfile {
  /** Visual style used when crossing a checkpoint */
  checkpointStyle: CheckpointAnimStyle;
  /** Particle burst style on checkpoint complete */
  checkpointParticle: ParticleStyle;
  /** Boss entrance cinematic variant (maps to BossSilhouette bossId prefix) */
  bossEntranceVariant: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD THEME (HUD + UI skin)
// ─────────────────────────────────────────────────────────────────────────────

export interface ThemeConfig {
  /** CSS variable set name controlling HUD color tokens */
  hudColorScheme: "venture" | "academic" | "lab" | "creative";
  /** Primary HUD accent color (CSS hex string) */
  hudPrimaryColor: string;
  /** HUD metric icon */
  hudMetricIcon: string;
  /** Phaser texture key for map background base */
  mapBackgroundKey: string;
  /** Google Font family for lore/flavor text */
  loreFont: string;
  /** Accent font (used for stage names, boss names) */
  accentFont: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI SCORING CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export interface AIScoringDimension {
  /** Machine id (used in the scoring prompt) */
  id: string;
  /** User-visible label */
  label: string;
  /** Description used in AI prompt rubric */
  rubric: string;
  /** Weight multiplier (default 1) */
  weight: number;
}

export interface AIScoringConfig {
  /** Four dimensions the AI evaluates (can be template-specific labels) */
  dimensions: [
    AIScoringDimension,
    AIScoringDimension,
    AIScoringDimension,
    AIScoringDimension,
  ];
  /** Evaluator persona used in the AI prompt */
  evaluatorPersona: string;
  /** Context about what kind of work is being assessed */
  workContext: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL TOOLS
// ─────────────────────────────────────────────────────────────────────────────

export interface SpecialToolConfig {
  /** Machine id */
  id: string;
  /** Display name */
  name: string;
  /** Which template this belongs to */
  templateId: TemplateId;
  /** Tool description */
  description: string;
  /** Icon emoji */
  icon: string;
  /** React component key for lazy loading */
  componentKey: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT TEMPLATE (root interface)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The full config for one template.
 * Every rendering decision in WorldMapScene, HUD, and AI scoring
 * must be driven by this config — NO hardcoded template logic elsewhere.
 */
export interface ProjectTemplate {
  /** Unique template identifier */
  id: TemplateId;
  /** Human-readable template name */
  name: string;
  /** Short tagline shown on template selection screen */
  tagline: string;
  /** Ordered array of stage configs (all checkpoints derived from these) */
  stages: StageConfig[];
  /** Quality metric definition */
  qualityMetric: QualityMetricConfig;
  /** World map / HUD visual theme */
  worldTheme: ThemeConfig;
  /**
   * All monsters for this template (one per stage + optional henchmen).
   * The WorldMapScene places these based on stageId.
   */
  monsters: MonsterConfig[];
  /** Audio track mapping */
  audioProfile: AudioProfile;
  /** Checkpoint and boss animation style */
  animationProfile: AnimationProfile;
  /** AI scoring configuration */
  aiScoring: AIScoringConfig;
  /** Template-specific special tool IDs */
  specialTools: SpecialToolConfig[];
  /** Total checkpoint count across all stages */
  totalCheckpoints: number;
}
