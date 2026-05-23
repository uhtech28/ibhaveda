/**
 * lab.config.ts
 *
 * Lab (Experimental) template configuration.
 *
 * Theme: Engineering Fantasy — Experimentation, Invention, Technical Mystery
 * Quality Metric: p-value (starts ~0.9, must reach ≤0.05)
 *
 * CRITICAL: This template REVERSES progression direction.
 *   LOWER p-value = BETTER quality. MetricDirection = "lower_is_better".
 *
 * Stages (7):
 *  1. Brief & Question        → Observatory
 *  2. Background Research     → Ancient Library
 *  3. Design & Planning       → Cartographer's Tower
 *  4. Build & Execute         → The Forge
 *  5. Test & Evaluate         → Alchemist's Laboratory
 *  6. Iterate & Refine        → Crossroads Town
 *  7. Document & Present      → Grand Hall
 *
 * Stage Monsters:
 *  - Mirage Lens
 *  - Librarian of Lost Questions
 *  - Cartographer of Crooked Maps
 *  - Saboteur of the Forge
 *  - Alchemist of Wishful Results
 *  - Babel Merchant
 *  - Silencer of Findings
 *
 * AI Scoring Emphasis: reproducibility, experimental rigor, technical depth, measurable validation
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

const LAB_BIOME_THEMES: BiomeThemeConfig[] = [
  { // Stage 1 — Observatory
    primaryColor: 0x1a6b8a,   // Deep teal
    secondaryColor: 0x0e4a60,
    particleStyle: "lab_sparks",
    ambientBiomeId: "arena",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#020d14",
  },
  { // Stage 2 — Ancient Library (shared biome, lab skin)
    primaryColor: 0x2d6a4f,   // Research green
    secondaryColor: 0x1b4332,
    particleStyle: "lab_sparks",
    ambientBiomeId: "forest",
    shaderType: "none",
    weatherEffect: "rain",
    bgColor: "#030f07",
  },
  { // Stage 3 — Cartographer's Tower (shared biome, lab skin)
    primaryColor: 0x4361ee,   // Blueprint blue
    secondaryColor: 0x2b4dc9,
    particleStyle: "lab_sparks",
    ambientBiomeId: "mine",
    shaderType: "electricity",
    weatherEffect: "none",
    bgColor: "#030820",
  },
  { // Stage 4 — The Forge
    primaryColor: 0xd62828,   // Forge red
    secondaryColor: 0xa81010,
    particleStyle: "lab_sparks",
    ambientBiomeId: "harbour",
    shaderType: "electricity",
    weatherEffect: "none",
    bgColor: "#1a0303",
  },
  { // Stage 5 — Alchemist's Laboratory
    primaryColor: 0x7209b7,   // Alchemic purple
    secondaryColor: 0x560bad,
    particleStyle: "lab_sparks",
    ambientBiomeId: "crossroads",
    shaderType: "electricity",
    weatherEffect: "none",
    bgColor: "#0e0320",
  },
  { // Stage 6 — Crossroads Town
    primaryColor: 0xf77f00,   // Amber warning
    secondaryColor: 0xd62b00,
    particleStyle: "lab_sparks",
    ambientBiomeId: "artisan",
    shaderType: "none",
    weatherEffect: "rain",
    bgColor: "#1a0800",
  },
  { // Stage 7 — Grand Hall
    primaryColor: 0x06d6a0,   // Success teal
    secondaryColor: 0x048a72,
    particleStyle: "lab_sparks",
    ambientBiomeId: "capital",
    shaderType: "none",
    weatherEffect: "none",
    bgColor: "#001a14",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MONSTERS
// ─────────────────────────────────────────────────────────────────────────────

const LAB_MONSTERS: MonsterConfig[] = [
  {
    id: "lab_mirage_lens",
    name: "Mirage Lens",
    stageId: 1,
    lore: "An optical illusion given form — the Mirage Lens shows you the experiment you wish you were running rather than the one you actually need. Under its gaze, vague questions look precise.",
    represents: "Unclear experimental briefs and poorly defined hypotheses",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "lab_librarian",
    name: "Librarian of Lost Questions",
    stageId: 2,
    lore: "The same archivist of abandonment haunts the lab's library. Here she trades not in academic questions but in experimental designs that were tried, found difficult, and quietly shelved.",
    represents: "Inadequate background research and ignoring prior art",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "lab_cartographer",
    name: "Cartographer of Crooked Maps",
    stageId: 3,
    lore: "In the lab, she draws experimental protocols that seem rigorous until you try to follow them — control groups that aren't controlled, variables that entangle, sample sizes that cannot support conclusions.",
    represents: "Flawed experimental design",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "lab_saboteur",
    name: "Saboteur of the Forge",
    stageId: 4,
    lore: "A chaos engineer in the truest sense — the Saboteur ensures that equipment fails at critical moments, data collection procedures drift, and execution never quite matches the plan.",
    represents: "Execution failure and data collection errors",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "lab_alchemist",
    name: "Alchemist of Wishful Results",
    stageId: 5,
    lore: "She promises to turn lead data into gold results. Her transmutations look beautiful in charts — p-values that just barely miss significance are rounded; outliers are called anomalies and removed.",
    represents: "Data manipulation and wishful analysis (p-hacking)",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "lab_babel_merchant",
    name: "Babel Merchant",
    stageId: 6,
    lore: "A trader of imprecision — he buys your clear experimental findings and sells you back jargon. Iterations improve the experiment but the Merchant ensures nobody can tell what changed or why.",
    represents: "Poor iteration documentation and unclear versioning",
    role: "mini_boss",
    spriteKey: "procedural",
  },
  {
    id: "lab_silencer",
    name: "Silencer of Findings",
    stageId: 7,
    lore: "The last guardian — and the most dangerous. The Silencer does not destroy your findings. It simply ensures they are never presented in a way anyone can understand, replicate, or use.",
    represents: "Poor documentation and reproducibility failure",
    role: "mini_boss",
    spriteKey: "procedural",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STAGES
// ─────────────────────────────────────────────────────────────────────────────

const LAB_STAGES: StageConfig[] = [
  {
    id: 1,
    name: "Brief & Question",
    biomeName: "Observatory",
    subtitle: "Stage 1 · Define the Experiment",
    checkpoints: 3,
    monster: LAB_MONSTERS[0],
    icon: "🔭",
    biomeTheme: LAB_BIOME_THEMES[0],
    worldX: 0,
    worldWidth: 1200,
  },
  {
    id: 2,
    name: "Background Research",
    biomeName: "Ancient Library",
    subtitle: "Stage 2 · Survey the Field",
    checkpoints: 4,
    monster: LAB_MONSTERS[1],
    icon: "📚",
    biomeTheme: LAB_BIOME_THEMES[1],
    worldX: 1200,
    worldWidth: 1400,
  },
  {
    id: 3,
    name: "Design & Planning",
    biomeName: "Cartographer's Tower",
    subtitle: "Stage 3 · Blueprint the Method",
    checkpoints: 4,
    monster: LAB_MONSTERS[2],
    icon: "📐",
    biomeTheme: LAB_BIOME_THEMES[2],
    worldX: 2600,
    worldWidth: 1400,
  },
  {
    id: 4,
    name: "Build & Execute",
    biomeName: "The Forge",
    subtitle: "Stage 4 · Run the Experiment",
    checkpoints: 5,
    monster: LAB_MONSTERS[3],
    icon: "⚗️",
    biomeTheme: LAB_BIOME_THEMES[3],
    worldX: 4000,
    worldWidth: 1600,
  },
  {
    id: 5,
    name: "Test & Evaluate",
    biomeName: "Alchemist's Laboratory",
    subtitle: "Stage 5 · Analyze the Results",
    checkpoints: 5,
    monster: LAB_MONSTERS[4],
    icon: "🧪",
    biomeTheme: LAB_BIOME_THEMES[4],
    worldX: 5600,
    worldWidth: 1600,
  },
  {
    id: 6,
    name: "Iterate & Refine",
    biomeName: "Crossroads Town",
    subtitle: "Stage 6 · Improve the Experiment",
    checkpoints: 4,
    monster: LAB_MONSTERS[5],
    icon: "🔧",
    biomeTheme: LAB_BIOME_THEMES[5],
    worldX: 7200,
    worldWidth: 1400,
  },
  {
    id: 7,
    name: "Document & Present",
    biomeName: "Grand Hall",
    subtitle: "Stage 7 · Share the Discovery",
    checkpoints: 4,
    monster: LAB_MONSTERS[6],
    icon: "📝",
    biomeTheme: LAB_BIOME_THEMES[6],
    worldX: 8600,
    worldWidth: 1400,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL TOOLS
// ─────────────────────────────────────────────────────────────────────────────

const LAB_SPECIAL_TOOLS: SpecialToolConfig[] = [
  {
    id: "experiment_logger",
    name: "Experiment Logger",
    templateId: "lab",
    description: "Log every experimental run with parameters, conditions, and results — maintain a full audit trail.",
    icon: "🗒️",
    componentKey: "LabExperimentLogger",
  },
  {
    id: "simulation_canvas",
    name: "Simulation Canvas",
    templateId: "lab",
    description: "Sketch and simulate your experimental setup visually before building.",
    icon: "🖥️",
    componentKey: "LabSimulationCanvas",
  },
  {
    id: "metrics_dashboard",
    name: "Metrics Dashboard",
    templateId: "lab",
    description: "Track key experimental metrics in real-time with charting and statistical summaries.",
    icon: "📈",
    componentKey: "LabMetricsDashboard",
  },
  {
    id: "test_tracker",
    name: "Test Tracker",
    templateId: "lab",
    description: "Manage and version your test cases — track pass/fail status across experiment iterations.",
    icon: "✅",
    componentKey: "LabTestTracker",
  },
  {
    id: "prototype_history",
    name: "Prototype Iteration History",
    templateId: "lab",
    description: "Timeline view of all prototype versions with diff notes and performance comparisons.",
    icon: "🔄",
    componentKey: "LabPrototypeHistory",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LAB TEMPLATE EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const LAB_TEMPLATE: ProjectTemplate = {
  id: "lab",
  name: "Lab",
  tagline: "Design, build, and prove your experiment",

  stages: LAB_STAGES,

  qualityMetric: {
    id: "p_value",
    label: "p-value",
    unit: "p",
    // CRITICAL: Lower p-value = better result. Must reach ≤0.05 for significance.
    direction: "lower_is_better",
    startValue: 0.9,
    displayFormat: "decimal",
    thresholds: {
      // For lower_is_better: score <= high threshold → High tier
      low: 0.5,       // p > 0.5 → Low tier
      standard: 0.1,  // 0.05 < p <= 0.5 → Standard tier
      high: 0.05,     // p <= 0.05 → High tier (significance threshold)
    },
    icon: "⚗️",
  },

  worldTheme: {
    hudColorScheme: "lab",
    hudPrimaryColor: "#06d6a0",
    hudMetricIcon: "⚗️",
    mapBackgroundKey: "bg_lab",
    loreFont: "Share Tech Mono",
    accentFont: "Orbitron",
  },

  monsters: LAB_MONSTERS,

  audioProfile: {
    stageThemes: {
      1: "stage_3",  // Observatory → arena theme
      2: "stage_2",  // Library
      3: "stage_5",  // Tower → mine theme
      4: "stage_6",  // Forge → harbour
      5: "stage_7",  // Lab → crossroads
      6: "stage_4",  // Town → artisan
      7: "stage_8",  // Grand Hall → capital
    },
    bossTheme: "boss_unraveller",
    ambienceMap: {
      1: "arena", 2: "forest", 3: "mine",
      4: "harbour", 5: "crossroads", 6: "artisan", 7: "capital",
    },
    corruptionLayerId: "corruption_lab",
  },

  animationProfile: {
    checkpointStyle: "reactor_pulse",
    checkpointParticle: "lab_sparks",
    bossEntranceVariant: "lab",
  },

  aiScoring: {
    dimensions: [
      {
        id: "reproducibility",
        label: "Reproducibility",
        rubric: "Could another researcher replicate this experiment exactly from the documentation provided? (0=cannot replicate, 1=partially documented, 2=mostly reproducible, 3=fully reproducible)",
        weight: 1.5,
      },
      {
        id: "experimental_rigor",
        label: "Experimental Rigor",
        rubric: "Are controls established? Is the methodology scientifically sound? Are variables properly isolated? (0=no rigor, 1=basic controls, 2=mostly rigorous, 3=fully rigorous)",
        weight: 1.5,
      },
      {
        id: "technical_depth",
        label: "Technical Depth",
        rubric: "Is the technical implementation detailed and precise? Are tools, parameters, and procedures specified? (0=vague, 1=some detail, 2=mostly detailed, 3=fully specified)",
        weight: 1,
      },
      {
        id: "measurable_validation",
        label: "Measurable Validation",
        rubric: "Are results quantified with appropriate metrics? Is statistical significance addressed? (0=no metrics, 1=basic counts, 2=meaningful metrics, 3=statistically validated)",
        weight: 1,
      },
    ],
    evaluatorPersona: "You are a rigorous experimental scientist peer-reviewing a lab submission for methodological soundness and reproducibility.",
    workContext: "experimental research and laboratory science",
  },

  specialTools: LAB_SPECIAL_TOOLS,

  totalCheckpoints: 29, // 3+4+4+5+5+4+4
};
