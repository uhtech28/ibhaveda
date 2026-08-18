/**
 * @file tutorialCopy.ts
 * @description Per-template vocabulary for the Sparky tutorial. The
 *   tutorial is a single React state machine, but each of the four
 *   templates has its own idiom — a Venture user thinks in "ideas /
 *   founders / building", an Academic in "research questions / theses /
 *   scholars", a Lab in "hypotheses / experiments / researchers", and a
 *   Creative in "creations / makers / crafting". This module keeps the
 *   Sparky lines from reading generic or, worse, wrong for whichever
 *   template the user's active venture uses.
 *
 *   Add strings here (never inline in step components) so all four
 *   templates stay balanced when copy is tuned.
 *
 *   Every field falls back to the venture entry via
 *   `resolveTutorialCopy` so a missing key never crashes a step.
 */

import type { TemplateId } from "./templateTypes";

export interface TutorialCopy {
  /** How Sparky refers to what the user is building.
   *  Venture: "venture", Academic: "thesis", Lab: "experiment",
   *  Creative: "creation". Used in Step2's opening pitch line. */
  projectNoun: string;
  /** Plural form — Step4's feed line ("all our live projects"). */
  projectNounPlural: string;
  /** Verb for what the user is doing.
   *  Venture: "build", Academic: "research", Lab: "run", Creative: "make". */
  buildingVerb: string;
  /** How the user is addressed in tutorial context.
   *  Venture: "founder", Academic: "scholar", Lab: "researcher",
   *  Creative: "maker". Reserved for future tone tweaks — not yet used
   *  in the four Step files. */
  userNoun: string;
  /** Word for the smallest unit of work the user submits.
   *  Venture / Lab / Creative: "task", Academic: "assignment". */
  taskNoun: string;
  /** Word for a potential collaborator surfaced during onboarding.
   *  Venture: "builder", Academic: "collaborator", Lab: "lab partner",
   *  Creative: "co-creator". */
  collaboratorNoun: string;
  /** What Sparky calls the antagonist that questions the user during
   *  AI Combat. All four templates use "boss" today, but Academic and
   *  Lab may prefer "challenger" once feedback lands. Keeping the
   *  field separate now avoids a second round of edits later. */
  bossNoun: string;
  /** The full first-monster line for Step3's boss-intro Sparky beat
   *  ("You're about to face …") minus the trailing name — see
   *  `firstMonsterIntro(name)`. */
  firstMonsterIntroPrefix: string;
  /** Second half of Step3's boss-intro line. */
  firstMonsterIntroSuffix: string;
  /** Victory line after the first monster is defeated (Step3). */
  firstMonsterVictory: (monsterName: string) => string;
  /** Feed-line for Step4 — how Sparky describes the /feed surface. */
  feedTagline: string;
  /** Step2's very first Sparky line (before template picker is shown). */
  welcomeLine: string;
}

/**
 * Venture is the reference template — every field is populated with the
 * original copy that shipped before the multi-template refactor. Any
 * missing field on another template falls back to this entry via
 * `resolveTutorialCopy` below.
 */
const VENTURE: TutorialCopy = {
  projectNoun: "venture",
  projectNounPlural: "ventures",
  buildingVerb: "build",
  userNoun: "founder",
  taskNoun: "task",
  collaboratorNoun: "builder",
  bossNoun: "boss",
  firstMonsterIntroPrefix:
    "You're about to face ",
  firstMonsterIntroSuffix:
    ", who'll question your idea. Defend it, fight back, and make him retreat so you can advance. You've got this!",
  firstMonsterVictory: (name) =>
    `Congratulations, the "${name}" retreated! Just two more things and you'll have everything you need.`,
  feedTagline:
    "This is the feed, all our live projects. Send a contribution request to any idea that isn't yours. That's how you plug into a team.",
  // Template-neutral by design. This line renders on the VERY FIRST
  // tutorial screen, BEFORE the user has picked a template — at that
  // moment there is no way to know whether they're about to build a
  // venture, a thesis, an experiment, or a creation. Any template-
  // specific wording here would be wrong for 3 out of 4 users.
  //
  // The per-template overrides below intentionally repeat this same
  // neutral phrasing — the divergence only kicks in for lines that
  // fire AFTER the template picker (collaborator noun, monster intro,
  // feed tagline).
  welcomeLine:
    "Hi, I'm Sparky! I'll walk you through your entire journey, from your first idea to shipping something real. Ready?",
};

const ACADEMIC: TutorialCopy = {
  projectNoun: "thesis",
  projectNounPlural: "theses",
  buildingVerb: "research",
  userNoun: "scholar",
  taskNoun: "assignment",
  collaboratorNoun: "collaborator",
  bossNoun: "examiner",
  firstMonsterIntroPrefix:
    "You're about to face ",
  firstMonsterIntroSuffix:
    ", who'll probe the rigour of your thesis. Defend your argument, cite what you know, and push back so you can move on. You've got this!",
  firstMonsterVictory: (name) =>
    `Nicely argued — "${name}" backed off. Just two more things and your foundation is set.`,
  feedTagline:
    "This is the feed, all our live theses and papers. Send a collaboration request to any project that isn't yours. That's how you plug into a research team.",
  // Neutral by design — see VENTURE.welcomeLine for the rationale.
  welcomeLine:
    "Hi, I'm Sparky! I'll walk you through your entire journey, from your first idea to shipping something real. Ready?",
};

const LAB: TutorialCopy = {
  projectNoun: "experiment",
  projectNounPlural: "experiments",
  buildingVerb: "run",
  userNoun: "researcher",
  taskNoun: "task",
  collaboratorNoun: "lab partner",
  bossNoun: "peer reviewer",
  firstMonsterIntroPrefix:
    "You're about to face ",
  firstMonsterIntroSuffix:
    ", who'll stress-test your hypothesis. Show the evidence, defend your method, and outlast the doubt so you can advance. You've got this!",
  firstMonsterVictory: (name) =>
    `Great result — "${name}" withdrew the objection! Just two more things and the experiment is on track.`,
  feedTagline:
    "This is the feed, all our live experiments. Send a collaboration request to any project that isn't yours. That's how you plug into a lab.",
  // Neutral by design — see VENTURE.welcomeLine for the rationale.
  welcomeLine:
    "Hi, I'm Sparky! I'll walk you through your entire journey, from your first idea to shipping something real. Ready?",
};

const CREATIVE: TutorialCopy = {
  projectNoun: "creation",
  projectNounPlural: "creations",
  buildingVerb: "make",
  userNoun: "maker",
  taskNoun: "task",
  collaboratorNoun: "co-creator",
  bossNoun: "critic",
  firstMonsterIntroPrefix:
    "You're about to face ",
  firstMonsterIntroSuffix:
    ", who'll pick at your creation. Own your choices, answer with intent, and make them back off so you can move on. You've got this!",
  firstMonsterVictory: (name) =>
    `Nailed it — "${name}" walked away! Just two more things and your piece is coming together.`,
  feedTagline:
    "This is the feed, all our live creations. Send a collaboration request to any piece that isn't yours. That's how you plug into a crew.",
  // Neutral by design — see VENTURE.welcomeLine for the rationale.
  welcomeLine:
    "Hi, I'm Sparky! I'll walk you through your entire journey, from your first idea to shipping something real. Ready?",
};

const REGISTRY: Record<TemplateId, TutorialCopy> = {
  venture: VENTURE,
  academic: ACADEMIC,
  lab: LAB,
  creative: CREATIVE,
};

/**
 * Resolve the tutorial vocabulary for a given template. Any nullish
 * templateId (Sparky is running before an active venture exists, or on
 * the /feed surface where the venture atom may be null) falls back to
 * VENTURE — the historical default.
 */
export function resolveTutorialCopy(
  templateId: TemplateId | string | null | undefined,
): TutorialCopy {
  if (!templateId) return VENTURE;
  const entry = REGISTRY[templateId as TemplateId];
  return entry ?? VENTURE;
}

/**
 * Full "You're about to face X." intro line — glues the prefix, the
 * monster name, and the suffix so callers don't repeat the concat.
 */
export function firstMonsterIntro(
  templateId: TemplateId | string | null | undefined,
  monsterName: string,
): string {
  const c = resolveTutorialCopy(templateId);
  return `${c.firstMonsterIntroPrefix}${monsterName}${c.firstMonsterIntroSuffix}`;
}
