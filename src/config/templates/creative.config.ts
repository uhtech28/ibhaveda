/**
 * creative.config.ts
 *
 * Creative template configuration.
 *
 * Theme: Dreamlike Fantasy — Imagination, Emotion, Artistic Expression
 * Quality Metric: Fan Score (always increases)
 *
 * Stages (6):
 *  1. Concept & Inspiration   → Sacred Grove
 *  2. References & Influences → Gallery of Echoes
 *  3. Drafting & Creation     → The Wilderness
 *  4. Feedback & Critique     → Village Square
 *  5. Refinement & Polish     → Artisan's Workshop
 *  6. Release & Sharing       → Harbour
 *
 * Stage Monsters:
 *  - Silence That Smothers
 *  - Curator of Derivative Ghosts
 *  - Beast of the Unfinished
 *  - Crowd of False Validation
 *  - Perfectionist's Spectre
 *  - Harbourmaster of Hesitation
 *
 * AI Scoring Emphasis: originality, emotional impact, execution quality, audience resonance
 */

import type {
  ProjectTemplate,
  StageConfig,
  MonsterConfig,
  BiomeThemeConfig,
  SpecialToolConfig,
} from "./templateTypes";

// ─────────────────────────────────────────────────────────────────────────────
// BIOME THEMES
// ─────────────────────────────────────────────────────────────────────────────

const CREATIVE_BIOME_THEMES: BiomeThemeConfig[] = [
  { // Stage 1 — Sacred Grove
    primaryColor: 0x90e0a0,   // Soft grove green
    secondaryColor: 0x52b788,
    particleStyle: "brush_strokes",
    ambientBiomeId: "forest",
    shaderType: "dream_fog",
    weatherEffect: "fog",
    bgColor: "#071409",
  },
  { // Stage 2 — Gallery of Echoes
    primaryColor: 0xe8b4d0,   // Gallery rose
    secondaryColor: 0xc27ba0,
    particleStyle: "brush_strokes",
    ambientBiomeId: "village",
    shaderType: "dream_fog",
    weatherEffect: "fog",
    bgColor: "#170a12",
  },
  { // Stage 3 — The Wilderness
    primaryColor: 0xffd166,   // Warm creative yellow
    secondaryColor: 0xe8a42b,
    particleStyle: "brush_strokes",
    ambientBiomeId: "arena",
    shaderType: "dream_fog",
    weatherEffect: "fog",
    bgColor: "#1a1200",
  },
  { // Stage 4 — Village Square
    primaryColor: 0xff6b6b,   // Community coral
    secondaryColor: 0xe63946,
    particleStyle: "brush_strokes",
    ambientBiomeId: "crossroads",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#1a0505",
  },
  { // Stage 5 — Artisan's Workshop
    primaryColor: 0xa8dadc,   // Artisan cyan
    secondaryColor: 0x457b9d,
    particleStyle: "brush_strokes",
    ambientBiomeId: "artisan",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#050f10",
  },
  { // Stage 6 — Harbour
    primaryColor: 0xf4a261,   // Sunset harbour orange
    secondaryColor: 0xe76f51,
    particleStyle: "brush_strokes",
    ambientBiomeId: "harbour",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#1a0c05",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MONSTERS
// ─────────────────────────────────────────────────────────────────────────────

const CREATIVE_MONSTERS: MonsterConfig[] = [
  {
    id: "creative_silence",
    name: "Silence That Smothers",
    stageId: 1,
    lore: "Not a creature but a presence — where it settles, all creative impulse is extinguished. It whispers that no concept is original enough, no inspiration worthy of pursuit. Many creators never escape the grove.",
    represents: "Creative paralysis and the blank beginning",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "creative_curator",
    name: "Curator of Derivative Ghosts",
    stageId: 2,
    lore: "An impeccably dressed phantom who curates a gallery of other people's work — and quietly replaces your references with copies of copies. Under her influence, everything you make is made of other things, never truly yours.",
    represents: "Derivative work and loss of authentic voice",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "creative_beast",
    name: "Beast of the Unfinished",
    stageId: 3,
    lore: "It feeds on creative projects that are 80% complete — the draft that was abandoned for a newer idea, the song that needed one more verse, the painting that became a storage rack. It grows fat in every creative's wilderness.",
    represents: "Inability to finish and distraction by new ideas",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "creative_crowd",
    name: "Crowd of False Validation",
    stageId: 4,
    lore: "A friendly mob who love everything — uncritically, reflexively, uselessly. They drown genuine critique in applause, insulate creative work from real feedback, and ensure the creator never improves.",
    represents: "Echo chambers and uncritical positive feedback",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "creative_spectre",
    name: "Perfectionist's Spectre",
    stageId: 5,
    lore: "An elegant ghost who appears in the final 10% of every creative project — pointing out flaws that don't exist, suggesting revisions that undo finished work, preventing the last brush from touching the canvas.",
    represents: "Perfectionism blocking completion",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "creative_harbourmaster",
    name: "Harbourmaster of Hesitation",
    stageId: 6,
    lore: "He manages the harbour where finished work waits to set sail — and finds endless bureaucratic reasons for every ship to remain docked. Every completed work deserves an audience, but the Harbourmaster ensures it never leaves port.",
    represents: "Fear of release and publishing paralysis",
    role: "mini_boss",
    spriteKey: "procedural",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STAGES
// ─────────────────────────────────────────────────────────────────────────────

const CREATIVE_STAGES: StageConfig[] = [
  {
    id: 1,
    name: "Concept & Inspiration",
    biomeName: "Sacred Grove",
    subtitle: "Stage 1 · Find the Spark",
    checkpoints: 3,
    monster: CREATIVE_MONSTERS[0],
    icon: "✨",
    biomeTheme: CREATIVE_BIOME_THEMES[0],
    worldX: 0,
    worldWidth: 1200,
  },
  {
    id: 2,
    name: "References & Influences",
    biomeName: "Gallery of Echoes",
    subtitle: "Stage 2 · Learn from Masters",
    checkpoints: 4,
    monster: CREATIVE_MONSTERS[1],
    icon: "🖼️",
    biomeTheme: CREATIVE_BIOME_THEMES[1],
    worldX: 1200,
    worldWidth: 1400,
  },
  {
    id: 3,
    name: "Drafting & Creation",
    biomeName: "The Wilderness",
    subtitle: "Stage 3 · Make the Thing",
    checkpoints: 5,
    monster: CREATIVE_MONSTERS[2],
    icon: "🎨",
    biomeTheme: CREATIVE_BIOME_THEMES[2],
    worldX: 2600,
    worldWidth: 1600,
  },
  {
    id: 4,
    name: "Feedback & Critique",
    biomeName: "Village Square",
    subtitle: "Stage 4 · Hear the Truth",
    checkpoints: 4,
    monster: CREATIVE_MONSTERS[3],
    icon: "💬",
    biomeTheme: CREATIVE_BIOME_THEMES[3],
    worldX: 4200,
    worldWidth: 1400,
  },
  {
    id: 5,
    name: "Refinement & Polish",
    biomeName: "Artisan's Workshop",
    subtitle: "Stage 5 · Perfect the Craft",
    checkpoints: 4,
    monster: CREATIVE_MONSTERS[4],
    icon: "⚒️",
    biomeTheme: CREATIVE_BIOME_THEMES[4],
    worldX: 5600,
    worldWidth: 1400,
  },
  {
    id: 6,
    name: "Release & Sharing",
    biomeName: "Harbour",
    subtitle: "Stage 6 · Set It Free",
    checkpoints: 3,
    monster: CREATIVE_MONSTERS[5],
    icon: "⛵",
    biomeTheme: CREATIVE_BIOME_THEMES[5],
    worldX: 7000,
    worldWidth: 1200,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL TOOLS
// ─────────────────────────────────────────────────────────────────────────────

const CREATIVE_SPECIAL_TOOLS: SpecialToolConfig[] = [
  {
    id: "moodboard",
    name: "Moodboard",
    templateId: "creative",
    description: "Visual inspiration board — collect images, colors, textures, and references into a single canvas.",
    icon: "🌈",
    componentKey: "CreativeMoodboard",
  },
  {
    id: "storyboard_canvas",
    name: "Storyboard Canvas",
    templateId: "creative",
    description: "Panel-by-panel storyboard for planning visual sequences, videos, or narrative arcs.",
    icon: "🎬",
    componentKey: "CreativeStoryboard",
  },
  {
    id: "asset_gallery",
    name: "Asset Gallery",
    templateId: "creative",
    description: "Organized gallery of all creative assets produced during the project — images, audio, text, video.",
    icon: "🗂️",
    componentKey: "CreativeAssetGallery",
  },
  {
    id: "publishing_hub",
    name: "Publishing Hub",
    templateId: "creative",
    description: "Centralized launch checklist — link all platforms where your work will be published.",
    icon: "📡",
    componentKey: "CreativePublishingHub",
  },
  {
    id: "audience_reaction_feed",
    name: "Audience Reaction Feed",
    templateId: "creative",
    description: "Curate and track audience responses, reviews, comments, and reactions from published work.",
    icon: "❤️",
    componentKey: "CreativeAudienceFeed",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CREATIVE TEMPLATE EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const CREATIVE_TEMPLATE: ProjectTemplate = {
  id: "creative",
  name: "Creative",
  tagline: "From inspiration to release",

  stages: CREATIVE_STAGES,

  qualityMetric: {
    id: "fan_score",
    label: "Fan Score",
    unit: "fans",
    direction: "higher_is_better",
    startValue: 0,
    displayFormat: "score",
    thresholds: {
      low: 100,
      standard: 1000,
      high: 10000,
    },
    icon: "⭐",
  },

  worldTheme: {
    hudColorScheme: "creative",
    hudPrimaryColor: "#ffd166",
    hudMetricIcon: "⭐",
    mapBackgroundKey: "bg_creative",
    loreFont: "Playfair Display",
    accentFont: "Dancing Script",
  },

  monsters: CREATIVE_MONSTERS,

  audioProfile: {
    stageThemes: {
      1: "stage_2",  // Sacred Grove → forest theme
      2: "stage_1",  // Gallery → village theme
      3: "stage_3",  // Wilderness → arena
      4: "stage_7",  // Village Square → crossroads
      5: "stage_4",  // Workshop → artisan
      6: "stage_6",  // Harbour → harbour
    },
    bossTheme: "boss_pale_architect",
    ambienceMap: {
      1: "forest", 2: "village", 3: "arena",
      4: "crossroads", 5: "artisan", 6: "harbour",
    },
    corruptionLayerId: "corruption_creative",
  },

  animationProfile: {
    checkpointStyle: "brushstroke",
    checkpointParticle: "brush_strokes",
    bossEntranceVariant: "creative",
  },

  aiScoring: {
    dimensions: [
      {
        id: "originality",
        label: "Originality",
        rubric: "Does the creative work present a genuinely unique voice, concept, or execution? (0=derivative/copied, 1=influenced but recognizable, 2=mostly original, 3=clearly distinctive and original)",
        weight: 1.5,
      },
      {
        id: "emotional_impact",
        label: "Emotional Impact",
        rubric: "Does the work evoke a clear emotional response? Is there intentionality behind the emotion? (0=no emotional resonance, 1=mild effect, 2=clear emotion, 3=powerful and intentional emotional impact)",
        weight: 1.5,
      },
      {
        id: "execution_quality",
        label: "Execution Quality",
        rubric: "Is the craft evident in the work? Does the execution match the intention? (0=rough/incomplete, 1=developing craft, 2=competent execution, 3=polished and purposeful)",
        weight: 1,
      },
      {
        id: "audience_resonance",
        label: "Audience Resonance",
        rubric: "Is there evidence the work connects with its intended audience? Are real audience reactions documented? (0=no audience data, 1=anecdotal, 2=some documented reactions, 3=clear documented resonance)",
        weight: 1,
      },
    ],
    evaluatorPersona: "You are a creative director and arts critic evaluating a creative project submission for artistic merit and audience connection.",
    workContext: "creative project production and publication",
  },

  specialTools: CREATIVE_SPECIAL_TOOLS,

  totalCheckpoints: 23, // 3+4+5+4+4+3
};
