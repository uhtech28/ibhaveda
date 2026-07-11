/**
 * @file stages.config.ts
 * @description Central registry of Venture stages (1-8) with their painted
 *  map assets, biome themes, and super-boss identity.
 *
 *  Purpose: when the future generic `StageMapScene` (successor to
 *  `VillageMapScene`) is built, it reads from this table to know which
 *  map PNG to load, which family palette to use, and which super-boss
 *  guards the east edge.
 *
 *  Right now only Stage 1 (Village) has a full Phaser scene wired.
 *  Stage 2 (Forest) has a preview pan reveal but no interactive scene.
 *  Stages 3-8 have assets ingested but no scenes yet — the config
 *  entries exist so the roadmap is honest and the wiring can be built
 *  incrementally without hunting for asset paths.
 */

import type { VillageBossFamily } from "@/config/village-bosses";

export interface StageMapAsset {
  /** Public URL to the painted map PNG. */
  mapPath: string;
  /** Optional additional layer PNGs (rendered above the base). */
  layerPaths?: string[];
  /** Intrinsic pixel dimensions of the base map (for camera bounds). */
  width: number;
  height: number;
}

export interface StageConfig {
  /** Stage number, 1-based (1-8 for a full venture). */
  stage: number;
  /** Display name — used in overlays + map header. */
  name: string;
  /** Short biome tag — drives ambient VFX + weather choices. */
  biome:
    | "village"
    | "forest"
    | "harbor"
    | "artisans_district"
    | "arena"
    | "peaks"
    | "citadel"
    | "outer_reaches";
  /** Painted map + layers. */
  assets: StageMapAsset;
  /** Family drives boss auras and combat backdrop tint. */
  family: VillageBossFamily;
  /** Stage-final super-boss display name. Rendered on reveal. */
  superBossName: string;
  /** Whether a fully-interactive Phaser scene exists yet. */
  hasInteractiveScene: boolean;
  /**
   * True when the super-boss NAME is defined but the roster + art aren't
   * ready yet. The scene will silently skip the super-boss combat and
   * jump straight to STAGE_COMPLETE. Consumers (UI, HUD) can use this to
   * label the stage "boss art pending" honestly.
   */
  bossArtPending?: boolean;
}

/**
 * The 8 canonical Venture stages. Update this array when new painted
 * assets arrive or when a new stage-scene ships.
 */
export const STAGES: readonly StageConfig[] = [
  {
    stage: 1,
    name: "The Village",
    biome: "village",
    assets: {
      mapPath: "/assets/maps-v2/village-painted/village-map.png",
      width: 1536,
      height: 1024,
    },
    family: "mist",
    superBossName: "The Unraveller",
    hasInteractiveScene: true,
  },
  {
    stage: 2,
    name: "Forest of Perfectionism",
    biome: "forest",
    assets: {
      mapPath: "/assets/maps-v2/forest/forest-map.png",
      width: 2304,
      height: 1440,
    },
    family: "plant",
    superBossName: "The Pale Architect",
    hasInteractiveScene: false, // preview only via Stage 1 finale pan
  },
  {
    // Stage 3 = Validation · The Arena · The Advocate of Comfortable Lies.
    // Painted map delivered (composited from base terrain + amphitheatre
    // overlay).  Boss art still pending — Advocate + minis stubbed out.
    stage: 3,
    name: "The Arena",
    biome: "arena",
    assets: {
      mapPath: "/assets/maps-v2/arena/arena-map.png",
      width: 2624,
      height: 1630,
    },
    family: "arcane",
    superBossName: "The Advocate of Comfortable Lies",
    hasInteractiveScene: true,
    bossArtPending: true, // no roster in stage-bosses.ts; fight is skipped at runtime
  },
  {
    stage: 4,
    name: "The Artisan's Quarter",
    biome: "artisans_district",
    assets: {
      mapPath: "/assets/maps-v2/artisans/artisans-map.png",
      width: 2624,
      height: 1630,
    },
    family: "arcane",
    // Roster + art ship as "The Forge Dragon"; keep names in sync so any
    // pre-fight UI text matches what actually appears at runtime.
    superBossName: "The Forge Dragon",
    hasInteractiveScene: true,
  },
  {
    // Stage 5 = Build & Deliver · The Mine · The Collapse Specter.
    // Ironhold Mine cross-section painted map delivered (1536×1024
    // after LDtk grey padding was cropped off).
    // Boss art still pending — Specter + minis stubbed.
    stage: 5,
    name: "The Mine",
    biome: "mine" as any,
    assets: {
      mapPath: "/assets/maps-v2/mine/mine-map.png",
      width: 1536,
      height: 1024,
    },
    family: "undead",
    superBossName: "The Collapse Specter",
    hasInteractiveScene: true,
    bossArtPending: true, // no roster in stage-bosses.ts; fight is skipped
  },
  {
    // Stage 6 = Launch · The Harbour · The Leviathan of Market Rejection.
    stage: 6,
    name: "The Harbour",
    biome: "harbor",
    assets: {
      mapPath: "/assets/maps-v2/golden-harbor/harbor-map.png",
      width: 2612,
      height: 1632,
    },
    family: "serpent",
    // Roster + art ship as "The Leviathan of Market Rejection". Keep the
    // config name aligned with what actually spawns.
    superBossName: "The Leviathan of Market Rejection",
    hasInteractiveScene: true,
  },
  {
    // Stage 7 = Iteration · The Crossroads Town · The Babel Merchant.
    // Autumn-lit small-town junction map delivered (1536×1024 after
    // LDtk grey padding was cropped off).
    // Boss art still pending — Babel Merchant + minis stubbed.
    stage: 7,
    name: "The Crossroads Town",
    biome: "crossroads" as any,
    assets: {
      mapPath: "/assets/maps-v2/crossroads/crossroads-map.png",
      width: 1536,
      height: 1024,
    },
    family: "arcane",
    superBossName: "The Babel Merchant",
    hasInteractiveScene: true,
    bossArtPending: true, // no roster in stage-bosses.ts; fight is skipped
  },
  {
    // Stage 8 = Scale · The Capital · The Iron Bureaucrat.
    // Painted map + boss art both pending — the artist brief lives in
    // docs/MAP_BRIEFS_FOR_ARTIST.md. Entry exists so getStageConfig(8)
    // returns a real record rather than null (previous behaviour would
    // have crashed any code that assumed 8 stages).
    stage: 8,
    name: "The Capital",
    biome: "citadel",
    assets: {
      mapPath: "", // no art yet — scene must check this before load
      width: 2400,
      height: 1600,
    },
    family: "machine",
    superBossName: "The Iron Bureaucrat",
    hasInteractiveScene: false,
    bossArtPending: true,
  },
];

/** Look up a stage config by its 1-based stage number. */
export function getStageConfig(stage: number): StageConfig | null {
  return STAGES.find((s) => s.stage === stage) ?? null;
}

/** Only the stages that have a fully interactive Phaser scene. */
export function getPlayableStages(): StageConfig[] {
  return STAGES.filter((s) => s.hasInteractiveScene);
}

/** Path to the shared combat arena backdrop (biome-agnostic). */
export const COMBAT_ARENA_BACKGROUND =
  "/assets/maps-v2/arena/arena-background.png";
