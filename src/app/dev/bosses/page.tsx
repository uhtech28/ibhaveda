"use client";

/**
 * /dev/bosses — Boss animation gallery for client review.
 *
 * Shows every boss the game has assets for, with each animation clip
 * (idle / attack / hurt / defeat / victory / walk / running / retreat)
 * playing on loop side-by-side. Uses the same CSS `steps()` sprite
 * player as CombatQuestionCard so what you see here is exactly what
 * plays in combat.
 *
 * Organization mirrors the boss registry from the reconciled xlsx:
 *   - Venture stage bosses (S1-S8, one per stage)
 *   - Village CP mini-bosses (per-checkpoint sprites)
 *   - Super Boss Pool (12 project-scoped villains)
 *   - Legacy idle-only placeholder sheets (stage 2-4)
 *
 * When new animation packs are delivered, add them to the matching
 * section by dropping folder + boss entry. Not linked from anywhere —
 * send the client `/dev/bosses` directly.
 * Add `?bg=dark` (default) or `?bg=light` to flip the backdrop.
 */

import React, { useId, useMemo } from "react";
import { useSearchParams } from "next/navigation";

type GroupId =
  | "venture-stage-bosses"
  | "village-cp-minibosses"
  | "super-boss-pool"
  | "legacy-idle-only";

interface BossDef {
  id: string;
  displayName: string;
  /** Boss's canonical stage assignment per xlsx (blank for super-boss pool + supplementary CP mini-bosses). */
  stage?: number;
  /** Biome name for context. */
  biome?: string;
  /** Which section of the gallery to render this boss under. */
  group: GroupId;
  folder: string;
  frameWidth: number;
  frameHeight: number;
  /** Map of clip name → { file, frames, fps }. */
  clips: Record<string, { file: string; frames: number; fps: number } | null>;
}

const F = 92;
const NINE = 9;

// Section headers (title + subtitle + color accent), rendered in order.
const GROUPS: {
  id: GroupId;
  title: string;
  subtitle: string;
  accent: string;
}[] = [
  {
    id: "venture-stage-bosses",
    title: "VENTURE STAGE BOSSES · 8 STAGES",
    subtitle:
      "One canonical stage-monster per Venture stage per the Ibhaveda spec. Full 5-clip Pixellab packs where delivered.",
    accent: "text-amber-300",
  },
  {
    id: "village-cp-minibosses",
    title: "VILLAGE CP MINI-BOSSES",
    subtitle:
      "Per-checkpoint sprites that hover over each Village CP. Supplementary to the Village stage boss (Fog of Vagueness).",
    accent: "text-sky-300",
  },
  {
    id: "super-boss-pool",
    title: "SUPER BOSS POOL · 12 PROJECT-SCOPED VILLAINS",
    subtitle:
      "One randomly assigned per idea run at project creation. Drop new packs here as they arrive.",
    accent: "text-pink-300",
  },
  {
    id: "legacy-idle-only",
    title: "LEGACY SPRITE DELIVERIES · IDLE ONLY",
    subtitle:
      "Older art passes for Stages 2-4 without motion clips. Superseded once the corresponding stage boss ships a full pack above.",
    accent: "text-white/60",
  },
];

const BOSSES: BossDef[] = [
  // ─── Venture Stage Bosses (canonical per xlsx Stage Monsters sheet) ───

  // Stage 1 · The Village · Fog of Vagueness ✅ full pack
  {
    id: "fog",
    displayName: "The Fog of Vagueness",
    stage: 1,
    biome: "The Village",
    group: "venture-stage-bosses",
    folder: "/assets/bosses/village/fog",
    frameWidth: F,
    frameHeight: F,
    clips: {
      idle: { file: "idle.png", frames: NINE, fps: 7 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      hurt: { file: "hurt.png", frames: NINE, fps: 8 },
      defeat: { file: "defeat.png", frames: NINE, fps: 6 },
      victory: { file: "victory.png", frames: NINE, fps: 8 },
      running: { file: "running.png", frames: 6, fps: 8 },
    },
  },

  // Stage 5 · The Mine · Collapse Specter ✅ full pack
  {
    id: "collapse-specter",
    displayName: "The Collapse Specter",
    stage: 5,
    biome: "The Mine",
    group: "venture-stage-bosses",
    folder: "/assets/bosses/incoming/collapse-specter",
    frameWidth: F,
    frameHeight: F,
    clips: {
      idle: { file: "idle.png", frames: NINE, fps: 7 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      hurt: { file: "hurt.png", frames: NINE, fps: 8 },
      victory: { file: "victory.png", frames: NINE, fps: 8 },
    },
  },

  // Stage 6 · The Golden Harbour · Harbourmaster of Hesitation ✅ full pack
  {
    id: "harbourmaster",
    displayName: "The Harbourmaster of Hesitation",
    stage: 6,
    biome: "The Golden Harbour",
    group: "venture-stage-bosses",
    folder: "/assets/bosses/incoming/harbourmaster",
    frameWidth: F,
    frameHeight: F,
    clips: {
      idle: { file: "idle.png", frames: NINE, fps: 7 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      retreat: { file: "retreat.png", frames: NINE, fps: 6 },
      victory: { file: "victory.png", frames: NINE, fps: 8 },
    },
  },

  // Stage 7 · The Crossroads Town · Babel Merchant ✅ full pack
  {
    id: "babel-merchant",
    displayName: "The Babel Merchant",
    stage: 7,
    biome: "The Crossroads Town",
    group: "venture-stage-bosses",
    folder: "/assets/bosses/incoming/babel-merchant",
    frameWidth: F,
    frameHeight: F,
    clips: {
      idle: { file: "idle.png", frames: NINE, fps: 7 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      retreat: { file: "retreat.png", frames: NINE, fps: 6 },
      victory: { file: "victory.png", frames: NINE, fps: 8 },
    },
  },

  // Stage 8 · The Capital · Iron Bureaucrat ✅ 3-clip pack
  {
    id: "iron-bureaucrat",
    displayName: "The Iron Bureaucrat",
    stage: 8,
    biome: "The Capital",
    group: "venture-stage-bosses",
    folder: "/assets/bosses/incoming/iron-bureaucrat",
    frameWidth: F,
    frameHeight: F,
    clips: {
      idle: { file: "idle.png", frames: NINE, fps: 7 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      victory: { file: "victory.png", frames: NINE, fps: 8 },
    },
  },

  // ─── Village CP mini-bosses (per-checkpoint supplementary sprites) ────
  {
    id: "chimera",
    displayName: "Chimera",
    biome: "The Village · CP2",
    group: "village-cp-minibosses",
    folder: "/assets/bosses/village/chimera",
    frameWidth: F,
    frameHeight: F,
    clips: {
      idle: { file: "idle.png", frames: NINE, fps: 7 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      hurt: { file: "hurt.png", frames: NINE, fps: 8 },
    },
  },
  {
    id: "automaton",
    displayName: "Automaton",
    biome: "The Village · CP3",
    group: "village-cp-minibosses",
    folder: "/assets/bosses/village/automaton",
    frameWidth: F,
    frameHeight: F,
    clips: {
      idle: { file: "idle.png", frames: NINE, fps: 7 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      hurt: { file: "hurt.png", frames: NINE, fps: 8 },
      victory: { file: "victory.png", frames: NINE, fps: 8 },
    },
  },
  {
    id: "wraith",
    displayName: "Pathwarden Wraith",
    biome: "The Village · CP4  (also canonical Stage 2 monster)",
    group: "village-cp-minibosses",
    folder: "/assets/bosses/village/wraith",
    frameWidth: F,
    frameHeight: F,
    clips: {
      idle: { file: "idle.png", frames: NINE, fps: 7 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      hurt: { file: "hurt.png", frames: NINE, fps: 8 },
      victory: { file: "victory.png", frames: NINE, fps: 8 },
      walk: { file: "walk.png", frames: 8, fps: 8 },
    },
  },

  // ─── Stage 2 · Forest (animated packs from latest boss batch) ─────────
  {
    id: "forest-sorceress",
    displayName: "Sorceress of Endless Iteration",
    stage: 2,
    biome: "The Forest · CP1",
    group: "venture-stage-bosses",
    folder: "/assets/bosses/stage2/forest-sorceress",
    frameWidth: 92,
    frameHeight: 92,
    clips: {
      idle:   { file: "idle.png",   frames: 4, fps: 6 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      hurt:   { file: "hurt.png",   frames: NINE, fps: 8 },
      defeat: { file: "defeat.png", frames: NINE, fps: 6 },
    },
  },
  {
    id: "thornbearer",
    displayName: "Thornbearer Champion",
    stage: 2,
    biome: "The Forest · CP2",
    group: "venture-stage-bosses",
    folder: "/assets/bosses/stage2/thornbearer",
    frameWidth: 88,
    frameHeight: 88,
    clips: {
      idle:   { file: "idle.png",   frames: 4, fps: 6 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      hurt:   { file: "hurt.png",   frames: NINE, fps: 8 },
      defeat: { file: "defeat.png", frames: NINE, fps: 6 },
    },
  },
  {
    id: "forest-colossus",
    displayName: "The Forest Colossus (SUPER)",
    stage: 2,
    biome: "The Forest · Super",
    group: "venture-stage-bosses",
    folder: "/assets/bosses/stage2/forest-colossus",
    frameWidth: 96,
    frameHeight: 96,
    clips: {
      idle:   { file: "idle.png",   frames: 4, fps: 6 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      hurt:   { file: "hurt.png",   frames: NINE, fps: 8 },
    },
  },

  // ─── Stage 3 · Arena (animated packs from latest boss batch) ──────────
  {
    id: "arena-judge",
    displayName: "Judge of False Precedent",
    stage: 3,
    biome: "The Arena · CP0",
    group: "venture-stage-bosses",
    folder: "/assets/bosses/arena/judge",
    frameWidth: 88,
    frameHeight: 88,
    clips: {
      idle:    { file: "idle.png",    frames: 4, fps: 6 },
      attack:  { file: "attack.png",  frames: NINE, fps: 8 },
      hurt:    { file: "hurt.png",    frames: NINE, fps: 8 },
      victory: { file: "victory.png", frames: NINE, fps: 8 },
    },
  },
  {
    id: "arena-masked-challenger",
    displayName: "The Masked Challenger",
    stage: 3,
    biome: "The Arena · CP1",
    group: "venture-stage-bosses",
    folder: "/assets/bosses/arena/masked-challenger",
    frameWidth: 92,
    frameHeight: 92,
    clips: {
      idle:   { file: "idle.png",   frames: 4, fps: 6 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
    },
  },
  {
    id: "arena-oracle-of-doubt",
    displayName: "Oracle of Doubt",
    stage: 3,
    biome: "The Arena · CP2",
    group: "venture-stage-bosses",
    folder: "/assets/bosses/arena/oracle-of-doubt",
    frameWidth: 88,
    frameHeight: 88,
    clips: {
      idle:   { file: "idle.png",   frames: 4, fps: 6 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      hurt:   { file: "hurt.png",   frames: NINE, fps: 8 },
    },
  },
  {
    id: "arena-advocate",
    displayName: "The Advocate of Comfortable Lies (SUPER)",
    stage: 3,
    biome: "The Arena · Super",
    group: "venture-stage-bosses",
    folder: "/assets/bosses/arena/advocate",
    frameWidth: 88,
    frameHeight: 88,
    clips: {
      idle:   { file: "idle.png",   frames: 4, fps: 6 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      hurt:   { file: "hurt.png",   frames: NINE, fps: 8 },
    },
  },

  // ─── Super Boss Pool (12 project-scoped villains) ──────────────────────
  {
    id: "unraveller",
    displayName: "The Unraveller",
    biome: "Doubt and loss of direction",
    group: "super-boss-pool",
    folder: "/assets/bosses/village/unraveller",
    frameWidth: F,
    frameHeight: F,
    clips: {
      idle: { file: "idle.png", frames: 1, fps: 1 },
    },
  },
  {
    id: "super-tide-caller",
    displayName: "The Tide Caller",
    biome: "Distraction and scope creep",
    group: "super-boss-pool",
    folder: "/assets/bosses/super-pool/tide-caller",
    frameWidth: 164,
    frameHeight: 164,
    clips: {
      idle:    { file: "idle.png",    frames: NINE, fps: 7 },
      attack:  { file: "attack.png",  frames: NINE, fps: 8 },
      hurt:    { file: "hurt.png",    frames: NINE, fps: 8 },
      defeat:  { file: "defeat.png",  frames: NINE, fps: 6 },
      victory: { file: "victory.png", frames: NINE, fps: 8 },
    },
  },
  {
    id: "super-rusted-oracle",
    displayName: "The Rusted Oracle",
    biome: "Imposter syndrome",
    group: "super-boss-pool",
    folder: "/assets/bosses/super-pool/rusted-oracle",
    frameWidth: 92,
    frameHeight: 92,
    clips: {
      idle:   { file: "idle.png",   frames: 4, fps: 6 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      hurt:   { file: "hurt.png",   frames: NINE, fps: 8 },
      defeat: { file: "defeat.png", frames: NINE, fps: 6 },
    },
  },
  {
    id: "super-wraith-council",
    displayName: "The Wraith Council",
    biome: "Decision paralysis",
    group: "super-boss-pool",
    folder: "/assets/bosses/super-pool/wraith-council",
    frameWidth: 88,
    frameHeight: 88,
    clips: {
      idle:   { file: "idle.png",   frames: 4, fps: 6 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      hurt:   { file: "hurt.png",   frames: NINE, fps: 8 },
      defeat: { file: "defeat.png", frames: NINE, fps: 6 },
    },
  },
  {
    id: "super-veilwalker",
    displayName: "The Veilwalker",
    biome: "Isolation and fear of irrelevance",
    group: "super-boss-pool",
    folder: "/assets/bosses/super-pool/veilwalker",
    frameWidth: 88,
    frameHeight: 88,
    clips: {
      idle:   { file: "idle.png",   frames: 4, fps: 6 },
      attack: { file: "attack.png", frames: NINE, fps: 8 },
      defeat: { file: "defeat.png", frames: NINE, fps: 6 },
    },
  },
  {
    id: "super-stonecaller",
    displayName: "The Stonecaller",
    biome: "Overwhelm",
    group: "super-boss-pool",
    folder: "/assets/bosses/super-pool/stonecaller",
    frameWidth: 92,
    frameHeight: 92,
    clips: {
      attack:  { file: "attack.png",  frames: NINE, fps: 8 },
      victory: { file: "victory.png", frames: NINE, fps: 8 },
    },
  },
];

// ─── Stage 2-4 legacy idle-only sheets ───────────────────────────────────
// Older sprite deliveries — still displayed so the client sees what's
// on disk. Once the corresponding canonical stage boss lands a full
// Pixellab pack in venture-stage-bosses, its legacy card can be
// removed from this array.
const IDLE_ONLY: Array<{
  id: string;
  displayName: string;
  stage: number;
  biome: string;
  folder: string;
  frameSize: number;
}> = [
  // Stage 2 legacy — kept for shadow-specter + forest-wraith (still
  // idle-only). forest-colossus / forest-sorceress / thornbearer moved
  // to the ANIMATED venture-stage-bosses section above.
  { id: "s2-forest-wraith", displayName: "Forest Wraith (idle only)", stage: 2, biome: "Forest", folder: "/assets/bosses/stage2/forest-wraith", frameSize: 92 },
  { id: "s2-shadow-specter", displayName: "Shadow Specter (idle only)", stage: 2, biome: "Forest", folder: "/assets/bosses/stage2/shadow-specter", frameSize: 88 },
  // Legacy Harbour placeholders (kept until Harbour boss art lands).
  { id: "s3-harbor-merchant", displayName: "Harbor Merchant (legacy)", stage: 6, biome: "Harbour", folder: "/assets/bosses/stage3/harbor-merchant", frameSize: 92 },
  { id: "s3-harbor-mist", displayName: "Harbor Mist (legacy)", stage: 6, biome: "Harbour", folder: "/assets/bosses/stage3/harbor-mist", frameSize: 92 },
  { id: "s3-harbor-official", displayName: "Harbor Official (legacy)", stage: 6, biome: "Harbour", folder: "/assets/bosses/stage3/harbor-official", frameSize: 96 },
  { id: "s3-leviathan", displayName: "Leviathan (legacy)", stage: 6, biome: "Harbour", folder: "/assets/bosses/stage3/leviathan", frameSize: 92 },
  { id: "s3-sea-serpent", displayName: "Sea Serpent (legacy)", stage: 6, biome: "Harbour", folder: "/assets/bosses/stage3/sea-serpent", frameSize: 92 },
  { id: "s4-armor-golem", displayName: "Armor Golem", stage: 4, biome: "Artisans", folder: "/assets/bosses/stage4/armor-golem", frameSize: 92 },
  { id: "s4-artisan-automaton", displayName: "Artisan Automaton", stage: 4, biome: "Artisans", folder: "/assets/bosses/stage4/artisan-automaton", frameSize: 96 },
  { id: "s4-forge-dragon", displayName: "Forge Dragon", stage: 4, biome: "Artisans", folder: "/assets/bosses/stage4/forge-dragon", frameSize: 92 },
  { id: "s4-spectral-king", displayName: "Spectral King", stage: 4, biome: "Artisans", folder: "/assets/bosses/stage4/spectral-king", frameSize: 92 },
  { id: "s4-undead-titan", displayName: "Undead Titan", stage: 4, biome: "Artisans", folder: "/assets/bosses/stage4/undead-titan", frameSize: 88 },
];

const CLIP_ORDER = ["idle", "attack", "hurt", "defeat", "victory", "walk", "running", "retreat"];

// ─── CSS-steps sprite player (matches CombatQuestionCard) ────────────────
function AnimatedSprite({
  src,
  frames,
  frameWidth,
  frameHeight,
  fps,
  scale = 2,
}: {
  src: string;
  frames: number;
  frameWidth: number;
  frameHeight: number;
  fps: number;
  scale?: number;
}) {
  const durationMs = Math.max(1, (frames * 1000) / fps);
  const displayFrameW = frameWidth * scale;
  const displayFrameH = frameHeight * scale;
  const endX = -frames * displayFrameW;
  const uid = useId();
  const animName = `boss-anim-${uid.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      <style>{`
        @keyframes ${animName} {
          from { background-position-x: 0px; }
          to   { background-position-x: ${endX}px; }
        }
      `}</style>
      <div
        style={{
          width: displayFrameW,
          height: displayFrameH,
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${frames * displayFrameW}px ${displayFrameH}px`,
          imageRendering: "pixelated",
          animation:
            frames > 1
              ? `${animName} ${durationMs}ms steps(${frames}) infinite`
              : undefined,
        }}
      />
    </>
  );
}

function ClipCard({
  clipName,
  src,
  frames,
  frameWidth,
  frameHeight,
  fps,
}: {
  clipName: string;
  src: string;
  frames: number;
  frameWidth: number;
  frameHeight: number;
  fps: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-3 min-w-[220px]">
      <div className="flex h-[192px] w-full items-center justify-center overflow-hidden rounded bg-neutral-900/60">
        <AnimatedSprite
          src={src}
          frames={frames}
          frameWidth={frameWidth}
          frameHeight={frameHeight}
          fps={fps}
          scale={2}
        />
      </div>
      <div className="w-full text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-white">{clipName}</div>
        <div className="mt-0.5 text-[10px] text-white/50">
          {frames} frame{frames === 1 ? "" : "s"} · {fps} fps
        </div>
      </div>
    </div>
  );
}

function BossRow({ boss }: { boss: BossDef }) {
  const availableClips = CLIP_ORDER
    .filter((k) => boss.clips[k])
    .map((k) => ({ name: k, ...boss.clips[k]! }));
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-baseline gap-3 flex-wrap">
        {boss.stage !== undefined && (
          <span
            className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-200"
            style={{ fontFamily: "var(--font-pixel-display), monospace" }}
          >
            STAGE {boss.stage}
          </span>
        )}
        <h3 className="text-lg font-bold text-white">{boss.displayName}</h3>
        {boss.biome && (
          <span className="text-xs text-white/60">· {boss.biome}</span>
        )}
        <span className="text-xs text-white/40">
          {availableClips.length} clip{availableClips.length === 1 ? "" : "s"} · {boss.frameWidth}×{boss.frameHeight}
        </span>
        <span className="ml-auto text-[10px] font-mono text-white/30">{boss.folder}</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {availableClips.length === 0 ? (
          <div className="flex items-center rounded-lg border border-dashed border-white/10 bg-black/20 px-3 py-2 text-xs text-white/40">
            No clips yet.
          </div>
        ) : (
          availableClips.map((c) => (
            <ClipCard
              key={c.name}
              clipName={c.name}
              src={`${boss.folder}/${c.file}`}
              frames={c.frames}
              frameWidth={boss.frameWidth}
              frameHeight={boss.frameHeight}
              fps={c.fps}
            />
          ))
        )}
      </div>
    </div>
  );
}

function IdleOnlyCard({
  displayName,
  stage,
  biome,
  folder,
  frameSize,
}: {
  displayName: string;
  stage: number;
  biome: string;
  folder: string;
  frameSize: number;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div>
          <span className="mr-1.5 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white/70">S{stage}</span>
          <span className="text-sm font-bold text-white">{displayName}</span>
        </div>
        <div className="text-[10px] text-white/40">{frameSize}×{frameSize}</div>
      </div>
      <div className="flex h-[140px] items-center justify-center rounded bg-neutral-900/60">
        <img
          src={`${folder}/idle.png`}
          alt={displayName}
          style={{
            width: frameSize * 1.6,
            height: frameSize * 1.6,
            imageRendering: "pixelated",
          }}
        />
      </div>
      <div className="mt-1 text-center text-[10px] text-white/40">{biome} · idle only</div>
    </div>
  );
}

export default function BossesGalleryPage() {
  const search = useSearchParams();
  const bg = search?.get("bg") === "light" ? "bg-neutral-100 text-neutral-900" : "bg-neutral-950 text-white";

  const bossesByGroup = useMemo(() => {
    const groups = new Map<GroupId, BossDef[]>();
    BOSSES.forEach((b) => {
      const arr = groups.get(b.group) ?? [];
      arr.push(b);
      groups.set(b.group, arr);
    });
    // Sort venture-stage-bosses by stage number so they render in stage order
    const venture = groups.get("venture-stage-bosses");
    if (venture) venture.sort((a, b) => (a.stage ?? 99) - (b.stage ?? 99));
    return groups;
  }, []);

  return (
    <div className={`min-h-screen w-full p-6 sm:p-10 ${bg}`}>
      <header className="mb-8 max-w-6xl">
        <h1
          className="font-mono text-3xl font-black tracking-widest sm:text-4xl"
          style={{ fontFamily: "var(--font-pixel-display), monospace" }}
        >
          BOSS ANIMATION GALLERY
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-white/60">
          Every boss sprite shipped in the game, aligned to its canonical stage
          per the Ibhaveda spec. Uses the same CSS <code className="text-white/80">steps()</code>
          player as AI Combat — what you see here is exactly what appears in-game.
        </p>
        <p className="mt-1 text-xs text-white/40">
          Toggle backdrop: <code>?bg=light</code> · <code>?bg=dark</code> (default) ·
          Also see: <a href="/dev/maps" className="text-amber-300 underline">/dev/maps</a>
        </p>
      </header>

      {GROUPS.map((g) => {
        const bosses = bossesByGroup.get(g.id) ?? [];
        if (g.id === "legacy-idle-only") {
          // Legacy section renders in a grid, not stacked
          return (
            <section key={g.id} className="mb-10 max-w-6xl">
              <h2 className={`mb-1 font-mono text-lg font-bold uppercase tracking-widest ${g.accent}`}>
                {g.title}
              </h2>
              <p className="mb-3 text-xs text-white/50">{g.subtitle}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {IDLE_ONLY.map((b) => (
                  <IdleOnlyCard
                    key={b.id}
                    displayName={b.displayName}
                    stage={b.stage}
                    biome={b.biome}
                    folder={b.folder}
                    frameSize={b.frameSize}
                  />
                ))}
              </div>
            </section>
          );
        }
        if (bosses.length === 0) return null;
        return (
          <section key={g.id} className="mb-10 max-w-6xl">
            <h2 className={`mb-1 font-mono text-lg font-bold uppercase tracking-widest ${g.accent}`}>
              {g.title}
            </h2>
            <p className="mb-3 text-xs text-white/50">{g.subtitle}</p>
            <div className="flex flex-col gap-4">
              {bosses.map((b) => (
                <BossRow key={b.id} boss={b} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
