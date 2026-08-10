/**
 * @file template-stage-bosses.ts
 * @description Maps every Academic / Lab / Creative stage to a StageBoss
 *   config that TemplateMapScene consumes via its `boss` init prop.
 *
 * Why this file exists:
 *   Non-Venture templates render through the shared TemplateMapScene
 *   (see src/lib/phaser/scenes/TemplateMapScene.ts). Previously the
 *   scene fell back to a generic "Village Fog Guardian" for every
 *   template biome because no per-template boss data flowed in. This
 *   module resolves each template stage to a StageBoss populated with
 *   the correct sprite paths, frame metadata, name and intro line —
 *   so a user on the Academic template sees the Librarian of Lost
 *   Questions on Stage 1, not the Fog Guardian.
 *
 * Data source:
 *   Assets under /public/assets/bosses/{academic|lab|creative}/{slug}/
 *   were stitched from the Pixellab exports by the boss-wiring pass
 *   (2026-08-10). Each folder contains:
 *     idle.png, attack.png [, hurt.png] [, defeat.png] [, victory.png]
 *     rotations/{N,NE,E,SE,S,SW,W,NW}.png
 *   Missing clips are handled by the resolveState fallback chain in
 *   src/lib/phaser/animations/stageMapAnimations.ts (defeat → hurt →
 *   idle, victory → attack → idle) per user rule ("if any animation
 *   is missing for a boss use can use defeat animation also in retreat
 *   and attack animation for victory").
 *
 * Frame sizes are boss-specific (76 / 84 / 88 / 92 / 96) — Pixellab
 * exports at whatever native resolution suits the character's silhouette.
 */

import type { StageBoss, BossClipMeta, VillageBossFamily } from "./stage-bosses";
import type { TemplateId } from "./templates/templateTypes";

type NonVentureTemplate = Exclude<TemplateId, "venture">;

/** Compact clip descriptor used only inside this module. */
interface TemplateBossClips {
  /** Frame width/height. Always square (Pixellab exports as N×N grids). */
  size: number;
  /** State → frame count. Missing states = clip not shipped; the
   *  runtime resolveState fallback chain fills the gap. */
  frames: {
    idle: number;
    attack?: number;
    hurt?: number;
    defeat?: number;
    victory?: number;
  };
}

/** Boss metadata for a single template stage. Purely data — no logic. */
interface TemplateStageBossData {
  /** URL-safe folder name under /assets/bosses/{template}/ */
  slug: string;
  /** Display name shown in the combat header + intro line. Should
   *  match the template config's monster.name so HUD copy is
   *  consistent across the map + combat panel. */
  name: string;
  /** Ibhaveda combat family — drives the projectile tint + aura
   *  vignette in CombatPanel. Best-effort thematic match. */
  family: VillageBossFamily;
  /** Undertale-style intro line rendered above the boss on combat
   *  entry. Optional; falls back to "* {name} blocks your path." */
  introLine?: string;
  /** Per-clip frame metadata (which sheets shipped, at what size). */
  clips: TemplateBossClips;
  /** Optional per-clip fps override. Defaults: idle 6 / combat 10 /
   *  defeat 8 / victory 8. Bump these for stiff or oversized bosses. */
  fpsOverride?: Partial<Record<
    "idle" | "attack" | "hurt" | "defeat" | "victory",
    number
  >>;
  /** Scale factor for the map sprite. Default 1.9 (Village parity).
   *  Larger bosses (Colossus / Golem / Dragon) go 2.4-2.6. */
  spriteScale?: number;
  /** Y offset from the CP marker anchor point. Defaults 62 for a
   *  92×92 sprite so the boss stands on the disc; smaller frames
   *  read better at 54-58. */
  spriteYOffset?: number;
  /** X offset from the CP marker anchor. Defaults 0. */
  spriteXOffset?: number;
}

/**
 * Per-template stage roster. Index = stage_number - 1.
 * Every entry is required; missing entries would break the map load.
 */
const TEMPLATE_STAGE_BOSSES: Record<
  NonVentureTemplate,
  ReadonlyArray<TemplateStageBossData | null>
> = {
  academic: [
    // Stage 1 · Ancient Library
    {
      slug: "librarian-of-lost-questions",
      name: "Librarian of Lost Questions",
      family: "undead",
      introLine:
        "* The Librarian offers her endless index — every question leads deeper into doubt.",
      clips: { size: 96, frames: { idle: 4, attack: 9 } },
      spriteScale: 1.9,
      spriteYOffset: 62,
    },
    // Stage 2 · The Ruins
    {
      slug: "keeper-of-incomplete-records",
      name: "Keeper of Incomplete Records",
      family: "undead",
      introLine:
        "* The Keeper unfurls scrolls of citations that cite nothing.",
      clips: { size: 88, frames: { idle: 4, attack: 9, hurt: 9 } },
      spriteScale: 1.9,
      spriteYOffset: 60,
    },
    // Stage 3 · Cartographer's Tower
    {
      slug: "cartographer-of-crooked-maps",
      name: "Cartographer of Crooked Maps",
      family: "arcane",
      introLine:
        "* She draws beautiful maps of methodology that cannot be replicated.",
      clips: { size: 92, frames: { idle: 4, attack: 9, hurt: 9, defeat: 9 } },
      spriteScale: 1.9,
      spriteYOffset: 62,
    },
    // Stage 4 · The Scriptorium
    {
      slug: "blank-page-wraith",
      name: "Blank Page Wraith",
      family: "undead",
      introLine:
        "* Where the Wraith passes, parchment becomes impossibly blank.",
      clips: { size: 76, frames: { idle: 4, attack: 9, hurt: 9 } },
      spriteScale: 2.0,
      spriteYOffset: 56,
    },
    // Stage 5 · Council Chamber
    {
      slug: "councillor-of-false-consensus",
      name: "Councillor of False Consensus",
      family: "arcane",
      introLine:
        "* The Councillor agrees with everything — flaws and all.",
      clips: { size: 92, frames: { idle: 4, attack: 9, hurt: 9 } },
      spriteScale: 1.9,
      spriteYOffset: 62,
    },
    // Stage 6 · Grand Archive
    {
      slug: "gatekeeper-of-unearned-entry",
      name: "Gatekeeper of Unearned Entry",
      family: "machine",
      introLine:
        "* The Gatekeeper cites every bureaucratic rule against you.",
      clips: { size: 92, frames: { idle: 4, attack: 9, defeat: 9 } },
      spriteScale: 2.1,
      spriteYOffset: 60,
    },
  ],
  lab: [
    // Stage 1 · Observatory
    {
      slug: "mirage-lens",
      name: "Mirage Lens",
      family: "machine",
      introLine:
        "* The Mirage Lens shows you a result that isn't there.",
      // Attack clip not shipped in the Mirage Lens pack — the runtime
      // fallback chain plays idle for both idle AND attack windows,
      // which reads as a "stoic instrument" rather than a swinging
      // combatant. Fine for a Stage-1 opener.
      clips: { size: 84, frames: { idle: 4, hurt: 9 } },
      spriteScale: 1.8,
      spriteYOffset: 58,
    },
    // Stage 2 · Ancient Library (shared with Academic Stage 1)
    {
      slug: "librarian-of-lost-questions",
      name: "Librarian of Lost Questions",
      family: "undead",
      introLine:
        "* The Librarian again — this time she demands your literature review.",
      clips: { size: 96, frames: { idle: 4, attack: 9 } },
      spriteScale: 1.9,
      spriteYOffset: 62,
    },
    // Stage 3 · Cartographer's Tower (shared with Academic Stage 3)
    {
      slug: "cartographer-of-crooked-maps",
      name: "Cartographer of Crooked Maps",
      family: "arcane",
      introLine:
        "* The Cartographer will test whether your method holds up under replication.",
      clips: { size: 92, frames: { idle: 4, attack: 9, hurt: 9, defeat: 9 } },
      spriteScale: 1.9,
      spriteYOffset: 62,
    },
    // Stage 4 · The Forge
    {
      slug: "saboteur-of-the-forge",
      name: "Saboteur of the Forge",
      family: "machine",
      introLine:
        "* The Saboteur adds imperfections to your castings when you aren't looking.",
      // idle here is 1 frame (rotations/south fallback) — no
      // Breathing_Idle shipped in the Saboteur pack. Runtime treats
      // frameCount:1 as a still image loop, which is fine.
      clips: { size: 88, frames: { idle: 1, attack: 9, hurt: 9 } },
      spriteScale: 2.0,
      spriteYOffset: 60,
    },
    // Stage 5 · Alchemist's Laboratory
    {
      slug: "alchemist-of-wishful-results",
      name: "Alchemist of Wishful Results",
      family: "arcane",
      introLine:
        "* The Alchemist lifts a test tube glowing with hope, not evidence.",
      clips: { size: 88, frames: { idle: 4, attack: 9, hurt: 9 } },
      spriteScale: 1.9,
      spriteYOffset: 60,
    },
    // Stage 6 · Crossroads Town — Babel Merchant (shared with Venture 7).
    // Uses the existing /assets/bosses/incoming/babel-merchant/ pack
    // which shipped earlier (idle/attack/retreat/victory).
    {
      slug: "..:incoming/babel-merchant",
      name: "Babel Merchant",
      family: "arcane",
      introLine:
        "* The Merchant offers you a hundred paths — every one detours.",
      // Existing incoming/ pack: 92×92 with idle/attack (retreat as
      // hurt-fallback, victory shipped).
      clips: { size: 92, frames: { idle: 9, attack: 9, hurt: 9, victory: 9 } },
      spriteScale: 1.9,
      spriteYOffset: 62,
    },
    // Stage 7 · Grand Hall
    {
      slug: "silencer-of-findings",
      name: "Silencer of Findings",
      family: "undead",
      introLine:
        "* The Silencer waits at the podium. Your conclusion had better hold.",
      clips: { size: 92, frames: { idle: 4, attack: 9, defeat: 9 } },
      spriteScale: 2.0,
      spriteYOffset: 60,
    },
  ],
  creative: [
    // Stage 1 · Sacred Grove → Silence That Smothers.
    // Reuses Silencer of Findings art per user directive
    // ("reuse existing where names are close enough").
    {
      slug: "..:lab/silencer-of-findings",
      name: "Silence That Smothers",
      family: "undead",
      introLine:
        "* A hush settles over the Grove. The Silence smothers every first draft.",
      clips: { size: 92, frames: { idle: 4, attack: 9, defeat: 9 } },
      spriteScale: 2.0,
      spriteYOffset: 60,
    },
    // Stage 2 · Gallery of Echoes → Curator of Derivative Ghosts.
    // Art pending (user hasn't sent this pack yet). Returning null
    // here makes TemplateMapScene fall back to FALLBACK_BOSS (Fog).
    null,
    // Stage 3 · The Wilderness → Beast of the Unfinished.
    // Reuses Unfinished Golem art per user directive.
    {
      slug: "..:venture/unfinished-golem",
      name: "Beast of the Unfinished",
      family: "plant",
      introLine:
        "* The Beast lumbers out of the Wilderness. Half-built and hungry.",
      clips: { size: 88, frames: { idle: 4, attack: 9 } },
      spriteScale: 2.2,
      spriteYOffset: 58,
    },
    // Stage 4 · Village Square → Crowd of False Validation.
    // Reuses Councillor of False Consensus art per user directive.
    {
      slug: "..:academic/councillor-of-false-consensus",
      name: "Crowd of False Validation",
      family: "arcane",
      introLine:
        "* The Crowd claps for everything — even the mediocrity.",
      clips: { size: 92, frames: { idle: 4, attack: 9, hurt: 9 } },
      spriteScale: 1.9,
      spriteYOffset: 62,
    },
    // Stage 5 · Artisan's Workshop → Perfectionist's Spectre. Art pending.
    null,
    // Stage 6 · Harbour → Harbourmaster of Hesitation
    // (shared with Venture Stage 6; uses the existing incoming/ pack).
    {
      slug: "..:incoming/harbourmaster",
      name: "Harbourmaster of Hesitation",
      family: "machine",
      introLine:
        "* The Harbourmaster demands proof you belong on this dock.",
      // Existing pack: idle/attack/retreat/victory at 92×92.
      clips: { size: 92, frames: { idle: 9, attack: 9, hurt: 9, victory: 9 } },
      spriteScale: 1.9,
      spriteYOffset: 62,
    },
  ],
};

/** Resolve a slug that starts with "..:" as an override pointing to
 *  a different folder root (used when Creative reuses art from
 *  academic/lab/venture, or when Lab shares Babel with venture). */
function resolveAssetBase(slug: string, template: NonVentureTemplate): string {
  if (slug.startsWith("..:")) {
    // Absolute override — the rest of the string IS the folder path
    // beneath /assets/bosses/.
    return `/assets/bosses/${slug.slice(3)}`;
  }
  return `/assets/bosses/${template}/${slug}`;
}

/** Build a BossClipMeta from a state name + this-boss's frame size
 *  + shipped frame count. Returns undefined for states the boss
 *  doesn't have (caller relies on the runtime fallback chain). */
function makeClip(
  base: string,
  state: "idle" | "attack" | "hurt" | "defeat" | "victory",
  size: number,
  frames: number | undefined,
  fps: number,
): BossClipMeta | undefined {
  if (!frames) return undefined;
  return {
    asset: `${base}/${state}.png`,
    frameCount: frames,
    frameWidth: size,
    frameHeight: size,
    fps,
  };
}

/**
 * Look up the boss guarding a specific template + stage.
 * Returns a fully-populated StageBoss ready to feed into
 * TemplateMapScene's `boss` init prop, or null when no art is wired
 * yet for that slot (caller should fall back to FALLBACK_BOSS).
 */
export function getTemplateStageBoss(
  templateId: string,
  stageNumber: number,
): StageBoss | null {
  if (templateId === "venture") return null; // venture uses stage-bosses.ts
  const tid = templateId as NonVentureTemplate;
  const roster = TEMPLATE_STAGE_BOSSES[tid];
  if (!roster) return null;
  const entry = roster[Math.max(0, stageNumber - 1)];
  if (!entry) return null;

  const base = resolveAssetBase(entry.slug, tid);
  const size = entry.clips.size;
  const fps = entry.fpsOverride ?? {};

  // Idle always ships (guaranteed by the on-disk stitcher — either
  // Breathing_Idle or a rotation/south fallback). If it's missing
  // from the data table that's a config bug, not a runtime one.
  const idleClip = makeClip(base, "idle", size, entry.clips.frames.idle, fps.idle ?? 6);
  const attackClip = makeClip(base, "attack", size, entry.clips.frames.attack, fps.attack ?? 10);
  const hurtClip = makeClip(base, "hurt", size, entry.clips.frames.hurt, fps.hurt ?? 10);
  const defeatClip = makeClip(base, "defeat", size, entry.clips.frames.defeat, fps.defeat ?? 8);
  const victoryClip = makeClip(base, "victory", size, entry.clips.frames.victory, fps.victory ?? 8);

  return {
    // checkpointIndex 0 = "first CP" — TemplateMapScene spawns the
    // boss at the FIRST checkpoint on the map by design.
    checkpointIndex: 0,
    name: entry.name,
    family: entry.family,
    idleAsset: `${base}/idle.png`,
    introLine: entry.introLine ?? `* ${entry.name} blocks your path.`,
    idleClip,
    attackClip,
    hurtClip,
    defeatClip,
    victoryClip,
    spriteScale: entry.spriteScale ?? 1.9,
    spriteYOffset: entry.spriteYOffset ?? 62,
    spriteXOffset: entry.spriteXOffset ?? 0,
  };
}
