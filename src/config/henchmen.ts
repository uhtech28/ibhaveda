/**
 * Henchmen — PRD § 9.1
 *
 * Small thematic enemies that spawn inline on the path between
 * checkpoints. Distinct from inter-checkpoint mini-game spawns
 * (`MINIGAME_SPAWNS`), which are full-screen overlay experiences.
 * Henchmen are blink-and-you-miss-it inline encounters: tap to
 * defeat for a small XP bonus, or let them auto-flee for nothing.
 *
 * Per-stage thematic types reinforce the stage monster's narrative
 * presence. The Pathwarden Wraith of the Forest is accompanied by
 * Confusion Sprites that scramble trails. The Iron Bureaucrat at
 * the Capital is accompanied by Audit Clerks that demand paperwork.
 *
 * Each spawn awards XP scaled by stage. Auto-flee awards 50% of
 * normal so passive players aren't fully shut out.
 */

import type { StageMonsterTemplate } from "./stageMonsters";

export type HenchmanInteractionKind =
  | "tap"
  | "quick_tap"
  | "dodge_then_tap";

export interface HenchmanDefinition {
  /** Stable slug used by spawn/defeat events. */
  id: string;
  /** Template this henchman appears in. */
  template: StageMonsterTemplate;
  /** Stage number within the template. */
  stage: number;
  /** Display name shown in the small floating label. */
  name: string;
  /** XP awarded on tap-to-defeat (auto-flee = half). */
  xpReward: number;
  /** How the player interacts with it. */
  interaction: HenchmanInteractionKind;
  /**
   * Visual style — drives the procedural drawing in the Henchman
   * Phaser entity. Five rough archetypes cover all the PRD types.
   */
  visualStyle:
    | "wisp"
    | "sprite"
    | "shade"
    | "imp"
    | "clerk";
  /** Auto-flee duration in seconds. */
  autoFleeSeconds: number;
}

/** Per-stage henchman roster. */
const VENTURE: HenchmanDefinition[] = [
  { id: "venture-h-fog-wisp",        template: "venture", stage: 1, name: "Fog Wisp",        xpReward: 3,  interaction: "tap",            visualStyle: "wisp",   autoFleeSeconds: 14 },
  { id: "venture-h-confusion-sprite", template: "venture", stage: 2, name: "Confusion Sprite", xpReward: 4,  interaction: "quick_tap",      visualStyle: "sprite", autoFleeSeconds: 12 },
  { id: "venture-h-echo-shade",       template: "venture", stage: 3, name: "Echo Shade",       xpReward: 5,  interaction: "dodge_then_tap", visualStyle: "shade",  autoFleeSeconds: 12 },
  { id: "venture-h-shard-imp",        template: "venture", stage: 4, name: "Shard Imp",        xpReward: 6,  interaction: "tap",            visualStyle: "imp",    autoFleeSeconds: 13 },
  { id: "venture-h-tunnel-rat",       template: "venture", stage: 5, name: "Tunnel Rat",       xpReward: 7,  interaction: "quick_tap",      visualStyle: "imp",    autoFleeSeconds: 11 },
  { id: "venture-h-port-clerk",       template: "venture", stage: 6, name: "Port Clerk",       xpReward: 8,  interaction: "tap",            visualStyle: "clerk",  autoFleeSeconds: 13 },
  { id: "venture-h-rumour-sprite",    template: "venture", stage: 7, name: "Rumour Sprite",    xpReward: 9,  interaction: "dodge_then_tap", visualStyle: "sprite", autoFleeSeconds: 11 },
  { id: "venture-h-audit-clerk",      template: "venture", stage: 8, name: "Audit Clerk",      xpReward: 10, interaction: "tap",            visualStyle: "clerk",  autoFleeSeconds: 13 },
];

const ACADEMIC: HenchmanDefinition[] = [
  { id: "academic-h-misfile-wisp",   template: "academic", stage: 1, name: "Misfile Wisp",   xpReward: 3,  interaction: "tap",            visualStyle: "wisp",   autoFleeSeconds: 14 },
  { id: "academic-h-fragment-shade", template: "academic", stage: 2, name: "Fragment Shade", xpReward: 4,  interaction: "quick_tap",      visualStyle: "shade",  autoFleeSeconds: 12 },
  { id: "academic-h-bias-imp",       template: "academic", stage: 3, name: "Bias Imp",       xpReward: 6,  interaction: "dodge_then_tap", visualStyle: "imp",    autoFleeSeconds: 12 },
  { id: "academic-h-doubt-sprite",   template: "academic", stage: 4, name: "Doubt Sprite",   xpReward: 7,  interaction: "tap",            visualStyle: "sprite", autoFleeSeconds: 13 },
  { id: "academic-h-quibble-clerk",  template: "academic", stage: 5, name: "Quibble Clerk",  xpReward: 8,  interaction: "quick_tap",      visualStyle: "clerk",  autoFleeSeconds: 11 },
  { id: "academic-h-veto-imp",       template: "academic", stage: 6, name: "Veto Imp",       xpReward: 10, interaction: "tap",            visualStyle: "imp",    autoFleeSeconds: 13 },
];

const LAB: HenchmanDefinition[] = [
  { id: "lab-h-haze-wisp",         template: "lab", stage: 1, name: "Haze Wisp",         xpReward: 3,  interaction: "tap",            visualStyle: "wisp",   autoFleeSeconds: 14 },
  { id: "lab-h-precedent-shade",   template: "lab", stage: 2, name: "Precedent Shade",   xpReward: 4,  interaction: "quick_tap",      visualStyle: "shade",  autoFleeSeconds: 12 },
  { id: "lab-h-blueprint-sprite",  template: "lab", stage: 3, name: "Blueprint Sprite",  xpReward: 5,  interaction: "tap",            visualStyle: "sprite", autoFleeSeconds: 13 },
  { id: "lab-h-ember-imp",         template: "lab", stage: 4, name: "Ember Imp",         xpReward: 6,  interaction: "quick_tap",      visualStyle: "imp",    autoFleeSeconds: 12 },
  { id: "lab-h-bias-wisp",         template: "lab", stage: 5, name: "Bias Wisp",         xpReward: 7,  interaction: "dodge_then_tap", visualStyle: "wisp",   autoFleeSeconds: 11 },
  { id: "lab-h-pivot-sprite",      template: "lab", stage: 6, name: "Pivot Sprite",      xpReward: 8,  interaction: "tap",            visualStyle: "sprite", autoFleeSeconds: 13 },
  { id: "lab-h-silencer-clerk",    template: "lab", stage: 7, name: "Silencer Clerk",    xpReward: 10, interaction: "tap",            visualStyle: "clerk",  autoFleeSeconds: 13 },
];

const CREATIVE: HenchmanDefinition[] = [
  { id: "creative-h-blank-wisp",      template: "creative", stage: 1, name: "Blank Wisp",      xpReward: 3,  interaction: "tap",            visualStyle: "wisp",   autoFleeSeconds: 14 },
  { id: "creative-h-echo-shade",      template: "creative", stage: 2, name: "Echo Shade",      xpReward: 4,  interaction: "quick_tap",      visualStyle: "shade",  autoFleeSeconds: 12 },
  { id: "creative-h-drift-sprite",    template: "creative", stage: 3, name: "Drift Sprite",    xpReward: 5,  interaction: "dodge_then_tap", visualStyle: "sprite", autoFleeSeconds: 12 },
  { id: "creative-h-flatter-sprite",  template: "creative", stage: 4, name: "Flatter Sprite",  xpReward: 6,  interaction: "tap",            visualStyle: "sprite", autoFleeSeconds: 13 },
  { id: "creative-h-polish-imp",      template: "creative", stage: 5, name: "Polish Imp",      xpReward: 7,  interaction: "quick_tap",      visualStyle: "imp",    autoFleeSeconds: 11 },
  { id: "creative-h-portage-clerk",   template: "creative", stage: 6, name: "Portage Clerk",   xpReward: 9,  interaction: "tap",            visualStyle: "clerk",  autoFleeSeconds: 13 },
];

export const HENCHMAN_DEFINITIONS: readonly HenchmanDefinition[] = [
  ...VENTURE,
  ...ACADEMIC,
  ...LAB,
  ...CREATIVE,
] as const;

const BY_TEMPLATE_STAGE = new Map<string, HenchmanDefinition>();
for (const h of HENCHMAN_DEFINITIONS) {
  BY_TEMPLATE_STAGE.set(`${h.template}-${h.stage}`, h);
}

export function getHenchmanForStage(
  template: StageMonsterTemplate,
  stage: number,
): HenchmanDefinition | undefined {
  return BY_TEMPLATE_STAGE.get(`${template}-${stage}`);
}

/**
 * PRD § 9.1 — small enemies on the path. Per the design,
 * inter-checkpoint segments have a moderate chance of spawning at
 * least one henchman (a chest is rarer, mini-game rarer still). We
 * use 35% per segment so most segments are quiet but a player who
 * grinds through a few back-to-back will reliably see at least one.
 */
export function shouldSpawnHenchman(): boolean {
  return Math.random() < 0.35;
}
