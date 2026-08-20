"use client";

/**
 * BossIntroCinematic — one-shot intro that plays the FIRST time a user
 * lands on /map/world. The Unraveller (main boss) rises out of shadow
 * and challenges the founder, then the four checkpoint bosses reveal
 * one by one with their names. Ends with a "Face them" CTA which
 * dismisses and marks the seen flag so it never plays again.
 *
 * Guarded on the caller side by `useQuery(api.users.getMyBossIntroSeen)`
 * — the parent only mounts this component when the query returns
 * `false` (unseen) AND the map is ready.
 */

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { VILLAGE_BOSSES } from "@/config/village-bosses";
import { STAGES } from "@/config/stages.config";
import { audioManager } from "@/lib/audio/audioManager";

interface Props {
  /** Called after the cinematic has been fully dismissed. */
  onDone: () => void;
  /** Optional overrides so the parent (`map/world/page.tsx`) can
   *  replace the hardcoded Unraveller reveal with WHICHEVER super
   *  boss was randomly assigned to this venture (via `venture.
   *  assignedBosses[0]` → SUPER_BOSS_POOL entry). When omitted, the
   *  component falls back to the Unraveller defaults so existing
   *  callers that only pass `onDone` keep working exactly as before.
   *
   *  Product ask 2026-08-16: "make super bosses random and the
   *  random super boss should be there in tutorial" — without these
   *  overrides the cinematic always showed Unraveller regardless of
   *  the actual random pick, so the reroll effect had no visible
   *  effect on the intro. */
  mainBossArt?: string;
  mainBossTitle?: string;
  /** 1–3 lines the super boss speaks during `main-speech`. */
  speechLines?: readonly string[];
  /** Taunt over the minions reveal (during the four village-boss
   *  strip). Only relevant for venture-template intros; other
   *  templates hide the minion strip entirely (future work). */
  minionsSpeechLine?: string;
  /** When the passed `mainBossArt` is a HORIZONTAL SPRITESHEET
   *  (9-frame Pixellab output for the super-pool bosses), pass the
   *  per-frame dims here so the cinematic can clip to frame 0
   *  instead of rendering the whole sheet stretched. Leave undefined
   *  for single-frame legacy assets like the Unraveller default. */
  mainBossFrameSize?: { frameWidth: number; frameHeight: number; frameCount: number };
}

type Phase =
  | "curtain"        // 0-500ms — black scrim fades in
  | "main-reveal"    // 500-2500ms — Unraveller rises from shadow
  | "main-speech"    // 2500ms+ — typed speech from the main boss
  | "minions"        // reveals CP bosses one by one
  | "finale"         // "Face them, founder." + Continue button
  | "leaving";       // fade out on dismiss

const DEFAULT_MAIN_BOSS_ART = "/assets/bosses/village/unraveller/idle.png";
const DEFAULT_MAIN_BOSS_TITLE = "The Unraveller";

// Actual Venture stage function names (from convex/ventureConstants.ts
// VENTURE_STAGES). Kept as a local mirror so this client component
// doesn't have to import from the Convex module. Index i = stage i+1.
const VENTURE_STAGE_FUNCTION_NAMES = [
  "Ideation",
  "Research",
  "Validation",
  "Offer Design",
];

// Fallback speech for the `main-speech` phase — used only when the
// parent doesn't pass `speechLines` (e.g. legacy callers). Real intros
// come from SUPER_BOSS_POOL[id-1].speechLines in map/world/page.tsx.
const DEFAULT_MAIN_SPEECH_LINES = [
  "So, you dare to dream of something new.",
  "I am the Unraveller. I feed on every doubt you have yet to name.",
];

// Fallback taunt during the minions reveal (venture-template only).
const DEFAULT_MINIONS_SPEECH_LINE =
  "You'll have to defeat my four minions before you can reach me.";

export function BossIntroCinematic({
  onDone,
  mainBossArt = DEFAULT_MAIN_BOSS_ART,
  mainBossTitle = DEFAULT_MAIN_BOSS_TITLE,
  speechLines = DEFAULT_MAIN_SPEECH_LINES,
  minionsSpeechLine = DEFAULT_MINIONS_SPEECH_LINE,
  mainBossFrameSize,
}: Props) {
  // Resolve the actual speech arrays used by the effects + render —
  // defensive clamp so an empty override array doesn't break the
  // typewriter's `speechIdx < length` loop.
  const MAIN_SPEECH_LINES =
    speechLines.length > 0 ? speechLines : DEFAULT_MAIN_SPEECH_LINES;
  const MINIONS_SPEECH_LINE = minionsSpeechLine;
  const markSeen = useMutation(api.users.markBossIntroSeen);
  const [phase, setPhase] = useState<Phase>("curtain");
  const [speechIdx, setSpeechIdx] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [minionIdx, setMinionIdx] = useState(-1);
  // Separate typewriter buffer for the villain line that plays during
  // the minions reveal. Keeping it in its own state prevents the intro
  // typewriter from stomping the taunt (and vice versa).
  const [minionTypedText, setMinionTypedText] = useState("");

  // ── Sequence timing (ms) ──────────────────────────────────────────
  // Slower pacing so the intro reads like a cinematic beat instead of
  // a burst. Curtain / reveal are shifted out a touch, but the big
  // pacing wins come from the typewriter speed and the between-line
  // pauses further down.
  useEffect(() => {
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase("main-reveal"), 500));
    timers.push(window.setTimeout(() => setPhase("main-speech"), 2800));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  // ── Typewriter for main speech ────────────────────────────────────
  // Character interval bumped 34ms → 55ms and inter-line pause
  // 1400ms → 2400ms so each line lands with room to breathe.
  useEffect(() => {
    if (phase !== "main-speech") return;
    const line = MAIN_SPEECH_LINES[speechIdx] ?? "";
    setTypedText("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTypedText(line.slice(0, i));
      if (i >= line.length) {
        window.clearInterval(id);
        // Pause on the finished line before advancing.
        window.setTimeout(() => {
          if (speechIdx < MAIN_SPEECH_LINES.length - 1) {
            setSpeechIdx((v) => v + 1);
          } else {
            setPhase("minions");
          }
        }, 2400);
      }
    }, 55);
    return () => window.clearInterval(id);
  }, [phase, speechIdx]);

  // ── Minion reveal sequence ────────────────────────────────────────
  // Stagger bumped 1400ms → 2000ms per minion and the tail pause
  // 600ms → 1000ms so the finale button lands after the taunt fully
  // reads instead of stomping it.
  useEffect(() => {
    if (phase !== "minions") return;
    setMinionIdx(0);
    const timers: number[] = [];
    for (let i = 1; i < VILLAGE_BOSSES.length; i++) {
      timers.push(
        window.setTimeout(() => setMinionIdx(i), 2000 * i),
      );
    }
    timers.push(
      window.setTimeout(
        () => setPhase("finale"),
        2000 * VILLAGE_BOSSES.length + 1000,
      ),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase]);

  // ── Typewriter for the Unraveller's taunt during the minions reveal.
  // Starts 400ms after the minions phase begins so the first minion has
  // just started fading in when the line lands. Cleaned up on phase
  // change so it never leaks into the finale.
  useEffect(() => {
    if (phase !== "minions" && phase !== "finale") {
      setMinionTypedText("");
      return;
    }
    // Only type on minions phase; keep the final text visible through
    // the finale so the villain's line still reads while the CTA
    // appears underneath.
    if (phase === "finale") return;
    let i = 0;
    setMinionTypedText("");
    // Match the main-speech typewriter pace (34→55ms per char) and give
    // the villain a longer beat (400→800ms) before the taunt starts so
    // the first minion has settled in the frame first.
    const kick = window.setTimeout(() => {
      const id = window.setInterval(() => {
        i += 1;
        setMinionTypedText(MINIONS_SPEECH_LINE.slice(0, i));
        if (i >= MINIONS_SPEECH_LINE.length) window.clearInterval(id);
      }, 55);
      // Store on window so the cleanup below can clear it.
      (window as unknown as { __unravellerTauntTimer?: number }).__unravellerTauntTimer = id;
    }, 800);
    return () => {
      window.clearTimeout(kick);
      const stored = (window as unknown as {
        __unravellerTauntTimer?: number;
      }).__unravellerTauntTimer;
      if (typeof stored === "number") window.clearInterval(stored);
    };
  }, [phase]);

  // ── Ambient sting on first reveal ─────────────────────────────────
  useEffect(() => {
    if (phase === "main-reveal") {
      try {
        audioManager.playUI("hover");
      } catch {
        /* audio not critical */
      }
    }
  }, [phase]);

  const handleDismiss = useCallback(() => {
    setPhase("leaving");
    // Fire the mutation without awaiting — even if the network hiccups,
    // we don't want the user stuck watching the intro.
    void markSeen({}).catch(() => {
      /* no-op */
    });
    window.setTimeout(() => onDone(), 550);
  }, [markSeen, onDone]);

  // handleSkip removed — the top-right SKIP affordance was pulled per
  // product request. Users advance only via the "Face them" CTA at the
  // end of the cinematic so the villain's speech isn't bypassable.

  return (
    <AnimatePresence>
      {phase !== "leaving" && (
        <motion.div
          key="boss-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-[200] overflow-hidden"
          // Marker attribute so Sparky (Step3MapGuide) can detect the
          // cinematic is up and swap its speech to the villain-intro
          // copy instead of the combat prompt.
          data-boss-intro="active"
          // Sub-marker: TRUE while the boss is actively speaking (intro
          // monologue or the minion-reveal taunt). Step3MapGuide reads
          // this and hides Sparky's bubble so the two speakers don't
          // overlap. Flips to false during the `finale` phase — that's
          // when Sparky steps in with "You're about to face…".
          data-boss-speaking={
            phase === "main-speech" || phase === "minions" ? "true" : "false"
          }
          style={{
            background:
              "radial-gradient(ellipse 90% 65% at 50% 50%, #1a0616 0%, #08030f 55%, #000000 100%)",
            fontFamily: "var(--font-sans)",
            color: "#f6f4fa",
          }}
        >

          {/* Red pulse behind the boss — scaled down on mobile so it
              doesn't wash the whole screen red on small viewports.
              Follows the same top-[42%] mobile position as the boss
              sprite so the glow stays centered on it. */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] sm:top-[42%] sm:h-[720px] sm:w-[720px]"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={
              phase === "curtain"
                ? { opacity: 0, scale: 0.5 }
                : { opacity: 0.55, scale: 1 }
            }
            transition={{ duration: 1.6, ease: "easeOut" }}
            style={{
              background:
                "radial-gradient(circle, rgba(214, 34, 90, 0.42) 0%, rgba(129, 15, 46, 0.2) 40%, transparent 70%)",
              filter: "blur(30px)",
            }}
          />

          {/* Main boss sprite — pixel-art has only a single idle frame,
              so we fake motion with an outer breathing bob (Y + scale)
              and an inner glow pulse. Feels alive without needing a
              spritesheet. Sprite scales down on mobile so the boss +
              header + minions can all coexist in portrait viewports.
              Positioned at top-[42%] on mobile to sit centered between
              the pushed-down speech bubble (top-[22%]) and the mobile
              stage strip (bottom-[26%]). */}
          <motion.div
            // Boss sprite pulled UP further per product ask
            // ("shift everything little upward so it look
            // centralised for all pc"). Desktop 38%→30% and mobile
            // 32%→28% so the boss + surrounding stack (title / bubble
            // above, minions + CTA below) reads as a vertically
            // centered composition instead of sitting mid-lower.
            className="pointer-events-none absolute left-1/2 top-[28%] -translate-x-1/2 -translate-y-1/2 sm:top-[30%]"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={
              phase === "curtain"
                ? { opacity: 0, y: 60, scale: 0.9 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              // Idle breathing loop — starts once the boss is past the
              // curtain phase. Small motion, long duration.
              animate={
                phase === "curtain"
                  ? {}
                  : { y: [0, -10, 0], scale: [1, 1.02, 1] }
              }
              transition={{
                duration: 3.4,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "loop",
              }}
              style={{ willChange: "transform" }}
            >
              <MainBossPortrait
                src={mainBossArt}
                alt={mainBossTitle}
                configuredFrameSize={mainBossFrameSize}
              />
            </motion.div>
          </motion.div>

          {/* Boss name callout — the "STAGE 1 OVERSEER" eyebrow was
              removed per product ask (was overlapping the tutorial
              progress bar + reading as redundant next to the
              per-stage cards below). Only "The Unraveller" title
              renders here now. */}
          <motion.div
            // Title HIDDEN on mobile (< sm) per product ask:
            // "FIX THE MOBILE VIEW THE CONVERSATION BOX IS OVERLAPPING
            // BOSS FACE". The giant "The Unraveller" heading was
            // colliding with the speech bubble below it. The bubble
            // already labels the speaker ("THE UNRAVELLER" chip), so
            // the redundant title only served the desktop hero
            // layout — where there's room to spare. `hidden sm:block`
            // keeps the desktop treatment intact.
            className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 px-4 text-center sm:block sm:top-[10%]"
            style={{
              top: "calc(64px + env(safe-area-inset-top, 0px))",
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={
              phase === "curtain"
                ? { opacity: 0, y: -10 }
                : { opacity: 1, y: 0 }
            }
            transition={{ duration: 0.9, delay: 0.6, ease: "easeOut" }}
          >
            <div
              className="mt-1 whitespace-nowrap text-[26px] font-black leading-none tracking-tight text-white sm:text-[42px]"
              style={{
                fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                textShadow: "0 6px 26px rgba(99, 102, 241, 0.35)",
              }}
            >
              {mainBossTitle}
            </div>
          </motion.div>

          {/* Boss chat bubble — mirrors Sparky's style but themed rose/
              black for the villain. Positioned upper-LEFT of the boss
              so the tail points diagonally down-right toward the
              Unraveller and nothing collides with the minions strip
              along the bottom. Renders the intro monologue during
              `main-speech` and the four-minions taunt during
              `minions`. Hidden entirely during `finale` — that's
              Sparky's beat. */}
          <AnimatePresence>
            {(phase === "main-speech" || phase === "minions") && (
              <motion.div
                key={
                  phase === "main-speech" ? `boss-speech-${speechIdx}` : "boss-speech-minions"
                }
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                // Mobile: sits BELOW the header and ABOVE the boss
                // sprite as a full-width bubble (tail points DOWN to
                // the boss). Pushed down slightly so there's a real
                // gap between it and the boss art below. Desktop/
                // tablet: floats upper-LEFT with a tail pointing
                // down-right toward the boss.
                // Bubble top offset dropped from top-[22%] → top-[10%]
                // on mobile now that the "The Unraveller" title above
                // is hidden. Gives the bubble the top slot cleanly
                // and puts more space between the bubble tail and
                // the boss sprite below (which sits ~mid-viewport).
                className="pointer-events-none absolute inset-x-3 top-[10%] mx-auto w-auto max-w-[420px] sm:inset-x-auto sm:left-[6%] sm:top-[24%] sm:w-[min(88vw,380px)] md:left-[8%]"
              >
                {/* Villain bubble — dark #0F1726 surface + white/8
                    border, matching every other card on the platform.
                    Speaker dot uses the platform indigo (#6366F1) so
                    the accent stays consistent with the CTA below. */}
                <div
                  className="relative rounded-[18px] border px-4 py-3 shadow-2xl sm:px-5 sm:py-4"
                  style={{
                    background: "rgba(15, 23, 38, 0.9)",
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    backdropFilter: "blur(24px)",
                    boxShadow: "0 24px 60px -18px rgba(0, 0, 0, 0.7)",
                  }}
                >
                  {/* Speaker label */}
                  <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        background: "#6366F1",
                        boxShadow: "0 0 8px rgba(99, 102, 241, 0.7)",
                      }}
                    />
                    <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#9CA3AF] sm:text-[10px] sm:tracking-[0.32em]">
                      {mainBossTitle}
                    </span>
                  </div>

                  {/* Line text */}
                  <p
                    className="text-[13px] leading-snug sm:text-[16px]"
                    style={{
                      fontFamily:
                        "'Space Grotesk', var(--font-sans), sans-serif",
                      color: "#f6f4fa",
                      textShadow: "0 1px 6px rgba(0,0,0,0.6)",
                    }}
                  >
                    {phase === "main-speech" ? typedText : minionTypedText}
                    {((phase === "main-speech" &&
                      typedText.length <
                        (MAIN_SPEECH_LINES[speechIdx]?.length ?? 0)) ||
                      (phase === "minions" &&
                        minionTypedText.length <
                          MINIONS_SPEECH_LINE.length)) && (
                      <span
                        className="ml-0.5 inline-block h-[14px] w-[2px] align-middle sm:h-[16px]"
                        style={{
                          background: "#f6f4fa",
                          animation:
                            "boss-intro-caret 0.9s steps(2) infinite",
                        }}
                      />
                    )}
                  </p>

                  {/* Bubble tail — CENTER-BOTTOM on mobile (bubble sits
                      above boss, tail points straight down). On desktop
                      the tail shifts to the right edge because the
                      bubble hangs upper-left of the boss. */}
                  {/* Tail — outer stroke uses the same white/8 border
                      as the bubble; inner fill matches the #0F1726
                      surface. */}
                  <div
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-0 w-0 sm:left-auto sm:right-8 sm:translate-x-0"
                    style={{
                      borderLeft: "10px solid transparent",
                      borderRight: "10px solid transparent",
                      borderTop: "12px solid rgba(255, 255, 255, 0.08)",
                    }}
                  />
                  <div
                    className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 h-0 w-0 sm:left-auto sm:right-[34px] sm:translate-x-0"
                    style={{
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderTop: "10px solid rgba(15, 23, 38, 0.9)",
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Minion reveal — 4 boss cards laid across the bottom */}
          <AnimatePresence>
            {(phase === "minions" || phase === "finale") && (
              <motion.div
                key="minion-strip"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                // Minion strip repositioned to sit ABOVE the Face
                // them button on mobile (~100px from bottom leaves
                // room for the 48px CTA + margin), and lifted a bit
                // on desktop so the whole composition centers rather
                // than crowding the bottom edge.
                // Mobile: mini-boss strip lifted from bottom-[110px]
                // → bottom-[130px] so there's a real gap between the
                // minion cards and the Face them CTA (which sits at
                // bottom-6 = 24px). Prevents the CTA from crowding
                // the minion labels.
                // Desktop: dropped from sm:bottom-[22%] → sm:bottom-[28%]
                // to lift the whole composition off the baseline and
                // pack title/boss/minions/CTA into a centered stack
                // (product ask: "shift everything little upward so it
                // look centralised for all pc").
                className="pointer-events-none absolute bottom-[130px] left-1/2 flex w-[calc(100vw-12px)] max-w-full -translate-x-1/2 justify-center gap-2 px-1 sm:bottom-[28%] sm:w-auto sm:gap-4 sm:px-0"
              >
                {VILLAGE_BOSSES.map((boss, i) => {
                  const revealed = i <= minionIdx || phase === "finale";
                  return (
                    <motion.div
                      key={boss.name}
                      animate={
                        revealed
                          ? { opacity: 1, scale: 1, y: 0 }
                          : { opacity: 0, scale: 0.7, y: 40 }
                      }
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                      // Mobile card ~82px wide (was 74px) so labels
                      // like "Forest of Perfectionism" have room to
                      // break onto 2 lines cleanly instead of getting
                      // squeezed. Four cards × 82 + 3 × 8 gap = 352px,
                      // still fits inside a 360px viewport.
                      className="flex w-[82px] flex-col items-center gap-1 sm:w-[148px] sm:gap-2"
                    >
                      {/* Minion card — repalatted from rose-tinted to
                          the platform's #0F1726 surface + white/8
                          border so it matches the feed card visual
                          language. */}
                      <div
                        className="relative flex h-[64px] w-[64px] items-center justify-center rounded-xl sm:h-[108px] sm:w-[108px] sm:rounded-2xl"
                        style={{
                          background: "rgba(15, 23, 38, 0.85)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          boxShadow: "0 8px 24px -8px rgba(0, 0, 0, 0.5)",
                        }}
                      >
                        {/* Some village boss idles (Fog, Chimera, Automaton,
                            Wraith) are now 9-frame Pixellab spritesheets
                            (828×92) — rendering them as plain <img>
                            would show all 9 frames strung out. Detect
                            by folder path and paint as a background
                            clipped to frame 0. */}
                        {(
                          boss.idleAsset.includes("/village/fog/idle.png") ||
                          boss.idleAsset.includes("/village/chimera/idle.png") ||
                          boss.idleAsset.includes("/village/automaton/idle.png") ||
                          boss.idleAsset.includes("/village/wraith/idle.png")
                        ) ? (
                          <div
                            role="img"
                            aria-label={boss.name}
                            style={{
                              // Match the visible-boss sizing (~78% of the
                              // parent card).
                              width: "78%",
                              paddingTop: "78%", // square aspect
                              position: "relative",
                              imageRendering: "pixelated",
                              filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.6))",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                backgroundImage: `url(${boss.idleAsset})`,
                                backgroundRepeat: "no-repeat",
                                // Sheet is 9 frames × 92px = 828px wide,
                                // 92px tall. Scale so one frame fills the
                                // box: sheet 9× as wide as displayed.
                                backgroundSize: "900% 100%",
                                backgroundPosition: "0 50%",
                              }}
                            />
                          </div>
                        ) : (
                          <img
                            src={boss.idleAsset}
                            alt={boss.name}
                            style={{
                              maxWidth: "78%",
                              maxHeight: "78%",
                              imageRendering: "pixelated",
                              objectFit: "contain",
                              filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.6))",
                            }}
                            draggable={false}
                          />
                        )}
                        {i === minionIdx && phase === "minions" && (
                          <motion.div
                            className="absolute -inset-1 rounded-xl border-2 sm:rounded-2xl"
                            style={{ borderColor: "rgba(99, 102, 241, 0.55)" }}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 1.2 }}
                          />
                        )}
                      </div>
                      {/* Label swapped from BOSS name → STAGE name
                          per product ask ("use stage name instead of
                          boss name"). Each of the 4 mini-boss cards
                          in this cinematic previews the corresponding
                          venture stage the user will progress
                          through, so surfacing the biome / stage name
                          ("The Village", "The Forest", "The Arena",
                          "The Artisan's Quarter") reads as a roadmap
                          preview rather than "here are four bosses
                          named X, Y, Z, W". */}
                      {/* Card label — actual stage FUNCTION name
                          (Ideation / Research / Validation / Offer
                          Design) on top, and the boss name below.
                          Previous rev used the biome name ("The
                          Village") on top; product ask: use the
                          real stage name up top and the boss name
                          on the bottom. */}
                      <div className="text-center">
                        <div className="text-[7px] font-bold uppercase tracking-wider text-[#9CA3AF] sm:text-[9px] sm:tracking-widest">
                          {VENTURE_STAGE_FUNCTION_NAMES[i] ?? `Stage ${i + 1}`}
                        </div>
                        <div className="mt-0.5 text-[9px] font-bold leading-tight text-white/95 sm:text-[12px]">
                          {boss.name}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Finale CTA — button only. On mobile the CTA lifts well
              above the bottom edge so it doesn't get eclipsed by
              Sparky's full-width mobile bubble (which docks at the
              viewport bottom). On desktop Sparky sits in the corner so
              the CTA can hug the bottom. */}
          <AnimatePresence>
            {phase === "finale" && (
              <motion.div
                key="finale-cta"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                // Face them CTA now sits BELOW the minion strip on
                // mobile (`bottom-6`, same as desktop) per product
                // ask: "for mobile view of this screen keep face
                // them button below the mini bosses". The old
                // `bottom-[260px]` placement landed the button in the
                // middle of the boss art / above the minions.
                // Mobile: bottom-6 (24px) — sits comfortably below
                // the minion strip (which is at bottom-[130px]).
                // Desktop: bumped from sm:bottom-10 → sm:bottom-[12%]
                // so it lifts off the very bottom of the viewport and
                // stays inside the centered stack alongside the
                // minions (which moved to sm:bottom-[28%]).
                className="absolute inset-x-0 bottom-6 z-[210] flex flex-col items-center gap-3 sm:bottom-[12%]"
              >
                {/* CTA re-styled to match the platform's primary
                    indigo action (same treatment as Post Idea,
                    Send Request, and the CheckpointPanel Advance
                    button). Was a peach/pink/violet gradient with
                    a right-arrow suffix — both replaced per
                    product ask ("make the color combo similar to
                    the platform, also remove arrow"). */}
                <motion.button
                  onClick={handleDismiss}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="pointer-events-auto rounded-[12px] px-8 py-3 text-[13px] font-semibold text-white sm:px-10 sm:text-sm"
                  style={{
                    background: "#6366F1",
                    border: "1px solid rgba(99, 102, 241, 0.5)",
                    boxShadow: "0 12px 32px -10px rgba(99, 102, 241, 0.55)",
                  }}
                >
                  Face them
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <style jsx>{`
            @keyframes boss-intro-caret {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MainBossPortrait
// ─────────────────────────────────────────────────────────────────────
/**
 * Renders the huge boss silhouette in the center of the intro
 * cinematic. Two render paths, chosen automatically:
 *
 *   1. SPRITESHEET (auto-detected) — when the naturalWidth of the
 *      loaded image is > naturalHeight, treat the asset as a
 *      horizontal N-frame sheet where `N = round(width / height)`.
 *      Clip to frame 0 via CSS `background-position`. This is what
 *      the super-pool Pixellab exports look like (e.g. Tide Caller
 *      1476×164 = 9 × 164). Runtime detection means we no longer
 *      depend on the caller passing `configuredFrameSize` correctly.
 *
 *   2. SINGLE-FRAME — when the image is square (or nearly so),
 *      render as a plain `<img>` with `object-fit: contain`. Used
 *      for Unraveller's legacy single-frame silhouette and any other
 *      boss whose idle asset is a portrait.
 *
 * A configured frame size (from SUPER_BOSS_POOL config) still wins
 * over auto-detection when passed — lets us handle sheets whose
 * per-frame square doesn't match the natural height (rare, but
 * possible if the sheet is 828×92 with frameCount=4 override).
 *
 * Product ask (2026-08-18, "one and big for all superbosses like
 * unraveller take deep analysis"): making the auto-detection the
 * default means no super boss can accidentally render as a stretched
 * row of 9 mini-copies just because a config value is missing —
 * every rolled super now shows one big silhouette.
 */
function MainBossPortrait({
  src,
  alt,
  configuredFrameSize,
}: {
  src: string;
  alt: string;
  configuredFrameSize?: { frameWidth: number; frameHeight: number; frameCount: number };
}) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    // Reset on src change so a stale prior boss's dims can't leak.
    setDims(null);
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (cancelled) return;
      setDims({ w: probe.naturalWidth, h: probe.naturalHeight });
    };
    probe.onerror = () => {
      if (cancelled) return;
      // Fall through to single-frame path with dummy dims.
      setDims({ w: 200, h: 200 });
    };
    probe.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Resolve frame count: configured wins; else auto-detect from
  // naturalWidth / naturalHeight (round to nearest whole frame so a
  // sheet 1476/164=9.0 becomes 9 exactly, and near-square 92×92
  // becomes 1).
  let frameCount = 1;
  if (configuredFrameSize && configuredFrameSize.frameCount > 0) {
    frameCount = configuredFrameSize.frameCount;
  } else if (dims && dims.h > 0) {
    const ratio = dims.w / dims.h;
    frameCount = Math.max(1, Math.round(ratio));
  }

  const isSheet = frameCount > 1;
  const filter =
    "drop-shadow(0 24px 40px rgba(0,0,0,0.75)) drop-shadow(0 0 30px rgba(214, 34, 90, 0.35))";
  const sizeClass = "h-[200px] w-[200px] sm:h-[340px] sm:w-[340px]";

  // Both paths hidden until dims settle so we never show the
  // stretched-sheet flash the first time this component mounts.
  const visibility: "hidden" | "visible" = dims ? "visible" : "hidden";

  if (isSheet) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={sizeClass}
        style={{
          backgroundImage: `url(${src})`,
          // Sheet is `frameCount` frames wide × 1 frame tall. Sizing
          // to (N × 100%, 100%) makes each frame fill the full box;
          // backgroundPosition "0 50%" pins to frame 0.
          backgroundSize: `${frameCount * 100}% 100%`,
          backgroundPosition: "0 50%",
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
          filter,
          visibility,
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={sizeClass}
      style={{
        imageRendering: "pixelated",
        filter,
        objectFit: "contain",
        visibility,
      }}
      draggable={false}
    />
  );
}
