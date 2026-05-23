/**
 * bossCinematics.ts
 *
 * Phase 11 — Boss System Extensions: Entrance and Defeat Cinematics
 *
 * Defines the 12-boss cinematic profiles used by BossSilhouette.ts
 * and the Phaser WorldMapScene to trigger per-boss entrance/defeat/retreat
 * animations without modifying the existing Boss.ts entity.
 *
 * Each boss profile specifies:
 *  - Entrance cinematic sequence (shake, flash, sound, text reveal)
 *  - Defeat cinematic sequence (particle burst, corruption drain, lore text)
 *  - Retreat sequence (used when boss is forced back at <50% HP)
 *  - HP scaling formula (base HP × corruption multiplier)
 *  - Template affinity (which templates this boss appears in)
 *
 * INVARIANT: This file does NOT modify Boss.ts.
 * The existing BossSilhouette procedural drawing is reused for all 12 bosses.
 * Only the cinematic metadata changes per boss.
 */

import type { TemplateId } from "@/config/templates";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type BossId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type CinematicShakePattern =
  | "none"
  | "light"     // Subtle tremor — boss approaching
  | "medium"    // Clear screen shake — boss revealed
  | "heavy"     // Full screen shake — cataclysmic reveal
  | "pulse";    // Rhythmic pulse — heartbeat style

export type CinematicFlashColor =
  | "none"
  | "white"
  | "red"
  | "purple"
  | "gold"
  | "green"
  | "cyan";

export type BossAuraStyle =
  | "shadow_tendrils"   // Dark tendrils spreading from edges
  | "lightning_ring"    // Electric ring around boss
  | "ink_bleed"         // Dark ink bleeding from boss body
  | "crystal_shatter"   // Crystal fragments orbit boss
  | "smoke_veil"        // Thick smoke obscures boss
  | "void_rift"         // Rift in space around boss
  | "brush_swirl";      // Paint brushstrokes swirl (Creative template)

export interface BossCinematicSequence {
  /** Duration of entire cinematic in ms */
  durationMs: number;
  /** Screen shake pattern */
  shake: CinematicShakePattern;
  /** Full-screen flash color */
  flash: CinematicFlashColor;
  /** Boss aura visual effect */
  aura: BossAuraStyle;
  /** Ambient audio dampening during cinematic (0–1, 0 = silent) */
  ambienceFadeLevel: number;
  /** Music track to play during cinematic */
  musicTrackId: string;
  /** Lore text lines displayed sequentially during cinematic */
  loreLines: string[];
  /** Whether to show the boss name reveal with typewriter effect */
  showNameReveal: boolean;
}

export interface BossDefeatCinematic {
  /** Duration ms */
  durationMs: number;
  /** Particle color (Phaser hex) */
  particleColor: number;
  /** Corruption drain amount (% to reduce) */
  corruptionDrainPct: number;
  /** XP award base amount (scaled by corruption level) */
  xpBase: number;
  /** Victory lore text */
  victoryText: string;
  /** Whether to do a full-screen white flash on defeat */
  whiteFlash: boolean;
}

export interface BossHPConfig {
  /** Base HP pool */
  baseHP: number;
  /**
   * HP scaling formula:
   *   finalHP = baseHP × (1 + corruptionLevel / 100) × (1 - insightReduction)
   * insightReduction = insight fragments collected × 0.05 (max 0.25)
   */
  corruptionScaling: true;
}

export interface BossCinematicProfile {
  id: BossId;
  name: string;
  /** Which templates this boss can appear in (null = all templates) */
  templateAffinity: TemplateId[] | null;
  /** Which stages this boss guards (maps to ventureConstants BOSS_DEFINITIONS) */
  stageIds: number[];
  entrance: BossCinematicSequence;
  defeat: BossDefeatCinematic;
  retreat: Pick<BossCinematicSequence, "durationMs" | "shake" | "loreLines">;
  hpConfig: BossHPConfig;
  /** Drawing style variant passed to BossSilhouette renderer */
  silhouetteVariant: "shadow" | "crystal" | "spectral" | "mechanical" | "organic";
}

// ─────────────────────────────────────────────────────────────────────────────
// HP CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate boss HP using the template-aware formula.
 * @param baseHP        Base HP from hpConfig
 * @param corruption    Current venture corruption level (0–100)
 * @param insightFrags  Insight fragments collected (0–5 max effective)
 */
export function calculateBossHP(
  baseHP: number,
  corruption: number,
  insightFrags: number = 0,
): number {
  const corruptionMultiplier = 1 + Math.min(corruption, 100) / 100;
  const insightReduction = Math.min(insightFrags * 0.05, 0.25);
  return Math.round(baseHP * corruptionMultiplier * (1 - insightReduction));
}

// ─────────────────────────────────────────────────────────────────────────────
// 12-BOSS CINEMATIC PROFILES
// ─────────────────────────────────────────────────────────────────────────────

export const BOSS_CINEMATIC_PROFILES: Record<BossId, BossCinematicProfile> = {
  1: {
    id: 1,
    name: "The Unraveller",
    templateAffinity: ["venture"],
    stageIds: [1],
    silhouetteVariant: "shadow",
    hpConfig: { baseHP: 100, corruptionScaling: true },
    entrance: {
      durationMs: 4000,
      shake: "medium",
      flash: "purple",
      aura: "shadow_tendrils",
      ambienceFadeLevel: 0.1,
      musicTrackId: "boss_unraveller",
      showNameReveal: true,
      loreLines: [
        "The fabric of reality begins to tear…",
        "Paths dissolve. Plans unravel.",
        "The Unraveller has emerged.",
      ],
    },
    defeat: {
      durationMs: 3000,
      particleColor: 0x8b5cf6,
      corruptionDrainPct: 30,
      xpBase: 500,
      victoryText: "The threads hold. Reality steadies. You move forward.",
      whiteFlash: true,
    },
    retreat: {
      durationMs: 1500,
      shake: "light",
      loreLines: ["The Unraveller pulls back into the void…", "For now."],
    },
  },

  2: {
    id: 2,
    name: "The Pale Architect",
    templateAffinity: ["venture", "academic", "creative"],
    stageIds: [2],
    silhouetteVariant: "crystal",
    hpConfig: { baseHP: 120, corruptionScaling: true },
    entrance: {
      durationMs: 4500,
      shake: "light",
      flash: "white",
      aura: "crystal_shatter",
      ambienceFadeLevel: 0.05,
      musicTrackId: "boss_pale_architect",
      showNameReveal: true,
      loreLines: [
        "Everything slows to amber perfection…",
        "The Pale Architect surveys your incomplete masterpiece.",
        "It will never be good enough.",
      ],
    },
    defeat: {
      durationMs: 3500,
      particleColor: 0xe5e7eb,
      corruptionDrainPct: 28,
      xpBase: 600,
      victoryText: "The amber shatters. Progress resumes. Done is better than perfect.",
      whiteFlash: true,
    },
    retreat: {
      durationMs: 2000,
      shake: "none",
      loreLines: ["The Architect retreats to its palace of frozen time.", "You have bought yourself progress."],
    },
  },

  3: {
    id: 3,
    name: "The Hollow King",
    templateAffinity: ["venture"],
    stageIds: [3],
    silhouetteVariant: "spectral",
    hpConfig: { baseHP: 130, corruptionScaling: true },
    entrance: {
      durationMs: 5000,
      shake: "heavy",
      flash: "none",
      aura: "void_rift",
      ambienceFadeLevel: 0,
      musicTrackId: "boss_gravemind",
      showNameReveal: true,
      loreLines: [
        "The world desaturates…",
        "Tasks complete but feel meaningless.",
        "The Hollow King reigns where purpose once lived.",
      ],
    },
    defeat: {
      durationMs: 4000,
      particleColor: 0x06b6d4,
      corruptionDrainPct: 35,
      xpBase: 650,
      victoryText: "Colour floods back. Meaning returns. The Hollow King dissolves.",
      whiteFlash: false,
    },
    retreat: {
      durationMs: 2500,
      shake: "none",
      loreLines: ["The grey retreats. You remember why you started."],
    },
  },

  4: {
    id: 4,
    name: "The Thornwarden",
    templateAffinity: ["venture"],
    stageIds: [4],
    silhouetteVariant: "organic",
    hpConfig: { baseHP: 140, corruptionScaling: true },
    entrance: {
      durationMs: 4000,
      shake: "medium",
      flash: "green",
      aura: "shadow_tendrils",
      ambienceFadeLevel: 0.15,
      musicTrackId: "boss_unraveller",
      showNameReveal: true,
      loreLines: [
        "Thorns spread across every pathway…",
        "Every checkpoint requires twice the force.",
        "The Thornwarden will not yield easily.",
      ],
    },
    defeat: {
      durationMs: 3000,
      particleColor: 0x3b82f6,
      corruptionDrainPct: 25,
      xpBase: 700,
      victoryText: "The thorns wither. The path clears. Bureaucracy breaks before will.",
      whiteFlash: false,
    },
    retreat: {
      durationMs: 1800,
      shake: "light",
      loreLines: ["The Thornwarden retreats into the thicket.", "The path is easier — for now."],
    },
  },

  5: {
    id: 5,
    name: "The Mirror Witch",
    templateAffinity: ["venture"],
    stageIds: [5],
    silhouetteVariant: "spectral",
    hpConfig: { baseHP: 150, corruptionScaling: true },
    entrance: {
      durationMs: 4500,
      shake: "pulse",
      flash: "cyan",
      aura: "smoke_veil",
      ambienceFadeLevel: 0.2,
      musicTrackId: "boss_pale_architect",
      showNameReveal: true,
      loreLines: [
        "Your reflection smiles back — showing what you want to see.",
        "The data confirms your assumptions.",
        "The Mirror Witch has entered.",
      ],
    },
    defeat: {
      durationMs: 3500,
      particleColor: 0x22d3ee,
      corruptionDrainPct: 28,
      xpBase: 750,
      victoryText: "The mirror shatters. The real data emerges. Truth was always there.",
      whiteFlash: true,
    },
    retreat: {
      durationMs: 2000,
      shake: "light",
      loreLines: ["The reflections fade. Your data is your own again."],
    },
  },

  6: {
    id: 6,
    name: "The Ashen Drake",
    templateAffinity: ["venture"],
    stageIds: [6],
    silhouetteVariant: "shadow",
    hpConfig: { baseHP: 160, corruptionScaling: true },
    entrance: {
      durationMs: 5000,
      shake: "heavy",
      flash: "red",
      aura: "void_rift",
      ambienceFadeLevel: 0.1,
      musicTrackId: "boss_unraveller",
      showNameReveal: true,
      loreLines: [
        "Fire licks at the edges of completed work…",
        "Everything achieved begins to ash.",
        "The Ashen Drake rises.",
      ],
    },
    defeat: {
      durationMs: 4000,
      particleColor: 0xef4444,
      corruptionDrainPct: 32,
      xpBase: 800,
      victoryText: "The dragon falls. Your work survives the fire. Momentum preserved.",
      whiteFlash: false,
    },
    retreat: {
      durationMs: 2500,
      shake: "medium",
      loreLines: ["The Ashen Drake retreats to its smouldering crater.", "Your progress stands."],
    },
  },

  7: {
    id: 7,
    name: "The Tide Caller",
    templateAffinity: ["venture"],
    stageIds: [7],
    silhouetteVariant: "organic",
    hpConfig: { baseHP: 170, corruptionScaling: true },
    entrance: {
      durationMs: 4500,
      shake: "heavy",
      flash: "none",
      aura: "shadow_tendrils",
      ambienceFadeLevel: 0.05,
      musicTrackId: "boss_gravemind",
      showNameReveal: true,
      loreLines: [
        "The flood comes. Too many directions.",
        "Priorities submerge beneath the noise.",
        "The Tide Caller commands the chaos.",
      ],
    },
    defeat: {
      durationMs: 3500,
      particleColor: 0x10b981,
      corruptionDrainPct: 30,
      xpBase: 850,
      victoryText: "The tide recedes. Focus returns. One direction, clear ahead.",
      whiteFlash: false,
    },
    retreat: {
      durationMs: 2000,
      shake: "medium",
      loreLines: ["The waters pull back.", "You find solid ground."],
    },
  },

  8: {
    id: 8,
    name: "The Gravemind",
    templateAffinity: ["venture"],
    stageIds: [8],
    silhouetteVariant: "shadow",
    hpConfig: { baseHP: 200, corruptionScaling: true },
    entrance: {
      durationMs: 6000,
      shake: "heavy",
      flash: "purple",
      aura: "void_rift",
      ambienceFadeLevel: 0,
      musicTrackId: "boss_gravemind",
      showNameReveal: true,
      loreLines: [
        "They rise. Every abandoned idea. Every failed plan.",
        "The graveyard of abandoned ventures opens.",
        "The Gravemind commands an army of what might have been.",
        "This is the final test.",
      ],
    },
    defeat: {
      durationMs: 5000,
      particleColor: 0xfbbf24,
      corruptionDrainPct: 50,
      xpBase: 1500,
      victoryText: "The dead rest. Their failures become your foundation. You have scaled.",
      whiteFlash: true,
    },
    retreat: {
      durationMs: 3000,
      shake: "heavy",
      loreLines: ["The Gravemind retreats below.", "You are not done. But you will be."],
    },
  },

  9: {
    id: 9,
    name: "Gatekeeper of Unearned Entry",
    templateAffinity: ["academic"],
    stageIds: [6],
    silhouetteVariant: "spectral",
    hpConfig: { baseHP: 180, corruptionScaling: true },
    entrance: {
      durationMs: 4500,
      shake: "light",
      flash: "gold",
      aura: "crystal_shatter",
      ambienceFadeLevel: 0.15,
      musicTrackId: "boss_pale_architect",
      showNameReveal: true,
      loreLines: [
        "The gates of the Grand Archive seal shut.",
        "The Gatekeeper reads your submission with cold eyes.",
        "Every flaw becomes a wall. Every gap becomes a locked door.",
      ],
    },
    defeat: {
      durationMs: 3500,
      particleColor: 0xd4a853,
      corruptionDrainPct: 35,
      xpBase: 900,
      victoryText: "The gates open. The Archive accepts your work. Your contribution is real.",
      whiteFlash: true,
    },
    retreat: {
      durationMs: 2000,
      shake: "none",
      loreLines: ["The Gatekeeper steps aside — grudgingly.", "Your work has earned temporary passage."],
    },
  },

  10: {
    id: 10,
    name: "Alchemist of Wishful Results",
    templateAffinity: ["lab"],
    stageIds: [5],
    silhouetteVariant: "mechanical",
    hpConfig: { baseHP: 175, corruptionScaling: true },
    entrance: {
      durationMs: 4000,
      shake: "pulse",
      flash: "cyan",
      aura: "lightning_ring",
      ambienceFadeLevel: 0.1,
      musicTrackId: "boss_unraveller",
      showNameReveal: true,
      loreLines: [
        "The p-values shift. The charts smooth themselves.",
        "The Alchemist of Wishful Results begins transmutation.",
        "Your data is being… improved.",
      ],
    },
    defeat: {
      durationMs: 3500,
      particleColor: 0x06d6a0,
      corruptionDrainPct: 30,
      xpBase: 950,
      victoryText: "The transmutation reverses. Your raw data holds its truth. Significance earned honestly.",
      whiteFlash: false,
    },
    retreat: {
      durationMs: 2000,
      shake: "pulse",
      loreLines: ["The Alchemist retreats to her laboratory.", "Your p-values are your own again."],
    },
  },

  11: {
    id: 11,
    name: "Silence That Smothers",
    templateAffinity: ["creative"],
    stageIds: [1],
    silhouetteVariant: "shadow",
    hpConfig: { baseHP: 120, corruptionScaling: true },
    entrance: {
      durationMs: 5000,
      shake: "none",
      flash: "none",
      aura: "smoke_veil",
      ambienceFadeLevel: 0,
      musicTrackId: "boss_pale_architect",
      showNameReveal: true,
      loreLines: [
        "The music stops.",
        "The cursor blinks. The page stays blank.",
        "The Silence That Smothers fills the sacred grove.",
        "No concept is good enough to survive it.",
      ],
    },
    defeat: {
      durationMs: 4000,
      particleColor: 0xffd166,
      corruptionDrainPct: 40,
      xpBase: 500,
      victoryText: "Sound returns. Your voice fills the grove. The first mark is made — and that is everything.",
      whiteFlash: false,
    },
    retreat: {
      durationMs: 3000,
      shake: "none",
      loreLines: ["The silence lifts.", "Your creative impulse survives."],
    },
  },

  12: {
    id: 12,
    name: "Harbourmaster of Hesitation",
    templateAffinity: ["creative"],
    stageIds: [6],
    silhouetteVariant: "mechanical",
    hpConfig: { baseHP: 190, corruptionScaling: true },
    entrance: {
      durationMs: 4500,
      shake: "light",
      flash: "none",
      aura: "smoke_veil",
      ambienceFadeLevel: 0.2,
      musicTrackId: "boss_gravemind",
      showNameReveal: true,
      loreLines: [
        "The harbour is full. Every ship is ready.",
        "But the Harbourmaster has found another reason to delay.",
        "Your finished work waits at the dock. It may wait forever.",
      ],
    },
    defeat: {
      durationMs: 3500,
      particleColor: 0xf4a261,
      corruptionDrainPct: 35,
      xpBase: 1000,
      victoryText: "The gangplank drops. Your work sets sail. The audience waits on the other shore.",
      whiteFlash: true,
    },
    retreat: {
      durationMs: 2000,
      shake: "none",
      loreLines: ["The Harbourmaster steps aside — just this once.", "Your ship leaves port."],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the boss profile for a given boss ID.
 */
export function getBossCinematicProfile(bossId: BossId): BossCinematicProfile {
  return BOSS_CINEMATIC_PROFILES[bossId];
}

/**
 * Get all boss profiles that can appear in a given template.
 */
export function getBossesForTemplate(templateId: TemplateId): BossCinematicProfile[] {
  return Object.values(BOSS_CINEMATIC_PROFILES).filter(
    (boss) => boss.templateAffinity === null || boss.templateAffinity.includes(templateId),
  );
}

/**
 * Calculate the actual HP for a boss encounter.
 */
export function getBossEncounterHP(
  bossId: BossId,
  corruptionLevel: number,
  insightFragments: number = 0,
): number {
  const profile = BOSS_CINEMATIC_PROFILES[bossId];
  return calculateBossHP(profile.hpConfig.baseHP, corruptionLevel, insightFragments);
}
