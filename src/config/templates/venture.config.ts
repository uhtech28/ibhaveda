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

// Per Ibhaveda_boss_corruption_table Stage Monsters sheet: each Venture
// stage has ONE local stage-monster. The 12-boss Super Boss Pool is a
// separate project-scoped random assignment — see SUPER_BOSS_POOL below.
const VENTURE_MONSTERS: MonsterConfig[] = [
  {
    id: "venture_fog_of_vagueness",
    name: "The Fog of Vagueness",
    stageId: 1,
    lore: "Pale blue-grey mist that swallows every noticeboard until the founder names the problem exactly.",
    represents: "Vague problem-framing",
    role: "stage_monster",
    spriteKey: "procedural",
  },
  {
    id: "venture_pathwarden_wraith",
    name: "The Pathwarden Wraith",
    stageId: 2,
    lore: "A tangled forest spectre that hoards every side-path until the founder commits to one route.",
    represents: "Endless research without direction",
    role: "stage_monster",
    spriteKey: "procedural",
  },
  {
    id: "venture_advocate_of_lies",
    name: "The Advocate of Comfortable Lies",
    stageId: 3,
    lore: "A slick barrister who reframes assumptions as facts — falls silent only when real evidence lands.",
    represents: "Untested assumptions",
    role: "stage_monster",
    spriteKey: "procedural",
  },
  {
    id: "venture_unfinished_golem",
    name: "The Unfinished Golem",
    stageId: 4,
    lore: "A half-forged stone giant that crumbles the moment the founder ships one buyable offer instead of ten drafts.",
    represents: "Perpetual polishing without release",
    role: "stage_monster",
    spriteKey: "procedural",
  },
  {
    id: "venture_collapse_specter",
    name: "The Collapse Specter",
    stageId: 5,
    lore: "A dark-grey rubble-shrouded wraith that dispels the moment the founder ships the smallest working version.",
    represents: "Fear of the first shipped build",
    role: "stage_monster",
    spriteKey: "procedural",
  },
  {
    id: "venture_harbourmaster",
    name: "The Harbourmaster of Hesitation",
    stageId: 6,
    lore: "A bureaucrat wreathed in blue-grey storm-fog that clears the moment the founder names the launch date out loud.",
    represents: "Hesitation at the launch window",
    role: "stage_monster",
    spriteKey: "procedural",
  },
  {
    id: "venture_babel_merchant",
    name: "The Babel Merchant",
    stageId: 7,
    lore: "A shrouded figure of black-and-white static who dissipates the moment the founder commits to one message.",
    represents: "Message dilution across iterations",
    role: "stage_monster",
    spriteKey: "procedural",
  },
  {
    id: "venture_iron_bureaucrat",
    name: "The Iron Bureaucrat",
    stageId: 8,
    lore: "An armored chain-wrapped figure that shatters the moment the founder names one system to automate this quarter.",
    represents: "Scale-time process paralysis",
    role: "stage_monster",
    spriteKey: "procedural",
  },
];

// 12-boss Super Boss Pool — one is RANDOMLY assigned per project at
// venture creation (see createTemplatedVenture). These are project-
// scoped villains, NOT per-stage. Sourced from Ibhaveda_boss_corruption_
// table Sheet 1 "Super Boss Pool - 12 Bosses".
export const SUPER_BOSS_POOL: readonly {
  id: string;
  name: string;
  represents: string;
  /** Idle sprite path (south-facing). Optional — populated as art lands. */
  idleAsset?: string;
}[] = [
  { id: "super_unraveller",     name: "The Unraveller",     represents: "Doubt and loss of direction",       idleAsset: "/assets/bosses/village/unraveller/idle.png" },
  { id: "super_pale_architect", name: "The Pale Architect", represents: "Perfectionism and paralysis" },
  { id: "super_hollow_king",    name: "The Hollow King",    represents: "Loss of purpose" },
  { id: "super_thornwarden",    name: "The Thornwarden",    represents: "Bureaucracy and friction" },
  { id: "super_mirror_witch",   name: "The Mirror Witch",   represents: "Self-deception" },
  { id: "super_ashen_drake",    name: "The Ashen Drake",    represents: "Abandonment and inertia" },
  { id: "super_tide_caller",    name: "The Tide Caller",    represents: "Distraction and scope creep",       idleAsset: "/assets/bosses/super-pool/tide-caller/idle.png" },
  { id: "super_gravemind",      name: "The Gravemind",      represents: "Fear of failure" },
  { id: "super_rusted_oracle",  name: "The Rusted Oracle",  represents: "Imposter syndrome",                 idleAsset: "/assets/bosses/super-pool/rusted-oracle/idle.png" },
  { id: "super_wraith_council", name: "The Wraith Council", represents: "Decision paralysis",                idleAsset: "/assets/bosses/super-pool/wraith-council/idle.png" },
  { id: "super_stonecaller",    name: "The Stonecaller",    represents: "Overwhelm",                         idleAsset: "/assets/bosses/super-pool/stonecaller/idle.png" },
  { id: "super_veilwalker",     name: "The Veilwalker",     represents: "Isolation and fear of irrelevance", idleAsset: "/assets/bosses/super-pool/veilwalker/idle.png" },
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
