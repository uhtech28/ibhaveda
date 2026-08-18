/**
 * @file bossCorruptionProfiles.ts
 * @description Per-boss corruption-overlay profiles — the visual pattern +
 *   tint the map layer paints over an uncleared checkpoint or a
 *   high-corruption biome band. Sourced verbatim from the client's
 *   Corruption Overlay Reference HTML (dated 2026-08-14):
 *
 *     "Procedurally rendered from the tile/pattern + tint described in
 *      the spreadsheet for each row. Each swatch shows the overlay tile
 *      at 100% opacity (uncleared / fully 'corrupted') — the state
 *      before any checkpoint progress."
 *
 *   Every entry maps a boss slug (used elsewhere in the codebase — see
 *   template-stage-bosses.ts + stage-bosses.ts) to:
 *     - `pattern`: which of the 14 procedural drawers renders the tile.
 *     - `color`:   the specific tint (single hex from the spec).
 *     - `label`:   the boss's canonical name (for the artist debug HUD).
 *     - `meta`:    the client-supplied one-liner theme ("Doubt & loss of
 *                  direction" etc.) so the artist / QA can identify it
 *                  without leaving the code.
 *
 *   The renderer at `src/components/corruption/CorruptionOverlayCanvas.tsx`
 *   consumes these tuples. See that file for the pixel-level pattern
 *   implementations (mirrors the client's reference-HTML canvas code
 *   1:1 so what QA sees in-app matches the swatch sheet exactly).
 */

/** Pattern id → procedural drawer. Adding a new pattern requires
 *  extending BOTH this union AND the switch in CorruptionOverlayCanvas.tsx. */
export type CorruptionPattern =
  | "crack"       // jagged vertical crack lines (Unraveller — doubt / loss of direction)
  | "grid"        // orthogonal scaffold grid (Pale Architect — perfectionism)
  | "chain"       // wider grid (chain-link overlay for Iron Bureaucrat / Scale)
  | "barlock"     // horizontal bars + lock hasp (Gatekeeper of Unearned Entry)
  | "dither"      // pixel dither noise (Hollow King / Ashen Drake / static / dust)
  | "vine"        // organic tangle (Thornwarden / Beast of the Unfinished)
  | "shard"       // shattered crystal triangles (Mirror Witch / Stonecaller / rubble)
  | "wave"        // horizontal wave ripples (Tide Caller / harbours / heat shimmer)
  | "blob"        // amorphous rounded blobs (Gravemind / fog / smoke)
  | "silhouette"  // 4 robed figure silhouettes (Wraith Council / crowd)
  | "cloth"       // vertical hanging cloth strips (Veilwalker — filled)
  | "outline"     // vertical cloth strips outline-only (Curator of Derivative Ghosts — ghost frames)
  | "zigzag"      // horizontal jagged zigzag rows (Cartographer / murmuring shadow)
  | "block";      // large filled block with grid seams (Blank Page Wraith / sound panels)

export interface CorruptionProfile {
  /** Machine slug — matches the boss folder under /assets/bosses/. */
  slug: string;
  /** Human name for HUD / debug. */
  label: string;
  /** Which of the 14 procedural drawers renders this tile. */
  pattern: CorruptionPattern;
  /** Single hex color the spec assigns to this boss. */
  color: string;
  /** Client-supplied theme blurb — one-liner. */
  meta: string;
}

// ─────────────────────────────────────────────────────────────────────
// 12 SUPER-BOSS PROFILES
// Mirrors the "Super Boss Pool — 12 corruption overlays" list in the
// reference HTML. Slugs match /assets/bosses/super-pool/{slug}/.
// ─────────────────────────────────────────────────────────────────────

export const SUPER_BOSS_CORRUPTION_PROFILES: readonly CorruptionProfile[] = [
  { slug: "unraveller",       label: "The Unraveller",       pattern: "crack",      color: "#6a3fa0", meta: "Doubt & loss of direction" },
  { slug: "pale-architect",   label: "The Pale Architect",   pattern: "grid",       color: "#9a97a3", meta: "Perfectionism & paralysis" },
  { slug: "hollow-king",      label: "The Hollow King",      pattern: "dither",     color: "#8b8792", meta: "Loss of purpose" },
  { slug: "thornwarden",      label: "The Thornwarden",      pattern: "vine",       color: "#8a5a2f", meta: "Bureaucracy & friction" },
  { slug: "mirror-witch",     label: "The Mirror Witch",     pattern: "shard",      color: "#8fd3ea", meta: "Self-deception" },
  { slug: "ashen-drake",      label: "The Ashen Drake",      pattern: "dither",     color: "#d98a3d", meta: "Abandonment & inertia" },
  { slug: "tide-caller",      label: "The Tide Caller",      pattern: "wave",       color: "#4a90c4", meta: "Distraction & scope creep" },
  { slug: "gravemind",        label: "The Gravemind",        pattern: "blob",       color: "#3f6b3f", meta: "Fear of failure" },
  { slug: "rusted-oracle",    label: "The Rusted Oracle",    pattern: "dither",     color: "#b5602a", meta: "Imposter syndrome" },
  { slug: "wraith-council",   label: "The Wraith Council",   pattern: "silhouette", color: "#a48fc9", meta: "Decision paralysis" },
  { slug: "stonecaller",      label: "The Stonecaller",      pattern: "shard",      color: "#8f8b95", meta: "Overwhelm" },
  { slug: "veilwalker",       label: "The Veilwalker",       pattern: "cloth",      color: "#4b3f7a", meta: "Isolation & fear of irrelevance" },
] as const;

// ─────────────────────────────────────────────────────────────────────
// 27 STAGE-MONSTER PROFILES
// Keyed by (templateId, stage). Order mirrors the reference HTML's
// "Stage Monsters — 27 corruption overlays" list.
// ─────────────────────────────────────────────────────────────────────

/** Composite key — safe stringification for lookup + logging. */
export type StageBossKey = `${string}:${number}`;
export const makeStageBossKey = (
  templateId: string,
  stage: number,
): StageBossKey => `${templateId}:${stage}` as StageBossKey;

interface StageCorruptionProfile extends CorruptionProfile {
  templateId: "venture" | "academic" | "lab" | "creative";
  stage: number;
}

export const STAGE_BOSS_CORRUPTION_PROFILES: readonly StageCorruptionProfile[] = [
  // ── Venture (8 stages) ─────────────────────────────────────────
  { templateId: "venture",  stage: 1, slug: "fog-of-vagueness",           label: "The Fog of Vagueness",          pattern: "blob",       color: "#a9b6c4", meta: "Cloud / fog — undefined problem space" },
  { templateId: "venture",  stage: 2, slug: "pathwarden-wraith",          label: "The Pathwarden Wraith",         pattern: "vine",       color: "#8a5a2f", meta: "Vine-tangle — research friction" },
  { templateId: "venture",  stage: 3, slug: "advocate-of-comfortable-lies", label: "Advocate of Comfortable Lies", pattern: "wave",     color: "#e08a3d", meta: "Heat shimmer — validation distortion" },
  { templateId: "venture",  stage: 4, slug: "unfinished-golem",           label: "The Unfinished Golem",          pattern: "grid",       color: "#9a97a3", meta: "Scaffold grid — offer half-built" },
  { templateId: "venture",  stage: 5, slug: "collapse-specter",           label: "The Collapse Specter",          pattern: "shard",      color: "#5a5760", meta: "Rubble chunk — build fragility" },
  { templateId: "venture",  stage: 6, slug: "harbourmaster-of-hesitation", label: "Harbourmaster of Hesitation",  pattern: "wave",       color: "#5f7f99", meta: "Storm fog — launch anxiety" },
  { templateId: "venture",  stage: 7, slug: "babel-merchant",             label: "The Babel Merchant",            pattern: "dither",     color: "#c9c9c9", meta: "TV static — iteration noise" },
  { templateId: "venture",  stage: 8, slug: "iron-bureaucrat",            label: "The Iron Bureaucrat",           pattern: "chain",      color: "#8f8b95", meta: "Chain link — scale constraints" },

  // ── Academic (6 stages) ────────────────────────────────────────
  { templateId: "academic", stage: 1, slug: "librarian-of-lost-questions", label: "Librarian of Lost Questions",  pattern: "dither",     color: "#9a95a0", meta: "Dust speckle — misfiled inquiry" },
  { templateId: "academic", stage: 2, slug: "keeper-of-incomplete-records", label: "Keeper of Incomplete Records", pattern: "shard",     color: "#c9a877", meta: "Crumbled stone — half-cited work" },
  { templateId: "academic", stage: 3, slug: "cartographer-of-crooked-maps", label: "Cartographer of Crooked Maps", pattern: "zigzag",    color: "#a5824f", meta: "Crooked lines — unreplicable method" },
  { templateId: "academic", stage: 4, slug: "blank-page-wraith",          label: "The Blank Page Wraith",         pattern: "block",      color: "#d8d8d8", meta: "Blank page — writer's block" },
  { templateId: "academic", stage: 5, slug: "councillor-of-false-consensus", label: "Councillor of False Consensus", pattern: "zigzag", color: "#5a3f6e", meta: "Murmuring shadow — echo-chamber review" },
  { templateId: "academic", stage: 6, slug: "gatekeeper-of-unearned-entry", label: "Gatekeeper of Unearned Entry", pattern: "barlock",   color: "#8f8b95", meta: "Bar lock — publication gate" },

  // ── Lab (7 stages) ─────────────────────────────────────────────
  { templateId: "lab",      stage: 1, slug: "mirage-lens",                label: "Mirage Lens",                   pattern: "wave",       color: "#d9c65a", meta: "Heat shimmer — false-positive vision" },
  { templateId: "lab",      stage: 2, slug: "librarian-of-lost-questions", label: "Librarian of Lost Questions",  pattern: "dither",     color: "#9a95a0", meta: "Dust speckle — background research fog" },
  { templateId: "lab",      stage: 3, slug: "cartographer-of-crooked-maps", label: "Cartographer of Crooked Maps", pattern: "zigzag",    color: "#a5824f", meta: "Crooked lines — flawed experiment design" },
  { templateId: "lab",      stage: 4, slug: "saboteur-of-the-forge",      label: "Saboteur of the Forge",         pattern: "blob",       color: "#4a4a4a", meta: "Smoke puff — build sabotage" },
  { templateId: "lab",      stage: 5, slug: "alchemist-of-wishful-results", label: "Alchemist of Wishful Results", pattern: "dither",   color: "#4f9d6a", meta: "Tinted glass — p-hacking" },
  { templateId: "lab",      stage: 6, slug: "babel-merchant",             label: "The Babel Merchant",            pattern: "dither",     color: "#c9c9c9", meta: "TV static — noisy iteration" },
  { templateId: "lab",      stage: 7, slug: "silencer-of-findings",       label: "The Silencer of Findings",      pattern: "block",      color: "#8a3a3a", meta: "Sound panel — unpublished conclusion" },

  // ── Creative (6 stages) ────────────────────────────────────────
  { templateId: "creative", stage: 1, slug: "silence-that-smothers",       label: "The Silence That Smothers",    pattern: "blob",       color: "#b3aeb8", meta: "Flat mist — inspiration void" },
  { templateId: "creative", stage: 2, slug: "curator-of-derivative-ghosts", label: "Curator of Derivative Ghosts", pattern: "outline",   color: "#e8e5ee", meta: "Ghost outline frames — derivative influence" },
  { templateId: "creative", stage: 3, slug: "beast-of-the-unfinished",     label: "Beast of the Unfinished",       pattern: "vine",       color: "#345c34", meta: "Vine tangle — untamed draft" },
  { templateId: "creative", stage: 4, slug: "crowd-of-false-validation",   label: "Crowd of False Validation",     pattern: "silhouette", color: "#e4a7b8", meta: "Crowd silhouette — hollow praise" },
  { templateId: "creative", stage: 5, slug: "perfectionists-spectre",      label: "The Perfectionist's Spectre",   pattern: "dither",     color: "#a48fc9", meta: "Dust haze — endless polish" },
  { templateId: "creative", stage: 6, slug: "harbourmaster-of-hesitation", label: "Harbourmaster of Hesitation",   pattern: "wave",       color: "#5f7f99", meta: "Storm fog — release paralysis" },
] as const;

// ─────────────────────────────────────────────────────────────────────
// LOOKUPS
// ─────────────────────────────────────────────────────────────────────

const superBossBySlug = new Map(
  SUPER_BOSS_CORRUPTION_PROFILES.map((p) => [p.slug, p]),
);
const stageBossByKey = new Map(
  STAGE_BOSS_CORRUPTION_PROFILES.map(
    (p) =>
      [makeStageBossKey(p.templateId, p.stage), p] as const,
  ),
);

/** Resolve a corruption profile for the currently-active stage boss.
 *  Returns null if template + stage don't map to any registered boss
 *  (should never happen after wiring, but caller should degrade). */
export function getStageCorruptionProfile(
  templateId: string,
  stage: number,
): CorruptionProfile | null {
  return stageBossByKey.get(makeStageBossKey(templateId, stage)) ?? null;
}

/** Resolve a corruption profile for a super-boss slug (super-pool). */
export function getSuperBossCorruptionProfile(
  slug: string,
): CorruptionProfile | null {
  return superBossBySlug.get(slug) ?? null;
}
