"use client";

/**
 * InteractiveSparky — a fully interactive 2D dog mascot for tutorials.
 *
 * Wraps the pure-SVG SparkyPixelDog with rich behavior:
 *   - Head tracks the cursor (subtle tilt toward mouse)
 *   - Click → bark bounce + emote burst
 *   - Hover → wiggle
 *   - Draggable (Framer Motion drag)
 *   - Emote overlay system (❤️ ✨ ! ? …)
 *   - Speech bubble with typewriter effect
 *   - Idle breathing pulse
 *   - Auto-transitions between moods based on props
 *   - Reduced-motion respect
 *
 * Zero external assets. Pure code. Works offline. Renders identically
 * across all browsers.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { SparkyPixelDog, type DogMood } from "./SparkyPixelDog";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SparkyEmote =
  | "heart"
  | "sparkle"
  | "exclaim"
  | "question"
  | "dots"
  | "star"
  | "zzz";

export interface InteractiveSparkyProps {
  /** Base mood — drives face + pose from SparkyPixelDog */
  mood?: DogMood;
  /** Visual size in px (default 150) */
  size?: number;
  /** Optional speech to show above Sparky (typewriter revealed) */
  speech?: string | null;
  /** Emote burst to fire — cleared automatically after 1.4s */
  emote?: SparkyEmote | null;
  /** Allow user to drag Sparky around the parent container */
  draggable?: boolean;
  /** Follow the user's cursor with a subtle head tilt */
  eyeTracking?: boolean;
  /** Enable click-to-bark reaction */
  clickable?: boolean;
  /** Called when user clicks Sparky */
  onBark?: () => void;
  /** Called after Sparky is dragged (useful to persist position) */
  onDragEnd?: (x: number, y: number) => void;
  /** Screen-reader label */
  ariaLabel?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Emote glyph map
// ─────────────────────────────────────────────────────────────────────────────

const EMOTE_GLYPHS: Record<SparkyEmote, string> = {
  heart: "❤️",
  sparkle: "✨",
  exclaim: "❗",
  question: "❓",
  dots: "💭",
  star: "⭐",
  zzz: "💤",
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function InteractiveSparky({
  mood = "idle",
  size = 150,
  speech = null,
  emote = null,
  draggable = false,
  eyeTracking = true,
  clickable = true,
  onBark,
  onDragEnd,
  ariaLabel = "Sparky the mascot",
}: InteractiveSparkyProps): ReactElement {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Local emote state — supports both prop-driven and click-triggered emotes
  const [activeEmote, setActiveEmote] = useState<SparkyEmote | null>(emote);
  useEffect(() => {
    if (emote !== null) {
      setActiveEmote(emote);
      const t = window.setTimeout(() => setActiveEmote(null), 1400);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [emote]);

  // Bark animation trigger (increments to re-run tween)
  const [barkTick, setBarkTick] = useState(0);

  // Head tilt state (based on cursor position)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  useEffect(() => {
    if (!eyeTracking || reduce) return;
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        // Normalized delta clamped to ±1
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 400));
        const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 400));
        // Small tilt (max ±8deg) so it feels alive without looking odd
        setTilt({ rx: -dy * 6, ry: dx * 8 });
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [eyeTracking, reduce]);

  // Click handler → bark + random emote
  const handleClick = useCallback(() => {
    if (!clickable) return;
    setBarkTick((n) => n + 1);
    if (!activeEmote) {
      // Cycle through friendly emotes
      const friendly: SparkyEmote[] = ["heart", "sparkle", "star", "exclaim"];
      const pick = friendly[Math.floor(Math.random() * friendly.length)];
      setActiveEmote(pick);
      window.setTimeout(() => setActiveEmote(null), 1400);
    }
    onBark?.();
  }, [clickable, activeEmote, onBark]);

  // Drag handler
  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      onDragEnd?.(info.point.x, info.point.y);
    },
    [onDragEnd],
  );

  // Idle breathing scale — subtle
  const breathAnimate = useMemo(() => {
    if (reduce) return { scale: 1 };
    return {
      scale: [1, 1.02, 1],
    };
  }, [reduce]);

  return (
    <motion.div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        position: "relative",
        cursor: clickable ? "pointer" : draggable ? "grab" : "default",
        userSelect: "none",
        touchAction: "none",
      }}
      // Drag setup
      drag={draggable}
      dragMomentum={false}
      whileDrag={{ scale: 1.06, cursor: "grabbing" }}
      onDragEnd={handleDragEnd}
      // Hover wiggle
      whileHover={
        reduce
          ? undefined
          : {
              rotate: [0, -4, 4, -3, 0],
              transition: { duration: 0.6 },
            }
      }
      // Click bark bounce
      whileTap={{ scale: 0.94 }}
      onClick={handleClick}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {speech && <SpeechBubble text={speech} />}
      </AnimatePresence>

      {/* Emote burst */}
      <AnimatePresence>
        {activeEmote && (
          <EmoteBurst key={`${activeEmote}-${barkTick}`} glyph={activeEmote} />
        )}
      </AnimatePresence>

      {/* Bark bounce wrapper — remounts each bark to re-run animation */}
      <motion.div
        key={`bark-${barkTick}`}
        style={{ width: "100%", height: "100%" }}
        initial={barkTick === 0 ? false : { y: 0, scale: 1 }}
        animate={
          barkTick === 0
            ? undefined
            : {
                y: [0, -14, 0, -6, 0],
                scale: [1, 1.08, 0.98, 1.03, 1],
                transition: { duration: 0.55, ease: "easeOut" },
              }
        }
      >
        {/* Idle breath + cursor-tracked head tilt */}
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transform: `perspective(600px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transition: "transform 0.2s ease-out",
          }}
          animate={breathAnimate}
          transition={{
            duration: 2.4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          <SparkyPixelDog mood={mood} size={size} />
        </motion.div>
      </motion.div>

      {/* Ground shadow — grounds the sprite */}
      {!reduce && (
        <motion.div
          style={{
            position: "absolute",
            bottom: -6,
            left: "50%",
            width: size * 0.55,
            height: 10,
            marginLeft: -(size * 0.55) / 2,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(0,0,0,0.28) 0%, transparent 70%)",
            filter: "blur(2px)",
            pointerEvents: "none",
          }}
          animate={{ scaleX: [1, 0.95, 1], opacity: [0.28, 0.22, 0.28] }}
          transition={{
            duration: 2.4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Speech bubble (typewriter revealed)
// ─────────────────────────────────────────────────────────────────────────────

function SpeechBubble({ text }: { text: string }): ReactElement {
  const [visible, setVisible] = useState("");
  useEffect(() => {
    setVisible("");
    let i = 0;
    const tick = () => {
      i += 1;
      setVisible(text.slice(0, i));
      if (i < text.length) {
        window.setTimeout(tick, 22);
      }
    };
    const t = window.setTimeout(tick, 40);
    return () => window.clearTimeout(t);
  }, [text]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{
        position: "absolute",
        bottom: "108%",
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: 240,
        minWidth: 100,
        background: "linear-gradient(180deg,#fffdf5 0%,#fff2cc 100%)",
        color: "#2a1e0e",
        border: "2px solid #f4c94b",
        borderRadius: 14,
        padding: "10px 14px",
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.35,
        boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {visible}
      {/* Bubble tail */}
      <span
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          marginLeft: -8,
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "10px solid #f4c94b",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          marginLeft: -6,
          marginTop: -2,
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "8px solid #fff2cc",
        }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Emote burst — floats up + fades out
// ─────────────────────────────────────────────────────────────────────────────

function EmoteBurst({ glyph }: { glyph: SparkyEmote }): ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.6 }}
      animate={{ opacity: [0, 1, 1, 0], y: -60, scale: [0.6, 1.3, 1.1, 0.9] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4, ease: "easeOut" }}
      style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: 34,
        pointerEvents: "none",
        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))",
        zIndex: 4,
      }}
    >
      {EMOTE_GLYPHS[glyph]}
    </motion.div>
  );
}
