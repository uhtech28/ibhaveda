/**
 * bossFaces.ts — resolve a boss name to its head-shot face portrait.
 *
 * Faces live in `public/assets/bosses/faces/<slug>.jpeg` and are
 * shown inside the red portrait cell next to the boss's question in
 * the combat dialogue panel. They're separate from the animated
 * spritesheet in `public/assets/bosses/<biome>/<boss>/idle.png` —
 * spritesheets drive in-arena motion; face jpegs are hand-picked
 * head-shots that read cleanly at 64×64 without needing to be
 * clipped from a wider frame.
 *
 * The resolver is name-driven so any code path with a boss's display
 * name (e.g. "Fog of Vagueness", "The Veilwalker") gets the right
 * portrait without having to plumb a separate asset field through
 * every scoring/combat surface.
 *
 * Adding a new face:
 *   1. Drop the file in public/assets/bosses/faces/<kebab-case>.jpeg
 *   2. Add its display name(s) to FACE_ALIASES below.
 *   3. Ship — no other wiring needed.
 */

const FACE_DIR = "/assets/bosses/faces";

/**
 * Display-name → face-slug aliases. Keys are lowercased with
 * punctuation stripped for lookup; values are the filename slug
 * (without extension) under `public/assets/bosses/faces/`.
 *
 * Multiple keys can point at the same slug (e.g. "The Veilwalker"
 * and "Veilwalker" both resolve to `the-veilwalker`), so both the
 * canonical fantasy name and any legacy shorthand hit the right
 * asset.
 */
const FACE_ALIASES: Record<string, string> = {
  // Stage-1 (Village) bosses
  "fog of vagueness": "fog-of-vagueness",
  "chimera": "chimera",
  "automation": "automation",
  "automaton": "automation",
  "pathwarden wraith": "pathwarden-wraith",
  "wraith": "pathwarden-wraith",

  // Stage-2 (Forest) bosses
  "shadow specter": "shadow-specter",
  "collapse specter": "the-collapse-secter",
  "the collapse specter": "the-collapse-secter",
  "green wizard": "green-wizard",
  "green doom": "green-doom",

  // Stage-3 (Arena) bosses
  "judge of false precedent": "judge-of-false-precedent",
  "the advocate of comfortable lies": "the-advocate-of-comfortable-slies",
  "advocate of comfortable lies": "the-advocate-of-comfortable-slies",
  "the masked challenger": "the-masked-challenger",
  "masked challenger": "the-masked-challenger",

  // Stage-4 (Artisans) bosses
  "artisian automation": "artisian-automation",
  "iron bureaucrat": "the-iron-bureaucrat",
  "the iron bureaucrat": "the-iron-bureaucrat",
  "armor golem": "armor-golem",
  "babel merchant": "babel-merchant",

  // Stage-5 (Mine) bosses
  "forge dragon": "forge-dragon",
  "the ashen drake": "forge-dragon",
  "ashen drake": "forge-dragon",
  "stonecaller": "stronecaller", // note: source file has typo
  "the stonecaller": "stronecaller",

  // Stage-6 (Harbor) bosses
  "harbor merchant": "harbor-merchant",
  "harbor mist": "harbor-mist",
  "harbor official": "harbor-official",
  "harbourmaster of hesitation": "the-harbourmaster-of-hesitation",
  "the harbourmaster of hesitation": "the-harbourmaster-of-hesitation",

  // Stage-7 (Crossroads) bosses
  "tide caller": "tide-caller",
  "the tide caller": "tide-caller",
  "sea serpent": "sea-serpent",
  "leviathan": "leviathan",

  // Stage-8 (Golden Harbor) bosses & super bosses
  "spectral king": "spectral-king",
  "the hollow king": "spectral-king",
  "undead titan": "undead-titan",
  "the pale architect": "undead-titan",
  "oracle of doubt": "oracle-of-doubt",
  "rusted oracle": "rusted-oracle",
  "the rusted oracle": "rusted-oracle",
  "thornbearer champion": "thornbeared-champion", // note: source file has typo
  "thornbeared champion": "thornbeared-champion",
  "the thornwarden": "thornbeared-champion",
  "the veilwalker": "the-veilwalker",
  "veilwalker": "the-veilwalker",
  "unraveller": "unraveller",
  "the unraveller": "unraveller",
  "the forest colosseus": "the-forest-colosseus-super",
  "forest colosseus": "the-forest-colosseus-super",
};

/**
 * Art-folder → face-slug. The AUTHORITATIVE mapping.
 *
 * The name-keyed table above needs an entry for every wording a boss is
 * referred to by, and the rosters drift from it constantly: "The Forge
 * Dragon" misses `forge dragon`, "Colossal Sea Serpent" misses
 * `sea serpent`, "The Iron Bureaucrat's Herald" misses `the iron
 * bureaucrat`. Forty of the fifty boss names in the configs failed to
 * resolve, so most bosses fell through to a clipped spritesheet.
 *
 * A boss's art folder does not drift -- it is the same folder the sprite
 * is loaded from -- so keying on it fixes the whole class instead of one
 * name at a time. Two bosses sharing art share a face, which is correct:
 * that is what sharing art means.
 *
 * Folders deliberately absent (no matching portrait was supplied):
 *   stage2/forest-sorceress, stage2/forest-wraith, super-pool/mirror-witch,
 *   super-pool/wraith-council, and the whole academic / lab / creative
 *   rosters. Those fall back to the cropped sprite portrait rather than
 *   being given a face that is not theirs.
 */
const ASSET_FOLDER_FACES: Record<string, string> = {
  "village/fog": "fog-of-vagueness",
  "village/chimera": "chimera",
  "village/automaton": "automation",
  "village/wraith": "pathwarden-wraith",
  "village/unraveller": "unraveller",

  "stage2/shadow-specter": "shadow-specter",
  "stage2/thornbearer": "thornbeared-champion",
  "stage2/forest-colossus": "the-forest-colosseus-super",

  "arena/judge": "judge-of-false-precedent",
  "arena/masked-challenger": "the-masked-challenger",
  "arena/oracle-of-doubt": "oracle-of-doubt",
  "arena/advocate": "the-advocate-of-comfortable-slies",

  "stage3/harbor-merchant": "harbor-merchant",
  "stage3/harbor-mist": "harbor-mist",
  "stage3/harbor-official": "harbor-official",
  "stage3/sea-serpent": "sea-serpent",
  "stage3/leviathan": "leviathan",

  "stage4/armor-golem": "armor-golem",
  "stage4/artisan-automaton": "artisian-automation",
  "stage4/forge-dragon": "forge-dragon",
  "stage4/spectral-king": "spectral-king",
  "stage4/undead-titan": "undead-titan",

  "incoming/babel-merchant": "babel-merchant",
  "incoming/collapse-specter": "the-collapse-secter",
  "incoming/harbourmaster": "the-harbourmaster-of-hesitation",
  "incoming/iron-bureaucrat": "the-iron-bureaucrat",

  "venture/unfinished-golem": "armor-golem",

  "super-pool/ashen-drake": "forge-dragon",
  "super-pool/hollow-king": "spectral-king",
  "super-pool/pale-architect": "undead-titan",
  "super-pool/rusted-oracle": "rusted-oracle",
  "super-pool/stonecaller": "stronecaller",
  "super-pool/thornwarden": "thornbeared-champion",
  "super-pool/tide-caller": "tide-caller",
  "super-pool/unraveller": "unraveller",
  "super-pool/veilwalker": "the-veilwalker",
};

/**
 * Resolve a face from the boss's SPRITE PATH, e.g.
 * "/assets/bosses/stage4/forge-dragon/idle.png" -> the forge-dragon face.
 * Returns null for art we have no portrait for.
 */
export function getBossFaceUrlFromAsset(
  assetPath: string | null | undefined,
): string | null {
  if (!assetPath) return null;
  // Split on path segments rather than a regex literal: no escaping,
  // and it tolerates a leading origin or a query string.
  const parts = assetPath.split("/").filter(Boolean);
  const i = parts.indexOf("bosses");
  if (i === -1 || parts.length < i + 3) return null;
  const key = parts[i + 1] + "/" + parts[i + 2];
  const slug = ASSET_FOLDER_FACES[key];
  return slug ? `${FACE_DIR}/${slug}.jpeg` : null;
}

/** Normalise a boss display name for alias lookup. */
function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}

/**
 * Resolve a boss display name to its face portrait URL, or `null` if
 * we don't have a hand-picked face for that boss (caller can fall
 * back to a clipped spritesheet frame in that case).
 */
export function getBossFaceUrl(bossName: string | null | undefined): string | null {
  if (!bossName) return null;
  const key = normalize(bossName);
  const slug = FACE_ALIASES[key];
  if (!slug) return null;
  return `${FACE_DIR}/${slug}.jpeg`;
}
