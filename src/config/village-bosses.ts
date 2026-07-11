/**
 * @file village-bosses.ts
 * @description Shared config for the Village (Stage 1) mini-bosses.
 *  Both the Phaser VillageMapScene and the React CombatPanel read from
 *  this list so the boss the user sees on the map is the same boss they
 *  fight in AI Combat.
 *
 * Adding a new boss? Update this array only — the map scene picks up
 * the sprite via `idleKey` and the combat panel gets the name + family
 * via the same object.
 */

export type VillageBossFamily =
  | "mist"
  | "undead"
  | "plant"
  | "machine"
  | "serpent"
  | "arcane";

export interface VillageBossInfo {
  /** Zero-based checkpoint index this boss guards (0 → CP1). */
  checkpointIndex: number;
  /** Display name — shown on HP chip AND in combat intro line. */
  name: string;
  /** Family drives the projectile tint + aura color in combat. */
  family: VillageBossFamily;
  /** Public asset path to the idle sprite for use in <img> tags. */
  idleAsset: string;
  /** Combat intro flavor line prefix — falls back to "* {name} blocks your path." */
  introLine?: string;
}

/**
 * The four village mini-bosses in checkpoint order.
 * Keep in sync with VILLAGE_MINI_BOSSES in VillageMapScene.ts.
 */
export const VILLAGE_BOSSES: readonly VillageBossInfo[] = [
  {
    checkpointIndex: 0,
    name: "Fog of Vagueness",
    family: "mist",
    idleAsset: "/assets/bosses/village/fog/idle.png",
    introLine: "* The Fog of Vagueness swirls around you.",
  },
  {
    checkpointIndex: 1,
    name: "Everyone Chimera",
    family: "undead",
    idleAsset: "/assets/bosses/village/chimera/idle.png",
    introLine: "* The Everyone Chimera reaches for all directions at once.",
  },
  {
    checkpointIndex: 2,
    name: "Feature Automaton",
    family: "machine",
    idleAsset: "/assets/bosses/village/automaton/idle.png",
    introLine: "* The Feature Automaton stamps out another endless feature.",
  },
  {
    checkpointIndex: 3,
    name: "Assumption Wraith",
    family: "undead",
    idleAsset: "/assets/bosses/village/wraith/idle.png",
    introLine: "* The Assumption Wraith whispers doubts in your ear.",
  },
];

/** Look up boss metadata by zero-based checkpoint index. */
export function getVillageBoss(checkpointIndex: number): VillageBossInfo | null {
  return VILLAGE_BOSSES[checkpointIndex] ?? null;
}

/**
 * Family palette used by CombatPanel to tint the projectile and by
 * bossAnimator (Phaser) to tint particles. Kept in sync with
 * FAMILY_STYLES in bossAnimator.ts.
 */
export const FAMILY_PALETTE: Record<VillageBossFamily, {
  /** RGB hex for outer particle color. */
  particleColor: string;
  /** RGB hex for the projectile core. */
  coreColor: string;
  /** RGB hex for the aura glow. */
  auraColor: string;
}> = {
  mist: {
    particleColor: "#d8d8ee",
    coreColor: "#aaccff",
    auraColor: "#9999cc",
  },
  undead: {
    particleColor: "#8877aa",
    coreColor: "#cc99ff",
    auraColor: "#554466",
  },
  plant: {
    particleColor: "#66cc44",
    coreColor: "#aaff88",
    auraColor: "#336622",
  },
  machine: {
    particleColor: "#ff9944",
    coreColor: "#ffcc00",
    auraColor: "#995500",
  },
  serpent: {
    particleColor: "#442266",
    coreColor: "#cc44ff",
    auraColor: "#220033",
  },
  arcane: {
    particleColor: "#66ccff",
    coreColor: "#aaeeff",
    auraColor: "#2244aa",
  },
};
