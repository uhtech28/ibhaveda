"use client";

/**
 * TutorialHighlight
 *
 * Spotlight overlay that dims the entire viewport except for a target
 * element identified by a CSS selector. Used to focus user attention
 * on whatever Sparky is currently pointing at (a button, a card, the
 * map, a checkpoint, etc.).
 *
 * Implementation: a full-screen SVG with a rectangular cutout that
 * tracks the target's bounding rect. We re-measure on scroll + resize
 * via ResizeObserver + a scroll listener so the spotlight stays glued
 * to the target even if it moves.
 *
 * Selector falls back gracefully — if the target can't be found, the
 * overlay still dims the page (so the user knows the tutorial is
 * active) but no cutout is drawn.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialHighlightProps {
  /** Whether the spotlight is currently active. */
  visible: boolean;
  /** CSS selector identifying the element to highlight. */
  selector: string | null;
  /** Optional padding around the highlighted element in px. Default 4. */
  padding?: number;
  /** Optional border-radius for the cutout in px. Default 10. */
  rx?: number;
  /** Click-through the cutout? Default true so user can interact. */
  passthroughCutout?: boolean;
  /** Optional click handler on the dimmed area. */
  onDimClick?: () => void;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const EMPTY_RECT: Rect = { x: -9999, y: -9999, width: 0, height: 0 };

export function TutorialHighlight({
  visible,
  selector,
  padding = 4,
  rx = 10,
  passthroughCutout = true,
  onDimClick,
}: TutorialHighlightProps) {
  const [rect, setRect] = useState<Rect>(EMPTY_RECT);
  // Auto-detected border-radius of the target element — updated each measure
  // so the glow ring visually matches the target (round buttons, rounded
  // rectangles, sharp panels, etc.). Falls back to the caller's `rx` prop
  // if the target has no explicit radius.
  const [autoRadius, setAutoRadius] = useState<number | null>(null);
  const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const rafRef = useRef<number | null>(null);

  // ── Measurement ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible || !selector) {
      setRect(EMPTY_RECT);
      return;
    }
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      // FIX: querySelectorAll + pick first VISIBLE match. When a selector
      // matches multiple elements (e.g. mobile + desktop variants of the
      // same button), querySelector returns the first DOM hit — which is
      // often the hidden mobile one. Highlighting an element with 0×0
      // rect means no ring appears AND the dim overlay covers the visible
      // sibling, blocking clicks.
      const all = document.querySelectorAll<HTMLElement>(selector);
      let el: HTMLElement | null = null;
      for (const candidate of Array.from(all)) {
        const r = candidate.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          el = candidate;
          break;
        }
      }
      if (!el) {
        // Target may not be mounted yet — try again next frame
        rafRef.current = window.requestAnimationFrame(measure);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        x: r.left - padding,
        y: r.top - padding,
        width: r.width + padding * 2,
        height: r.height + padding * 2,
      });
      setViewport({ w: window.innerWidth, h: window.innerHeight });

      // Read the target's actual border-radius so the ring visually matches.
      // getComputedStyle returns e.g. "10px" or "999px" — parse the numeric
      // value and add our padding so the ring's radius outside the padding
      // matches the target's radius inside.
      try {
        const cs = window.getComputedStyle(el);
        const raw = cs.borderTopLeftRadius || cs.borderRadius || "";
        const parsed = parseFloat(raw);
        if (!Number.isNaN(parsed) && parsed > 0) {
          // Cap at half the smaller dimension so we don't over-round on
          // tiny targets. Add `padding` because the highlight rect is
          // inflated by `padding` on each side.
          const maxRadius = Math.min(r.width, r.height) / 2 + padding;
          setAutoRadius(Math.min(parsed + padding, maxRadius));
        } else {
          setAutoRadius(null);
        }
      } catch {
        setAutoRadius(null);
      }
    };

    measure();

    const ro = new ResizeObserver(() => {
      if (!cancelled) measure();
    });
    const el = document.querySelector(selector);
    if (el) ro.observe(el);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    // Polling safety net — some targets mount async (e.g. Convex
    // subscription resolves and CheckpointPanel mounts its task rows).
    // The RAF chain only fires while measure keeps failing; once we
    // set a rect we stop. But the *target* can appear even after we've
    // set an empty rect (via ResizeObserver missing the initial mount),
    // so this interval catches those cases and re-attaches the observer.
    const poll = window.setInterval(() => {
      if (cancelled) return;
      const all = document.querySelectorAll<HTMLElement>(selector);
      let visibleEl: HTMLElement | null = null;
      for (const c of Array.from(all)) {
        const r = c.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          visibleEl = c;
          break;
        }
      }
      if (visibleEl && visibleEl !== el) {
        // Element appeared / changed identity — reset observer + measure
        ro.disconnect();
        ro.observe(visibleEl);
      }
      measure();
    }, 300);

    return () => {
      cancelled = true;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.clearInterval(poll);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [visible, selector, padding]);

  if (!visible) {
    return (
      <AnimatePresence>
        {/* nothing */}
      </AnimatePresence>
    );
  }

  const hasTarget = rect.width > 0 && rect.height > 0;

  // Effective corner radius:
  //   1. If we managed to read a border-radius from the target's computed
  //      style (autoRadius), use that so the ring matches the target
  //      exactly — round buttons render as circles, rounded rectangles
  //      keep their curvature, sharp panels stay sharp.
  //   2. Otherwise fall back to the caller-provided rx prop.
  const effectiveRx = autoRadius != null ? autoRadius : rx;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100]"
          style={{ pointerEvents: passthroughCutout ? "none" : "auto" }}
          onClick={onDimClick}
        >
          {/* SVG overlay with hole punched out. Position of the cutout
              rect is applied via SVG attributes directly (no spring) so
              it stays glued to the target during fast scrolling — a
              spring transition here caused visible lag/displacement. */}
          <svg
            width="100%"
            height="100%"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            <defs>
              <mask id="tutorial-highlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {hasTarget && (
                  <rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    rx={effectiveRx}
                    ry={effectiveRx}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(2, 6, 23, 0.72)"
              mask="url(#tutorial-highlight-mask)"
            />
          </svg>

          {/* Crisp 1.5px ring around the target — position set via inline
              style (no spring transition) so the ring stays fixed to the
              target's rect during fast scrolling instead of springing
              behind it. will-change hints the browser to composite it on
              the GPU for smoother scroll tracking. */}
          {hasTarget && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                boxShadow:
                  "0 0 0 1.5px rgba(251, 191, 36, 0.95), 0 0 10px rgba(251, 191, 36, 0.30)",
                borderRadius: effectiveRx,
                willChange: "left, top, width, height",
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
