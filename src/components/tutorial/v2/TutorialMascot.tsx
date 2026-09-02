"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TutorialSpeechBubble } from "./TutorialSpeechBubble";
import { AnimatedSparky } from "./puppy/AnimatedSparky";
import { acquireBodyScrollLock } from "@/lib/ui/bodyScrollLock";

export type SparkyMood = "idle" | "talking" | "pointing" | "celebrating";

/**
 * Play the tutorial "Continue" win-chime for exactly 1 second.
 *
 * We create a lazy singleton HTMLAudioElement so hot subsequent clicks
 * don't spawn dozens of Audio nodes. On each click we rewind to 0 and
 * schedule a pause at t=1s. Any errors (autoplay policy, missing file)
 * are swallowed — the sound is nice-to-have, never blocking.
 */
let __tutorialContinueAudio: HTMLAudioElement | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function playContinueSound(): void {
  if (typeof window === "undefined") return;
  try {
    if (!__tutorialContinueAudio) {
      __tutorialContinueAudio = new Audio("/audio/tutorial/continue.mp3");
      __tutorialContinueAudio.preload = "auto";
      __tutorialContinueAudio.volume = 0.55;
    }
    const audio = __tutorialContinueAudio;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      /* browser autoplay policy — first click will unlock */
    });
    // Trim to 1 second so users get a punchy chime rather than the full
    // ~6-second winner jingle from Freesound.
    window.setTimeout(() => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* no-op */
      }
    }, 1000);
  } catch {
    /* no-op */
  }
}

interface TutorialMascotProps {
  visible: boolean;
  text: string;
  mood?: SparkyMood;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  /**
   * Fallback anchor when no target selector is set / target isn't found.
   * "center" pins Sparky to the true middle of the viewport — used for
   * the very first intro pitch so he doesn't sit tucked in a corner.
   */
  anchor?: "bottom-right" | "bottom-center" | "bottom-left" | "center";
  /**
   * CSS selector for the on-screen element Sparky should stand next to.
   * When provided, Sparky floats near that element and the bubble is
   * placed on the *outside* of Sparky (away from the target) so it
   * doesn't cover what the user is trying to interact with.
   */
  nearSelector?: string | null;
  /**
   * Opt out of the click-blocking scrim. Useful when the tutorial step
   * needs the user to scroll and freely interact with a whole surface
   * (e.g. the contribute step highlights every Contribute button on
   * the feed and lets the user browse). Defaults to false.
   */
  noScrim?: boolean;
  /**
   * When true, Sparky's idle-triggered ROLL animation is suppressed and
   * he stays IDLE. Used during high-focus activities (AI combat, task
   * writing) where a rolling puppy would distract the user.
   */
  suppressRoll?: boolean;
  /**
   * MOBILE ONLY — force the compact "corner" layout (small Sparky with a
   * bubble beside him, tucked at the highlighted modal's top-right)
   * instead of the full-width centered/hugging stack. Set this on steps
   * where the user types into a field: the full-width stack either covers
   * the textarea or gets shoved onto it when the on-screen keyboard opens.
   * The corner layout also auto-engages whenever a keyboard is detected,
   * so this prop mainly controls the keyboard-DOWN state of typing steps.
   */
  mobileCorner?: boolean;
  /**
   * MOBILE ONLY — always hug the highlighted target instead of letting the
   * centre-vs-hug heuristic decide.
   *
   * That heuristic centres the stack whenever a centred group wouldn't
   * physically overlap the target. For a target near the bottom edge (the
   * saddlebag button in the map HUD) it never overlaps, so Sparky sat in
   * the middle of the screen pointing at something far below him. Steps
   * whose target lives at an edge set this to keep him next to it.
   */
  mobileHugTarget?: boolean;
}

// ─── Size constants (must match rendered widths) ─────────────────────────────
const SPARKY_W = 170;
const SPARKY_H = 170;
const BUBBLE_W = 260;         // matches TutorialSpeechBubble w-[260px]
const BUBBLE_H_EST = 180;     // rough max estimate; used for fit checks
const GAP = 12;               // gap between group and target
const INNER_GAP = 16;         // gap between bubble and Sparky (base value)
// When the bubble is flipped-above Sparky, shift its bottom edge a
// few pixels closer to his head so the group reads tightly grouped —
// but MUST stay < INNER_GAP so the bubble never lands INSIDE Sparky.
// bubble.top (flipped) = sparkyTop - INNER_GAP + BUBBLE_FLIP_DOWNSHIFT
// so the final gap between bubble bottom and Sparky top edge is
// (INNER_GAP - BUBBLE_FLIP_DOWNSHIFT). Setting downshift = 8 keeps
// an ~8px visible gap so the tail tip reads as pointing AT Sparky
// instead of being embedded in his forehead.
// Previous value of 37 overshot INNER_GAP by 21px, causing the
// bubble to physically overlap Sparky on steps like the saddlebag
// tutorial hint (product feedback: "Sparky and bubble are
// overlapping"). Anything ≥ INNER_GAP re-introduces that bug.
const BUBBLE_FLIP_DOWNSHIFT = 8;
const VIEWPORT_MARGIN = 12;

// Mobile
const MOBILE_BREAKPOINT = 640; // px — below this we switch layouts
const SPARKY_SIZE_MOBILE = 90; // small enough to peek above a full-width bubble
// Intro beat gets a larger Sparky — he's the focal point of the first
// hello (no highlight target competing for attention), and the docked
// 90px felt undersized there (product feedback: "a touch too small in
// the first intro").
const SPARKY_SIZE_MOBILE_INTRO = 124;
// Compact side-by-side sizes for the "corner" layout used on typing
// steps (Describe Your Idea): small enough to tuck beside the modal
// without covering the textarea, and smaller still while the on-screen
// keyboard is up and vertical room is scarce.
const SPARKY_SIZE_MOBILE_CORNER = 84;      // keyboard down
const SPARKY_SIZE_MOBILE_CORNER_KBD = 58;  // keyboard up

/**
 * How far to lift the corner group above the highlighted box when the
 * on-screen keyboard is DOWN.
 *
 * Anchored flush to the modal's top edge, Sparky and his bubble sat over
 * the content the step is asking the user to read. With the keyboard down
 * there is plenty of room above, so use it. ~2.5cm: a CSS px is
 * density-independent and 1cm is about 37.8 of them.
 *
 * Keyboard UP is deliberately left alone -- vertical room is scarce
 * there, and the existing placement is what keeps him on screen at all.
 */
const CORNER_LIFT_KEYBOARD_DOWN_PX = 94;
const BUBBLE_BOTTOM_INSET_MOBILE = 12; // gap from viewport bottom
/** Dock inset for hug beats: clears the map's bottom HUD bar (~90px), so
 *  the bubble sits just above the control it is pointing at instead of on
 *  top of it. */
const HUG_DOCK_BOTTOM_INSET_MOBILE = 96;
const BUBBLE_SIDE_INSET_MOBILE = 12;   // left/right insets

type Side = "right" | "left" | "below" | "above";

interface Placement {
  sparky: { left: number; top: number };
  bubble: { left: number; top: number };
  side: Side;
  /** Which side of the BUBBLE Sparky sits on — drives the tail direction */
  bubbleTailSide: "left" | "right" | "top" | "bottom";
  /** When true, bubble is rendered with `transform: translateY(-100%)` so
   *  its BOTTOM edge lands at bubble.top. Used for "stack above Sparky"
   *  fallbacks so the bubble sits INNER_GAP above Sparky regardless of
   *  its actual rendered height (avoiding a large visual gap when the
   *  height estimate is too generous). */
  bubbleFlipToBottom?: boolean;
}

interface FollowResult {
  placement: Placement | null;
  /** Client-rect of the highlighted target, used to punch a hole in the
   *  scrim so the user can still interact with it. */
  targetRect: { left: number; top: number; right: number; bottom: number } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Compute independent absolute positions for Sparky + bubble so neither
// overlaps the highlighted target. Two separate positions eliminates any
// ambiguity from flex layout / motion.div interactions.
// Also returns the raw target rect so the scrim can punch a hole around it.
// ─────────────────────────────────────────────────────────────────────────────
function useFollowTarget(selector: string | null | undefined): FollowResult {
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [targetRect, setTargetRect] = useState<FollowResult["targetRect"]>(null);

  useEffect(() => {
    if (!selector || typeof window === "undefined") {
      setPlacement(null);
      setTargetRect(null);
      return;
    }

    let rafId = 0;
    let element: Element | null = null;

    // STICKINESS: if the target briefly disappears (React re-render, mobile
    // responsive switch, transient 0×0 rect during layout), don't immediately
    // clear the placement — that causes Sparky to snap from beside the target
    // all the way to the bottom-right corner (fallback mode), which reads as
    // a violent jitter. Instead we keep the last-known placement alive for
    // GRACE_MS. If the target reappears within the window Sparky stays put;
    // only after sustained absence do we actually clear.
    const GRACE_MS = 700;
    let lastGoodAt = 0;
    let hasEverPlaced = false;

    const clearIfStale = () => {
      // Nothing to be sticky about yet — clear immediately.
      if (!hasEverPlaced) {
        setPlacement(null);
        setTargetRect(null);
        return;
      }
      // Grace window still open — keep prior placement so Sparky doesn't
      // teleport to the corner. The rAF loop will retry on the next frame.
      if (Date.now() - lastGoodAt < GRACE_MS) {
        return;
      }
      // Target truly gone — release.
      setPlacement(null);
      setTargetRect(null);
    };

    // Prefer the first VISIBLE match — a comma-separated selector can hit
    // hidden responsive variants (e.g. mobile-only compose button), which
    // return a 0×0 rect and would otherwise fail the size check below.
    const pickVisible = (): Element | null => {
      const all = document.querySelectorAll(selector);
      for (const el of Array.from(all)) {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return el;
      }
      return null;
    };

    const recompute = () => {
      if (!element || !(element as Element).isConnected) {
        element = pickVisible();
      }
      if (!element) {
        clearIfStale();
        return;
      }
      let rect = element.getBoundingClientRect();
      // Element might be present but hidden (display:none / hidden variant
      // switched by responsive layout). Re-query for a visible sibling.
      if (rect.width === 0 || rect.height === 0) {
        element = pickVisible();
        if (!element) {
          clearIfStale();
          return;
        }
        rect = element.getBoundingClientRect();
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Skip: target tiny / off-screen / dominates viewport
      if (rect.width < 4 || rect.height < 4) {
        clearIfStale();
        return;
      }
      if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) {
        clearIfStale();
        return;
      }

      // Always update targetRect so the scrim can punch a hole around it,
      // even for very large targets where placement itself falls back.
      // Use the same 3px tolerance as placement to avoid pointless re-renders
      // that ripple through the scrim + Sparky's animated position at 60Hz.
      setTargetRect((prev) => {
        const next = {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
        };
        if (
          prev &&
          Math.abs(prev.left - next.left) < 3 &&
          Math.abs(prev.top - next.top) < 3 &&
          Math.abs(prev.right - next.right) < 3 &&
          Math.abs(prev.bottom - next.bottom) < 3
        ) {
          return prev;
        }
        return next;
      });

      if (rect.width > vw * 0.75 && rect.height > vh * 0.6) {
        // Target is too big for a normal beside/below spotlight — this
        // happens when the tutorial points at a full-viewport panel
        // (e.g. AI Combat modal at inset-0). Do NOT clear targetRect:
        // the scrim needs a valid rect so its 4-strip cutout collapses
        // to zero-size strips around the whole viewport — without a
        // rect it falls back to a full-screen click blocker that
        // makes the underlying panel unusable (user complaint: "not
        // able to scroll and type to complete ai combat"). We only
        // skip the placement calculation for Sparky's position;
        // Sparky then renders in the bottom-right corner via fallback.
        setPlacement(null);
        // Mark that we DID have a valid measurement this tick so the
        // grace-window doesn't fight this state.
        lastGoodAt = Date.now();
        hasEverPlaced = true;
        return;
      }

      // Only require SPARKY himself to fit on the chosen side — the
      // bubble is placed flexibly afterward (further out, or perpendicular
      // to Sparky if there's no room straight out). This keeps beside
      // placement working even when margins are tight.
      const sparkyNeedH = SPARKY_W + GAP + VIEWPORT_MARGIN;
      const sparkyNeedV = SPARKY_H + GAP + VIEWPORT_MARGIN;

      const spaceRight = vw - rect.right;
      const spaceLeft = rect.left;
      const spaceBelow = vh - rect.bottom;
      const spaceAbove = rect.top;

      // Preference: beside (right → left) → below → above.
      // Beside placement keeps Sparky at the target's eye-level without
      // covering headings or adjacent form fields.
      const preference: Side[] = ["right", "left", "below", "above"];

      const spaceFor = (s: Side) =>
        s === "right"
          ? spaceRight
          : s === "left"
            ? spaceLeft
            : s === "below"
              ? spaceBelow
              : spaceAbove;

      const neededFor = (s: Side) =>
        s === "right" || s === "left" ? sparkyNeedH : sparkyNeedV;

      let side: Side = preference[0];
      let chosen = false;
      for (const s of preference) {
        if (spaceFor(s) >= neededFor(s)) {
          side = s;
          chosen = true;
          break;
        }
      }
      if (!chosen) {
        // Nothing fits even for Sparky alone — pick least-overflowing side
        let best = -Infinity;
        for (const s of preference) {
          const score = spaceFor(s) - neededFor(s);
          if (score > best) {
            best = score;
            side = s;
          }
        }
      }

      const targetCenterY = rect.top + rect.height / 2;
      const targetCenterX = rect.left + rect.width / 2;

      let sparkyLeft = 0, sparkyTop = 0, bubbleLeft = 0, bubbleTop = 0;
      // bubbleTailSide records which side of the bubble Sparky ends up on
      // so the tail can be drawn correctly even when bubble is fallback-placed.
      let bubbleTailSide: "left" | "right" | "top" | "bottom" = "left";
      // Flip-to-bottom: bubbleTop anchors the bubble's BOTTOM edge (via
      // translateY(-100%) at render time). Used for "stack above" fallbacks
      // so the bubble sits tight to Sparky's head, not a rough estimate away.
      let bubbleFlipToBottom = false;

      if (side === "right") {
        sparkyLeft = rect.right + GAP;
        sparkyTop = targetCenterY - SPARKY_H / 2;
        // PREFERRED: bubble ABOVE Sparky. Threshold is intentionally
        // permissive (just enough room for the tail + a bit of bubble)
        // — if the bubble would overflow the viewport top, the browser
        // + clamping keeps it visible. The alternative (side-by-side)
        // pushes the bubble far off-frame on narrow layouts.
        const fitsAbove = sparkyTop >= VIEWPORT_MARGIN + 40;
        if (fitsAbove) {
          bubbleLeft = sparkyLeft + SPARKY_W / 2 - BUBBLE_W / 2;
          bubbleTop = sparkyTop - INNER_GAP + BUBBLE_FLIP_DOWNSHIFT;
          bubbleFlipToBottom = true;
          bubbleTailSide = "bottom"; // Sparky under bubble
        } else {
          // No room above — try further right (side-by-side)
          const wanted = sparkyLeft + SPARKY_W + INNER_GAP;
          if (wanted + BUBBLE_W + VIEWPORT_MARGIN <= vw) {
            bubbleLeft = wanted;
            bubbleTop = targetCenterY - BUBBLE_H_EST / 2;
            bubbleTailSide = "left";
          } else {
            // Last resort — stack below Sparky
            bubbleLeft = sparkyLeft + SPARKY_W / 2 - BUBBLE_W / 2;
            bubbleTop = sparkyTop + SPARKY_H + INNER_GAP;
            bubbleTailSide = "top";
          }
        }
      } else if (side === "left") {
        // Extra 1cm gap on the LEFT side. When targets sit on the right
        // half of the viewport (e.g. checkpoint panel on /map/world),
        // Sparky reads better a little further from the panel edge.
        sparkyLeft = rect.left - GAP - SPARKY_W - 37;
        sparkyTop = targetCenterY - SPARKY_H / 2;
        const fitsAbove = sparkyTop >= VIEWPORT_MARGIN + 40;
        if (fitsAbove) {
          bubbleLeft = sparkyLeft + SPARKY_W / 2 - BUBBLE_W / 2;
          bubbleTop = sparkyTop - INNER_GAP + BUBBLE_FLIP_DOWNSHIFT;
          bubbleFlipToBottom = true;
          bubbleTailSide = "bottom";
        } else {
          const wanted = sparkyLeft - INNER_GAP - BUBBLE_W;
          if (wanted >= VIEWPORT_MARGIN) {
            bubbleLeft = wanted;
            bubbleTop = targetCenterY - BUBBLE_H_EST / 2;
            bubbleTailSide = "right";
          } else {
            bubbleLeft = sparkyLeft + SPARKY_W / 2 - BUBBLE_W / 2;
            bubbleTop = sparkyTop + SPARKY_H + INNER_GAP;
            bubbleTailSide = "top";
          }
        }
      } else if (side === "below") {
        sparkyLeft = targetCenterX - SPARKY_W / 2;
        sparkyTop = rect.bottom + GAP;
        // Bubble: try further below Sparky
        const wanted = sparkyTop + SPARKY_H + INNER_GAP;
        if (wanted + BUBBLE_H_EST + VIEWPORT_MARGIN <= vh) {
          bubbleLeft = targetCenterX - BUBBLE_W / 2;
          bubbleTop = wanted;
          bubbleTailSide = "top"; // Sparky above bubble
        } else {
          // No room — place bubble beside Sparky
          bubbleTop = sparkyTop + SPARKY_H / 2 - BUBBLE_H_EST / 2;
          if (rect.left + rect.width + BUBBLE_W + VIEWPORT_MARGIN <= vw) {
            bubbleLeft = sparkyLeft + SPARKY_W + INNER_GAP;
            bubbleTailSide = "left";
          } else {
            bubbleLeft = sparkyLeft - INNER_GAP - BUBBLE_W;
            bubbleTailSide = "right";
          }
        }
      } else {
        // above — Sparky above target, bubble above Sparky
        sparkyLeft = targetCenterX - SPARKY_W / 2;
        sparkyTop = rect.top - GAP - SPARKY_H;
        // Bubble: try further above Sparky. Flip-to-bottom so bubble
        // sits tight to Sparky's head.
        bubbleLeft = targetCenterX - BUBBLE_W / 2;
        bubbleTop = sparkyTop - INNER_GAP + BUBBLE_FLIP_DOWNSHIFT;
        bubbleFlipToBottom = true;
        bubbleTailSide = "bottom"; // Sparky below bubble
        // If placing above would go off-screen, fall back to beside
        if (sparkyTop - INNER_GAP - BUBBLE_H_EST < VIEWPORT_MARGIN) {
          bubbleTop = sparkyTop + SPARKY_H / 2 - BUBBLE_H_EST / 2;
          bubbleFlipToBottom = false;
          if (rect.left + rect.width + BUBBLE_W + VIEWPORT_MARGIN <= vw) {
            bubbleLeft = sparkyLeft + SPARKY_W + INNER_GAP;
            bubbleTailSide = "left";
          } else {
            bubbleLeft = sparkyLeft - INNER_GAP - BUBBLE_W;
            bubbleTailSide = "right";
          }
        }
      }

      // Clamp both to viewport (each independently)
      sparkyLeft = Math.max(
        VIEWPORT_MARGIN,
        Math.min(sparkyLeft, vw - SPARKY_W - VIEWPORT_MARGIN),
      );
      sparkyTop = Math.max(
        VIEWPORT_MARGIN,
        Math.min(sparkyTop, vh - SPARKY_H - VIEWPORT_MARGIN),
      );
      bubbleLeft = Math.max(
        VIEWPORT_MARGIN,
        Math.min(bubbleLeft, vw - BUBBLE_W - VIEWPORT_MARGIN),
      );
      if (bubbleFlipToBottom) {
        // bubbleTop anchors the BOTTOM edge — bubble extends UP by its
        // rendered height (~BUBBLE_H_EST). Ensure the bubble's top edge
        // stays within the viewport by keeping bubbleTop >= BUBBLE_H_EST + margin.
        bubbleTop = Math.max(
          BUBBLE_H_EST + VIEWPORT_MARGIN,
          Math.min(bubbleTop, vh - VIEWPORT_MARGIN),
        );
      } else {
        bubbleTop = Math.max(
          VIEWPORT_MARGIN,
          Math.min(bubbleTop, vh - BUBBLE_H_EST - VIEWPORT_MARGIN),
        );
      }

      const next: Placement = {
        sparky: { left: sparkyLeft, top: sparkyTop },
        bubble: { left: bubbleLeft, top: bubbleTop },
        side,
        bubbleTailSide,
        bubbleFlipToBottom,
      };

      // Placement is valid — mark the grace-window anchor so any brief
      // future "target missing" state won't immediately blow us back to
      // fallback mode.
      lastGoodAt = Date.now();
      hasEverPlaced = true;

      // JITTER-DAMPING: motion springs make tiny sub-pixel deltas
      // visible as constant micro-shake because the rAF loop
      // recomputes at 60fps against layout that itself moves 1-2px
      // per frame (target has its own transitions, page paints, etc).
      // Bump the tolerance from 0.5px to 3px so only meaningful moves
      // trigger a state update.
      const DELTA_PX = 3;

      setPlacement((prev) => {
        if (
          prev &&
          prev.side === next.side &&
          prev.bubbleTailSide === next.bubbleTailSide &&
          !!prev.bubbleFlipToBottom === !!next.bubbleFlipToBottom &&
          Math.abs(prev.sparky.left - next.sparky.left) < DELTA_PX &&
          Math.abs(prev.sparky.top - next.sparky.top) < DELTA_PX &&
          Math.abs(prev.bubble.left - next.bubble.left) < DELTA_PX &&
          Math.abs(prev.bubble.top - next.bubble.top) < DELTA_PX
        ) {
          return prev;
        }
        return next;
      });
    };

    recompute();
    const tick = () => {
      recompute();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onResize = () => recompute();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [selector]);

  return { placement, targetRect };
}

// ─────────────────────────────────────────────────────────────────────────────
// Scrim — blocks all clicks on the page except the highlighted target and
// the Sparky bubble. Rendered as 4 rectangles (top/bottom/left/right of the
// target hole) so pointer events on the target itself still work.
// ─────────────────────────────────────────────────────────────────────────────
function TutorialScrim({
  targetRect,
}: {
  targetRect: FollowResult["targetRect"];
}) {
  const [dims, setDims] = useState(() =>
    typeof window !== "undefined"
      ? { vw: window.innerWidth, vh: window.innerHeight }
      : { vw: 0, vh: 0 },
  );

  useEffect(() => {
    const onResize = () =>
      setDims({ vw: window.innerWidth, vh: window.innerHeight });
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const base: React.CSSProperties = {
    position: "fixed",
    zIndex: 10005,
    background: "transparent",
    // Auto captures clicks; page beneath is inert
    pointerEvents: "auto",
  };

  // Swallow clicks / prevent accidental page interactions
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  if (!targetRect) {
    // No target — one full-screen overlay blocking everything
    return (
      <div
        aria-hidden
        onClick={onClick}
        onPointerDown={onClick}
        style={{ ...base, inset: 0 }}
      />
    );
  }

  // Small padding around the target so the highlight ring sits inside the hole
  const PAD = 4;
  const t = Math.max(0, targetRect.top - PAD);
  const b = Math.min(dims.vh, targetRect.bottom + PAD);
  const l = Math.max(0, targetRect.left - PAD);
  const r = Math.min(dims.vw, targetRect.right + PAD);

  // If the highlighted target fills the viewport (e.g. full-screen
  // combat modal), don't render any scrim strips at all — even 0-size
  // strips can intercept wheel/scroll events on some browsers and
  // block the user from scrolling inside the panel.
  const coversAll =
    t <= 0.5 &&
    l <= 0.5 &&
    b >= dims.vh - 0.5 &&
    r >= dims.vw - 0.5;
  if (coversAll) {
    return null;
  }

  return (
    <>
      {/* Top strip */}
      <div
        aria-hidden
        onClick={onClick}
        onPointerDown={onClick}
        style={{ ...base, left: 0, top: 0, width: "100vw", height: t }}
      />
      {/* Bottom strip */}
      <div
        aria-hidden
        onClick={onClick}
        onPointerDown={onClick}
        style={{ ...base, left: 0, top: b, width: "100vw", bottom: 0 }}
      />
      {/* Left strip */}
      <div
        aria-hidden
        onClick={onClick}
        onPointerDown={onClick}
        style={{ ...base, left: 0, top: t, width: l, height: b - t }}
      />
      {/* Right strip */}
      <div
        aria-hidden
        onClick={onClick}
        onPointerDown={onClick}
        style={{ ...base, left: r, top: t, right: 0, height: b - t }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function TutorialMascot({
  visible,
  text,
  mood = "talking",
  primaryAction,
  secondaryAction,
  anchor = "bottom-right",
  nearSelector = null,
  noScrim = false,
  suppressRoll = false,
  mobileCorner = false,
  mobileHugTarget = false,
}: TutorialMascotProps): ReactElement | null {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Track whether a combat modal OR a route-transition overlay is
  // currently on screen — we hide the global Sparky mascot in either
  // case. Combat has its own inline Sparky sprite in the arena; the
  // route-loading overlays (e.g. /map/world's "Entering the World...")
  // aren't tutorial surfaces and shouldn't flash Sparky for the ~1s
  // the loading screen is up.
  //
  // A parent renders `data-tutorial="combat-panel"` on the combat
  // wrapper; a route-transition overlay renders `data-tutorial-hide=
  // "true"` on its root. Both are observed via MutationObserver on
  // <body> so Sparky snaps back the instant they close.
  // Lazy-init from the current DOM state so if a suppress-overlay is
  // already on screen when this component mounts (e.g. the /map/world
  // page is loaded directly with the "Entering the World…" loader
  // already painted), we start in the suppressed state — no one-frame
  // race where Sparky peeks through before the useEffect runs.
  const [suppressedByOverlay, setSuppressedByOverlay] = useState(() => {
    if (typeof document === "undefined") return false;
    return !!document.querySelector(
      '[data-tutorial="combat-panel"], [data-tutorial-hide="true"], [data-boss-intro="active"]',
    );
  });
  // useLayoutEffect (not useEffect) so the observer subscription
  // happens BEFORE the browser paints the first frame. Combined with
  // the lazy initializer above this closes the last frame-race window
  // that let Sparky flash on top of a legitimately-hidden route.
  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const check = () => {
      setSuppressedByOverlay(
        !!document.querySelector(
          '[data-tutorial="combat-panel"], [data-tutorial-hide="true"], [data-boss-intro="active"]',
        ),
      );
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-tutorial",
        "data-tutorial-hide",
        "data-boss-intro",
      ],
    });
    return () => observer.disconnect();
  }, []);

  // Debounced-visible gate — prevents the "1-2s Sparky flash" bug
  // where a step's `visible` briefly flips true during a route change
  // (pathname updates before the destination page's tutorial state
  // resolves), then flips back to false. If visible turns true and
  // then turns false again within this window, Sparky never mounts.
  // Only sustained visibility (>=DEBOUNCE_MS) actually paints.
  const DEBOUNCE_MS = 500;
  const [visibleStable, setVisibleStable] = useState(false);
  useEffect(() => {
    if (!visible) {
      // Immediate hide — no debounce on the way out so exits stay snappy.
      setVisibleStable(false);
      return;
    }
    const timer = window.setTimeout(() => setVisibleStable(true), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [visible]);

  // ── Text stability gate ───────────────────────────────────────────────
  // The mount debounce (`visibleStable`) only fires on visible false→true.
  // Once mounted, any `text` change fires the typewriter effect below
  // synchronously — which meant transitional copy (e.g. Step2's
  // "Cool. Posting your idea now…" swapping out ~400ms later) would
  // still paint a partial line before being replaced. `stableText`
  // debounces the incoming text prop by the same window: only text
  // that survives ≥DEBOUNCE_MS ever becomes the active speech string.
  // Clears immediately when text becomes empty so exits are snappy.
  const TEXT_DEBOUNCE_MS = 400;
  const [stableText, setStableText] = useState<string>(() => text || "");
  useEffect(() => {
    if (!text) {
      setStableText("");
      return;
    }
    if (text === stableText) return;
    const timer = window.setTimeout(
      () => setStableText(text),
      TEXT_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
    // stableText intentionally excluded — we don't want to reset the
    // timer on our own setState update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // ── Talk trigger — set while the speech bubble is still typing ────────
  const [isTyping, setIsTyping] = useState(false);
  useEffect(() => {
    if (!visible || !stableText) {
      setIsTyping(false);
      return;
    }
    setIsTyping(true);
    const TYPE_SPEED_MS = 24;
    const INITIAL_DELAY_MS = 80;
    const totalDurationMs =
      INITIAL_DELAY_MS + stableText.length * TYPE_SPEED_MS;
    const timer = window.setTimeout(() => setIsTyping(false), totalDurationMs);
    return () => window.clearTimeout(timer);
  }, [stableText, visible]);

  // ── Cheer trigger — increments on Continue click or mood="celebrating"
  const [cheerTick, setCheerTick] = useState(0);
  const lastCelebratingRef = useRef(false);
  useEffect(() => {
    if (mood === "celebrating" && !lastCelebratingRef.current) {
      setCheerTick((n) => n + 1);
      lastCelebratingRef.current = true;
    } else if (mood !== "celebrating") {
      lastCelebratingRef.current = false;
    }
  }, [mood]);

  const wrappedPrimary = primaryAction
    ? {
        label: primaryAction.label,
        onClick: () => {
          setCheerTick((n) => n + 1);
          // Continue-chime disabled per product ask ("remove the music
          // that is in continue button in tutorial"). The
          // playContinueSound helper stays defined above so it can be
          // re-enabled with one line if we want it back.
          primaryAction.onClick();
        },
      }
    : undefined;

  // Follow-target only wires up once Sparky is *actually* going to
  // render — same debounce-gate as the portal below — so the rAF
  // measurement loop doesn't spin during the 500ms flash window.
  const willActuallyRender = visible && visibleStable && !suppressedByOverlay;
  const { placement, targetRect } = useFollowTarget(
    willActuallyRender ? nearSelector : null,
  );

  // ── Track viewport width AND height so we can switch to a mobile layout
  //    on narrow screens AND make dock decisions using the *visible* viewport.
  //
  //    iOS Safari's dynamic URL bar changes window.innerHeight as the user
  //    scrolls — reading innerHeight directly makes the Sparky dock flip
  //    from bottom→top→bottom every time the address bar collapses or
  //    expands. `visualViewport` reflects the true visible area and fires
  //    resize/scroll events for both toolbar changes AND on-screen keyboard
  //    open/close on both iOS and Android.
  const readVw = () =>
    typeof window !== "undefined"
      ? (window.visualViewport?.width ?? window.innerWidth)
      : 1024;
  const readVh = () =>
    typeof window !== "undefined"
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 800;
  // On-screen keyboard height = how much the layout viewport exceeds the
  // visible one. > ~120px means a keyboard (not just the URL bar) is up.
  const readKbInset = () =>
    typeof window !== "undefined" && window.visualViewport
      ? Math.max(
          0,
          window.innerHeight -
            window.visualViewport.height -
            window.visualViewport.offsetTop,
        )
      : 0;
  // Distance from the top of the LAYOUT viewport to the top of the VISIBLE
  // one. Non-zero whenever iOS shifts the page up to keep a focused input
  // above the keyboard. `position: fixed` coordinates are layout-viewport
  // relative, so any fixed element positioned purely from `vh` renders
  // OUTSIDE the visible window once this is non-zero — that is what made
  // Sparky and his bubble vanish the moment the keyboard opened on the
  // "Describe your idea" and flare steps.
  const readVvTop = () =>
    typeof window !== "undefined"
      ? (window.visualViewport?.offsetTop ?? 0)
      : 0;
  const [vw, setVw] = useState<number>(readVw);
  const [vh, setVh] = useState<number>(readVh);
  const [kbInset, setKbInset] = useState<number>(readKbInset);
  const [vvTop, setVvTop] = useState<number>(readVvTop);
  useEffect(() => {
    const onResize = () => {
      setVw(readVw());
      setVh(readVh());
      setKbInset(readKbInset());
      setVvTop(readVvTop());
    };
    window.addEventListener("resize", onResize, { passive: true });
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", onResize, { passive: true });
      vv.addEventListener("scroll", onResize, { passive: true });
    }
    return () => {
      window.removeEventListener("resize", onResize);
      if (vv) {
        vv.removeEventListener("resize", onResize);
        vv.removeEventListener("scroll", onResize);
      }
    };
  }, []);
  const isMobile = vw < MOBILE_BREAKPOINT;
  const keyboardOpen = kbInset > 120;

  // ── Mobile only: scroll the highlighted target into the upper half of
  //    the viewport when the selector changes, so the fixed-bottom bubble
  //    never covers what the user is meant to interact with.
  useEffect(() => {
    if (!isMobile || !visible || !nearSelector) return;
    // Give the DOM a tick to mount whatever this step targets
    const t = window.setTimeout(() => {
      const el = document.querySelector(nearSelector);
      if (el && "scrollIntoView" in el) {
        (el as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 60);
    return () => window.clearTimeout(t);
  }, [isMobile, nearSelector, visible]);

  // ── Desktop only: lock body scroll while the tutorial is visible so the
  //    user can't scroll the page away from the highlighted target.
  //    Uses the reference-counted acquireBodyScrollLock helper so nesting
  //    with Radix Dialogs / celebration overlays doesn't corrupt state.
  //
  //    SKIP the lock when noScrim=true — those steps (contribute, flare)
  //    explicitly need the user to scroll and browse the feed. Locking
  //    body scroll on those steps was making it impossible to reach any
  //    idea below the fold.
  useEffect(() => {
    if (!visible || isMobile || noScrim) return;
    const release = acquireBodyScrollLock();
    return release;
  }, [visible, isMobile, noScrim]);

  if (!mounted) return null;

  // Hide Sparky while any suppress-overlay is on screen (combat modal
  // or a route-transition loader — see `suppressedByOverlay` above).
  // These surfaces either have their own inline Sparky or aren't
  // tutorial contexts at all, so the global puppy would either
  // duplicate or flash for 1-2s during navigation.
  if (suppressedByOverlay) return null;

  // Sparky only renders after `visible` has been stable for
  // DEBOUNCE_MS (see `visibleStable` above). Every read of the
  // effective visible flag below routes through this so brief
  // route-transition flashes never mount the puppy or its bubble.
  const effectiveVisible = visible && visibleStable;

  // Speech + bubble content read from `stableText` (debounced), not
  // the raw `text` prop, so transitional strings that get replaced
  // within TEXT_DEBOUNCE_MS never paint. This is what stops
  // "Cool. Posting your idea now…" flashing during the ~400ms window
  // between the compose wizard closing and the SuggestedContributors
  // modal mounting.
  const activeSpeech =
    effectiveVisible && stableText && isTyping ? stableText : null;
  const isFollowing = placement !== null;

  // Only render the speech-bubble frame when there's actual content to
  // put inside it — text OR an action button. Otherwise (e.g. the boss
  // is speaking and Sparky is intentionally silent) we suppress the
  // bubble entirely so users don't see an empty white card floating
  // above the puppy.
  const hasBubbleContent =
    !!(stableText && stableText.trim().length > 0) ||
    !!primaryAction ||
    !!secondaryAction;

  // Bubble tail side comes directly from placement — it accounts for
  // cases where the bubble had to be perpendicular-stacked instead of
  // on the natural side (e.g. Sparky on the left with no room for
  // bubble further left → bubble stacks above/below Sparky).
  const bubbleSide: "left" | "right" | "bottom" | "top" =
    placement?.bubbleTailSide ?? "bottom";

  // For "center" mode the outer wrapper uses different positioning
  // (inset-0 + flex-center) so we don't apply bottom-N/anchorClass to
  // it. See the fallback branch below.
  const anchorClass =
    anchor === "bottom-right"
      ? "right-4 sm:right-6"
      : anchor === "bottom-center"
        ? "left-1/2 -translate-x-1/2"
        : anchor === "center"
          ? "" // handled with inset-0 wrapper below
          : "left-4 sm:left-6";

  const portal = createPortal(
    <AnimatePresence>
      {effectiveVisible && (
        <>
          {/* Typing marker. Sparky's typewriter state is internal, but the
              step components need it -- the map step must not open AI
              combat while Sparky is still mid-sentence introducing the
              boss. Published as a DOM attribute rather than a callback
              prop because the steps already observe this component through
              the DOM (data-tutorial-hide, data-boss-intro), and Sparky is
              rendered through a portal from several call sites. */}
          <span
            data-tutorial-typing={isTyping ? "true" : "false"}
            aria-hidden="true"
            style={{ display: "none" }}
          />
          {/* Scrim — blocks all page clicks except the highlighted target
              and Sparky's bubble. Ensures the user must advance via Sparky's
              Continue button, not via the underlying page controls.
              Skipped entirely when noScrim=true so the tutorial step can
              let the user scroll and interact with the whole page (e.g.
              the contribute step needs the user to browse the feed). */}
          {!noScrim && <TutorialScrim targetRect={targetRect} />}
          {isMobile ? (
            // ── MOBILE LAYOUT ─────────────────────────────────────────
            // Goal (product ask): keep Sparky + his bubble near the
            // VERTICAL CENTER, but tuck the stack right up against
            // whatever is highlighted. Concretely:
            //   • no highlight (intro)            → dead center.
            //   • highlight OUTSIDE the centre    → dead center (the
            //       stack wouldn't cover it — e.g. the "+" button up in
            //       the navbar), so Sparky stays middle-of-screen.
            //   • highlight IN the centre band    → hug it: sit just
            //       BELOW it if there's room, else just ABOVE. This is
            //       what keeps him off centered modals (template picker,
            //       "Describe your idea") while still reading as attached
            //       to them, instead of marooned at the bottom edge.
            //
            // The bubble is full-width (minus side insets); Sparky peeks
            // out of its top edge. `side="top"` points the tail up at him.
            (() => {
              // ── CORNER layout (typing steps) ───────────────────────────
              // Steps where the user types into a field (Describe Your
              // Idea) can't use the full-width stack: it either sits on the
              // textarea or, once the keyboard opens, gets shoved up onto
              // it. Instead put a compact Sparky beside a bubble at the
              // highlighted modal's TOP-RIGHT — near the box, clear of the
              // textarea below it, and above the keyboard. Engages when the
              // step opts in (`mobileCorner`) OR whenever a keyboard is up.
              if (keyboardOpen || mobileCorner) {
                const cornerSize = keyboardOpen
                  ? SPARKY_SIZE_MOBILE_CORNER_KBD
                  : SPARKY_SIZE_MOBILE_CORNER;
                // Anchor to the modal's top edge when we know it, then clamp
                // into the VISIBLE viewport.
                //
                // The clamp used to run against [0, vh] — layout-viewport
                // coordinates measured against a visual-viewport height.
                // The moment iOS shifted the page up to clear the keyboard
                // (vvTop > 0) that window no longer described anything the
                // user could see, and the whole group rendered above the
                // visible area: "Sparky disappears when the keyboard is on".
                // Clamping to [vvTop, vvTop + vh] keeps him on screen in
                // every keyboard state, on iOS and Android alike.
                const cornerGroupH = Math.max(cornerSize, 132);
                // Lift only while the keyboard is down -- see
                // CORNER_LIFT_KEYBOARD_DOWN_PX. Applied BEFORE the clamp so
                // it can never push the group off the top of the visible
                // viewport; on a short screen the clamp simply absorbs it.
                const rawTop =
                  (targetRect ? targetRect.top : vvTop) -
                  (keyboardOpen ? 0 : CORNER_LIFT_KEYBOARD_DOWN_PX);
                const minTop = vvTop + 8;
                const maxTop = Math.max(minTop, vvTop + vh - cornerGroupH - 12);
                const topY = Math.min(Math.max(rawTop, minTop), maxTop);
                return (
                  <div
                    className="pointer-events-none fixed z-[10010] flex justify-end"
                    style={{
                      left: 8,
                      right: 8,
                      // Plain px, not calc(... + safe-area-inset-top). topY is
                      // already an absolute layout-viewport coordinate derived
                      // from getBoundingClientRect / visualViewport, both of
                      // which account for the notch. Adding the inset again
                      // double-counted it and could push the group past the
                      // clamp we just computed.
                      top: `${topY}px`,
                      alignItems: "flex-start",
                      transition: "top 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                      willChange: "top",
                    }}
                  >
                    <motion.div
                      key="mobile-corner"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 260, damping: 24 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        pointerEvents: "none",
                        maxWidth: "100%",
                      }}
                    >
                      {hasBubbleContent && (
                        <div style={{ pointerEvents: "none", minWidth: 0 }}>
                          <TutorialSpeechBubble
                            text={stableText}
                            primaryAction={wrappedPrimary}
                            secondaryAction={secondaryAction}
                            side="right"
                          />
                        </div>
                      )}
                      <div
                        style={{
                          width: cornerSize,
                          height: cornerSize,
                          flexShrink: 0,
                        }}
                      >
                        <AnimatedSparky
                          size={cornerSize}
                          speech={activeSpeech}
                          cheerTick={cheerTick}
                          autoRoll={true}
                          suppressRoll={suppressRoll}
                          showSpeechBubble={false}
                          ariaLabel="Sparky the tutorial mascot"
                        />
                      </div>
                    </motion.div>
                  </div>
                );
              }

              // Intro (no target) gets the larger sprite; every guided
              // step keeps the standard size.
              const isIntro = !targetRect && anchor === "center";
              const sparkySize = isIntro
                ? SPARKY_SIZE_MOBILE_INTRO
                : SPARKY_SIZE_MOBILE;
              const GAP = 16;
              // Rough combined-height estimate (Sparky peek + bubble).
              // Only used to DECIDE center-vs-hug and which side has room;
              // the actual position is set with exact CSS below, so a
              // loose estimate is fine. Generous so we err toward hugging
              // rather than overlapping a modal.
              const groupHEst = sparkySize + 180;

              // Decide vertical placement.
              //   dock   — no target AND a corner anchor (e.g. the
              //            contributors beat, which sits beside its own
              //            centered modal with noScrim). Keep it bottom-
              //            docked and out of the way like before.
              //   center — no target + intro, OR a target that a centered
              //            stack wouldn't cover (e.g. the top "+" button).
              //   below/above — target sits in the centre band; hug it.
              let mode: "center" | "below" | "above" | "dock";
              if (mobileHugTarget) {
                // DETERMINISTIC. A hug step's target is a bottom-HUD
                // control, so dock low and stop asking.
                //
                // The measured path was reaching "above" and still landing
                // mid-screen, because every term in it -- vh, targetRect,
                // groupHEst -- mixes visual-viewport and layout-viewport
                // coordinates, and on iOS those disagree by the height of
                // the browser chrome. The result was Sparky floating in the
                // middle of the map pointing at an icon far below him.
                //
                // There is nothing to compute here: the saddlebag is at the
                // bottom of the screen on every phone. Dock above the HUD
                // bar and it is right in every viewport state.
                mode = "dock";
              } else if (!targetRect) {
                mode = anchor === "center" ? "center" : "dock";
              } else {
                const centeredTop = (vh - groupHEst) / 2;
                const centeredBottom = (vh + groupHEst) / 2;
                const collides =
                  centeredBottom > targetRect.top - GAP &&
                  centeredTop < targetRect.bottom + GAP;
                // mobileHugTarget forces the hug branch even when a centred
                // stack would clear the target — see the prop's docs. Used
                // by edge-anchored steps like the saddlebag button, where
                // centring left Sparky stranded mid-screen.
                if (!collides && !mobileHugTarget) {
                  mode = "center";
                } else {
                  const spaceBelow = vh - targetRect.bottom;
                  const spaceAbove = targetRect.top;
                  if (spaceBelow >= groupHEst + GAP) mode = "below";
                  else if (spaceAbove >= groupHEst + GAP) mode = "above";
                  else mode = spaceBelow >= spaceAbove ? "below" : "above";
                }
              }

              // ── Keyboard-aware nudge ───────────────────────────────
              // When the on-screen keyboard opens, visualViewport height
              // shrinks; `vh` (state) already tracks that, so center/below
              // math re-solves against the visible area automatically. We
              // keep the smooth transition so the shift glides.
              const outerStyle: React.CSSProperties = {
                transition:
                  "padding 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                willChange: "padding",
              };
              if (mode === "below" && targetRect) {
                outerStyle.alignItems = "flex-start";
                // Clamp so a tall bubble can't push off the bottom edge —
                // degrades gracefully to a near-bottom dock if nothing fits.
                outerStyle.paddingTop = Math.min(
                  targetRect.bottom + GAP,
                  Math.max(GAP, vh - groupHEst - GAP),
                );
              } else if (mode === "above" && targetRect) {
                outerStyle.alignItems = "flex-end";
                outerStyle.paddingBottom = Math.min(
                  vh - targetRect.top + GAP,
                  Math.max(GAP, vh - groupHEst - GAP),
                );
              } else if (mode === "dock") {
                outerStyle.alignItems = "flex-end";
                // Hug beats clear the bottom HUD bar they are pointing at;
                // everything else keeps the tight 12px dock.
                outerStyle.paddingBottom = `calc(${
                  mobileHugTarget
                    ? HUG_DOCK_BOTTOM_INSET_MOBILE
                    : BUBBLE_BOTTOM_INSET_MOBILE
                }px + env(safe-area-inset-bottom, 0px))`;
              } else {
                outerStyle.alignItems = "center";
              }

              return (
                <div
                  className="pointer-events-none fixed inset-0 z-[10010] flex justify-center"
                  style={outerStyle}
                >
                  <motion.div
                    key="mobile-tutorial"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    style={{
                      width: "100%",
                      maxWidth: 460,
                      paddingLeft: BUBBLE_SIDE_INSET_MOBILE,
                      paddingRight: BUBBLE_SIDE_INSET_MOBILE,
                      pointerEvents: "none", // children opt in
                    }}
                  >
                    {/* marginTop reserves the peek space above the bubble
                        so the COMBINED group (Sparky + bubble) is what gets
                        centered / hugged, not just the bubble. */}
                    <div style={{ position: "relative", marginTop: sparkySize - 8 }}>
                      <div
                        style={{
                          position: "absolute",
                          top: -(sparkySize - 8),
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: sparkySize,
                          height: sparkySize,
                          pointerEvents: "none",
                          zIndex: 1,
                        }}
                      >
                        <AnimatedSparky
                          size={sparkySize}
                          speech={activeSpeech}
                          cheerTick={cheerTick}
                          autoRoll={true}
                          suppressRoll={suppressRoll}
                          showSpeechBubble={false}
                          ariaLabel="Sparky the tutorial mascot"
                        />
                      </div>
                      {/* Full-width bubble. pointerEvents:none so it doesn't
                          intercept clicks meant for the panel underneath —
                          the primary action button re-enables its own hit
                          area. Hidden when Sparky has nothing to say. */}
                      {hasBubbleContent && (
                        <div style={{ pointerEvents: "none" }}>
                          <TutorialSpeechBubble
                            text={stableText}
                            primaryAction={wrappedPrimary}
                            secondaryAction={secondaryAction}
                            side="top"
                            fullWidth
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })()
          ) : isFollowing && placement ? (
            // FOLLOWING MODE: Sparky and bubble as two independently-positioned
            // fixed elements. No flex, no layout prop — just direct pixel
            // positions with a spring transition so they glide when the
            // target changes.
            <>
              <motion.div
                key="sparky-follow"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  left: placement.sparky.left,
                  top: placement.sparky.top,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                // pointerEvents:none — Sparky himself isn't clickable
                // and his sprite's bounding box was absorbing clicks
                // on controls underneath (Attack button).
                style={{ position: "fixed", zIndex: 10011, pointerEvents: "none" }}
              >
                <SparkyMascotImage
                  mood={mood}
                  speech={activeSpeech}
                  cheerTick={cheerTick}
                  suppressRoll={suppressRoll}
                />
              </motion.div>
              {hasBubbleContent && (
                <motion.div
                  key="bubble-follow"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    left: placement.bubble.left,
                    top: placement.bubble.top,
                  }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.05 }}
                  style={{ position: "fixed", zIndex: 10010, pointerEvents: "none" }}
                >
                  {/* Flip wrapper — when the placement stacks the bubble
                      ABOVE Sparky, bubble.top anchors the bubble's BOTTOM
                      edge. `translateY(-100%)` shifts this inner element up
                      by its own rendered height, so the bubble sits tight
                      to Sparky regardless of how many lines / buttons it
                      ends up rendering. Nested to avoid clashing with the
                      scale transform Framer Motion applies above. */}
                  <div
                    style={{
                      transform: placement.bubbleFlipToBottom
                        ? "translateY(-100%)"
                        : undefined,
                    }}
                  >
                    <TutorialSpeechBubble
                      text={stableText}
                      primaryAction={wrappedPrimary}
                      secondaryAction={secondaryAction}
                      side={bubbleSide}
                    />
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            // FALLBACK MODE: no highlight target — Sparky renders in a
            // corner (default) OR at true screen-center when
            // anchor="center". Center mode uses inset-0 + flex-center
            // so Sparky sits in the middle of the viewport instead of
            // tucked in the bottom-right.
            anchor === "center" ? (
              <motion.div
                key="center-anchor"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="fixed inset-0 z-[10010] flex items-center justify-center pointer-events-none"
              >
                <div className="flex flex-col items-center gap-3">
                  {hasBubbleContent && (
                    <div className="pointer-events-none">
                      <TutorialSpeechBubble
                        text={stableText}
                        primaryAction={wrappedPrimary}
                        secondaryAction={secondaryAction}
                        side="bottom"
                      />
                    </div>
                  )}
                  <SparkyMascotImage
                    mood={mood}
                    speech={activeSpeech}
                    cheerTick={cheerTick}
                    suppressRoll={suppressRoll}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="corner-anchor"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                // Shifted ~5cm (~189px at 96dpi) upward per product
                // request so Sparky clears the feed's floating chat
                // button and the "Request Sent" toast that pops from
                // the bottom-right during the contribute step. Prior
                // position (bottom-4 / sm:bottom-6) had Sparky and
                // his bubble tucked behind those chrome elements.
                className={`fixed ${anchorClass} z-[10010] pointer-events-none`}
                style={{
                  bottom: "calc(213px + env(safe-area-inset-bottom, 0px))",
                }}
              >
                <div className="flex flex-col items-end gap-2">
                  {/* pointer-events-none on the bubble wrapper so its
                      bounding box doesn't intercept clicks meant for
                      controls beneath (e.g. combat Attack button). The
                      inner action button re-enables its own hit area.
                      Skip the wrapper entirely when Sparky is silent so
                      no empty bubble frame paints above the puppy. */}
                  {hasBubbleContent && (
                    <div className="pointer-events-none">
                      <TutorialSpeechBubble
                        text={stableText}
                        primaryAction={wrappedPrimary}
                        secondaryAction={secondaryAction}
                        side="bottom"
                      />
                    </div>
                  )}
                  <SparkyMascotImage
                    mood={mood}
                    speech={activeSpeech}
                    cheerTick={cheerTick}
                    suppressRoll={suppressRoll}
                  />
                </div>
              </motion.div>
            )
          )}
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
  return portal as unknown as ReactElement;
}

function SparkyMascotImage({
  mood: _mood,
  speech,
  cheerTick,
  suppressRoll = false,
}: {
  mood: SparkyMood;
  speech: string | null;
  cheerTick: number;
  suppressRoll?: boolean;
}) {
  return (
    <div
      style={{
        width: SPARKY_W,
        height: SPARKY_H,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <AnimatedSparky
        size={150}
        speech={speech}
        cheerTick={cheerTick}
        autoRoll={true}
        suppressRoll={suppressRoll}
        showSpeechBubble={false}
        ariaLabel="Sparky the tutorial mascot"
      />
    </div>
  );
}
