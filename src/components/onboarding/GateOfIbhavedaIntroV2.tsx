"use client";

/**
 * GateOfIbhavedaIntroV2 — post-signup "Gate of Ibhaveda" cinematic.
 *
 * Faithful implementation of the creative brief in
 * `ibhaveda-onboarding-intro-doc.pdf`. Total runtime ≈ 23.6s.
 *
 * BEAT MAP (absolute times from t=0)
 *
 *   1.  Materialize        0.0 – 2.3s    scattered light dots snap into
 *                                        the outline of a tall double gate
 *   2.  Doors Open         2.3 – 3.9s    the two door halves swing apart,
 *                                        light spills through the seam
 *   2B. Through the Gate   3.9 – 5.5s    camera pushes at the gap; the
 *                                        stone frame parallaxes off-screen,
 *                                        bright flash at the threshold
 *   3.  Flythrough Corr.   5.5 – 9.5s    stone corridor with columns and
 *                                        torches parallaxing past
 *   4.  Arrive, Throne     9.5 – 11.5s   camera decelerates hard into a
 *                                        wide throne-room space, holds
 *   5.  Tilt Down         11.5 – 13.7s   camera pitches straight down onto
 *                                        a table with a rolled parchment
 *   6.  Unroll            13.7 – 17.5s   parchment unrolls, revealing a
 *                                        pixel-art medieval map
 *   7.  Reveal & Hold     17.5 – 23.6s   "Welcome to the Land of Ibhaveda"
 *                                        + wax-seal Continue stamp
 *
 * Interaction:
 *   - Tap Continue at ANY point after Beat 1 to skip ahead.
 *   - If ignored, auto-dismisses ~600ms after the Reveal beat ends.
 *
 * Visual fidelity note (per brief §6):
 *   Timing/staging/camera moves here are close-to-final. The pixel-art
 *   surfaces (gate, corridor stones, throne, parchment, map) are still
 *   placeholder geometry rendered with SVG + CSS in the brand palette.
 *   Swap them for real sprite sequences / Lottie / a WebM without
 *   changing the beat clock.
 *
 * Audio note (per brief §6):
 *   The spec calls for a composed 8-bit fantasy score with sync points at
 *   each beat (creak → whoosh → chord → arpeggio → descending motif →
 *   paper rustle → fanfare/stamp). This component fires `onBeat(beat)`
 *   at every transition so a caller can play cues from wherever they
 *   store audio (Howler, native <audio>, whatever). Nothing is loaded
 *   here — no missing-asset noise if audio isn't ready yet.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ────────────────────────────────────────────────────────────────────────
// Timing (ms, absolute from t=0). Sourced verbatim from the brief.
// ────────────────────────────────────────────────────────────────────────
const T_MATERIALIZE_END = 2_300;
const T_DOORS_OPEN_END = 3_900;
const T_THRESHOLD_END = 5_500;
const T_CORRIDOR_END = 9_500;
const T_THRONE_END = 11_500;
const T_TILT_END = 13_700;
const T_UNROLL_END = 17_500;
const T_REVEAL_END = 23_600;

// Grace window at the tail: sit on the Continue button briefly before
// auto-dismissing so a slow reader can still tap it.
const T_AUTO_DISMISS_AFTER_REVEAL = 800;

// Brand palette. Kept in one place so the whole cinematic can be
// re-tinted from a single edit if brand identity shifts.
const COLOR = {
  bg: "#05070E",
  navy: "#0B1027",
  purple: "#4A1E9E",
  purpleGlow: "#8B5CF6",
  gold: "#F5C542",
  goldGlow: "#FFE180",
  pink: "#F472B6",
  stone: "#3F3A38",
  stoneLight: "#5A5450",
  parchment: "#E8D7A8",
  parchmentDark: "#B49760",
  ink: "#3A2A18",
} as const;

// ────────────────────────────────────────────────────────────────────────
// Beat state machine
// ────────────────────────────────────────────────────────────────────────
export type GateIntroBeat =
  | "materialize"
  | "doors-open"
  | "through-doorway"
  | "corridor"
  | "throne-room"
  | "tilt-down"
  | "unroll"
  | "reveal"
  | "leaving";

interface Props {
  /** Fired after the intro fully dismisses (auto or user Continue). */
  onDone: () => void;
  /**
   * Optional beat-transition hook. Every state change calls this once,
   * so the caller can play its own audio cues (creak on doors-open,
   * whoosh at threshold, chord in throne-room, rustle on unroll, etc.)
   * without this component owning any audio files.
   */
  onBeat?: (beat: GateIntroBeat) => void;
  /**
   * Escape hatch for the very rare case a caller wants a shorter or
   * longer hold at the reveal beat. Defaults to the brief's 23.6s spec.
   */
  totalRuntimeMs?: number;
}

// ────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────
export function GateOfIbhavedaIntroV2({
  onDone,
  onBeat,
  totalRuntimeMs = T_REVEAL_END,
}: Props) {
  const [beat, setBeat] = useState<GateIntroBeat>("materialize");
  const doneFiredRef = useRef(false);

  // Notify caller on every beat change (including the initial mount so
  // they can start Beat-1 ambient audio).
  useEffect(() => {
    try {
      onBeat?.(beat);
    } catch {
      /* audio should never crash the cinematic */
    }
  }, [beat, onBeat]);

  // Schedule every beat transition as an absolute-time timer so the
  // sequence stays glued to the clock even if one beat's render runs
  // slightly long. All timers cleaned up on unmount.
  useEffect(() => {
    const timers: number[] = [];
    const at = (t: number, next: GateIntroBeat) => {
      timers.push(window.setTimeout(() => setBeat(next), t));
    };
    at(T_MATERIALIZE_END, "doors-open");
    at(T_DOORS_OPEN_END, "through-doorway");
    at(T_THRESHOLD_END, "corridor");
    at(T_CORRIDOR_END, "throne-room");
    at(T_THRONE_END, "tilt-down");
    at(T_TILT_END, "unroll");
    at(T_UNROLL_END, "reveal");
    // Auto-dismiss shortly after the Reveal beat ends.
    at(totalRuntimeMs, "leaving");
    timers.push(
      window.setTimeout(() => {
        if (doneFiredRef.current) return;
        doneFiredRef.current = true;
        try {
          onDone();
        } catch {
          /* no-op */
        }
      }, totalRuntimeMs + T_AUTO_DISMISS_AFTER_REVEAL),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [onDone, totalRuntimeMs]);

  const handleContinue = useCallback(() => {
    // Guard: don't allow skip during the first materialize beat — the
    // brief specifically says "make them feel like they've arrived
    // somewhere real". Instant-skip at t=0.5s undermines that.
    if (beat === "materialize") return;
    setBeat("leaving");
    window.setTimeout(() => {
      if (doneFiredRef.current) return;
      doneFiredRef.current = true;
      try {
        onDone();
      } catch {
        /* no-op */
      }
    }, 500);
  }, [beat, onDone]);

  // ── Derived staging flags ─────────────────────────────────────────────
  const showMaterialize = beat === "materialize";
  const gateOutlineDrawn = beat !== "materialize";
  const doorsSwung = ["doors-open", "through-doorway"].includes(beat);
  const pushingThrough = beat === "through-doorway";
  const inCorridor = beat === "corridor";
  const inThrone =
    beat === "throne-room" ||
    beat === "tilt-down" ||
    beat === "unroll" ||
    beat === "reveal";
  const tilted = beat === "tilt-down" || beat === "unroll" || beat === "reveal";
  const mapOpen = beat === "unroll" || beat === "reveal";
  const revealed = beat === "reveal";

  // Camera scale for the "push through the gate" moment (Beat 2B).
  // Ease curve chosen to match the "camera behaves like a camera" note:
  // slow start, quick pull-through, decelerate as we exit into the
  // corridor.
  const sceneScale = pushingThrough ? 3.6 : 1;
  const sceneTransition = pushingThrough
    ? {
        duration: (T_THRESHOLD_END - T_DOORS_OPEN_END) / 1000,
        ease: [0.65, 0, 0.35, 1] as const,
      }
    : { duration: 0.7, ease: [0.4, 0, 0.2, 1] as const };

  // Whether the Continue stamp/wax-seal is interactable.
  const continueVisible = beat !== "materialize" && beat !== "leaving";
  const continueEnabled = beat !== "materialize";

  return (
    <AnimatePresence>
      {beat !== "leaving" && (
        <motion.div
          key="gate-intro-v2"
          role="dialog"
          aria-label="Welcome to Ibhaveda"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] overflow-hidden bg-black"
          style={{
            imageRendering: "pixelated",
            fontFamily:
              "var(--font-pixel-display, 'Press Start 2P'), ui-monospace, monospace",
          }}
        >
          {/* ── Scene wrapper — carries the camera-push scale ──────────── */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: sceneScale }}
            transition={sceneTransition}
            style={{ transformOrigin: "50% 50%" }}
          >
            <Beat1_Materialize visible={showMaterialize} />

            <Beat2_Gate
              visible={
                gateOutlineDrawn &&
                (beat === "doors-open" || beat === "through-doorway")
              }
              doorsSwung={doorsSwung}
              pushingThrough={pushingThrough}
            />

            <Beat3_Corridor visible={inCorridor} />

            <Beat4_ThroneRoom visible={inThrone} tilted={tilted} />

            <Beat5_TableAndScroll
              visible={tilted}
              unrolled={mapOpen}
            />

            <Beat6_Map visible={mapOpen} revealed={revealed} />
          </motion.div>

          {/* ── Threshold flash — full-screen white pop at Beat 2B ─────── */}
          <ThresholdFlash active={pushingThrough} />

          {/* ── Title + Continue (Beat 7) ──────────────────────────────── */}
          <RevealOverlay
            visible={revealed}
            onContinue={handleContinue}
            continueEnabled={continueEnabled}
          />

          {/* ── Ambient vignette + film-grain for cinematic feel ───────── */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)",
            }}
          />

          {/* Skip hint — only appears once the user could actually use it */}
          {continueVisible && !revealed && (
            <button
              type="button"
              onClick={handleContinue}
              disabled={!continueEnabled}
              className="absolute bottom-6 right-6 z-[10000] rounded-md border border-white/20 bg-black/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 backdrop-blur transition hover:border-white/40 hover:bg-black/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: "inherit" }}
            >
              Skip ▸
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BEAT 1 — Materialize: scattered light points ignite, converge, snap.
// ─────────────────────────────────────────────────────────────────────────
function Beat1_Materialize({ visible }: { visible: boolean }) {
  // Deterministic scatter of ~40 dots. Seeded so their positions don't
  // reshuffle on re-render. Each dot has an ignition delay and a target
  // position on the gate outline so they "snap into shape" together.
  const dots = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        // Pseudo-random via a cheap hash so rerenders are stable.
        const seed = (i * 9301 + 49297) % 233280;
        const rand = (n: number) => ((seed * (n + 1)) % 1000) / 1000;
        const startX = 20 + rand(1) * 60; // % of viewport
        const startY = 15 + rand(2) * 70;
        // Target position along the tall gate outline (approx rectangle).
        const t = i / 44;
        const perim = t * 4;
        let tx = 50;
        let ty = 50;
        if (perim < 1) {
          tx = 42;
          ty = 20 + perim * 60;
        } else if (perim < 2) {
          tx = 42 + (perim - 1) * 16;
          ty = 80;
        } else if (perim < 3) {
          tx = 58;
          ty = 80 - (perim - 2) * 60;
        } else {
          tx = 58 - (perim - 3) * 16;
          ty = 20;
        }
        return {
          id: i,
          startX,
          startY,
          tx,
          ty,
          igniteDelay: rand(3) * 1.4, // 0-1.4s stagger
          hue: i % 3 === 0 ? COLOR.gold : COLOR.purpleGlow,
        };
      }),
    [],
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="materialize"
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          {dots.map((d) => (
            <motion.div
              key={d.id}
              initial={{
                left: `${d.startX}%`,
                top: `${d.startY}%`,
                opacity: 0,
                scale: 0.4,
              }}
              animate={{
                left: `${d.tx}%`,
                top: `${d.ty}%`,
                opacity: [0, 1, 1, 1],
                scale: [0.4, 1.4, 1, 1],
              }}
              transition={{
                left: {
                  duration: 1.4,
                  delay: d.igniteDelay + 0.6,
                  ease: [0.5, 0, 0.4, 1],
                },
                top: {
                  duration: 1.4,
                  delay: d.igniteDelay + 0.6,
                  ease: [0.5, 0, 0.4, 1],
                },
                opacity: { duration: 0.6, delay: d.igniteDelay },
                scale: { duration: 0.6, delay: d.igniteDelay },
              }}
              className="absolute"
              style={{
                width: 6,
                height: 6,
                borderRadius: 1, // slightly pixel-y square dot
                background: d.hue,
                boxShadow: `0 0 8px ${d.hue}, 0 0 20px ${d.hue}`,
              }}
            />
          ))}
          {/* Soft ambient pad — a low purple wash that grows underneath */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ duration: 2, delay: 0.3 }}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${COLOR.purple}44 0%, transparent 60%)`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BEAT 2 / 2B — Gate: solid door outline forms, doors swing apart, camera
// pushes through the gap.
// ─────────────────────────────────────────────────────────────────────────
function Beat2_Gate({
  visible,
  doorsSwung,
  pushingThrough,
}: {
  visible: boolean;
  doorsSwung: boolean;
  pushingThrough: boolean;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.svg
          key="gate"
          viewBox="0 0 400 600"
          className="absolute h-[min(90vh,720px)] w-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: pushingThrough ? [1, 1, 0] : 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          transition={{
            duration: pushingThrough ? 1.6 : 0.6,
            times: pushingThrough ? [0, 0.8, 1] : undefined,
          }}
          style={{
            imageRendering: "pixelated",
            filter:
              "drop-shadow(0 0 24px rgba(139, 92, 246, 0.55)) drop-shadow(0 0 60px rgba(245, 197, 66, 0.35))",
          }}
        >
          {/* Stone gate frame — pixel-y block */}
          <rect x="20" y="10" width="360" height="580" fill={COLOR.stone} />
          <rect x="30" y="20" width="340" height="560" fill={COLOR.navy} />
          {/* Frame accents */}
          <rect x="20" y="10" width="360" height="14" fill={COLOR.stoneLight} />
          <rect x="20" y="576" width="360" height="14" fill={COLOR.stoneLight} />
          {/* Frame stone bricks — sketchy pixel look */}
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={`bl-${i}`}
              x={20}
              y={30 + i * 46}
              width={12}
              height={4}
              fill={COLOR.stoneLight}
              opacity={0.6}
            />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={`br-${i}`}
              x={368}
              y={30 + i * 46}
              width={12}
              height={4}
              fill={COLOR.stoneLight}
              opacity={0.6}
            />
          ))}

          {/* LEFT door leaf */}
          <motion.g
            initial={{ rotateY: 0 }}
            animate={{ rotateY: doorsSwung ? -78 : 0 }}
            transition={{
              duration: (T_DOORS_OPEN_END - T_MATERIALIZE_END) / 1000,
              ease: [0.7, 0, 0.3, 1],
            }}
            style={{ transformOrigin: "30px 300px", transformBox: "fill-box" }}
          >
            <rect x="30" y="20" width="170" height="560" fill={COLOR.purple} />
            {/* wood-plank striations */}
            {Array.from({ length: 6 }).map((_, i) => (
              <rect
                key={`lp-${i}`}
                x={40}
                y={30 + i * 92}
                width={150}
                height={2}
                fill={COLOR.navy}
                opacity={0.6}
              />
            ))}
            {/* iron studs */}
            {Array.from({ length: 12 }).map((_, i) => (
              <rect
                key={`ls-${i}`}
                x={i % 2 === 0 ? 46 : 172}
                y={40 + Math.floor(i / 2) * 90}
                width={10}
                height={10}
                fill={COLOR.gold}
              />
            ))}
            {/* gold ring handle */}
            <circle
              cx="180"
              cy="300"
              r="14"
              fill="none"
              stroke={COLOR.gold}
              strokeWidth="4"
            />
          </motion.g>

          {/* RIGHT door leaf */}
          <motion.g
            initial={{ rotateY: 0 }}
            animate={{ rotateY: doorsSwung ? 78 : 0 }}
            transition={{
              duration: (T_DOORS_OPEN_END - T_MATERIALIZE_END) / 1000,
              ease: [0.7, 0, 0.3, 1],
            }}
            style={{ transformOrigin: "370px 300px", transformBox: "fill-box" }}
          >
            <rect x="200" y="20" width="170" height="560" fill={COLOR.purple} />
            {Array.from({ length: 6 }).map((_, i) => (
              <rect
                key={`rp-${i}`}
                x={210}
                y={30 + i * 92}
                width={150}
                height={2}
                fill={COLOR.navy}
                opacity={0.6}
              />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <rect
                key={`rs-${i}`}
                x={i % 2 === 0 ? 216 : 342}
                y={40 + Math.floor(i / 2) * 90}
                width={10}
                height={10}
                fill={COLOR.gold}
              />
            ))}
            <circle
              cx="220"
              cy="300"
              r="14"
              fill="none"
              stroke={COLOR.gold}
              strokeWidth="4"
            />
          </motion.g>

          {/* Warm light spilling out of the seam — grows during doors-open */}
          <motion.rect
            x="180"
            y="20"
            width="40"
            height="560"
            fill={COLOR.goldGlow}
            initial={{ opacity: 0, scaleX: 0.2 }}
            animate={{
              opacity: doorsSwung ? 0.85 : 0,
              scaleX: doorsSwung ? 1 : 0.2,
            }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: "200px 300px" }}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Threshold flash — a bright white wash at the moment we cross the gate.
// ─────────────────────────────────────────────────────────────────────────
function ThresholdFlash({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="flash"
          className="pointer-events-none absolute inset-0 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0.92, 0.4, 0] }}
          transition={{
            duration: (T_THRESHOLD_END - T_DOORS_OPEN_END) / 1000,
            times: [0, 0.55, 0.75, 0.9, 1],
          }}
        />
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BEAT 3 — Flythrough corridor: stone columns + torches parallax past.
// ─────────────────────────────────────────────────────────────────────────
function Beat3_Corridor({ visible }: { visible: boolean }) {
  const columns = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({ id: i, side: i % 2 })),
    [],
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="corridor"
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          transition={{ duration: 0.5 }}
        >
          {/* Corridor floor + ceiling perspective bands */}
          <div
            className="absolute inset-x-0 top-0 h-1/2"
            style={{
              background:
                "linear-gradient(180deg, #0B1027 0%, #1A1638 60%, #2A1F52 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{
              background:
                "linear-gradient(0deg, #05070E 0%, #1A1638 60%, #2A1F52 100%)",
            }}
          />
          {/* Perspective vanishing point glow */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${COLOR.goldGlow}55 0%, transparent 70%)`,
            }}
            animate={{ scale: [0.8, 1.4, 1] }}
            transition={{ duration: 4, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Columns — animated from small-far to large-near, each with a
              staggered start so they feel like real objects passing by. */}
          {columns.map((c) => {
            const delay = c.id * 0.55;
            const sideMul = c.side === 0 ? -1 : 1;
            return (
              <motion.div
                key={c.id}
                className="absolute top-1/2 -translate-y-1/2"
                style={{
                  width: 80,
                  left: "50%",
                }}
                initial={{
                  x: sideMul * 30 - 40,
                  scale: 0.15,
                  opacity: 0,
                }}
                animate={{
                  x: [sideMul * 30 - 40, sideMul * 550],
                  scale: [0.15, 2.4],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 2.4,
                  delay,
                  ease: [0.4, 0, 0.6, 1],
                  times: [0, 0.15, 0.85, 1],
                }}
              >
                <div
                  className="mx-auto"
                  style={{
                    width: 60,
                    height: 320,
                    background: `linear-gradient(180deg, ${COLOR.stoneLight} 0%, ${COLOR.stone} 100%)`,
                    boxShadow: `0 0 20px rgba(0,0,0,0.6)`,
                  }}
                />
                {/* Torch bracket + flame */}
                <div
                  className="absolute"
                  style={{ left: "50%", top: 40, transform: "translateX(-50%)" }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 26,
                      background: COLOR.gold,
                      boxShadow: `0 0 22px ${COLOR.goldGlow}`,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Low bass "heartbeat" pulse — a subtle vignette that breathes */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BEAT 4 / 5 — Throne room: wide reveal, camera decelerates and holds,
// then tilts down onto the table.
// ─────────────────────────────────────────────────────────────────────────
function Beat4_ThroneRoom({
  visible,
  tilted,
}: {
  visible: boolean;
  tilted: boolean;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="throne-room"
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotateX: tilted ? 70 : 0,
            y: tilted ? "20%" : 0,
          }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          transition={{
            duration: tilted ? (T_TILT_END - T_THRONE_END) / 1000 : 1,
            ease: [0.4, 0, 0.2, 1],
          }}
          style={{ transformStyle: "preserve-3d", perspective: 1200 }}
        >
          {/* Room ambient bg */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #0B1027 0%, #1E1450 55%, #05070E 100%)",
            }}
          />

          {/* Back wall with columns */}
          <div className="absolute inset-x-0 top-0 bottom-1/3">
            <div
              className="absolute inset-x-0 bottom-0 h-2"
              style={{ background: COLOR.stoneLight }}
            />
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="absolute bottom-0"
                style={{
                  left: `${10 + i * 20}%`,
                  width: 60,
                  height: "80%",
                  background: `linear-gradient(180deg, ${COLOR.stone} 0%, ${COLOR.stoneLight} 100%)`,
                }}
              />
            ))}
            {/* Warm hanging lantern light down center */}
            <div
              className="absolute left-1/2 top-1/3 h-20 w-20 -translate-x-1/2 rounded-full"
              style={{
                background: `radial-gradient(circle, ${COLOR.goldGlow}CC 0%, transparent 70%)`,
              }}
            />
          </div>

          {/* Throne — silhouetted upright, receding into the room */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[30%]"
            style={{ width: 180, height: 240 }}
          >
            <svg viewBox="0 0 180 240" width="100%" height="100%">
              {/* Throne back */}
              <rect x="40" y="20" width="100" height="160" fill={COLOR.purple} />
              <rect x="40" y="20" width="100" height="10" fill={COLOR.gold} />
              {/* Gold trim */}
              <rect x="50" y="30" width="80" height="4" fill={COLOR.gold} />
              <rect x="50" y="50" width="80" height="4" fill={COLOR.gold} />
              {/* Seat */}
              <rect x="30" y="180" width="120" height="30" fill={COLOR.stoneLight} />
              {/* Steps */}
              <rect x="10" y="210" width="160" height="12" fill={COLOR.stone} />
              <rect x="0" y="222" width="180" height="12" fill={COLOR.stoneLight} />
            </svg>
          </div>

          {/* Floor — pixel-y checker to sell scale */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "35%",
              background: `repeating-linear-gradient(90deg, ${COLOR.stone} 0 40px, ${COLOR.stoneLight} 40px 80px)`,
              opacity: 0.9,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BEAT 5 / 6 — Table + parchment scroll. After tilt lands, the parchment
// unrolls horizontally revealing the map underneath.
// ─────────────────────────────────────────────────────────────────────────
function Beat5_TableAndScroll({
  visible,
  unrolled,
}: {
  visible: boolean;
  unrolled: boolean;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="table"
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Wooden table plane */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm"
            style={{
              width: "min(80vw, 800px)",
              height: "min(52vh, 480px)",
              background: `linear-gradient(180deg, #4B2E14 0%, #3A2210 100%)`,
              boxShadow:
                "inset 0 0 60px rgba(0,0,0,0.6), 0 20px 60px rgba(0,0,0,0.7)",
            }}
          >
            {/* Wood grain striations */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  top: `${(i + 1) * 12}%`,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "rgba(0,0,0,0.25)",
                }}
              />
            ))}
          </div>

          {/* Rolled parchment (visible pre-unroll) — two rolls sit at the
              edges once open; before that they overlap in the middle. */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-y-1/2 rounded-full"
            initial={{ x: 0, opacity: 1 }}
            animate={{
              x: unrolled ? "min(-38vw, -360px)" : 0,
              opacity: 1,
            }}
            transition={{
              duration: (T_UNROLL_END - T_TILT_END) / 1000,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              width: 18,
              height: "min(48vh, 440px)",
              background: `linear-gradient(180deg, ${COLOR.parchmentDark} 0%, ${COLOR.parchment} 50%, ${COLOR.parchmentDark} 100%)`,
              boxShadow: `0 0 20px rgba(0,0,0,0.6)`,
            }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-y-1/2 rounded-full"
            initial={{ x: 0, opacity: 1 }}
            animate={{
              x: unrolled ? "min(38vw, 360px)" : 0,
              opacity: 1,
            }}
            transition={{
              duration: (T_UNROLL_END - T_TILT_END) / 1000,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              width: 18,
              height: "min(48vh, 440px)",
              background: `linear-gradient(180deg, ${COLOR.parchmentDark} 0%, ${COLOR.parchment} 50%, ${COLOR.parchmentDark} 100%)`,
              boxShadow: `0 0 20px rgba(0,0,0,0.6)`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BEAT 6 / 7 — Map + reveal text. Parchment paper widens between the two
// rolls, then the pixel-art map lands on top with mountains, paths, and
// a few landmarks. Title text burns in on Beat 7.
// ─────────────────────────────────────────────────────────────────────────
function Beat6_Map({
  visible,
  revealed,
}: {
  visible: boolean;
  revealed: boolean;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="map"
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {/* Parchment paper — widens from 0 → full width to sell the
              unroll. Sits above the table and under the rolls (visually). */}
          <motion.div
            className="relative overflow-hidden"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: (T_UNROLL_END - T_TILT_END) / 1000,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              width: "min(76vw, 720px)",
              height: "min(46vh, 420px)",
              background: `linear-gradient(180deg, ${COLOR.parchment} 0%, ${COLOR.parchmentDark} 100%)`,
              boxShadow:
                "inset 0 0 40px rgba(120, 80, 30, 0.5), 0 12px 32px rgba(0,0,0,0.7)",
              transformOrigin: "50% 50%",
            }}
          >
            {/* Aged-paper mottling */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, transparent 40%, rgba(120,80,30,0.35) 100%)",
              }}
            />

            {/* Pixel-art map surface — mountains, a winding path, three
                landmark markers, and a compass rose. */}
            <motion.svg
              viewBox="0 0 400 240"
              className="absolute inset-0 h-full w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: revealed || visible ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              style={{ imageRendering: "pixelated" }}
            >
              {/* Compass rose */}
              <g transform="translate(340, 40)">
                <circle
                  cx="0"
                  cy="0"
                  r="18"
                  fill="none"
                  stroke={COLOR.ink}
                  strokeWidth="1.5"
                />
                <path
                  d="M0 -18 L4 0 L0 18 L-4 0 Z"
                  fill={COLOR.pink}
                  stroke={COLOR.ink}
                />
                <path
                  d="M-18 0 L0 -4 L18 0 L0 4 Z"
                  fill={COLOR.gold}
                  stroke={COLOR.ink}
                />
                <text
                  x="0"
                  y="-24"
                  fontSize="8"
                  textAnchor="middle"
                  fill={COLOR.ink}
                  fontFamily="inherit"
                >
                  N
                </text>
              </g>

              {/* Mountains (chevrons) */}
              {[
                { x: 60, y: 120, s: 1.4 },
                { x: 120, y: 100, s: 1.1 },
                { x: 90, y: 140, s: 1.0 },
                { x: 250, y: 90, s: 1.3 },
                { x: 300, y: 120, s: 1.15 },
              ].map((m, i) => (
                <g key={`mtn-${i}`} transform={`translate(${m.x}, ${m.y}) scale(${m.s})`}>
                  <path
                    d="M0 20 L15 -10 L30 20 Z"
                    fill={COLOR.purple}
                    stroke={COLOR.ink}
                    strokeWidth="1"
                  />
                  <path
                    d="M8 -3 L15 -10 L22 -3 L15 6 Z"
                    fill={COLOR.parchment}
                  />
                </g>
              ))}

              {/* Winding path from bottom-left to top-right */}
              <path
                d="M20 210 C 100 180, 130 140, 180 130 S 280 90, 380 70"
                fill="none"
                stroke={COLOR.ink}
                strokeWidth="2"
                strokeDasharray="4 3"
                opacity="0.8"
              />

              {/* Landmark: village pin */}
              <g transform="translate(80, 195)">
                <rect x="-8" y="-14" width="16" height="14" fill={COLOR.pink} />
                <path d="M-10 -14 L0 -22 L10 -14 Z" fill={COLOR.purple} />
                <rect x="-2" y="-8" width="4" height="6" fill={COLOR.gold} />
              </g>

              {/* Landmark: tower */}
              <g transform="translate(200, 125)">
                <rect x="-4" y="-24" width="8" height="24" fill={COLOR.stoneLight} />
                <path d="M-6 -24 L0 -30 L6 -24 Z" fill={COLOR.purple} />
                <rect x="-1" y="-16" width="2" height="4" fill={COLOR.goldGlow} />
              </g>

              {/* Landmark: gate (nods back to the intro) */}
              <g transform="translate(340, 70)">
                <rect x="-10" y="-16" width="20" height="16" fill={COLOR.stone} />
                <rect x="-8" y="-14" width="16" height="14" fill={COLOR.gold} />
              </g>

              {/* River */}
              <path
                d="M0 60 C 80 80, 100 40, 180 60 S 280 100, 400 90"
                fill="none"
                stroke={COLOR.purpleGlow}
                strokeWidth="3"
                opacity="0.55"
              />
            </motion.svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BEAT 7 — Reveal text + wax-seal Continue button
// ─────────────────────────────────────────────────────────────────────────
function RevealOverlay({
  visible,
  onContinue,
  continueEnabled,
}: {
  visible: boolean;
  onContinue: () => void;
  continueEnabled: boolean;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="reveal"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-16 sm:pb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          transition={{ duration: 0.6 }}
        >
          {/* Title — burns in with a slight glow and a scale bump */}
          <motion.h1
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
            className="mb-6 text-center text-3xl font-bold text-white sm:text-4xl md:text-5xl"
            style={{
              fontFamily: "inherit",
              textShadow: `0 0 18px ${COLOR.gold}80, 0 0 40px ${COLOR.purpleGlow}66`,
              letterSpacing: "0.02em",
            }}
          >
            Welcome to the Land of Ibhaveda
          </motion.h1>

          {/* Wax-seal Continue button */}
          <motion.button
            type="button"
            onClick={onContinue}
            disabled={!continueEnabled}
            initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.9,
              ease: [0.5, 1.4, 0.3, 1],
            }}
            className="pointer-events-auto relative flex h-24 w-24 items-center justify-center rounded-full sm:h-28 sm:w-28"
            style={{
              background: `radial-gradient(circle at 40% 35%, ${COLOR.pink} 0%, #B91E5E 60%, #6E0F38 100%)`,
              boxShadow: `0 8px 24px rgba(0,0,0,0.7), inset 0 -6px 12px rgba(0,0,0,0.4), inset 0 4px 8px rgba(255,255,255,0.15)`,
              cursor: continueEnabled ? "pointer" : "not-allowed",
            }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-widest text-white/95 sm:text-xs"
              style={{ fontFamily: "inherit" }}
            >
              Enter
            </span>
            {/* Faux seal border (broken edges) */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                border: `2px dashed rgba(255,255,255,0.25)`,
                margin: 8,
              }}
            />
          </motion.button>

          {/* Faint prompt */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="mt-4 text-[10px] uppercase tracking-[0.3em] text-white/70"
            style={{ fontFamily: "inherit" }}
          >
            Tap the seal to enter
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
