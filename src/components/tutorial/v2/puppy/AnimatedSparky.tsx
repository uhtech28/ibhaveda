"use client";

/**
 * AnimatedSparky — the tutorial dog state machine.
 *
 * Behavior contract:
 *   1. When `speech` is set (text loading) → play TALK loop.
 *   2. When speech clears → return to IDLE loop.
 *   3. After INACTIVITY_MS of no mouse/keyboard input → play ROLL once,
 *      then return to IDLE.
 *   4. When `cheerTick` prop increments (parent bumps counter) → play
 *      CHEER once, then return to IDLE.
 *
 * Spritesheet convention:
 *   Each animation is a horizontal PNG strip of N equal-width frames.
 *   File names live under /public/assets/tutorial/sparky/:
 *     idle.png   talk.png   roll.png   cheer.png
 *   Frame width/height are set per-animation in ANIM_CONFIG below.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Config ──────────────────────────────────────────────────────────────

// Bumped from /assets/tutorial/sparky to /assets/tutorial/sparky-v2.
// The main branch had a DIFFERENT (AI-illustrated) idle.png at the old
// URL, which was cached with `Cache-Control: immutable, max-age=1yr`
// on returning visitors' devices. New URL = fresh fetch, guaranteed
// to serve the PixelLab pixel-art dog. Bump this suffix (v3, v4...)
// any time you replace files in this folder in the future.
const ASSET_BASE = "/assets/tutorial/sparky-v2";

/**
 * Per-animation configuration.
 * Update `frames` to match what PixelLab exported (probably 8 or 10).
 * Frame width/height default to 68 (PixelLab dog size) — override if
 * your export used a different scale.
 */
type AnimName = "idle" | "talk" | "roll" | "cheer";

interface AnimConfig {
  file: string;
  frames: number;   // number of frames in the horizontal strip
  fps: number;      // playback speed
  loop: boolean;    // idle/talk loop; roll/cheer play once
}

const ANIM_CONFIG: Record<AnimName, AnimConfig> = {
  // Frame counts confirmed by PixelLab export:
  //   idle = 8 frames, talk/roll/cheer = 9 frames each. 68×68 per frame.
  idle:  { file: `${ASSET_BASE}/idle.png`,  frames: 8, fps: 6,  loop: true  },
  talk:  { file: `${ASSET_BASE}/talk.png`,  frames: 9, fps: 8,  loop: true  },
  roll:  { file: `${ASSET_BASE}/roll.png`,  frames: 9, fps: 8,  loop: false },
  cheer: { file: `${ASSET_BASE}/cheer.png`, frames: 9, fps: 10, loop: false },
};

const FRAME_W = 68;   // native pixel width per frame
const FRAME_H = 68;   // native pixel height per frame

const INACTIVITY_MS = 4000; // 4s — sits between the user's 3-5s range

// ─── Props ───────────────────────────────────────────────────────────────

export interface AnimatedSparkyProps {
  /** Rendered display size in CSS pixels (native is 68×68 upscaled) */
  size?: number;
  /** When set, dog plays TALK. When null/empty, returns to IDLE. */
  speech?: string | null;
  /** Increment this to trigger CHEER once (e.g. on Continue click) */
  cheerTick?: number;
  /** Enable/disable idle-triggered ROLL */
  autoRoll?: boolean;
  /** Optional aria-label for a11y */
  ariaLabel?: string;
  /** Optional caption below or in a speech bubble (typewriter revealed) */
  showSpeechBubble?: boolean;
}

// ─── State machine ───────────────────────────────────────────────────────

type PlayingState =
  | { anim: "idle" }
  | { anim: "talk" }
  | { anim: "roll"; startedAt: number }
  | { anim: "cheer"; startedAt: number };

export function AnimatedSparky({
  size = 180,
  speech = null,
  cheerTick = 0,
  autoRoll = true,
  ariaLabel = "Sparky",
  showSpeechBubble = true,
}: AnimatedSparkyProps): ReactElement {
  const [state, setState] = useState<PlayingState>({ anim: "idle" });
  const lastActivityRef = useRef<number>(Date.now());
  const lastCheerTickRef = useRef<number>(cheerTick);
  // Keep a ref of speech so the always-registered activity listener
  // can decide where to transition on user return without needing
  // to re-register on every speech change.
  const speechRef = useRef<string | null>(speech);
  useEffect(() => {
    speechRef.current = speech;
  }, [speech]);

  // ─── Rule 1 & 2: speech → talk; no speech → idle ──────────────────────
  useEffect(() => {
    setState((prev) => {
      // Cheer is one-shot — never interrupt it.
      if (prev.anim === "cheer") return prev;
      // New speech arriving always breaks out of roll/idle into talk.
      if (speech && speech.length > 0) return { anim: "talk" };
      // Speech cleared but currently rolling → stay rolling. User is
      // still inactive; freezing on the last roll frame is intentional.
      if (prev.anim === "roll") return prev;
      return { anim: "idle" };
    });
  }, [speech]);

  // ─── Rule 4: cheerTick increment → cheer once ─────────────────────────
  useEffect(() => {
    if (cheerTick > lastCheerTickRef.current) {
      lastCheerTickRef.current = cheerTick;
      setState({ anim: "cheer", startedAt: Date.now() });
    }
  }, [cheerTick]);

  // ─── Rule 3: inactivity → roll ────────────────────────────────────────
  // Two-tier activity tracking:
  //   1. resetInactivity — fires on ANY user activity (mousemove, scroll,
  //      etc.) and pushes forward the inactivity timer so Sparky doesn't
  //      re-roll while the user is actively reading or scrolling.
  //   2. endRoll — fires ONLY on mouse click, keyboard press, or touch
  //      tap. These are the only events that break Sparky out of ROLL.
  //      Mouse-move and scroll no longer wake him up — roll now feels
  //      like a "committed" idle animation that only a real click or
  //      keystroke can interrupt.
  useEffect(() => {
    const resetInactivity = () => {
      lastActivityRef.current = Date.now();
    };
    const endRoll = () => {
      lastActivityRef.current = Date.now();
      setState((prev) => {
        if (prev.anim === "roll") {
          const s = speechRef.current;
          return s && s.length > 0 ? { anim: "talk" } : { anim: "idle" };
        }
        return prev;
      });
    };
    // Passive signals that just reset the inactivity timer
    window.addEventListener("mousemove", resetInactivity, { passive: true });
    window.addEventListener("scroll", resetInactivity, { passive: true });
    // Committed input events that ALSO end an in-progress roll
    window.addEventListener("mousedown", endRoll, { passive: true });
    window.addEventListener("keydown", endRoll, { passive: true });
    window.addEventListener("touchstart", endRoll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", resetInactivity);
      window.removeEventListener("scroll", resetInactivity);
      window.removeEventListener("mousedown", endRoll);
      window.removeEventListener("keydown", endRoll);
      window.removeEventListener("touchstart", endRoll);
    };
  }, []);

  useEffect(() => {
    if (!autoRoll) return;
    const timer = window.setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor >= INACTIVITY_MS) {
        setState((prev) => {
          // Only roll if we're currently IDLE — don't interrupt talk/roll/cheer
          if (prev.anim !== "idle") return prev;
          lastActivityRef.current = Date.now(); // reset so we don't spam
          return { anim: "roll", startedAt: Date.now() };
        });
      }
    }, 800);
    return () => window.clearInterval(timer);
  }, [autoRoll]);

  // ─── Cheer one-shot completion → return to idle/talk ──────────────────
  // Roll is NOT auto-cleared — it freezes on the last frame until the
  // user does something (see the activity listener above). Cheer always
  // returns to idle/talk after playing once.
  useEffect(() => {
    if (state.anim !== "cheer") return;
    const config = ANIM_CONFIG.cheer;
    const durationMs = (config.frames / config.fps) * 1000;
    const timer = window.setTimeout(() => {
      setState(
        speech && speech.length > 0 ? { anim: "talk" } : { anim: "idle" },
      );
    }, durationMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const activeAnim = state.anim;
  const config = ANIM_CONFIG[activeAnim];

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {showSpeechBubble && speech && (
          <SpeechBubble text={speech} />
        )}
      </AnimatePresence>

      {/* Sprite frame — no ground shadow, dog sits flush on the platform */}
      <Sprite
        src={config.file}
        frames={config.frames}
        fps={config.fps}
        loop={config.loop}
        frameW={FRAME_W}
        frameH={FRAME_H}
        displaySize={size}
      />
    </div>
  );
}

// ─── Sprite renderer (frame-by-frame background-position sweep) ────────

interface SpriteProps {
  src: string;
  frames: number;
  fps: number;
  loop: boolean;
  frameW: number;
  frameH: number;
  displaySize: number;
}

function Sprite({
  src,
  frames,
  fps,
  loop,
  frameW,
  frameH,
  displaySize,
}: SpriteProps): ReactElement {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    let f = 0;
    const interval = window.setInterval(() => {
      f += 1;
      if (f >= frames) {
        if (loop) {
          f = 0;
        } else {
          window.clearInterval(interval);
          return;
        }
      }
      setFrame(f);
    }, 1000 / fps);
    return () => window.clearInterval(interval);
  }, [src, frames, fps, loop]);

  // The spritesheet is a horizontal strip of `frames` cells, each frameW×frameH.
  // We scale the whole strip up so that ONE cell fits the displaySize.
  const scale = displaySize / frameW;
  const bgWidth = frameW * frames * scale;

  return (
    <div
      style={{
        width: displaySize,
        height: displaySize,
        backgroundImage: `url(${src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${bgWidth}px ${displaySize}px`,
        backgroundPosition: `-${frame * displaySize}px 0`,
        imageRendering: "pixelated", // keep pixel-art crisp
      }}
    />
  );
}

// ─── Speech bubble (typewriter) ────────────────────────────────────────

function SpeechBubble({ text }: { text: string }): ReactElement {
  const [visible, setVisible] = useState("");
  useEffect(() => {
    setVisible("");
    let i = 0;
    const tick = () => {
      i += 1;
      setVisible(text.slice(0, i));
      if (i < text.length) window.setTimeout(tick, 22);
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
        maxWidth: 280,
        minWidth: 120,
        background: "linear-gradient(180deg,#fffdf5 0%,#fff2cc 100%)",
        color: "#2a1e0e",
        border: "2px solid #f4c94b",
        borderRadius: 14,
        padding: "10px 14px",
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.4,
        boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {visible}
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
