/**
 * academic.config.ts
 *
 * Academic template configuration.
 *
 * Theme: Ancient Archive Fantasy — Knowledge, Discovery, Scholarship
 * Quality Metric: JIF Score (Journal Impact Factor proxy, always increases)
 *
 * Stages (6):
 *  1. Topic & Question       → Ancient Library
 *  2. Literature Review      → The Ruins
 *  3. Methodology            → Cartographer's Tower
 *  4. Writing & Drafting     → The Scriptorium
 *  5. Review & Revision      → Council Chamber
 *  6. Submission & Publication → Grand Archive
 *
 * Stage Monsters:
 *  - Librarian of Lost Questions
 *  - Keeper of Incomplete Records
 *  - Cartographer of Crooked Maps
 *  - Blank Page Wraith
 *  - Councillor of False Consensus
 *  - Gatekeeper of Unearned Entry
 *
 * AI Scoring Emphasis: evidence, rigor, citation quality, originality
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

const ACADEMIC_BIOME_THEMES: BiomeThemeConfig[] = [
  { // Stage 1 — Ancient Library
    primaryColor: 0xd4a853,   // Aged gold
    secondaryColor: 0x8b6914,
    particleStyle: "archive_dust",
    ambientBiomeId: "village", // repurposed as library ambience
    shaderType: "parchment_grain",
    weatherEffect: "dust_motes",
    bgColor: "#1a1408",
  },
  { // Stage 2 — The Ruins
    primaryColor: 0x7c8c5e,   // Mossy stone
    secondaryColor: 0x556b2f,
    particleStyle: "archive_dust",
    ambientBiomeId: "forest",
    shaderType: "parchment_grain",
    weatherEffect: "dust_motes",
    bgColor: "#0d110a",
  },
  { // Stage 3 — Cartographer's Tower
    primaryColor: 0x4a7c9a,   // Blueprint blue
    secondaryColor: 0x2c5f78,
    particleStyle: "archive_dust",
    ambientBiomeId: "mine",
    shaderType: "parchment_grain",
    weatherEffect: "dust_motes",
    bgColor: "#070f14",
  },
  { // Stage 4 — The Scriptorium
    primaryColor: 0xc87941,   // Amber ink
    secondaryColor: 0x8b4513,
    particleStyle: "archive_dust",
    ambientBiomeId: "artisan",
    shaderType: "parchment_grain",
    weatherEffect: "dust_motes",
    bgColor: "#150c05",
  },
  { // Stage 5 — Council Chamber
    primaryColor: 0x8e44ad,   // Authority purple
    secondaryColor: 0x6c3483,
    particleStyle: "archive_dust",
    ambientBiomeId: "crossroads",
    shaderType: "parchment_grain",
    weatherEffect: "none",
    bgColor: "#0e0514",
  },
  { // Stage 6 — Grand Archive
    primaryColor: 0xf0c040,   // Grand gold
    secondaryColor: 0xcda231,
    particleStyle: "archive_dust",
    ambientBiomeId: "capital",
    shaderType: "parchment_grain",
    weatherEffect: "none",
    bgColor: "#1a1500",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MONSTERS
// ─────────────────────────────────────────────────────────────────────────────

const ACADEMIC_MONSTERS: MonsterConfig[] = [
  {
    id: "academic_librarian",
    name: "Librarian of Lost Questions",
    stageId: 1,
    lore: "A spectral librarian who has catalogued every question ever abandoned. She offers you her endless index — but every question leads deeper into doubt, never toward an answer.",
    represents: "Research paralysis and unfocused inquiry",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "academic_keeper",
    name: "Keeper of Incomplete Records",
    stageId: 2,
    lore: "An archivist of half-finished knowledge — his scrolls are full of references that trail off, studies without conclusions, citations of citations that cite nothing.",
    represents: "Shallow literature review and citation loops",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "academic_cartographer",
    name: "Cartographer of Crooked Maps",
    stageId: 3,
    lore: "She draws beautiful, detailed maps of territory that does not exist — methodologies that cannot be replicated, measurement instruments that measure themselves.",
    represents: "Flawed research design and unreplicable methods",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "academic_blank_wraith",
    name: "Blank Page Wraith",
    stageId: 4,
    lore: "The embodiment of writer's block. Where it passes, parchment becomes impossibly blank — words evaporate before they can be written, paragraphs dissolve overnight.",
    represents: "Writing paralysis and perfectionism",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "academic_councillor",
    name: "Councillor of False Consensus",
    stageId: 5,
    lore: "A phantom peer reviewer who agrees with everything — approving flawed work, praising mediocre conclusions, and ensuring no genuine critique ever reaches the researcher.",
    represents: "Echo chambers and uncritical review",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "academic_gatekeeper",
    name: "Gatekeeper of Unearned Entry",
    stageId: 6,
    lore: "The guardian of the Grand Archive. He turns away submissions that lack substance, citing every bureaucratic rule — but his real power is making researchers doubt their own worthiness.",
    represents: "Rejection fear and publication gatekeeping",
    role: "mini_boss",
    spriteKey: "procedural",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STAGES
// ─────────────────────────────────────────────────────────────────────────────

const ACADEMIC_STAGES: StageConfig[] = [
  {
    id: 1,
    name: "Topic & Question",
    biomeName: "Ancient Library",
    subtitle: "Stage 1 · Define the Inquiry",
    checkpoints: 4,
    monster: ACADEMIC_MONSTERS[0],
    icon: "📚",
    biomeTheme: ACADEMIC_BIOME_THEMES[0],
    worldX: 0,
    worldWidth: 1400,
  },
  {
    id: 2,
    name: "Literature Review",
    biomeName: "The Ruins",
    subtitle: "Stage 2 · Excavate the Field",
    checkpoints: 5,
    monster: ACADEMIC_MONSTERS[1],
    icon: "🏛️",
    biomeTheme: ACADEMIC_BIOME_THEMES[1],
    worldX: 1400,
    worldWidth: 1600,
  },
  {
    id: 3,
    name: "Methodology",
    biomeName: "Cartographer's Tower",
    subtitle: "Stage 3 · Chart the Method",
    checkpoints: 4,
    monster: ACADEMIC_MONSTERS[2],
    icon: "🗺️",
    biomeTheme: ACADEMIC_BIOME_THEMES[2],
    worldX: 3000,
    worldWidth: 1400,
  },
  {
    id: 4,
    name: "Writing & Drafting",
    biomeName: "The Scriptorium",
    subtitle: "Stage 4 · Inscribe the Work",
    checkpoints: 5,
    monster: ACADEMIC_MONSTERS[3],
    icon: "✍️",
    biomeTheme: ACADEMIC_BIOME_THEMES[3],
    worldX: 4400,
    worldWidth: 1600,
  },
  {
    id: 5,
    name: "Review & Revision",
    biomeName: "Council Chamber",
    subtitle: "Stage 5 · Face the Council",
    checkpoints: 4,
    monster: ACADEMIC_MONSTERS[4],
    icon: "⚖️",
    biomeTheme: ACADEMIC_BIOME_THEMES[4],
    worldX: 6000,
    worldWidth: 1400,
  },
  {
    id: 6,
    name: "Submission & Publication",
    biomeName: "Grand Archive",
    subtitle: "Stage 6 · Enter the Archive",
    checkpoints: 3,
    monster: ACADEMIC_MONSTERS[5],
    icon: "🏆",
    biomeTheme: ACADEMIC_BIOME_THEMES[5],
    worldX: 7400,
    worldWidth: 1200,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL TOOLS
// ─────────────────────────────────────────────────────────────────────────────

const ACADEMIC_SPECIAL_TOOLS: SpecialToolConfig[] = [
  {
    id: "citation_graph",
    name: "Citation Graph",
    templateId: "academic",
    description: "Visualize the citation network of your literature review — map how papers connect to each other.",
    icon: "🕸️",
    componentKey: "AcademicCitationGraph",
  },
  {
    id: "paper_structure_helper",
    name: "Paper Structure Helper",
    templateId: "academic",
    description: "Scaffold your paper's structure with section templates and writing prompts.",
    icon: "📋",
    componentKey: "AcademicPaperStructure",
  },
  {
    id: "research_notes",
    name: "Research Notes",
    templateId: "academic",
    description: "A structured note-taking system organized by source, theme, and argument.",
    icon: "📓",
    componentKey: "AcademicResearchNotes",
  },
  {
    id: "bibliography_assistant",
    name: "Bibliography Assistant",
    templateId: "academic",
    description: "Format and manage your reference list across APA, MLA, Chicago, and Harvard styles.",
    icon: "📑",
    componentKey: "AcademicBibliography",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC TEMPLATE EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const ACADEMIC_TEMPLATE: ProjectTemplate = {
  id: "academic",
  name: "Academic",
  tagline: "From research question to published paper",

  stages: ACADEMIC_STAGES,

  qualityMetric: {
    id: "jif_score",
    label: "JIF Score",
    unit: "JIF",
    direction: "higher_is_better",
    startValue: 0,
    displayFormat: "decimal",
    thresholds: {
      low: 1.0,
      standard: 3.0,
      high: 6.0,
    },
    icon: "📊",
  },

  worldTheme: {
    hudColorScheme: "academic",
    hudPrimaryColor: "#d4a853",
    hudMetricIcon: "📊",
    mapBackgroundKey: "bg_academic",
    loreFont: "Cinzel",
    accentFont: "IM Fell English",
  },

  monsters: ACADEMIC_MONSTERS,

  audioProfile: {
    stageThemes: {
      1: "stage_1", 2: "stage_2", 3: "stage_5", 4: "stage_4",
      5: "stage_7", 6: "stage_8",
    },
    bossTheme: "boss_pale_architect",
    ambienceMap: {
      1: "village", 2: "forest", 3: "mine",
      4: "artisan", 5: "crossroads", 6: "capital",
    },
    corruptionLayerId: "corruption_academic",
  },

  animationProfile: {
    checkpointStyle: "parchment_stamp",
    checkpointParticle: "archive_dust",
    bossEntranceVariant: "academic",
  },

  aiScoring: {
    dimensions: [
      {
        id: "evidence",
        label: "Evidence Quality",
        rubric: "Are claims supported by cited sources, empirical data, or peer-reviewed literature? (0=unsupported, 1=anecdotal, 2=partial evidence, 3=rigorous cited evidence)",
        weight: 1.5, // Evidence weighted higher for academic
      },
      {
        id: "rigor",
        label: "Academic Rigor",
        rubric: "Is the methodology sound? Are assumptions stated? Are limitations acknowledged? (0=no rigor, 1=basic structure, 2=mostly rigorous, 3=fully rigorous)",
        weight: 1.5,
      },
      {
        id: "citation_quality",
        label: "Citation Quality",
        rubric: "Are sources properly cited, peer-reviewed, and relevant? Are primary vs. secondary sources distinguished? (0=no citations, 1=web sources only, 2=some peer-reviewed, 3=high-quality peer-reviewed)",
        weight: 1,
      },
      {
        id: "originality",
        label: "Original Contribution",
        rubric: "Does the work contribute something new — novel synthesis, new findings, or unique framing? (0=purely derivative, 1=slight variation, 2=moderate contribution, 3=clear original contribution)",
        weight: 1,
      },
    ],
    evaluatorPersona: "You are a rigorous academic peer reviewer assessing a researcher's submission for scholarly merit.",
    workContext: "academic research and publication",
  },

  specialTools: ACADEMIC_SPECIAL_TOOLS,

  totalCheckpoints: 25, // 4+5+4+5+4+3
};
