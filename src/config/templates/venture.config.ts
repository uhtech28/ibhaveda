/**
 * venture.config.ts
 *
 * Venture template configuration.
 * Wraps the existing VENTURE_STAGES / CHECKPOINT_DEFINITIONS from ventureConstants.ts
 * as a ProjectTemplate config — no existing constants are modified.
 *
 * Theme: Dark Tech Platform — Indigo / Purple / Cyan
 * Quality Metric: Valuation Score (₹, higher is better)
 */

import type {
  ProjectTemplate,
  StageConfig,
  MonsterConfig,
  BiomeThemeConfig,
} from "./templateTypes";

// ─────────────────────────────────────────────────────────────────────────────
// BIOME THEMES (per stage)
// ─────────────────────────────────────────────────────────────────────────────

const VENTURE_BIOME_THEMES: BiomeThemeConfig[] = [
  { // Stage 1 — Ideation Hub (Village)
    primaryColor: 0x6366f1,
    secondaryColor: 0x818cf8,
    particleStyle: "circuit_nodes",
    ambientBiomeId: "village",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#0f0f1a",
  },
  { // Stage 2 — Research Lab (Forest)
    primaryColor: 0x8b5cf6,
    secondaryColor: 0xa78bfa,
    particleStyle: "circuit_nodes",
    ambientBiomeId: "forest",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#0f0f1a",
  },
  { // Stage 3 — Validation Center (Arena)
    primaryColor: 0x06b6d4,
    secondaryColor: 0x22d3ee,
    particleStyle: "circuit_nodes",
    ambientBiomeId: "arena",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#0a0a14",
  },
  { // Stage 4 — Offer Design Studio (Artisan)
    primaryColor: 0xf59e0b,
    secondaryColor: 0xfbbf24,
    particleStyle: "circuit_nodes",
    ambientBiomeId: "artisan",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#0f0a00",
  },
  { // Stage 5 — Build & Deliver Zone (Mine)
    primaryColor: 0x3b82f6,
    secondaryColor: 0x60a5fa,
    particleStyle: "circuit_nodes",
    ambientBiomeId: "mine",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#070714",
  },
  { // Stage 6 — Launch Pad (Harbour)
    primaryColor: 0xef4444,
    secondaryColor: 0xf87171,
    particleStyle: "circuit_nodes",
    ambientBiomeId: "harbour",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#140a0a",
  },
  { // Stage 7 — Iteration Engine (Crossroads)
    primaryColor: 0x10b981,
    secondaryColor: 0x34d399,
    particleStyle: "circuit_nodes",
    ambientBiomeId: "crossroads",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#001a0f",
  },
  { // Stage 8 — Scale Summit (Capital)
    primaryColor: 0xfbbf24,
    secondaryColor: 0xfde68a,
    particleStyle: "circuit_nodes",
    ambientBiomeId: "capital",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#1a1400",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MONSTERS (one per stage — PRD §4.1)
// ─────────────────────────────────────────────────────────────────────────────

const VENTURE_MONSTERS: MonsterConfig[] = [
  {
    id: "venture_unraveller",
    name: "The Unraveller",
    stageId: 1,
    lore: "An ancient void serpent that pulls threads from the fabric of reality — walls crack, roads dissolve, plans collapse.",
    represents: "Doubt and loss of direction",
    role: "super_boss",
    spriteKey: "procedural",
  },
  {
    id: "venture_pale_architect",
    name: "The Pale Architect",
    stageId: 2,
    lore: "An undead perfectionist titan who freezes progress in amber — everything looks almost right but nothing moves.",
    represents: "Paralysis and perfectionism",
    role: "super_boss",
    spriteKey: "procedural",
  },
  {
    id: "venture_hollow_king",
    name: "The Hollow King",
    stageId: 3,
    lore: "A spectral sovereign that drains meaning from actions — tasks complete but feel empty, the world greyscales.",
    represents: "Loss of purpose",
    role: "super_boss",
    spriteKey: "procedural",
  },
  {
    id: "venture_thornwarden",
    name: "The Thornwarden",
    stageId: 4,
    lore: "An ancient forest colossus that overgrows paths with thorns — every checkpoint requires twice the effort.",
    represents: "Bureaucracy and friction",
    role: "super_boss",
    spriteKey: "procedural",
  },
  {
    id: "venture_mirror_witch",
    name: "The Mirror Witch",
    stageId: 5,
    lore: "An illusionist sorceress who replaces real progress with reflections — users see what they want rather than what is true.",
    represents: "Confirmation bias",
    role: "super_boss",
    spriteKey: "procedural",
  },
  {
    id: "venture_ashen_drake",
    name: "The Ashen Drake",
    stageId: 6,
    lore: "A fire dragon of entropy that burns completed work to ash if left untouched — idle stages decay visually.",
    represents: "Abandonment and inertia",
    role: "super_boss",
    spriteKey: "procedural",
  },
  {
    id: "venture_tide_caller",
    name: "The Tide Caller",
    stageId: 7,
    lore: "An oceanic leviathan that floods the landscape with noise — too many directions, priorities submerged.",
    represents: "Distraction and scope creep",
    role: "super_boss",
    spriteKey: "procedural",
  },
  {
    id: "venture_gravemind",
    name: "The Gravemind",
    stageId: 8,
    lore: "A necromantic hive intelligence that raises the corpses of abandoned ideas to block progress.",
    represents: "Fear of failure",
    role: "super_boss",
    spriteKey: "procedural",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STAGE CONFIGS
// ─────────────────────────────────────────────────────────────────────────────

const VENTURE_STAGES: StageConfig[] = [
  {
    id: 1,
    name: "Ideation",
    biomeName: "The Village",
    subtitle: "Stage 1 · Birth of Ideas",
    checkpoints: 4,
    monster: VENTURE_MONSTERS[0],
    icon: "💡",
    biomeTheme: VENTURE_BIOME_THEMES[0],
    worldX: 0,
    worldWidth: 1400,
  },
  {
    id: 2,
    name: "Research",
    biomeName: "The Forest",
    subtitle: "Stage 2 · Climb to Knowledge",
    checkpoints: 5,
    monster: VENTURE_MONSTERS[1],
    icon: "🔍",
    biomeTheme: VENTURE_BIOME_THEMES[1],
    worldX: 1400,
    worldWidth: 1600,
  },
  {
    id: 3,
    name: "Validation",
    biomeName: "Validation Center",
    subtitle: "Stage 3 · Test What's Real",
    checkpoints: 4,
    monster: VENTURE_MONSTERS[2],
    icon: "✅",
    biomeTheme: VENTURE_BIOME_THEMES[2],
    worldX: 3000,
    worldWidth: 1400,
  },
  {
    id: 4,
    name: "Offer Design",
    biomeName: "Offer Design Studio",
    subtitle: "Stage 4 · Shape the Product",
    checkpoints: 5,
    monster: VENTURE_MONSTERS[3],
    icon: "🎨",
    biomeTheme: VENTURE_BIOME_THEMES[3],
    worldX: 4400,
    worldWidth: 1600,
  },
  {
    id: 5,
    name: "Build & Deliver",
    biomeName: "Build & Deliver Zone",
    subtitle: "Stage 5 · Make It Real",
    checkpoints: 6,
    monster: VENTURE_MONSTERS[4],
    icon: "⚙️",
    biomeTheme: VENTURE_BIOME_THEMES[4],
    worldX: 6000,
    worldWidth: 1800,
  },
  {
    id: 6,
    name: "Launch",
    biomeName: "Launch Pad",
    subtitle: "Stage 6 · Go Public",
    checkpoints: 3,
    monster: VENTURE_MONSTERS[5],
    icon: "🚀",
    biomeTheme: VENTURE_BIOME_THEMES[5],
    worldX: 7800,
    worldWidth: 1200,
  },
  {
    id: 7,
    name: "Iteration",
    biomeName: "Iteration Engine",
    subtitle: "Stage 7 · Refine & Improve",
    checkpoints: 4,
    monster: VENTURE_MONSTERS[6],
    icon: "🔄",
    biomeTheme: VENTURE_BIOME_THEMES[6],
    worldX: 9000,
    worldWidth: 1400,
  },
  {
    id: 8,
    name: "Scale",
    biomeName: "Scale Summit",
    subtitle: "Stage 8 · Reach New Heights",
    checkpoints: 5,
    monster: VENTURE_MONSTERS[7],
    icon: "📈",
    biomeTheme: VENTURE_BIOME_THEMES[7],
    worldX: 10400,
    worldWidth: 1600,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// VENTURE TEMPLATE EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const VENTURE_TEMPLATE: ProjectTemplate = {
  id: "venture",
  name: "Venture",
  tagline: "Build a startup from idea to scale",

  stages: VENTURE_STAGES,

  qualityMetric: {
    id: "valuation_score",
    label: "Valuation Score",
    unit: "₹",
    direction: "higher_is_better",
    startValue: 0,
    displayFormat: "currency",
    thresholds: {
      low: 100_000,
      standard: 500_000,
      high: 2_000_000,
    },
    icon: "💰",
  },

  worldTheme: {
    hudColorScheme: "venture",
    hudPrimaryColor: "#6366f1",
    hudMetricIcon: "💰",
    mapBackgroundKey: "bg_venture",
    loreFont: "Inter",
    accentFont: "Courier New",
  },

  monsters: VENTURE_MONSTERS,

  audioProfile: {
    stageThemes: {
      1: "stage_1", 2: "stage_2", 3: "stage_3", 4: "stage_4",
      5: "stage_5", 6: "stage_6", 7: "stage_7", 8: "stage_8",
    },
    bossTheme: "boss_gravemind",
    ambienceMap: {
      1: "village", 2: "forest", 3: "arena", 4: "artisan",
      5: "mine", 6: "harbour", 7: "crossroads", 8: "capital",
    },
    corruptionLayerId: "corruption_venture",
  },

  animationProfile: {
    checkpointStyle: "seal_break",
    checkpointParticle: "circuit_nodes",
    bossEntranceVariant: "venture",
  },

  aiScoring: {
    dimensions: [
      {
        id: "completeness",
        label: "Completeness",
        rubric: "Does the submission fully address every part of the checkpoint outcome? (0=missing, 1=partial, 2=mostly, 3=complete)",
        weight: 1,
      },
      {
        id: "specificity",
        label: "Specificity",
        rubric: "Are claims concrete and named (real people, places, numbers, companies)? (0=vague, 1=some specifics, 2=mostly specific, 3=fully specific)",
        weight: 1,
      },
      {
        id: "evidence",
        label: "Evidence",
        rubric: "Is real-world evidence referenced (links, data, quotes, uploads)? (0=none, 1=anecdotal, 2=some evidence, 3=strong evidence)",
        weight: 1,
      },
      {
        id: "originality",
        label: "Originality",
        rubric: "Is the thinking genuinely the user's own vs. generic/copied? (0=generic, 1=some original thought, 2=mostly original, 3=clearly original)",
        weight: 1,
      },
    ],
    evaluatorPersona: "You are a rigorous startup accelerator evaluator assessing a founder's checkpoint submission.",
    workContext: "startup venture progression",
  },

  specialTools: [], // Venture uses the standard tool set

  totalCheckpoints: 36, // 4+5+4+5+6+3+4+5
};
