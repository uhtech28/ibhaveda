/**
 * Persona Definitions — PRD § 3.1
 *
 * Single source of truth for the 10 named personas. Used by:
 *  - Character Creator UI (cards + previews)
 *  - Phaser asset loader (sprite paths)
 *  - Phaser Persona entity (which sprite to render on the map)
 *  - Convex schema validation (allowed personaId values)
 *
 * Sprites are stored at /public/assets/personas/<id>.png as 4-direction
 * reference sheets (front/side/back/side2, ~384px per frame). The Phaser
 * scene renders the front frame only as the avatar; the UI uses the full
 * sheet as a high-fidelity preview in the Character Creator.
 */

export type PersonaArchetype =
  | "Wizard"
  | "Scout"
  | "Scholar"
  | "Creator"
  | "Rogue"
  | "Seer"
  | "Builder"
  | "Cleric"
  | "Explorer"
  | "Mentor";

/** Per PRD § 3.1, intentionally a mixed-gender / diverse pool. */
export type PersonaClass = "Male" | "Female" | "Nonbinary";

export interface PersonaDefinition {
  /** Stable slug used in the database and as the sprite filename. */
  id: PersonaId;
  /** Display name with definite article — "The Arcanist", "The Ranger". */
  name: string;
  /** Class fantasy archetype — drives narrative dialogue tone. */
  archetype: PersonaArchetype;
  /** Demographic descriptor (for accessibility / matchmaking, not gameplay). */
  class: PersonaClass;
  /** Public path to the painted reference sprite. */
  spritePath: string;
  /** One-line flavour text shown on the Character Creator card. */
  tagline: string;
  /** Dialogue tone descriptor — informs AI flavour text per persona. */
  voice: string;
}

export type PersonaId =
  | "arcanist"
  | "ranger"
  | "alchemist"
  | "artisan"
  | "drifter"
  | "oracle"
  | "engineer"
  | "healer"
  | "pathfinder"
  | "sage";

/** Ordered to match PRD § 3.1. */
export const PERSONA_DEFINITIONS: readonly PersonaDefinition[] = [
  {
    id: "arcanist",
    name: "The Arcanist",
    archetype: "Wizard",
    class: "Male",
    spritePath: "/assets/personas/arcanist.png",
    tagline: "First principles, then the working spell.",
    voice: "analytical, abstract, fond of metaphor",
  },
  {
    id: "ranger",
    name: "The Ranger",
    archetype: "Scout",
    class: "Female",
    spritePath: "/assets/personas/ranger.png",
    tagline: "Trails first. The map only catches up later.",
    voice: "spare, observational, action-oriented",
  },
  {
    id: "alchemist",
    name: "The Alchemist",
    archetype: "Scholar",
    class: "Nonbinary",
    spritePath: "/assets/personas/alchemist.png",
    tagline: "Mix small. Test fast. Scale only what survives.",
    voice: "curious, precise, comfortable with failure",
  },
  {
    id: "artisan",
    name: "The Artisan",
    archetype: "Creator",
    class: "Female",
    spritePath: "/assets/personas/artisan.png",
    tagline: "What the customer touches is what matters.",
    voice: "warm, concrete, particular about craft",
  },
  {
    id: "drifter",
    name: "The Drifter",
    archetype: "Rogue",
    class: "Male",
    spritePath: "/assets/personas/drifter.png",
    tagline: "Find the gap. Walk through before they notice.",
    voice: "wry, opportunistic, light on ceremony",
  },
  {
    id: "oracle",
    name: "The Oracle",
    archetype: "Seer",
    class: "Female",
    spritePath: "/assets/personas/oracle.png",
    tagline: "The signal is already there. Listen for it.",
    voice: "patient, pattern-seeking, often metaphorical",
  },
  {
    id: "engineer",
    name: "The Engineer",
    archetype: "Builder",
    class: "Male",
    spritePath: "/assets/personas/engineer.png",
    tagline: "Specs, then schedule, then iron.",
    voice: "blunt, structured, allergic to ambiguity",
  },
  {
    id: "healer",
    name: "The Healer",
    archetype: "Cleric",
    class: "Female",
    spritePath: "/assets/personas/healer.png",
    tagline: "Mend the team and the work mends with them.",
    voice: "steady, generous, focused on people",
  },
  {
    id: "pathfinder",
    name: "The Pathfinder",
    archetype: "Explorer",
    class: "Nonbinary",
    spritePath: "/assets/personas/pathfinder.png",
    tagline: "There is always a path. The question is the cost.",
    voice: "open, comparative, route-aware",
  },
  {
    id: "sage",
    name: "The Sage",
    archetype: "Mentor",
    class: "Male",
    spritePath: "/assets/personas/sage.png",
    tagline: "The lesson is in the room. Listen for it.",
    voice: "reflective, historical, asks more than answers",
  },
] as const;

/** Fast lookup by id. Built once at module load. */
const PERSONA_BY_ID = new Map<PersonaId, PersonaDefinition>(
  PERSONA_DEFINITIONS.map((p) => [p.id, p]),
);

export function getPersonaById(id: PersonaId): PersonaDefinition | undefined {
  return PERSONA_BY_ID.get(id);
}

/**
 * Back-compat shim — earlier code stored only "male" | "female". Maps each
 * legacy gender to a sensible default persona so existing ventures don't
 * lose their character on the next render.
 */
export function legacyGenderToPersonaId(
  gender: "male" | "female" | null | undefined,
): PersonaId {
  if (gender === "female") return "artisan";
  return "drifter";
}

/** Sprite texture key used in Phaser. Single source of truth. */
export function personaTextureKey(id: PersonaId): string {
  return `persona_${id}_portrait`;
}
