"use client";

/**
 * SwordDropCelebration — post-tutorial step 9 per the updated script.
 * Sparky says: "You did it! You're ready now. It's dangerous to go
 * alone, take this." — then drops a little pixel-art sword/dagger.
 *
 * Not counted toward the 8 visible tutorial steps. Renders as a full
 * screen overlay for ~4-5 seconds after step 8 completes. Auto-
 * dismisses; user can also tap the sword to speed it up.
 *
 * Mount whenever the tutorial's backendState flips from "in_progress"
 * to "completed" — a one-shot sessionStorage flag stops it from
 * repeating on refresh.
 */

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  /** Fired when the celebration finishes (auto or click). */
  onDone: () => void;
}

const SESSION_KEY = "ibhaveda:sword-drop-shown";

export function SwordDropCelebration({ onDone }: Props) {
  const [phase, setPhase] = useState<
    "line" | "dropping" | "landed" | "leaving"
  >("line");

  // Ambient timings
  useEffect(() => {
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase("dropping"), 1600));
    timers.push(window.setTimeout(() => setPhase("landed"), 2400));
    timers.push(window.setTimeout(() => setPhase("leaving"), 4400));
    timers.push(window.setTimeout(() => onDone(), 5000));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [onDone]);

  const handleTap = useCallback(() => {
    setPhase("leaving");
    window.setTimeout(() => onDone(), 500);
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== "leaving" && (
        <motion.div
          key="sword-drop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[400] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(24, 14, 44, 0.94) 0%, rgba(8, 4, 20, 0.98) 60%, rgba(0, 0, 0, 1) 100%)",
            fontFamily: "'Space Grotesk', var(--font-sans), sans-serif",
            color: "#f6f4fa",
          }}
          onClick={handleTap}
        >
          {/* Zelda-nod speech line at the top */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-[720px] px-6 text-center"
          >
            <div
              className="text-[11px] font-bold uppercase tracking-[0.42em] text-amber-300/80"
              style={{ textShadow: "0 2px 8px rgba(255, 213, 128, 0.35)" }}
            >
              Sparky
            </div>
            <div
              className="mt-3 text-[22px] font-medium leading-relaxed sm:text-[26px]"
              style={{
                color: "#fff2b0",
                textShadow: "0 4px 16px rgba(0, 0, 0, 0.75)",
              }}
            >
              &ldquo;You did it! You&rsquo;re ready now. It&rsquo;s dangerous to
              go alone, take this.&rdquo;
            </div>
          </motion.div>

          {/* Golden pulse behind the sword drop point */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={
              phase === "landed"
                ? { opacity: [0, 0.9, 0.4], scale: [0.3, 1.6, 1.1] }
                : { opacity: 0, scale: 0.3 }
            }
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{
              width: 320,
              height: 320,
              background:
                "radial-gradient(circle, rgba(255, 213, 128, 0.85) 0%, rgba(226, 115, 154, 0.35) 45%, transparent 75%)",
              filter: "blur(12px)",
            }}
          />

          {/* Sparky sprite (bottom-left of drop point) */}
          <motion.div
            className="pointer-events-none absolute left-[calc(50%-140px)] top-[62%] -translate-y-1/2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <img
              src="/assets/sparky-v2/idle-frame0.png"
              alt="Sparky"
              className="h-[110px] w-[110px]"
              style={{ imageRendering: "pixelated" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
              draggable={false}
            />
          </motion.div>

          {/* The dagger — falls from above, lands, then glows */}
          <AnimatePresence>
            {phase !== "line" && (
              <motion.div
                key="dagger"
                className="pointer-events-none absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2"
                initial={{ y: -420, rotate: -180, opacity: 0 }}
                animate={
                  phase === "dropping"
                    ? { y: -40, rotate: -20, opacity: 1 }
                    : { y: 0, rotate: 0, opacity: 1 }
                }
                transition={
                  phase === "dropping"
                    ? { duration: 0.7, ease: [0.55, 0.15, 0.72, 0.15] }
                    : {
                        duration: 0.35,
                        ease: [0.16, 1.4, 0.3, 1],
                      }
                }
              >
                <DaggerSprite />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Landing dust puff */}
          <AnimatePresence>
            {phase === "landed" && (
              <motion.div
                key="dust"
                className="pointer-events-none absolute left-1/2 top-[70%] -translate-x-1/2"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 1.5] }}
                transition={{ duration: 0.9 }}
              >
                <div
                  className="h-6 w-40 rounded-full"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, rgba(255, 213, 128, 0.7) 0%, rgba(226, 115, 154, 0.35) 40%, transparent 80%)",
                    filter: "blur(6px)",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tap-to-continue hint */}
          <AnimatePresence>
            {phase === "landed" && (
              <motion.div
                key="tap-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0.9] }}
                transition={{ duration: 1.2, delay: 0.6 }}
                className="absolute bottom-8 text-[10px] font-bold uppercase tracking-[0.42em] text-white/40"
              >
                Tap anywhere to continue
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Small pixel-art dagger as inline SVG. Gold hilt, silver blade. */
function DaggerSprite() {
  return (
    <svg
      width="72"
      height="140"
      viewBox="0 0 24 46"
      style={{ imageRendering: "pixelated" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blade */}
      <rect x="10" y="4" width="4" height="24" fill="#e6e8ef" stroke="#6b7080" strokeWidth="1" />
      <rect x="11" y="5" width="2" height="22" fill="#f8f9fc" />
      {/* Tip */}
      <polygon points="10,4 12,0 14,4" fill="#e6e8ef" stroke="#6b7080" strokeWidth="1" />
      {/* Crossguard */}
      <rect x="4" y="28" width="16" height="4" fill="#c9a45c" stroke="#5a4020" strokeWidth="1" />
      <rect x="5" y="29" width="14" height="2" fill="#e8c47a" />
      {/* Handle */}
      <rect x="10" y="32" width="4" height="10" fill="#7a4a2a" stroke="#3a2010" strokeWidth="1" />
      <rect x="11" y="33" width="2" height="8" fill="#9a6438" />
      {/* Pommel */}
      <rect x="9" y="42" width="6" height="4" fill="#c9a45c" stroke="#5a4020" strokeWidth="1" />
      <rect x="10" y="43" width="4" height="2" fill="#e8c47a" />
    </svg>
  );
}

/**
 * Check the sessionStorage flag so we only show the sword drop once
 * per browser session (per tab). Convex-side "completed" already
 * prevents re-trigger across sessions, but this keeps the celebration
 * from replaying if the user refreshes right after finishing.
 */
export function hasSwordDropBeenShown(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSwordDropShown(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}
