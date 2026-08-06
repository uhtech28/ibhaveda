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
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialSpeechBubbleProps {
  /** The line of dialogue Sparky is saying right now. */
  text: string;
  /** Optional CTA button label. If omitted, no button is rendered. */
  primaryAction?: { label: string; onClick: () => void };
  /** Optional secondary text-style link, e.g. "Skip tutorial". */
  secondaryAction?: { label: string; onClick: () => void };
  /** Side the bubble sits relative to Sparky. Default "right".
   *  "bottom" means bubble sits ABOVE Sparky and tail points DOWN.
   *  "top" means bubble sits BELOW Sparky and tail points UP. */
  side?: "left" | "right" | "bottom" | "top";
  /** Render-text speed in ms per character. Default 24. Lower = faster. */
  typeSpeed?: number;
  /** When true, bubble spans its container width instead of the fixed 260px.
   *  Used on mobile where the bubble is docked to the viewport bottom. */
  fullWidth?: boolean;
}

export function TutorialSpeechBubble({
  text,
  primaryAction,
  secondaryAction,
  side = "right",
  typeSpeed = 24,
  fullWidth = false,
}: TutorialSpeechBubbleProps) {
  // Bubble stays WHITE. Product ask for the intro-only black BACKDROP
  // (dimming the feed underneath) is handled below by rendering a
  // full-screen fixed scrim behind the bubble — not by darkening
  // the bubble itself. Match on the leading phrase of Sparky's very
  // first line so we don't have to thread a variant prop through
  // every render site.
  const isIntroDialogue = text.trim().startsWith("Hi, I'm Sparky");
  const bubbleBg = "white";
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
  //   side="right"  → Sparky on right   → tail on right edge  → points right
  //   side="left"   → Sparky on left    → tail on left edge   → points left
  //   side="bottom" → Sparky underneath → tail on bottom edge → points down
  //   side="top"    → Sparky above      → tail on top edge    → points up
  const tailDirection: "left" | "right" | "bottom" | "top" =
    side === "right"
      ? "right"
      : side === "bottom"
        ? "bottom"
        : side === "top"
          ? "top"
          : "left";

  // Portal the intro-only black scrim to document.body so it lives
  // OUTSIDE this component's parent stacking context (the mascot's
  // z-[10010] fixed container). If the scrim renders as a sibling of
  // the bubble inside that container, its z-[10009] wins vs. the
  // bubble's auto z-index — the scrim ends up ON TOP of the bubble
  // and Sparky, so the user sees a full black viewport with no
  // dialogue. Portaling escapes the stacking context and lets the
  // fixed inset-0 + z-[9998] genuinely sit UNDERNEATH the bubble
  // (z-[10010]) and Sparky (z-[10011]).
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => {
    setPortalReady(true);
  }, []);
  const scrim =
    isIntroDialogue && portalReady && typeof document !== "undefined"
      ? createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            aria-hidden
            className="fixed inset-0 z-[9998] pointer-events-none"
            style={{ background: "#000000" }}
          />,
          document.body,
        )
      : null;

  return (
    <>
      {scrim}
      <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      // Bubble container is pointer-events:none so clicks pass through
      // to whatever's underneath (e.g. the combat "Attack" button
      // that lived beneath Sparky). The primary/skip action buttons
      // below re-enable pointer-events on themselves so they still
      // work. Fixes "attack button not working on tutorial".
      className={`relative pointer-events-none ${fullWidth ? "w-full" : "w-[260px]"}`}
    >
      <div
        className="relative rounded-2xl px-5 py-4 shadow-xl"
        style={{
          background: bubbleBg,
          boxShadow: "0 10px 30px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
        }}
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
            // Position + rotation per side. The 4-square is centered on
            // the bubble's outer edge so half pokes out. Amber outline
            // dropped per product ask ("remove the golden border") —
            // the tail is now just a rotated square sharing the
            // bubble's fill colour, no rim.
            if (tailDirection === "right") {
              return {
                top: "62%",
                right: "0px",
                transform: "translate(50%, -50%) rotate(45deg)",
                background: bubbleBg,
              };
            }
            if (tailDirection === "left") {
              return {
                top: "62%",
                left: "0px",
                transform: "translate(-50%, -50%) rotate(45deg)",
                background: bubbleBg,
              };
            }
            if (tailDirection === "top") {
              // top — bubble sits BELOW Sparky, tail points UP.
              return {
                top: "0px",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(45deg)",
                background: bubbleBg,
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
              background: bubbleBg,
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
        {/* Secondary action ("Skip tutorial") REMOVED per product
            request. The tutorial can no longer be skipped from
            inside Sparky's speech bubble. `secondaryAction` prop
            still accepted for backward compat but never rendered. */}
        <AnimatePresence>
          {done && primaryAction && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              className="mt-3 flex items-center justify-between gap-3"
            >
              <span />
              {/* secondaryAction intentionally not rendered — see above. */}
              {secondaryAction ? null : null}
              {primaryAction && (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  // pointer-events-auto opts this button back in
                  // (bubble container is now pointer-events-none).
                  className="pointer-events-auto ml-auto inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:from-amber-500 active:to-amber-600 text-white text-sm font-bold px-4 py-2 shadow-md hover:shadow-lg transition-all touch-manipulation"
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
    </>
  );
}
