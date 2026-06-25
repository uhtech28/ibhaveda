/**
 * Stage Monster Definitions — PRD Monsters & Mechanics workbook.
 *
 * Per template (Venture / Academic / Lab / Creative), each stage has
 * one named monster that guards the stage's checkpoints. The monster
 * takes damage as the player clears checkpoints; defeating the stage's
 * final checkpoint either retreats (partial clear) or slays the
 * monster (full gold clear).
 *
 * This file is the single source of truth for:
 *  - Phaser asset loading: each monster has a paintedSprite key whose
 *    file is loaded silently at boot. If the file is missing the
 *    MiniBoss class falls back to its procedural draw method.
 *  - MiniBoss rendering: the `bossType` field matches the string
 *    keys in MiniBoss.ts's switch-case so the existing damage/eye
 *    logic continues to work.
 *
 * Asset path convention:
 *  /public/assets/monsters/<template>/<id>.png
 */

export type StageMonsterTemplate = "venture" | "academic" | "lab" | "creative";

export interface StageMonsterDefinition {
  /** Stable slug used as the sprite filename. */
  id: string;
  /** Template this monster appears in. */
  template: StageMonsterTemplate;
  /** 1-indexed stage number within the template. */
  stage: number;
  /** Display name shown in HUD / nameplate. */
  name: string;
  /**
   * Matches the existing MiniBoss switch-case string. Determines
   * which procedural fallback draw method runs if the painted
   * sprite is missing.
   */
  bossType: string;
  /** Public path to the painted sprite (4-direction or single pose). */
  spritePath: string;
  /** Short narrative description shown in stage intro. */
  description: string;
}

/** Phaser texture key for a monster sprite. Single source of truth. */
export function monsterTextureKey(id: string): string {
  return `monster_${id}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// VENTURE — 8 stages
// ─────────────────────────────────────────────────────────────────────────────

const VENTURE: StageMonsterDefinition[] = [
  {
    id: "venture-s1-fog",
    template: "venture",
    stage: 1,
    name: "The Fog of Vagueness",
    bossType: "Fog of Vagueness",
    spritePath: "/assets/monsters/venture/s1-fog.png",
    description:
      "A creeping mist that obscures the problem from those who live with it.",
  },
  {
    id: "venture-s2-pathwarden",
    template: "venture",
    stage: 2,
    name: "The Pathwarden Wraith",
    bossType: "Pathwarden Wraith",
    spritePath: "/assets/monsters/venture/s2-pathwarden.png",
    description:
      "A spectral guardian that scrambles the forest's trails — every promising lead circles back.",
  },
  {
    id: "venture-s3-advocate",
    template: "venture",
    stage: 3,
    name: "The Advocate of Comfortable Lies",
    bossType: "Advocate of Comfortable Lies",
    spritePath: "/assets/monsters/venture/s3-advocate.png",
    description:
      "A silver-tongued champion who fights with reassuring falsehoods that survive any cursory test.",
  },
  {
    id: "venture-s4-golem",
    template: "venture",
    stage: 4,
    name: "The Unfinished Golem",
    bossType: "Unfinished Golem",
    spritePath: "/assets/monsters/venture/s4-golem.png",
    description:
      "A massive construct that breaks finished work in the artisan's quarter — never malicious, never still.",
  },
  {
    id: "venture-s5-specter",
    template: "venture",
    stage: 5,
    name: "The Collapse Specter",
    bossType: "Collapse Specter",
    spritePath: "/assets/monsters/venture/s5-specter.png",
    description:
      "A creature of the deep mine that weakens supports wherever the work is rushed or skipped.",
  },
  {
    id: "venture-s6-harbourmaster",
    template: "venture",
    stage: 6,
    name: "The Harbourmaster of Hesitation",
    bossType: "Harbourmaster of Hesitation",
    spritePath: "/assets/monsters/venture/s6-harbourmaster.png",
    description:
      "An ancient official who cites missing paperwork to keep every ship in port indefinitely.",
  },
  {
    id: "venture-s7-merchant",
    template: "venture",
    stage: 7,
    name: "The Babel Merchant",
    bossType: "Babel Merchant",
    spritePath: "/assets/monsters/venture/s7-merchant.png",
    description:
      "A trader who sells contradictory maps — each customer gets different directions and priorities.",
  },
  {
    id: "venture-s8-bureaucrat",
    template: "venture",
    stage: 8,
    name: "The Iron Bureaucrat",
    bossType: "Iron Bureaucrat",
    spritePath: "/assets/monsters/venture/s8-bureaucrat.png",
    description:
      "A towering armoured figure controlling the capital's gates with permits, audits, and tributes.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC — 6 stages
// ─────────────────────────────────────────────────────────────────────────────

const ACADEMIC: StageMonsterDefinition[] = [
  {
    id: "academic-s1-librarian",
    template: "academic",
    stage: 1,
    name: "The Librarian of Lost Questions",
    bossType: "Librarian of Lost Questions",
    spritePath: "/assets/monsters/academic/s1-librarian.png",
    description:
      "A spectral scholar who has spent centuries misfiling questions, hiding the genuine ones.",
  },
  {
    id: "academic-s2-keeper",
    template: "academic",
    stage: 2,
    name: "The Keeper of Incomplete Records",
    bossType: "Keeper of Incomplete Records",
    spritePath: "/assets/monsters/academic/s2-keeper.png",
    description:
      "An ancient archivist who has destroyed half of every document, leaving only fragments.",
  },
  {
    id: "academic-s3-cartographer",
    template: "academic",
    stage: 3,
    name: "The Cartographer of Crooked Maps",
    bossType: "Cartographer of Crooked Maps",
    spritePath: "/assets/monsters/academic/s3-cartographer.png",
    description:
      "A mad mapmaker whose instruments are all slightly wrong, every measurement off by just enough.",
  },
  {
    id: "academic-s4-blank-page-wraith",
    template: "academic",
    stage: 4,
    name: "The Blank Page Wraith",
    bossType: "Blank Page Wraith",
    spritePath: "/assets/monsters/academic/s4-blank-page-wraith.png",
    description:
      "A creature that feeds on unwritten words — the longer the page stays blank the stronger it grows.",
  },
  {
    id: "academic-s5-councillor",
    template: "academic",
    stage: 5,
    name: "The Councillor of False Consensus",
    bossType: "Councillor of False Consensus",
    spritePath: "/assets/monsters/academic/s5-councillor.png",
    description:
      "A diplomat who convinces every reviewer that everyone else has already approved.",
  },
  {
    id: "academic-s6-gatekeeper",
    template: "academic",
    stage: 6,
    name: "The Gatekeeper of Unearned Entry",
    bossType: "Gatekeeper of Unearned Entry",
    spritePath: "/assets/monsters/academic/s6-gatekeeper.png",
    description:
      "An armoured guardian who demands proof at every step before allowing publication.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LAB EXPERIMENTAL — 7 stages
// ─────────────────────────────────────────────────────────────────────────────

const LAB: StageMonsterDefinition[] = [
  {
    id: "lab-s1-mirage-lens",
    template: "lab",
    stage: 1,
    name: "The Mirage Lens",
    bossType: "Mirage Lens",
    spritePath: "/assets/monsters/lab/s1-mirage-lens.png",
    description:
      "An enchanted lens that shows you the question you wanted to ask, not the one you should.",
  },
  {
    id: "lab-s2-librarian",
    template: "lab",
    stage: 2,
    name: "The Librarian of Lost Questions",
    bossType: "Librarian of Lost Questions",
    spritePath: "/assets/monsters/lab/s2-librarian.png",
    description:
      "A spectral scholar misfiling prior work so you cannot find what has already been tried.",
  },
  {
    id: "lab-s3-cartographer",
    template: "lab",
    stage: 3,
    name: "The Cartographer of Crooked Maps",
    bossType: "Cartographer of Crooked Maps",
    spritePath: "/assets/monsters/lab/s3-cartographer.png",
    description:
      "A mapmaker whose plans are slightly off — your experimental design has a fatal blind spot.",
  },
  {
    id: "lab-s4-saboteur",
    template: "lab",
    stage: 4,
    name: "The Saboteur of the Forge",
    bossType: "Saboteur of the Forge",
    spritePath: "/assets/monsters/lab/s4-saboteur.png",
    description:
      "A creature of soot and ember that fouls every build, every measurement, every test rig.",
  },
  {
    id: "lab-s5-alchemist-wraith",
    template: "lab",
    stage: 5,
    name: "The Alchemist of Wishful Results",
    bossType: "Alchemist of Wishful Results",
    spritePath: "/assets/monsters/lab/s5-alchemist-wraith.png",
    description:
      "A ghostly figure that whispers the result you wanted as if your data agreed.",
  },
  {
    id: "lab-s6-merchant",
    template: "lab",
    stage: 6,
    name: "The Babel Merchant",
    bossType: "Babel Merchant",
    spritePath: "/assets/monsters/lab/s6-merchant.png",
    description:
      "A trader who sells contradictory advice — pivot, persevere, iterate, redo — all at once.",
  },
  {
    id: "lab-s7-silencer",
    template: "lab",
    stage: 7,
    name: "The Silencer of Findings",
    bossType: "Silencer of Findings",
    spritePath: "/assets/monsters/lab/s7-silencer.png",
    description:
      "A faceless figure that smothers every attempt to publish or present results.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CREATIVE — 6 stages
// ─────────────────────────────────────────────────────────────────────────────

const CREATIVE: StageMonsterDefinition[] = [
  {
    id: "creative-s1-silence",
    template: "creative",
    stage: 1,
    name: "The Silence That Smothers",
    bossType: "Silence That Smothers",
    spritePath: "/assets/monsters/creative/s1-silence.png",
    description:
      "A pressing quiet in the sacred grove that swallows every impulse before it can take shape.",
  },
  {
    id: "creative-s2-curator",
    template: "creative",
    stage: 2,
    name: "The Curator of Derivative Ghosts",
    bossType: "Curator of Derivative Ghosts",
    spritePath: "/assets/monsters/creative/s2-curator.png",
    description:
      "A spectral curator who shows you only what already exists, daring you to make anything new.",
  },
  {
    id: "creative-s3-beast",
    template: "creative",
    stage: 3,
    name: "The Beast of the Unfinished",
    bossType: "Beast of the Unfinished",
    spritePath: "/assets/monsters/creative/s3-beast.png",
    description:
      "A wilderness predator that thrives where drafts are abandoned mid-stroke.",
  },
  {
    id: "creative-s4-crowd",
    template: "creative",
    stage: 4,
    name: "The Crowd of False Validation",
    bossType: "Crowd of False Validation",
    spritePath: "/assets/monsters/creative/s4-crowd.png",
    description:
      "Friendly faces in the village square who praise without understanding, hiding what the work needs.",
  },
  {
    id: "creative-s5-perfectionist",
    template: "creative",
    stage: 5,
    name: "The Perfectionist's Spectre",
    bossType: "Perfectionist's Spectre",
    spritePath: "/assets/monsters/creative/s5-perfectionist.png",
    description:
      "A spectre in the artisan's workshop who insists the work is never quite ready to release.",
  },
  {
    id: "creative-s6-harbourmaster",
    template: "creative",
    stage: 6,
    name: "The Harbourmaster of Hesitation",
    bossType: "Harbourmaster of Hesitation",
    spritePath: "/assets/monsters/creative/s6-harbourmaster.png",
    description:
      "The same ancient official who keeps every release in port until the manifest is signed.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export const STAGE_MONSTER_DEFINITIONS: readonly StageMonsterDefinition[] = [
  ...VENTURE,
  ...ACADEMIC,
  ...LAB,
  ...CREATIVE,
] as const;

/** Fast lookup by (template, stage). Built once at module load. */
const BY_TEMPLATE_STAGE = new Map<string, StageMonsterDefinition>();
for (const m of STAGE_MONSTER_DEFINITIONS) {
  BY_TEMPLATE_STAGE.set(`${m.template}-${m.stage}`, m);
}

export function getStageMonster(
  template: StageMonsterTemplate,
  stage: number,
): StageMonsterDefinition | undefined {
  return BY_TEMPLATE_STAGE.get(`${template}-${stage}`);
}

/** All monsters of a given template, ordered by stage. */
export function getMonstersForTemplate(
  template: StageMonsterTemplate,
): StageMonsterDefinition[] {
  return STAGE_MONSTER_DEFINITIONS.filter((m) => m.template === template);
}
