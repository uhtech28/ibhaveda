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
import { audioManager } from "@/lib/audio/audioManager";

interface Props {
  /** Called after the cinematic has been fully dismissed. */
  onDone: () => void;
}

type Phase =
  | "curtain"        // 0-500ms — black scrim fades in
  | "main-reveal"    // 500-2500ms — Unraveller rises from shadow
  | "main-speech"    // 2500ms+ — typed speech from the main boss
  | "minions"        // reveals CP bosses one by one
  | "finale"         // "Face them, founder." + Continue button
  | "leaving";       // fade out on dismiss

const MAIN_BOSS_ART = "/assets/bosses/village/unraveller/idle.png";

// Speech that plays during the `main-speech` phase — Unraveller intro
// lines BEFORE the minions are revealed. Kept intentionally short so
// the pacing stays cinematic.
const MAIN_SPEECH_LINES = [
  "So, you dare to dream of something new.",
  "I am the Unraveller. I feed on every doubt you have yet to name.",
];

// Speech that plays over the minions reveal — the Unraveller taunts
// while his four servants materialise beneath him. Split into a
// dedicated line so it lands on the minion strip rather than being
// buried in the intro monologue.
const MINIONS_SPEECH_LINE =
  "You'll have to defeat my four minions before you can reach me.";

export function BossIntroCinematic({ onDone }: Props) {
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
  useEffect(() => {
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase("main-reveal"), 350));
    timers.push(window.setTimeout(() => setPhase("main-speech"), 2100));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  // ── Typewriter for main speech ────────────────────────────────────
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
        }, 1400);
      }
    }, 34);
    return () => window.clearInterval(id);
  }, [phase, speechIdx]);

  // ── Minion reveal sequence ────────────────────────────────────────
  useEffect(() => {
    if (phase !== "minions") return;
    setMinionIdx(0);
    const timers: number[] = [];
    for (let i = 1; i < VILLAGE_BOSSES.length; i++) {
      timers.push(
        window.setTimeout(() => setMinionIdx(i), 1400 * i),
      );
    }
    timers.push(
      window.setTimeout(
        () => setPhase("finale"),
        1400 * VILLAGE_BOSSES.length + 600,
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
    const kick = window.setTimeout(() => {
      const id = window.setInterval(() => {
        i += 1;
        setMinionTypedText(MINIONS_SPEECH_LINE.slice(0, i));
        if (i >= MINIONS_SPEECH_LINE.length) window.clearInterval(id);
      }, 34);
      // Store on window so the cleanup below can clear it.
      (window as unknown as { __unravellerTauntTimer?: number }).__unravellerTauntTimer = id;
    }, 400);
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
              doesn't wash the whole screen red on small viewports. */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-[32%] -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] sm:top-[42%] sm:h-[720px] sm:w-[720px]"
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
              header + minions can all coexist in portrait viewports. */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 sm:top-[45%]"
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
              <img
                src={MAIN_BOSS_ART}
                alt="The Unraveller"
                className="h-[200px] w-[200px] sm:h-[340px] sm:w-[340px]"
                style={{
                  imageRendering: "pixelated",
                  // Layered drop-shadow gives him a pulsing rose halo —
                  // the outer glow ramps via the surrounding radial
                  // pulse element already in place.
                  filter:
                    "drop-shadow(0 24px 40px rgba(0,0,0,0.75)) drop-shadow(0 0 30px rgba(214, 34, 90, 0.35))",
                  objectFit: "contain",
                }}
                draggable={false}
              />
            </motion.div>
          </motion.div>

          {/* Boss name callout — tighter tracking + smaller font on
              mobile so "The Unraveller" fits on a single line and the
              header doesn't blow through the boss sprite. */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-[10%] -translate-x-1/2 px-4 text-center sm:top-[18%]"
            initial={{ opacity: 0, y: -10 }}
            animate={
              phase === "curtain"
                ? { opacity: 0, y: -10 }
                : { opacity: 1, y: 0 }
            }
            transition={{ duration: 0.9, delay: 0.6, ease: "easeOut" }}
          >
            <div className="text-[9px] font-bold uppercase tracking-[0.34em] text-rose-300/70 sm:text-[10px] sm:tracking-[0.5em]">
              Stage 1 Overseer
            </div>
            <div
              className="mt-1 whitespace-nowrap text-[26px] font-black leading-none tracking-tight sm:text-[42px]"
              style={{
                fontFamily: "'Space Grotesk', var(--font-sans), sans-serif",
                background:
                  "linear-gradient(180deg, #ffe0eb 0%, #e2739a 55%, #a4123f 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 6px 26px rgba(214,34,90,0.35)",
              }}
            >
              The Unraveller
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
                // the boss). Desktop/tablet: floats upper-LEFT with a
                // tail pointing down-right toward the boss.
                className="pointer-events-none absolute inset-x-3 top-[19%] mx-auto w-auto max-w-[420px] sm:inset-x-auto sm:left-[6%] sm:top-[24%] sm:w-[min(88vw,380px)] md:left-[8%]"
              >
                <div
                  className="relative rounded-2xl border px-4 py-3 shadow-2xl sm:px-5 sm:py-4"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(28,10,22,0.98) 0%, rgba(14,4,12,0.98) 100%)",
                    borderColor: "rgba(214,34,90,0.45)",
                    boxShadow:
                      "0 24px 60px -18px rgba(214,34,90,0.55), 0 0 30px rgba(214,34,90,0.15) inset",
                  }}
                >
                  {/* Speaker label */}
                  <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        background: "#e2739a",
                        boxShadow: "0 0 8px rgba(214,34,90,0.7)",
                      }}
                    />
                    <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-rose-300/85 sm:text-[10px] sm:tracking-[0.32em]">
                      The Unraveller
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
                  <div
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-0 w-0 sm:left-auto sm:right-8 sm:translate-x-0"
                    style={{
                      borderLeft: "10px solid transparent",
                      borderRight: "10px solid transparent",
                      borderTop: "12px solid rgba(214,34,90,0.45)",
                    }}
                  />
                  <div
                    className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 h-0 w-0 sm:left-auto sm:right-[34px] sm:translate-x-0"
                    style={{
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderTop: "10px solid rgba(14,4,12,0.98)",
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
                // Mobile: tighter gap, lifted higher (bottom-[24%]) so
                // it never crowds Sparky's bottom-right slot. Desktop
                // keeps original spacing.
                className="pointer-events-none absolute bottom-[24%] left-1/2 flex w-[calc(100vw-16px)] max-w-full -translate-x-1/2 justify-center gap-1.5 px-2 sm:bottom-[16%] sm:w-auto sm:gap-4 sm:px-0"
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
                      // Mobile card ~72px wide so all four fit in a
                      // 360px viewport with small gaps; desktop keeps
                      // the roomy 148px layout.
                      className="flex w-[74px] flex-col items-center gap-1 sm:w-[148px] sm:gap-2"
                    >
                      <div
                        className="relative flex h-[64px] w-[64px] items-center justify-center rounded-xl sm:h-[108px] sm:w-[108px] sm:rounded-2xl"
                        style={{
                          background:
                            "linear-gradient(150deg, rgba(214,34,90,0.18), rgba(15,5,25,0.6))",
                          border: "1px solid rgba(255,255,255,0.12)",
                          boxShadow:
                            "0 12px 32px -12px rgba(0,0,0,0.7), inset 0 0 24px rgba(214,34,90,0.15)",
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
                            className="absolute -inset-1 rounded-xl border-2 border-rose-400/50 sm:rounded-2xl"
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 1.2 }}
                          />
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-[7px] font-bold uppercase tracking-wider text-rose-300/60 sm:text-[9px] sm:tracking-widest">
                          Stage {i + 1}
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
                className="absolute inset-x-0 bottom-[260px] z-[210] flex flex-col items-center gap-3 sm:bottom-6"
              >
                <motion.button
                  onClick={handleDismiss}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="pointer-events-auto rounded-full px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-white sm:px-8 sm:text-[13px] sm:tracking-[0.28em]"
                  style={{
                    background:
                      "linear-gradient(115deg, #f0b25e 0%, #e2739a 45%, #8f5ce8 100%)",
                    boxShadow:
                      "0 18px 40px -14px rgba(226,115,154,0.6), inset 0 0 16px rgba(255,255,255,0.15)",
                  }}
                >
                  Face them →
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
