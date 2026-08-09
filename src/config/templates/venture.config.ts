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
//
// Every entry now carries optional per-state Pixellab spritesheet
// paths. The animation state-machine helper (stageMapAnimations.ts)
// reads these when a super boss is instantiated as a MovingBossHandle
// and plays each clip if present. Missing clips fall through per the
// resolveState() chain:
//   defeat  → hurt → idle
//   victory → attack → idle
// so a boss shipped with only idle+attack still plays a "victory"
// pose (by re-using its attack sheet) and a "defeat" (by re-using
// hurt if present, else static idle).
//
// Frame descriptor defaults: Pixellab exports at this template are
// 92×92 with 9 frames per state. Overrides per-clip are supported
// via BossClipMeta.frameWidth/frameHeight/frameCount.
export interface SuperBossClip {
  asset: string;
  frameCount: number;
  frameWidth?: number;
  frameHeight?: number;
  fps?: number;
}
export interface SuperBossPoolEntry {
  id: string;
  name: string;
  represents: string;
  /** Static south-facing idle image. Kept for backwards-compat + as
   *  the "when nothing else loads" fallback path. */
  idleAsset?: string;
  /** Per-state animation clips. `idle` overrides idleAsset when both
   *  are present. All fields optional — helper falls back through
   *  defeat→hurt→idle and victory→attack→idle. */
  idleClip?: SuperBossClip;
  attackClip?: SuperBossClip;
  hurtClip?: SuperBossClip;
  defeatClip?: SuperBossClip;
  victoryClip?: SuperBossClip;
  /** 8-direction idle rotations. If present, the map's persona-walk
   *  code can pick the right facing frame instead of always showing
   *  south. Same 8 keys as Pixellab exports. */
  rotations?: Partial<Record<
    "north" | "north-east" | "east" | "south-east" | "south" | "south-west" | "west" | "north-west",
    string
  >>;
  /** Boss size scale on the map — pool bosses default to 2.4 (final
   *  boss reveal, bigger than stage minis at 1.9). */
  spriteScale?: number;
  /** Y offset from CP marker — pool bosses default to 40 (higher
   *  than mini bosses so the sword-with-wings crest reads clearly). */
  spriteYOffset?: number;
  spriteXOffset?: number;
}

// Pixellab helper — most sheets are 92×92×9. Some pool bosses ship at
// different dims (Tide Caller = 164×164, Stonecaller idle rotations
// = 256×256). Per-clip overrides handle those.
const P92 = { frameCount: 9, frameWidth: 92, frameHeight: 92 } as const;
const T164 = { frameCount: 9, frameWidth: 164, frameHeight: 164 } as const;

export const SUPER_BOSS_POOL: readonly SuperBossPoolEntry[] = [
  {
    id: "super_unraveller",
    name: "The Unraveller",
    represents: "Doubt and loss of direction",
    // Village-stage idle (kept as the low-alpha silhouette on the map
    // before reveal) + newly-extracted anim strips from the user's
    // GIF uploads at 96×96 (four_purple_serpentine idle 9f + strike
    // attack 9f). Rotations at 92×92 from A_colossal_serpent zip.
    // Frame-size differs between rotations (92) and anims (96) —
    // per-clip dims respect that.
    idleAsset: "/assets/bosses/village/unraveller/idle.png",
    idleClip:   { asset: "/assets/bosses/super-pool/unraveller/idle.png",   frameCount: 9, frameWidth: 96, frameHeight: 96, fps: 6 },
    attackClip: { asset: "/assets/bosses/super-pool/unraveller/attack.png", frameCount: 9, frameWidth: 96, frameHeight: 96, fps: 10 },
    rotations: {
      north:        "/assets/bosses/super-pool/unraveller/rotations/north.png",
      "north-east": "/assets/bosses/super-pool/unraveller/rotations/north-east.png",
      east:         "/assets/bosses/super-pool/unraveller/rotations/east.png",
      "south-east": "/assets/bosses/super-pool/unraveller/rotations/south-east.png",
      south:        "/assets/bosses/super-pool/unraveller/rotations/south.png",
      "south-west": "/assets/bosses/super-pool/unraveller/rotations/south-west.png",
      west:         "/assets/bosses/super-pool/unraveller/rotations/west.png",
      "north-west": "/assets/bosses/super-pool/unraveller/rotations/north-west.png",
    },
    spriteScale: 2.4, spriteYOffset: 40, spriteXOffset: 0,
  },
  {
    id: "super_pale_architect",
    name: "The Pale Architect",
    represents: "Perfectionism and paralysis",
    // Rotations at 88×88 from A_towering_undead_titan_boss.zip +
    // newly-extracted anim strips at 92×92 from the user's GIF
    // uploads (armored_skeleton stands firmly 9f = idle, armored_
    // skeleton lunges forward 11f = attack). Per-clip frame dims
    // handle the 88/92 split.
    idleAsset: "/assets/bosses/super-pool/pale-architect/idle.png",
    idleClip:   { asset: "/assets/bosses/super-pool/pale-architect/idle.png",   frameCount: 9,  frameWidth: 92, frameHeight: 92, fps: 6 },
    attackClip: { asset: "/assets/bosses/super-pool/pale-architect/attack.png", frameCount: 11, frameWidth: 92, frameHeight: 92, fps: 10 },
    rotations: {
      north:        "/assets/bosses/super-pool/pale-architect/rotations/north.png",
      "north-east": "/assets/bosses/super-pool/pale-architect/rotations/north-east.png",
      east:         "/assets/bosses/super-pool/pale-architect/rotations/east.png",
      "south-east": "/assets/bosses/super-pool/pale-architect/rotations/south-east.png",
      south:        "/assets/bosses/super-pool/pale-architect/rotations/south.png",
      "south-west": "/assets/bosses/super-pool/pale-architect/rotations/south-west.png",
      west:         "/assets/bosses/super-pool/pale-architect/rotations/west.png",
      "north-west": "/assets/bosses/super-pool/pale-architect/rotations/north-west.png",
    },
    spriteScale: 2.4, spriteYOffset: 40,
  },
  {
    id: "super_hollow_king",
    name: "The Hollow King",
    represents: "Loss of purpose",
    // Rotations at 92×92 from A_grand_spectral_king_boss.zip + FULL
    // 5-clip anim set from the user's GIF uploads (Tall_armored_king_
    // in_tarnished breathing-idle 4f + custom king-slumps defeat 9f +
    // custom taking-damage hurt 9f + grand-spectral-king dark-figure-
    // raises-staff attack 9f + grand-spectral-king armored-king-plants
    // 9f as victory). Frame sizes: idle/hurt/defeat = 92×92 native
    // (from Tall_armored_king pack); attack/victory = 88×88 native
    // (from A_grand_spectral_king pack). Per-clip dims respect that.
    idleAsset: "/assets/bosses/super-pool/hollow-king/idle.png",
    idleClip:    { asset: "/assets/bosses/super-pool/hollow-king/idle.png",    frameCount: 4, frameWidth: 92, frameHeight: 92, fps: 4 },
    attackClip:  { asset: "/assets/bosses/super-pool/hollow-king/attack.png",  frameCount: 9, frameWidth: 88, frameHeight: 88, fps: 10 },
    hurtClip:    { asset: "/assets/bosses/super-pool/hollow-king/hurt.png",    frameCount: 9, frameWidth: 92, frameHeight: 92, fps: 10 },
    defeatClip:  { asset: "/assets/bosses/super-pool/hollow-king/defeat.png",  frameCount: 9, frameWidth: 92, frameHeight: 92, fps: 8 },
    victoryClip: { asset: "/assets/bosses/super-pool/hollow-king/victory.png", frameCount: 9, frameWidth: 88, frameHeight: 88, fps: 8 },
    rotations: {
      north:        "/assets/bosses/super-pool/hollow-king/rotations/north.png",
      "north-east": "/assets/bosses/super-pool/hollow-king/rotations/north-east.png",
      east:         "/assets/bosses/super-pool/hollow-king/rotations/east.png",
      "south-east": "/assets/bosses/super-pool/hollow-king/rotations/south-east.png",
      south:        "/assets/bosses/super-pool/hollow-king/rotations/south.png",
      "south-west": "/assets/bosses/super-pool/hollow-king/rotations/south-west.png",
      west:         "/assets/bosses/super-pool/hollow-king/rotations/west.png",
      "north-west": "/assets/bosses/super-pool/hollow-king/rotations/north-west.png",
    },
    spriteScale: 2.4, spriteYOffset: 40,
  },
  {
    id: "super_thornwarden",
    name: "The Thornwarden",
    represents: "Bureaucracy and friction",
    // Extracted from `Massive_humanoid_tree-giant_trunk-body_covered (1).zip`
    // — 8-dir rotations at 96×96 + 3 stitched frame sequences:
    //   idle.png = Breathing_Idle 4-frame loop
    //   attack.png = tree-creature-draws-itself-up 9 frames
    //   hurt.png = creature-recoils-sharply 9 frames
    // No defeat/victory anims shipped → fallback chain uses hurt/attack.
    idleAsset: "/assets/bosses/super-pool/thornwarden/idle.png",
    idleClip:   { asset: "/assets/bosses/super-pool/thornwarden/idle.png",   frameCount: 4, frameWidth: 96, frameHeight: 96, fps: 4 },
    attackClip: { asset: "/assets/bosses/super-pool/thornwarden/attack.png", frameCount: 9, frameWidth: 96, frameHeight: 96, fps: 10 },
    hurtClip:   { asset: "/assets/bosses/super-pool/thornwarden/hurt.png",   frameCount: 9, frameWidth: 96, frameHeight: 96, fps: 10 },
    rotations: {
      north:        "/assets/bosses/super-pool/thornwarden/rotations/north.png",
      "north-east": "/assets/bosses/super-pool/thornwarden/rotations/north-east.png",
      east:         "/assets/bosses/super-pool/thornwarden/rotations/east.png",
      "south-east": "/assets/bosses/super-pool/thornwarden/rotations/south-east.png",
      south:        "/assets/bosses/super-pool/thornwarden/rotations/south.png",
      "south-west": "/assets/bosses/super-pool/thornwarden/rotations/south-west.png",
      west:         "/assets/bosses/super-pool/thornwarden/rotations/west.png",
      "north-west": "/assets/bosses/super-pool/thornwarden/rotations/north-west.png",
    },
    spriteScale: 2.4, spriteYOffset: 40,
  },
  {
    id: "super_mirror_witch",
    name: "The Mirror Witch",
    represents: "Self-deception",
    // 8-dir rotations at 92×92 from A_tall_elegant_sorceress_boss.zip
    // + anim strips at 92×92 from the user's GIF uploads (sorceress
    // stands-tall 9f idle + sorceress raises-her-arms 9f attack).
    idleAsset: "/assets/bosses/super-pool/mirror-witch/idle.png",
    idleClip:   { asset: "/assets/bosses/super-pool/mirror-witch/idle.png",   frameCount: 9, frameWidth: 92, frameHeight: 92, fps: 6 },
    attackClip: { asset: "/assets/bosses/super-pool/mirror-witch/attack.png", frameCount: 9, frameWidth: 92, frameHeight: 92, fps: 10 },
    rotations: {
      north:        "/assets/bosses/super-pool/mirror-witch/rotations/north.png",
      "north-east": "/assets/bosses/super-pool/mirror-witch/rotations/north-east.png",
      east:         "/assets/bosses/super-pool/mirror-witch/rotations/east.png",
      "south-east": "/assets/bosses/super-pool/mirror-witch/rotations/south-east.png",
      south:        "/assets/bosses/super-pool/mirror-witch/rotations/south.png",
      "south-west": "/assets/bosses/super-pool/mirror-witch/rotations/south-west.png",
      west:         "/assets/bosses/super-pool/mirror-witch/rotations/west.png",
      "north-west": "/assets/bosses/super-pool/mirror-witch/rotations/north-west.png",
    },
    spriteScale: 2.4, spriteYOffset: 40,
  },
  {
    id: "super_ashen_drake",
    name: "The Ashen Drake",
    represents: "Abandonment and inertia",
    // 8-dir rotations at 92×92 from A_large_dragon_boss_with.zip +
    // 3 anim strips from the user's GIF uploads:
    //   idle = dragon-stands-its-ground 9f 96×96
    //   attack = dragon-rears-back 9f 96×96
    //   defeat = small-dragon-slowly-slumps 9f 92×92
    // Per-clip dims cover the 96/92 mix.
    idleAsset: "/assets/bosses/super-pool/ashen-drake/idle.png",
    idleClip:   { asset: "/assets/bosses/super-pool/ashen-drake/idle.png",   frameCount: 9, frameWidth: 96, frameHeight: 96, fps: 6 },
    attackClip: { asset: "/assets/bosses/super-pool/ashen-drake/attack.png", frameCount: 9, frameWidth: 96, frameHeight: 96, fps: 10 },
    defeatClip: { asset: "/assets/bosses/super-pool/ashen-drake/defeat.png", frameCount: 9, frameWidth: 92, frameHeight: 92, fps: 8 },
    rotations: {
      north:        "/assets/bosses/super-pool/ashen-drake/rotations/north.png",
      "north-east": "/assets/bosses/super-pool/ashen-drake/rotations/north-east.png",
      east:         "/assets/bosses/super-pool/ashen-drake/rotations/east.png",
      "south-east": "/assets/bosses/super-pool/ashen-drake/rotations/south-east.png",
      south:        "/assets/bosses/super-pool/ashen-drake/rotations/south.png",
      "south-west": "/assets/bosses/super-pool/ashen-drake/rotations/south-west.png",
      west:         "/assets/bosses/super-pool/ashen-drake/rotations/west.png",
      "north-west": "/assets/bosses/super-pool/ashen-drake/rotations/north-west.png",
    },
    spriteScale: 2.4, spriteYOffset: 40,
  },
  {
    id: "super_tide_caller",
    name: "The Tide Caller",
    represents: "Distraction and scope creep",
    idleAsset: "/assets/bosses/super-pool/tide-caller/idle.png",
    // Full 5-clip Pixellab set on disk at 164×164×9 + newly-extracted
    // 8-dir rotations from `Tide caller.zip` (53 PNGs including anim
    // sequences under anims/).
    idleClip:    { asset: "/assets/bosses/super-pool/tide-caller/idle.png",    ...T164, fps: 6 },
    attackClip:  { asset: "/assets/bosses/super-pool/tide-caller/attack.png",  ...T164, fps: 10 },
    hurtClip:    { asset: "/assets/bosses/super-pool/tide-caller/hurt.png",    ...T164, fps: 10 },
    defeatClip:  { asset: "/assets/bosses/super-pool/tide-caller/defeat.png",  ...T164, fps: 8 },
    victoryClip: { asset: "/assets/bosses/super-pool/tide-caller/victory.png", ...T164, fps: 8 },
    rotations: {
      north:        "/assets/bosses/super-pool/tide-caller/rotations/north.png",
      "north-east": "/assets/bosses/super-pool/tide-caller/rotations/north-east.png",
      east:         "/assets/bosses/super-pool/tide-caller/rotations/east.png",
      "south-east": "/assets/bosses/super-pool/tide-caller/rotations/south-east.png",
      south:        "/assets/bosses/super-pool/tide-caller/rotations/south.png",
      "south-west": "/assets/bosses/super-pool/tide-caller/rotations/south-west.png",
      west:         "/assets/bosses/super-pool/tide-caller/rotations/west.png",
      "north-west": "/assets/bosses/super-pool/tide-caller/rotations/north-west.png",
    },
    spriteScale: 2.4, spriteYOffset: 40,
  },
  {
    id: "super_gravemind",
    name: "The Gravemind",
    represents: "Fear of failure",
    // Only pool boss with ZERO art. Pending user delivery.
    spriteScale: 2.4, spriteYOffset: 40,
  },
  {
    id: "super_rusted_oracle",
    name: "The Rusted Oracle",
    represents: "Imposter syndrome",
    idleAsset: "/assets/bosses/super-pool/rusted-oracle/idle.png",
    // Full 5-clip Pixellab set on disk at 92×92×9 plus 8-dir rotations
    // extracted from the new `the_rusted_oracle.zip` pack (39 PNGs
    // total including animation frame sequences under anims/).
    idleClip:    { asset: "/assets/bosses/super-pool/rusted-oracle/idle.png",    ...P92, fps: 6 },
    attackClip:  { asset: "/assets/bosses/super-pool/rusted-oracle/attack.png",  ...P92, fps: 10 },
    hurtClip:    { asset: "/assets/bosses/super-pool/rusted-oracle/hurt.png",    ...P92, fps: 10 },
    defeatClip:  { asset: "/assets/bosses/super-pool/rusted-oracle/defeat.png",  ...P92, fps: 8 },
    victoryClip: { asset: "/assets/bosses/super-pool/rusted-oracle/victory.png", ...P92, fps: 8 },
    rotations: {
      north:        "/assets/bosses/super-pool/rusted-oracle/rotations/north.png",
      "north-east": "/assets/bosses/super-pool/rusted-oracle/rotations/north-east.png",
      east:         "/assets/bosses/super-pool/rusted-oracle/rotations/east.png",
      "south-east": "/assets/bosses/super-pool/rusted-oracle/rotations/south-east.png",
      south:        "/assets/bosses/super-pool/rusted-oracle/rotations/south.png",
      "south-west": "/assets/bosses/super-pool/rusted-oracle/rotations/south-west.png",
      west:         "/assets/bosses/super-pool/rusted-oracle/rotations/west.png",
      "north-west": "/assets/bosses/super-pool/rusted-oracle/rotations/north-west.png",
    },
    spriteScale: 2.4, spriteYOffset: 40,
  },
  {
    id: "super_wraith_council",
    name: "The Wraith Council",
    represents: "Decision paralysis",
    // Rebuilt from `the_wraith_council.zip` — 88×88 sheets stitched
    // from Pixellab anim frames (idle 4f + attack 9f + hurt 9f). No
    // defeat/victory anims → fallback chain uses hurt/attack.
    // Legacy 92×92 defeat.png sheet exists on disk from an earlier
    // pack but the newer anims are 88×88; if we wired defeatClip
    // pointing at the legacy 92×92 file Phaser would slice wrong.
    // Skipped to keep the frame-size consistent.
    idleAsset: "/assets/bosses/super-pool/wraith-council/idle.png",
    idleClip:    { asset: "/assets/bosses/super-pool/wraith-council/idle.png",   frameCount: 4, frameWidth: 88, frameHeight: 88, fps: 4 },
    attackClip:  { asset: "/assets/bosses/super-pool/wraith-council/attack.png", frameCount: 9, frameWidth: 88, frameHeight: 88, fps: 10 },
    hurtClip:    { asset: "/assets/bosses/super-pool/wraith-council/hurt.png",   frameCount: 9, frameWidth: 88, frameHeight: 88, fps: 10 },
    // Existing 88×88×9 defeat sheet was already on disk from an
    // earlier legacy pack (verified: 792×88 = 9 frames × 88px), so
    // we wire it here to complete the state machine even though
    // the new Pixellab pack didn't ship a defeat anim.
    defeatClip:  { asset: "/assets/bosses/super-pool/wraith-council/defeat.png", frameCount: 9, frameWidth: 88, frameHeight: 88, fps: 8 },
    spriteScale: 2.4, spriteYOffset: 40,
  },
  {
    id: "super_stonecaller",
    name: "The Stonecaller",
    represents: "Overwhelm",
    // Rebuilt from `the_stonecaller (1).zip` — 92×92 stitched anims
    // (attack 9f + hurt 9f from stone-golem shifts/hunches) + legacy
    // victory sheet + 256×256 8-direction rotations from the
    // idle_stonecaller.zip pack.
    idleAsset: "/assets/bosses/super-pool/stonecaller/idle.png",
    idleClip:    { asset: "/assets/bosses/super-pool/stonecaller/idle.png",    ...P92, fps: 6 },
    attackClip:  { asset: "/assets/bosses/super-pool/stonecaller/attack.png",  ...P92, fps: 10 },
    hurtClip:    { asset: "/assets/bosses/super-pool/stonecaller/hurt.png",    ...P92, fps: 10 },
    victoryClip: { asset: "/assets/bosses/super-pool/stonecaller/victory.png", ...P92, fps: 8 },
    rotations: {
      north:        "/assets/bosses/super-pool/stonecaller/rotations/north.png",
      "north-east": "/assets/bosses/super-pool/stonecaller/rotations/north-east.png",
      east:         "/assets/bosses/super-pool/stonecaller/rotations/east.png",
      "south-east": "/assets/bosses/super-pool/stonecaller/rotations/south-east.png",
      south:        "/assets/bosses/super-pool/stonecaller/rotations/south.png",
      "south-west": "/assets/bosses/super-pool/stonecaller/rotations/south-west.png",
      west:         "/assets/bosses/super-pool/stonecaller/rotations/west.png",
      "north-west": "/assets/bosses/super-pool/stonecaller/rotations/north-west.png",
    },
    spriteScale: 2.4, spriteYOffset: 40,
  },
  {
    id: "super_veilwalker",
    name: "The Veilwalker",
    represents: "Isolation and fear of irrelevance",
    // Rebuilt from `the_veilwalker.zip` + `v_eilwalker_hurt.zip` —
    // 88×88 stitched sheets (idle Breathing 4f + attack cloaked-lunges
    // 9f + defeat hooded-slumps 9f) + 8-dir rotations at 256×256
    // (idle + hurt-state facings). No standalone hurt anim yet →
    // fallback uses idle.
    idleAsset: "/assets/bosses/super-pool/veilwalker/idle.png",
    idleClip:    { asset: "/assets/bosses/super-pool/veilwalker/idle.png",   frameCount: 4, frameWidth: 88, frameHeight: 88, fps: 4 },
    attackClip:  { asset: "/assets/bosses/super-pool/veilwalker/attack.png", frameCount: 9, frameWidth: 88, frameHeight: 88, fps: 10 },
    defeatClip:  { asset: "/assets/bosses/super-pool/veilwalker/defeat.png", frameCount: 9, frameWidth: 88, frameHeight: 88, fps: 8 },
    rotations: {
      north:        "/assets/bosses/super-pool/veilwalker/rotations/north.png",
      "north-east": "/assets/bosses/super-pool/veilwalker/rotations/north-east.png",
      east:         "/assets/bosses/super-pool/veilwalker/rotations/east.png",
      "south-east": "/assets/bosses/super-pool/veilwalker/rotations/south-east.png",
      south:        "/assets/bosses/super-pool/veilwalker/rotations/south.png",
      "south-west": "/assets/bosses/super-pool/veilwalker/rotations/south-west.png",
      west:         "/assets/bosses/super-pool/veilwalker/rotations/west.png",
      "north-west": "/assets/bosses/super-pool/veilwalker/rotations/north-west.png",
    },
    spriteScale: 2.4, spriteYOffset: 40,
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
