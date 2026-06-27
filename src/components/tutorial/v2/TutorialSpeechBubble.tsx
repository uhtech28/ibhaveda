"use client";

/**
 * TutorialSpeechBubble
 *
 * Duolingo-style dialogue bubble that floats above Sparky. Supports:
 *  - Typewriter text reveal (so each line feels paced and friendly)
 *  - Optional primary action button + skip link
 *  - Animated entrance from Sparky's mouth direction
 *
 * Self-contained — caller passes text + handlers. The bubble manages
 * its own typewriter state. When `text` changes the typewriter restarts.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialSpeechBubbleProps {
  /** The line of dialogue Sparky is saying right now. */
  text: string;
  /** Optional CTA button label. If omitted, no button is rendered. */
  primaryAction?: { label: string; onClick: () => void };
  /** Optional secondary text-style link, e.g. "Skip tutorial". */
  secondaryAction?: { label: string; onClick: () => void };
  /** Side the bubble sits relative to Sparky. Default "right".
   *  "bottom" means bubble sits ABOVE Sparky and tail points DOWN. */
  side?: "left" | "right" | "bottom";
  /** Render-text speed in ms per character. Default 24. Lower = faster. */
  typeSpeed?: number;
}

export function TutorialSpeechBubble({
  text,
  primaryAction,
  secondaryAction,
  side = "right",
  typeSpeed = 24,
}: TutorialSpeechBubbleProps) {
  // ── Typewriter state ─────────────────────────────────────────────────────
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown("");
    setDone(false);
    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        setDone(true);
        return;
      }
      window.setTimeout(tick, typeSpeed);
    };
    window.setTimeout(tick, 80);
    return () => {
      cancelled = true;
    };
  }, [text, typeSpeed]);

  // Tail direction — `side` is which edge of the bubble Sparky is on.
  //   side="right"  → Sparky on right  → tail on right edge   → points right
  //   side="left"   → Sparky on left   → tail on left edge    → points left
  //   side="bottom" → Sparky underneath → tail on bottom edge → points down
  const tailDirection: "left" | "right" | "bottom" =
    side === "right" ? "right" : side === "bottom" ? "bottom" : "left";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="relative w-[260px] pointer-events-auto"
    >
      <div
        className="relative rounded-2xl bg-white px-5 py-4 shadow-xl border-2 border-amber-300/70"
        style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)" }}
      >
        {/* ── Bubble tail ─────────────────────────────────────────────── */}
        {/* Positioned on the SIDE of the bubble, not the bottom, so the
            tail visibly points at Sparky regardless of which side he's
            sitting on. Implementation: a 16x16 square rotated 45deg with
            two of its outer edges bordered to match the bubble outline.
            Translated outward by 50% of its size so half pokes out. */}
        <div
          className="absolute w-4 h-4"
          style={(() => {
            // Position + rotation per side. The 4-square is centered on the
            // bubble's outer edge so half pokes out. Borders match the
            // bubble's amber rim on the two edges that face OUTWARD.
            const amber = "2px solid rgba(252, 211, 77, 0.7)";
            if (tailDirection === "right") {
              return {
                top: "62%",
                right: "0px",
                transform: "translate(50%, -50%) rotate(45deg)",
                background: "white",
                borderTop: amber,
                borderRight: amber,
              };
            }
            if (tailDirection === "left") {
              return {
                top: "62%",
                left: "0px",
                transform: "translate(-50%, -50%) rotate(45deg)",
                background: "white",
                borderBottom: amber,
                borderLeft: amber,
              };
            }
            // bottom — bubble sits ABOVE Sparky, tail points DOWN.
            // Anchor at right-third so the tail aims at Sparky's head
            // (Sparky sits flush with the bubble's right edge in the
            // vertical-stack layout used inside TutorialMascot).
            return {
              bottom: "0px",
              right: "30%",
              transform: "translate(50%, 50%) rotate(45deg)",
              background: "white",
              borderRight: amber,
              borderBottom: amber,
            };
          })() as React.CSSProperties}
        />

        {/* ── Dialogue text (typewriter) ──────────────────────────────── */}
        <div
          className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium"
          style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
        >
          {shown}
          {!done && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              className="inline-block w-0.5 h-3.5 bg-slate-500 align-middle ml-0.5"
            />
          )}
        </div>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {done && (primaryAction || secondaryAction) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              className="mt-3 flex items-center justify-between gap-3"
            >
              {secondaryAction ? (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {secondaryAction.label}
                </button>
              ) : (
                <span />
              )}
              {primaryAction && (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:from-amber-500 active:to-amber-600 text-white text-sm font-bold px-4 py-2 shadow-md hover:shadow-lg transition-all touch-manipulation"
                  style={{ boxShadow: "0 3px 0 rgb(180, 83, 9)" }}
                >
                  {primaryAction.label}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
