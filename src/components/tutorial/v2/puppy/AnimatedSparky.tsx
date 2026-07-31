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
  /** Number of full cycles to play when loop=false. Defaults to 1. */
  playCount?: number;
}

const ANIM_CONFIG: Record<AnimName, AnimConfig> = {
  // Frame counts confirmed by PixelLab export:
  //   idle = 8 frames, talk/roll/cheer = 9 frames each. 68×68 per frame.
  idle:  { file: `${ASSET_BASE}/idle.png`,  frames: 8, fps: 6,  loop: true  },
  talk:  { file: `${ASSET_BASE}/talk.png`,  frames: 9, fps: 8,  loop: true  },
  // Roll plays ONCE per product request (reverted from playCount: 2).
  // Freezes on the last frame after the single cycle; user must
  // click/type/tap to wake Sparky back to idle.
  roll:  { file: `${ASSET_BASE}/roll.png`,  frames: 9, fps: 8,  loop: false, playCount: 1 },
  cheer: { file: `${ASSET_BASE}/cheer.png`, frames: 9, fps: 10, loop: false },
};

const FRAME_W = 68;   // native pixel width per frame
const FRAME_H = 68;   // native pixel height per frame

// Sparky sits calmly playing IDLE, then plays the ROLL animation
// after INACTIVITY_MS of no user input. Any click/keypress/tap ends
// the roll early. Product spec:
//   - Speech typing → TALK
//   - Speech done   → IDLE
//   - 60s idle      → ROLL (once)
const INACTIVITY_MS = 60_000; // 60 seconds

// Set to true by any AnimatedSparky instance currently rendering a
// speech typewriter. The module-level poller checks this flag before
// firing a roll — talking Sparky must never be interrupted by a roll
// even if the user hasn't clicked in 60s (typing is Sparky's activity,
// not the user's, but we treat it as "don't sleep while I'm speaking").
let sparkySpeechActiveCount = 0;

// ─── Module-level animation state ──────────────────────────────────────
//
// Sparky remounts when the tutorial switches between "following mode"
// and "corner-anchor mode", or when Step3 hands off to Step4, or when
// the target selector briefly disappears.  Component-local state
// (useRef / useState) does NOT survive remounts, so the 30s countdown
// used to restart constantly and even when it fired the new mount's
// initial state was `idle` again — user never saw the roll.
//
// Solution: hoist both the timer AND the roll-window to module scope.
// Any Sparky instance mounted while `Date.now() < sparkyRollUntil`
// initializes its state as { anim: "roll" }.  The timer also
// accumulates across the whole tab lifetime, not per-mount.
let sparkyLastActivityAt =
  typeof window !== "undefined" ? Date.now() : 0;
/** When > Date.now(), all live Sparky instances should render `roll`. */
let sparkyRollUntil = 0;
// Subscribers — every mounted Sparky registers here so the poller can
// nudge them to re-check `sparkyRollUntil` when it changes.
const sparkySubscribers = new Set<() => void>();
function notifySparkyChange() {
  for (const fn of sparkySubscribers) fn();
}
// Install the committed-input listeners exactly ONCE per tab.
let sparkyListenersInstalled = false;
function ensureSparkyActivityListeners() {
  if (typeof window === "undefined") return;
  if (sparkyListenersInstalled) return;
  sparkyListenersInstalled = true;
  const bump = () => {
    sparkyLastActivityAt = Date.now();
    // Cut any in-flight roll short when the user interacts.
    if (sparkyRollUntil > 0) {
      sparkyRollUntil = 0;
      notifySparkyChange();
    }
  };
  window.addEventListener("mousedown", bump, { passive: true });
  window.addEventListener("keydown", bump, { passive: true });
  window.addEventListener("touchstart", bump, { passive: true });
}
// Duration of the ROLL animation, in ms.  Matches ANIM_CONFIG.roll
// (frames / fps * 1000) times playCount, so two full cycles play
// before the state auto-clears.
function computeRollWindowMs() {
  const cfg = ANIM_CONFIG.roll;
  const play = cfg.playCount ?? 1;
  return (cfg.frames / cfg.fps) * 1000 * play;
}
// Global poller — runs whenever any Sparky is mounted.  Uses module
// state so it can trigger roll even across component remounts.
//
// IMPORTANT: once `sparkyRollUntil` is set, we do NOT auto-clear it
// when the window expires.  The Sprite renderer plays the roll strip
// twice (playCount=2) and then freezes on the last frame — Sparky
// stays in the "just-rolled" pose until the user clicks/types/taps.
// Only ensureSparkyActivityListeners's `bump()` handler zeroes the
// window, matching the original product spec ("wait for mouse click
// instead of automatically coming back to static").
let sparkyPollerInstalled = false;
function ensureSparkyPoller() {
  if (typeof window === "undefined") return;
  if (sparkyPollerInstalled) return;
  sparkyPollerInstalled = true;
  window.setInterval(() => {
    if (sparkyRollUntil > 0) return; // already rolling, wait for user input
    // Never fire a roll while Sparky is mid-speech — TALK animation
    // must play through unimpeded. Any live typewriter is treated as
    // "not idle" for the purposes of the 60s roll trigger.
    if (sparkySpeechActiveCount > 0) {
      sparkyLastActivityAt = Date.now();
      return;
    }
    const idleFor = Date.now() - sparkyLastActivityAt;
    if (idleFor >= INACTIVITY_MS) {
      sparkyRollUntil = Date.now() + computeRollWindowMs();
      sparkyLastActivityAt = Date.now(); // stop re-firing on the next poll tick
      notifySparkyChange();
    }
  }, 500);
}

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
  /**
   * When true, forces Sparky OUT of any roll state and prevents any new
   * roll from firing while it stays true. Used during focused activities
   * (AI combat, task submission, etc.) where a rolling puppy would be
   * distracting — Sparky just sits idle until the activity ends.
   */
  suppressRoll?: boolean;
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
  suppressRoll = false,
  ariaLabel = "Sparky",
  showSpeechBubble = true,
}: AnimatedSparkyProps): ReactElement {
  // Initial state — speech ALWAYS wins over roll. If this Sparky is
  // spawned with speech text (typewriter about to run), start in TALK
  // regardless of the module-level roll flag. Otherwise, honour the
  // roll flag so a Sparky remounted mid-roll (or during the "frozen
  // on last frame" wait for the user to click) continues rendering
  // roll instead of resetting to idle. Uses `> 0` not `> Date.now()`
  // — after the roll window expires we still want to stay in the
  // roll state so the Sprite renderer keeps showing the last (frozen)
  // roll frame until the user actually clicks/keys/taps.
  const [state, setState] = useState<PlayingState>(() => {
    if (speech && speech.length > 0) return { anim: "talk" };
    if (typeof window !== "undefined" && sparkyRollUntil > 0) {
      return { anim: "roll", startedAt: Date.now() };
    }
    return { anim: "idle" };
  });
  const lastCheerTickRef = useRef<number>(cheerTick);
  // Ensure the module-level activity listeners + poller are installed
  // once per tab. Safe to call multiple times — the functions self-guard.
  useEffect(() => {
    ensureSparkyActivityListeners();
    ensureSparkyPoller();
  }, []);

  // Subscribe to module-level state changes so the component reacts
  // when the poller sets or clears sparkyRollUntil.
  // Uses `> 0` not `> Date.now()` — sparkyRollUntil stays non-zero
  // after the roll window expires so Sparky stays in the "just
  // rolled, frozen on last frame" pose. Only committed input events
  // zero it (via ensureSparkyActivityListeners's bump).
  useEffect(() => {
    const onChange = () => {
      if (sparkyRollUntil > 0) {
        setState((prev) => {
          if (prev.anim === "cheer") return prev; // never interrupt cheer
          if (prev.anim === "roll") return prev;  // already rolling — don't restart
          return { anim: "roll", startedAt: Date.now() };
        });
      } else {
        setState((prev) => {
          if (prev.anim === "roll") {
            const s = speechRef.current;
            return s && s.length > 0 ? { anim: "talk" } : { anim: "idle" };
          }
          return prev;
        });
      }
    };
    sparkySubscribers.add(onChange);
    return () => {
      sparkySubscribers.delete(onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Keep a ref of speech so the always-registered activity listener
  // can decide where to transition on user return without needing
  // to re-register on every speech change.
  const speechRef = useRef<string | null>(speech);
  useEffect(() => {
    speechRef.current = speech;
  }, [speech]);

  // Register with the module-level speech-active counter so the
  // poller knows to skip firing a roll while any Sparky is speaking.
  // Also reset lastActivityAt every time a new speech starts so the
  // idle timer restarts fresh after the typewriter finishes.
  useEffect(() => {
    if (!speech || speech.length === 0) return;
    sparkySpeechActiveCount += 1;
    sparkyLastActivityAt = Date.now();
    // If a stale roll was frozen on-screen, clear it — a new speech
    // beat means Sparky needs to talk again immediately.
    if (sparkyRollUntil > 0) {
      sparkyRollUntil = 0;
      notifySparkyChange();
    }
    return () => {
      sparkySpeechActiveCount = Math.max(0, sparkySpeechActiveCount - 1);
      // When the last active speech finishes, restart the 60s idle
      // clock so the user has a full window before Sparky rolls.
      if (sparkySpeechActiveCount === 0) {
        sparkyLastActivityAt = Date.now();
      }
    };
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
    // The module-level listeners already bump sparkyLastActivityAt on
    // every committed input.  This effect only needs to wake Sparky
    // out of a roll when a committed input fires while he's in the
    // roll animation.
    const endRoll = () => {
      setState((prev) => {
        if (prev.anim === "roll") {
          const s = speechRef.current;
          return s && s.length > 0 ? { anim: "talk" } : { anim: "idle" };
        }
        return prev;
      });
    };
    window.addEventListener("mousedown", endRoll, { passive: true });
    window.addEventListener("keydown", endRoll, { passive: true });
    window.addEventListener("touchstart", endRoll, { passive: true });
    return () => {
      window.removeEventListener("mousedown", endRoll);
      window.removeEventListener("keydown", endRoll);
      window.removeEventListener("touchstart", endRoll);
    };
  }, []);

  // Component-local polling REMOVED — replaced by the module-level
  // `ensureSparkyPoller()` above which sets sparkyRollUntil and
  // notifies all subscribers. The `autoRoll` prop is now advisory
  // only (any Sparky instance that doesn't want to roll can opt out
  // by ignoring the module signal via a local guard).
  void autoRoll;

  // ─── suppressRoll enforcement ────────────────────────────────────────
  // When suppressRoll flips true (e.g. AI combat just opened) we force
  // Sparky out of any active roll AND swallow the module-level roll
  // signal for as long as the prop stays true. This prevents the
  // idle-poller's roll trigger from ever landing on this instance
  // while the user is focused on a task.
  useEffect(() => {
    if (!suppressRoll) return;
    // Zero out the shared roll window so no live Sparky renders a roll.
    if (sparkyRollUntil > 0) {
      sparkyRollUntil = 0;
      notifySparkyChange();
    }
    // Also nudge the local state out of roll immediately.
    setState((prev) => {
      if (prev.anim === "roll") {
        const s = speechRef.current;
        return s && s.length > 0 ? { anim: "talk" } : { anim: "idle" };
      }
      return prev;
    });
    // While suppressed, keep the last-activity timestamp fresh so the
    // module poller's INACTIVITY_MS window never elapses. Belt-and-
    // braces on top of the state coercion above.
    const id = window.setInterval(() => {
      sparkyLastActivityAt = Date.now();
    }, 1_000);
    return () => window.clearInterval(id);
  }, [suppressRoll]);

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
        playCount={config.playCount ?? 1}
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
  /** For loop=false animations: how many full cycles to play before
   *  freezing on the last frame. Defaults to 1. */
  playCount?: number;
  frameW: number;
  frameH: number;
  displaySize: number;
}

function Sprite({
  src,
  frames,
  fps,
  loop,
  playCount = 1,
  frameW,
  frameH,
  displaySize,
}: SpriteProps): ReactElement {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    let f = 0;
    let cyclesDone = 0;
    const interval = window.setInterval(() => {
      f += 1;
      if (f >= frames) {
        if (loop) {
          f = 0;
        } else {
          cyclesDone += 1;
          if (cyclesDone >= playCount) {
            // Done — freeze on the last frame.
            window.clearInterval(interval);
            return;
          }
          // Play another cycle.
          f = 0;
        }
      }
      setFrame(f);
    }, 1000 / fps);
    return () => window.clearInterval(interval);
  }, [src, frames, fps, loop, playCount]);

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
