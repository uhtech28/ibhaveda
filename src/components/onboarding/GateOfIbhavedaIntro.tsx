"use client";

/**
 * GateOfIbhavedaIntro — post-signup, pre-onboarding cinematic.
 *
 * Full creative brief lives in `ibhaveda-onboarding-intro-doc.pdf`.
 * Total runtime ≈ 23.6s with 7 beats:
 *
 *   1. Materialize        0.0s – 2.3s   dots of light form a door outline
 *   2. Doors Open         2.3s – 3.9s   doors swing apart, light spills
 *   2B. Through Doorway   3.9s – 5.5s   camera pushes through the gap
 *   3. Flythrough Corr.   5.5s – 9.5s   corridor with columns + torches
 *   4. Arrive Throne Rm   9.5s – 11.5s  wide throne-room space, hold
 *   5. Tilt Down         11.5s – 13.7s  pitch down to a table + scroll
 *   6. Unroll Map        13.7s – 17.5s  parchment unrolls
 *   7. Reveal & Hold     17.5s – 23.6s  "Welcome to the Land of Ibhaveda"
 *
 * User may tap Continue at any point to skip. Component auto-fires
 * `onDone` when the sequence completes.
 *
 * VISUAL FIDELITY — per section 6 of the brief, the timing / staging /
 * camera moves in this file are close-to-final. The pixel-art assets
 * themselves (door leaves, corridor stones, throne, scroll, map) are
 * placeholder shapes drawn with CSS + SVG. Swap them for real
 * pre-rendered pixel art (sprite sequence, Lottie, or WebM) without
 * changing the beat timings.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Timing (ms, absolute from t=0) ────────────────────────────────────
const T_MATERIALIZE_END = 2300;
const T_DOORS_OPEN_END = 3900;
const T_THRESHOLD_END = 5500;
const T_CORRIDOR_END = 9500;
const T_THRONE_END = 11500;
const T_TILT_END = 13700;
const T_UNROLL_END = 17500;
const T_REVEAL_END = 23600;

type Beat =
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
  /** Called after the intro fully dismisses (auto or Continue). */
  onDone: () => void;
}

export function GateOfIbhavedaIntro({ onDone }: Props) {
  const [beat, setBeat] = useState<Beat>("materialize");
  const startedAtRef = useRef<number>(Date.now());

  // Schedule every beat transition as an absolute-time setTimeout so
  // the sequence stays in sync even if a beat handler runs slightly
  // long. Timers are all cleaned up on unmount.
  useEffect(() => {
    const timers: number[] = [];
    const schedule = (delayMs: number, next: Beat) => {
      timers.push(window.setTimeout(() => setBeat(next), delayMs));
    };
    schedule(T_MATERIALIZE_END, "doors-open");
    schedule(T_DOORS_OPEN_END, "through-doorway");
    schedule(T_THRESHOLD_END, "corridor");
    schedule(T_CORRIDOR_END, "throne-room");
    schedule(T_THRONE_END, "tilt-down");
    schedule(T_TILT_END, "unroll");
    schedule(T_UNROLL_END, "reveal");
    // Auto-dismiss shortly after Reveal & Hold if the user doesn't
    // hit Continue themselves.
    schedule(T_REVEAL_END, "leaving");
    timers.push(
      window.setTimeout(() => {
        try {
          onDone();
        } catch {
          /* no-op */
        }
      }, T_REVEAL_END + 600),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [onDone]);

  const handleContinue = useCallback(() => {
    setBeat("leaving");
    window.setTimeout(() => {
      try {
        onDone();
      } catch {
        /* no-op */
      }
    }, 600);
  }, [onDone]);

  // Derived flags for staging each beat in JSX.
  const showDots = beat === "materialize";
  const showDoorOutline =
    beat === "materialize" ||
    beat === "doors-open" ||
    beat === "through-doorway";
  const doorsOpening =
    beat === "doors-open" || beat === "through-doorway";
  const doorsPushingThrough = beat === "through-doorway";
  const showCorridor =
    beat === "through-doorway" ||
    beat === "corridor" ||
    beat === "throne-room" ||
    beat === "tilt-down";
  const throneRoomVisible =
    beat === "throne-room" || beat === "tilt-down";
  const tilting = beat === "tilt-down" || beat === "unroll" || beat === "reveal";
  const tableVisible = beat === "tilt-down" || beat === "unroll" || beat === "reveal";
  const mapUnrolled = beat === "unroll" || beat === "reveal";
  const revealText = beat === "reveal";

  // Container-level camera transform: emulates the push-through-gate
  // moment by scaling the whole scene up on Beat 2B, then settles
  // back to identity for the corridor flythrough.
  const cameraScale = doorsPushingThrough ? 3.2 : 1;
  const cameraTransition = doorsPushingThrough
    ? { duration: (T_THRESHOLD_END - T_DOORS_OPEN_END) / 1000, ease: [0.7, 0, 0.32, 1] as const }
    : { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <AnimatePresence>
      {beat !== "leaving" && (
        <motion.div
          key="gate-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
          className="fixed inset-0 z-[300] overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse 60% 45% at 50% 45%, #0a0616 0%, #060314 45%, #01010a 100%)",
            fontFamily: "'Press Start 2P', 'Space Grotesk', var(--font-sans), sans-serif",
            color: "#f6f4fa",
            imageRendering: "pixelated",
          }}
        >
          {/* Continue button — top-right, subtle. User can always skip. */}
          <button
            onClick={handleContinue}
            className="absolute right-6 top-6 z-40 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/70 transition hover:border-amber-300/40 hover:bg-black/60 hover:text-amber-200"
          >
            Skip
          </button>

          {/* ─── Camera container (holds all pre-throne scenes) ─── */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: cameraScale }}
            transition={cameraTransition}
            style={{ willChange: "transform" }}
          >
            {/* ══════ BEAT 1 — Materialize (dots) ══════ */}
            {showDots && <MaterializeDots />}

            {/* ══════ BEAT 1/2/2B — Door outline + door leaves ══════ */}
            {showDoorOutline && (
              <DoorScene
                outlineVisible={beat === "materialize"}
                opening={doorsOpening}
                pushingThrough={doorsPushingThrough}
              />
            )}

            {/* ══════ BEAT 3 / 4 — Corridor + Throne Room ══════ */}
            {showCorridor && (
              <CorridorScene
                inThroneRoom={throneRoomVisible}
                tiltingDown={tilting}
              />
            )}
          </motion.div>

          {/* ══════ BEATS 5 – 7 — Tilt down to table + unroll map ══════
             Rendered OUTSIDE the camera container so tilt is a
             separate transform on the table stage. */}
          {tableVisible && (
            <TableScrollScene
              unrolled={mapUnrolled}
              showText={revealText}
              onContinue={handleContinue}
            />
          )}

          {/* Vignette + film grain — overall polish. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)",
              mixBlendMode: "multiply",
            }}
          />

          <GateStyles />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// BEAT 1 — Materialize (dots of light form a door outline)
// ═══════════════════════════════════════════════════════════════════════

function MaterializeDots() {
  // 60 dots arranged along an implied door outline. Each fades in
  // at a staggered delay so they read as "gathering" into the shape.
  const dots = useMemo(() => {
    const list: { top: number; left: number; delay: number; size: number }[] = [];
    const cx = 50;
    const cyTop = 20;
    const cyBottom = 78;
    // Left + right vertical rails (24 dots each side)
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      const y = cyTop + t * (cyBottom - cyTop);
      list.push({ top: y, left: cx - 12, delay: 200 + t * 1500, size: 3 + (i % 3) });
      list.push({ top: y, left: cx + 12, delay: 200 + t * 1500, size: 3 + (i % 3) });
    }
    // Top arch (12 dots)
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      const arcAngle = Math.PI * (1 - t);
      const x = cx + Math.cos(arcAngle) * 12;
      const y = cyTop - Math.sin(arcAngle) * 6;
      list.push({ top: y, left: x, delay: 500 + t * 1200, size: 3 });
    }
    return list;
  }, []);

  return (
    <div className="relative h-full w-full">
      {dots.map((d, i) => (
        <span
          key={i}
          className="gate-dot"
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            animationDelay: `${d.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// BEAT 1 / 2 / 2B — Door outline + swinging door leaves
// ═══════════════════════════════════════════════════════════════════════

interface DoorSceneProps {
  outlineVisible: boolean;
  opening: boolean;
  pushingThrough: boolean;
}

function DoorScene({ outlineVisible, opening, pushingThrough }: DoorSceneProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 320, height: 460 }}>
      {/* Stone door frame — pixel-art placeholder */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #3a2f5c 0%, #24193f 100%)",
          border: "10px solid #1a1128",
          borderRadius: "8px 8px 0 0",
          boxShadow:
            "0 0 60px rgba(143, 92, 232, 0.35), inset 0 0 40px rgba(0, 0, 0, 0.6)",
        }}
      />

      {/* Golden glow behind the door — visible as doors open */}
      <motion.div
        className="absolute inset-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: opening ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255, 213, 128, 0.95) 0%, rgba(226, 115, 154, 0.55) 40%, rgba(143, 92, 232, 0.2) 75%, transparent 100%)",
          filter: pushingThrough ? "brightness(1.7)" : "brightness(1)",
        }}
      />

      {/* Left door leaf */}
      <motion.div
        className="absolute"
        style={{
          left: "5%",
          top: "5%",
          bottom: "5%",
          width: "45%",
          transformOrigin: "left center",
          background:
            "linear-gradient(90deg, #4a3872 0%, #6b4e9c 60%, #3f2960 100%)",
          border: "4px solid #2c1c4a",
          borderRadius: "6px 0 0 0",
          boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.65)",
        }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: opening ? -85 : 0 }}
        transition={{ duration: (T_DOORS_OPEN_END - T_MATERIALIZE_END) / 1000, ease: [0.5, 0, 0.4, 1] }}
      >
        {/* Vertical pixel-art strut lines to sell the wood */}
        <div className="absolute left-2 right-2 top-2 bottom-2 opacity-40" style={{
          background:
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.4) 0, rgba(0,0,0,0.4) 2px, transparent 2px, transparent 14px)",
        }} />
        {/* Iron ring handle */}
        <div className="absolute right-3 top-1/2 h-5 w-5 rounded-full border-2 border-[#c9a45c] bg-[#5a4020]" style={{ transform: "translateY(-50%)" }} />
      </motion.div>

      {/* Right door leaf */}
      <motion.div
        className="absolute"
        style={{
          right: "5%",
          top: "5%",
          bottom: "5%",
          width: "45%",
          transformOrigin: "right center",
          background:
            "linear-gradient(270deg, #4a3872 0%, #6b4e9c 60%, #3f2960 100%)",
          border: "4px solid #2c1c4a",
          borderRadius: "0 6px 0 0",
          boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.65)",
        }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: opening ? 85 : 0 }}
        transition={{ duration: (T_DOORS_OPEN_END - T_MATERIALIZE_END) / 1000, ease: [0.5, 0, 0.4, 1] }}
      >
        <div className="absolute left-2 right-2 top-2 bottom-2 opacity-40" style={{
          background:
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.4) 0, rgba(0,0,0,0.4) 2px, transparent 2px, transparent 14px)",
        }} />
        <div className="absolute left-3 top-1/2 h-5 w-5 rounded-full border-2 border-[#c9a45c] bg-[#5a4020]" style={{ transform: "translateY(-50%)" }} />
      </motion.div>

      {/* Threshold-crossing flash — appears at the exact moment of push */}
      <AnimatePresence>
        {pushingThrough && (
          <motion.div
            className="pointer-events-none absolute inset-[-100%]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.6, 0] }}
            transition={{ duration: 1.4, times: [0, 0.35, 0.65, 1] }}
            style={{
              background:
                "radial-gradient(ellipse at center, #fff8dc 0%, rgba(255, 213, 128, 0.75) 30%, transparent 65%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Faint outline glow while the door is still being drawn */}
      {outlineVisible && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            border: "2px solid rgba(255, 213, 128, 0.7)",
            borderRadius: "10px 10px 0 0",
            boxShadow:
              "0 0 30px rgba(255, 213, 128, 0.55), inset 0 0 12px rgba(255, 213, 128, 0.35)",
            animation: "gate-outline-pulse 1.6s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// BEAT 3 / 4 — Corridor flythrough → Throne Room
// ═══════════════════════════════════════════════════════════════════════

interface CorridorSceneProps {
  inThroneRoom: boolean;
  tiltingDown: boolean;
}

function CorridorScene({ inThroneRoom, tiltingDown }: CorridorSceneProps) {
  // 6 column pairs travel toward the camera. Each column's `scale` +
  // `opacity` animation gives the sense of forward motion. When the
  // corridor "ends," a throne-room silhouette fades in.
  const columns = [0, 1, 2, 3, 4, 5];
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Corridor floor + ceiling (perspective) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #12082a 0%, #1c1240 20%, #2a1d54 40%, #1a1128 65%, #0a0616 100%)",
        }}
      />
      {/* Vanishing-point glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "40vw",
          height: "40vw",
          background:
            "radial-gradient(circle, rgba(255, 213, 128, 0.35) 0%, rgba(143, 92, 232, 0.15) 30%, transparent 65%)",
          filter: "blur(20px)",
        }}
      />

      {/* Column pairs — each animates from tiny (far) to huge (past camera) */}
      {!inThroneRoom &&
        columns.map((i) => {
          const delay = i * 0.7;
          return (
            <div key={i}>
              <motion.div
                className="pointer-events-none absolute bottom-0 top-0"
                style={{
                  left: "18%",
                  width: 60,
                  background:
                    "linear-gradient(90deg, #3a2f5c 0%, #6b4e9c 30%, #4a3872 60%, #2a1c40 100%)",
                  border: "3px solid #1a1128",
                  boxShadow: "inset -8px 0 20px rgba(0,0,0,0.6)",
                }}
                initial={{ scale: 0.2, opacity: 0, x: 0 }}
                animate={{ scale: [0.2, 1.4, 3.6], opacity: [0, 1, 0], x: [-40, -180, -420] }}
                transition={{ duration: 3.5, delay, ease: "linear", repeat: 0 }}
              >
                {/* Torch at top */}
                <div className="absolute left-1/2 top-6 -translate-x-1/2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{
                      background: "radial-gradient(circle, #fff2b0 0%, #ffb04a 60%, transparent 100%)",
                      boxShadow: "0 0 18px rgba(255, 176, 74, 0.9)",
                      animation: "gate-torch-flicker 0.6s ease-in-out infinite alternate",
                    }}
                  />
                </div>
              </motion.div>
              <motion.div
                className="pointer-events-none absolute bottom-0 top-0"
                style={{
                  right: "18%",
                  width: 60,
                  background:
                    "linear-gradient(270deg, #3a2f5c 0%, #6b4e9c 30%, #4a3872 60%, #2a1c40 100%)",
                  border: "3px solid #1a1128",
                  boxShadow: "inset 8px 0 20px rgba(0,0,0,0.6)",
                }}
                initial={{ scale: 0.2, opacity: 0, x: 0 }}
                animate={{ scale: [0.2, 1.4, 3.6], opacity: [0, 1, 0], x: [40, 180, 420] }}
                transition={{ duration: 3.5, delay, ease: "linear", repeat: 0 }}
              >
                <div className="absolute left-1/2 top-6 -translate-x-1/2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{
                      background: "radial-gradient(circle, #fff2b0 0%, #ffb04a 60%, transparent 100%)",
                      boxShadow: "0 0 18px rgba(255, 176, 74, 0.9)",
                      animation: "gate-torch-flicker 0.6s ease-in-out infinite alternate 0.3s",
                    }}
                  />
                </div>
              </motion.div>
            </div>
          );
        })}

      {/* Throne room silhouette — resolves at end of corridor */}
      <AnimatePresence>
        {inThroneRoom && !tiltingDown && (
          <motion.div
            key="throne-room"
            className="absolute inset-0 flex items-end justify-center"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Wide stone chamber */}
            <div className="relative" style={{ width: "min(80vw, 900px)", height: "min(70vh, 620px)" }}>
              {/* Back wall with arched window */}
              <div
                className="absolute inset-x-0 bottom-[35%] top-0 rounded-t-[40%]"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 100%, #3a2f5c 0%, #1a1128 70%)",
                  border: "6px solid #2a1c40",
                  boxShadow: "inset 0 -20px 40px rgba(0, 0, 0, 0.6)",
                }}
              />
              {/* Window light */}
              <div
                className="absolute top-[5%] left-1/2 -translate-x-1/2 rounded-t-full"
                style={{
                  width: "22%",
                  height: "35%",
                  background:
                    "linear-gradient(180deg, #fff2b0 0%, #f6b25e 50%, #e2739a 100%)",
                  boxShadow: "0 0 60px rgba(255, 213, 128, 0.7)",
                }}
              />
              {/* Throne silhouette */}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  bottom: "12%",
                  width: "26%",
                  height: "38%",
                  background: "linear-gradient(180deg, #4a3872 0%, #24193f 100%)",
                  clipPath: "polygon(20% 0%, 80% 0%, 100% 30%, 100% 100%, 0 100%, 0 30%)",
                  border: "4px solid #1a1128",
                  boxShadow: "0 12px 24px rgba(0, 0, 0, 0.7)",
                }}
              />
              {/* Two flanking pillars */}
              <div className="absolute bottom-0 left-[10%] top-[15%] w-[6%] rounded-t-md" style={{
                background: "linear-gradient(180deg, #6b4e9c 0%, #3a2960 100%)",
                border: "3px solid #1a1128",
              }} />
              <div className="absolute bottom-0 right-[10%] top-[15%] w-[6%] rounded-t-md" style={{
                background: "linear-gradient(180deg, #6b4e9c 0%, #3a2960 100%)",
                border: "3px solid #1a1128",
              }} />
              {/* Floor tiles */}
              <div
                className="absolute inset-x-0 bottom-0 h-[8%]"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, #1a1128 0, #1a1128 30px, #24193f 30px, #24193f 60px)",
                  boxShadow: "inset 0 4px 8px rgba(0, 0, 0, 0.7)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// BEAT 5 / 6 / 7 — Tilt down to table, unroll scroll, reveal text
// ═══════════════════════════════════════════════════════════════════════

interface TableScrollSceneProps {
  unrolled: boolean;
  showText: boolean;
  onContinue: () => void;
}

function TableScrollScene({ unrolled, showText, onContinue }: TableScrollSceneProps) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, rotateX: -30, y: -60 }}
      animate={{ opacity: 1, rotateX: 0, y: 0 }}
      transition={{ duration: (T_TILT_END - T_THRONE_END) / 1000, ease: [0.5, 0, 0.32, 1] }}
      style={{
        background:
          "linear-gradient(180deg, #0a0616 0%, #14082a 50%, #0a0616 100%)",
      }}
    >
      {/* Wooden table plane */}
      <div
        className="relative"
        style={{
          width: "min(90vw, 900px)",
          height: "min(70vh, 560px)",
          background:
            "radial-gradient(ellipse at 50% 50%, #6b4a2a 0%, #4a3020 60%, #2a180c 100%)",
          borderRadius: "24px",
          border: "6px solid #1a1006",
          boxShadow:
            "0 40px 60px -20px rgba(0, 0, 0, 0.8), inset 0 -10px 20px rgba(0, 0, 0, 0.5)",
          transform: "perspective(1200px) rotateX(30deg)",
        }}
      >
        {/* Wood grain */}
        <div
          className="absolute inset-3 rounded-2xl opacity-25"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.2) 0, rgba(0,0,0,0.2) 3px, transparent 3px, transparent 22px)",
          }}
        />

        {/* Rolled parchment (when not unrolled) — centered at table top */}
        {!unrolled && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "22%",
              height: "8%",
              background:
                "linear-gradient(180deg, #f4d89b 0%, #d8b26a 50%, #a37a3f 100%)",
              borderRadius: "50%",
              border: "3px solid #4a3018",
              boxShadow:
                "0 10px 20px rgba(0, 0, 0, 0.55), inset 0 -4px 8px rgba(74, 48, 24, 0.6)",
            }}
          />
        )}

        {/* Unrolled parchment map */}
        <AnimatePresence>
          {unrolled && (
            <motion.div
              key="parchment"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ width: "22%", height: "8%", opacity: 0 }}
              animate={{ width: "78%", height: "72%", opacity: 1 }}
              transition={{
                duration: (T_UNROLL_END - T_TILT_END) / 1000,
                ease: [0.5, 0, 0.32, 1],
              }}
              style={{
                background:
                  "linear-gradient(155deg, #f4e0aa 0%, #e8c98a 45%, #c9a45c 100%)",
                border: "5px solid #6b4a2a",
                borderRadius: "6px",
                boxShadow:
                  "0 14px 30px rgba(0, 0, 0, 0.55), inset 0 0 40px rgba(139, 90, 40, 0.25)",
                overflow: "hidden",
              }}
            >
              {/* Aged-parchment noise */}
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply"
                style={{
                  background:
                    "radial-gradient(circle at 20% 30%, rgba(107, 74, 42, 0.35) 0%, transparent 40%), radial-gradient(circle at 80% 65%, rgba(107, 74, 42, 0.35) 0%, transparent 45%), radial-gradient(circle at 45% 85%, rgba(107, 74, 42, 0.25) 0%, transparent 40%)",
                }}
              />
              {/* Map path — winding line from bottom to top */}
              <svg
                viewBox="0 0 400 300"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
              >
                {/* Mountains */}
                <polygon points="60,220 120,140 180,220" fill="#7a4a2a" stroke="#3a2010" strokeWidth="2" />
                <polygon points="140,220 200,120 260,220" fill="#8f5a3a" stroke="#3a2010" strokeWidth="2" />
                <polygon points="220,220 290,150 360,220" fill="#7a4a2a" stroke="#3a2010" strokeWidth="2" />
                {/* Path (dashed) */}
                <path
                  d="M50,260 Q120,220 160,240 T260,200 T350,120"
                  stroke="#8f5ce8"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Landmark stars */}
                <circle cx="60" cy="260" r="6" fill="#e2739a" stroke="#4a1a2a" strokeWidth="2" />
                <circle cx="180" cy="230" r="5" fill="#f6b25e" stroke="#4a3018" strokeWidth="2" />
                <circle cx="270" cy="195" r="5" fill="#8f5ce8" stroke="#2a1440" strokeWidth="2" />
                <circle cx="350" cy="120" r="7" fill="#facc15" stroke="#4a3810" strokeWidth="2" />
                {/* Compass rose */}
                <g transform="translate(360, 40)">
                  <circle r="14" fill="none" stroke="#6b4a2a" strokeWidth="2" />
                  <polygon points="0,-14 4,0 0,14 -4,0" fill="#6b4a2a" />
                </g>
              </svg>

              {/* Text reveal — sits ABOVE the map */}
              <AnimatePresence>
                {showText && (
                  <motion.div
                    key="welcome-text"
                    initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
                    className="absolute inset-x-0 top-[38%] flex flex-col items-center px-6 text-center"
                  >
                    <div
                      className="text-[10px] font-bold uppercase tracking-[0.42em]"
                      style={{ color: "#4a2a10" }}
                    >
                      Welcome to
                    </div>
                    <div
                      className="mt-2 leading-none"
                      style={{
                        fontFamily: "'Space Grotesk', var(--font-sans), sans-serif",
                        fontWeight: 900,
                        fontSize: "clamp(28px, 5.5vw, 56px)",
                        background:
                          "linear-gradient(120deg, #8f5ce8 0%, #e2739a 50%, #f6b25e 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: "0 4px 12px rgba(74, 30, 90, 0.3)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      the Land of Ibhaveda
                    </div>
                    {/* Wax-seal Continue button */}
                    <motion.button
                      onClick={onContinue}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ scale: 1.05, rotate: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative mt-8 rounded-full px-8 py-4 text-[11px] font-black uppercase tracking-[0.34em]"
                      style={{
                        background:
                          "radial-gradient(ellipse at 30% 30%, #a4123f 0%, #7a0a2a 60%, #4a061a 100%)",
                        color: "#fff2b0",
                        border: "3px solid #4a061a",
                        boxShadow:
                          "0 8px 20px rgba(0, 0, 0, 0.55), inset 0 -3px 6px rgba(0, 0, 0, 0.35), inset 0 2px 4px rgba(255, 213, 128, 0.35)",
                        textShadow: "0 1px 2px rgba(0, 0, 0, 0.7)",
                      }}
                    >
                      Continue
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Global styles — keyframes for dots, torches, outline pulse
// ═══════════════════════════════════════════════════════════════════════

function GateStyles() {
  return (
    <style jsx global>{`
      .gate-dot {
        position: absolute;
        display: block;
        border-radius: 50%;
        background: radial-gradient(circle, #fff2b0 0%, #f6b25e 45%, transparent 100%);
        box-shadow: 0 0 12px rgba(255, 213, 128, 0.9);
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.4);
        animation: gate-dot-ignite 900ms ease-out forwards;
      }
      @keyframes gate-dot-ignite {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.4);
        }
        60% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.4);
        }
        100% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
      @keyframes gate-outline-pulse {
        0%, 100% {
          box-shadow: 0 0 30px rgba(255, 213, 128, 0.55), inset 0 0 12px rgba(255, 213, 128, 0.35);
        }
        50% {
          box-shadow: 0 0 45px rgba(255, 213, 128, 0.85), inset 0 0 20px rgba(255, 213, 128, 0.55);
        }
      }
      @keyframes gate-torch-flicker {
        0% { opacity: 0.85; transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1.1); }
      }
    `}</style>
  );
}
