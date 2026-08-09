"use client";

/**
 * WelcomeSplash — full-screen intro shown right after signup.
 *
 * Previous rev was a 2.5s "Congratulations!" auto-fade card with
 * confetti + wordmark. Product ask (verbatim): "remove current
 * congratulations window that come after sign up. implement this
 * one: the video should play once then pause at end and the video
 * is having a continue button at end when the user clicks continue
 * on it then it will move to next that is username setup".
 *
 * New behavior:
 *   1. Full-viewport <video> autoplays muted+inline (autoplay policy
 *      compliance across every browser)
 *   2. Video plays exactly once (no loop)
 *   3. onEnded → pause on last frame, enable click-through
 *   4. The video artwork itself contains a "Continue" button baked
 *      into its final frames; clicking anywhere on the video after
 *      end fires onDone → parent navigates to /profile-setup form
 *   5. Optional keyboard fallback: Enter/Space also advances
 *      once ended, so a11y stays intact
 *
 * The `durationMs` prop is preserved as a MAX-WAIT safety valve —
 * if the video fails to load or its `ended` event never fires, the
 * splash still dismisses after that timeout so signup can't dead-end.
 */

import { useEffect, useRef, useState } from "react";

interface Props {
  /** LEGACY: pre-video splash timed out after ~2.5s. The prop is
   *  kept only for backwards-compat with any lingering callers —
   *  IGNORED intentionally. Splash now dismisses ONLY on user click
   *  after video ends (or on video error). */
  durationMs?: number;
  onDone: () => void;
}

const VIDEO_SRC = "/assets/videos/welcome-intro.mp4";

/** Hard upper bound — only kicks in if the video never loads AND
 *  never fires `onError` (offline dev, blocked domain, whatever).
 *  Cleared the moment the video's `onPlay` event fires, so once
 *  playback starts the user gets the full clip no matter how long. */
const NEVER_LOADED_TIMEOUT_MS = 15_000;

export function WelcomeSplash({ durationMs: _unused, onDone }: Props) {
  void _unused; // silence unused-var lint without changing the API
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ended, setEnded] = useState(false);
  const doneRef = useRef(false);
  const safetyTimerRef = useRef<number | null>(null);

  // Wrap onDone in a fire-once guard so a rapid keyboard-and-click
  // combo can't fire twice (would cause a double router.replace on
  // the parent and stack navigations).
  const fireDone = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  // Clear the safety-valve timer. Called once playback actually
  // starts (onPlay) — from that point on we trust `onEnded` and the
  // click handler to advance, never a wall-clock timer.
  const clearSafetyTimer = () => {
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  // Safety-valve auto-dismiss — ONLY fires if the video never even
  // starts playing (broken mp4, dropped connection, autoplay blocked
  // AND user never interacts). Cleared the moment `onPlay` fires.
  // Once cleared, the splash sits on the last frame forever waiting
  // for the user to tap Continue — which is the product spec.
  useEffect(() => {
    safetyTimerRef.current = window.setTimeout(
      fireDone,
      NEVER_LOADED_TIMEOUT_MS,
    );
    return clearSafetyTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kick playback on mount. iOS Safari sometimes needs an explicit
  // .play() call even with autoPlay attribute, and Chrome's
  // autoplay-with-sound policy requires we start muted (we do).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    // Fire-and-forget play; ignore the promise rejection that some
    // browsers throw when a tab loses focus mid-mount.
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => { /* no-op */ });
  }, []);

  // Keyboard shortcut — Enter or Space advances once the video ends.
  // Prevents a stuck user who can't find the baked Continue button.
  useEffect(() => {
    if (!ended) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fireDone();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended]);

  return (
    <div
      className="welcome-splash"
      // Click-anywhere-after-end. The video's baked Continue button
      // is what the user sees; the click handler doesn't care where
      // inside the video they tap. Before the video ends, this
      // handler no-ops so a stray early click doesn't skip the
      // intro.
      onClick={ended ? fireDone : undefined}
      role={ended ? "button" : undefined}
      aria-label={ended ? "Continue to profile setup" : "Welcome video playing"}
      style={{ cursor: ended ? "pointer" : "default" }}
    >
      <video
        ref={videoRef}
        className="welcome-video"
        src={VIDEO_SRC}
        autoPlay
        muted
        playsInline
        // No `loop` — spec says play once + pause at end.
        // Playback started for real — kill the never-loaded safety
        // valve so it can't dismiss the splash mid-video.
        onPlay={clearSafetyTimer}
        onPlaying={clearSafetyTimer}
        onLoadedData={clearSafetyTimer}
        onEnded={() => {
          // Pause explicitly so the last frame stays painted even
          // on browsers that snap the poster back on ended events
          // (older mobile Safari behavior).
          const v = videoRef.current;
          if (v) {
            try {
              v.pause();
              // Also nudge currentTime back one frame — some
              // browsers race the pause vs. the visual clear
              // and briefly flash black. Sitting 0.05s before the
              // true end keeps the baked-in Continue button
              // rendered rock-steady.
              v.currentTime = Math.max(0, (v.duration || 0) - 0.05);
            } catch { /* no-op */ }
          }
          setEnded(true);
        }}
        // If the video errors out entirely (404, codec unsupported),
        // fire onDone immediately so the user isn't stuck on a
        // black splash. The safety-valve timer above catches slower
        // stalls too.
        onError={() => fireDone()}
      />

      {/* After the video ends, a subtle "Tap to continue" hint fades
          in beneath the baked Continue button just in case the
          artwork alone doesn't read as interactive. Purely
          decorative — the click handler on the parent is what
          actually advances. */}
      {ended && (
        <div className="welcome-tap-hint">
          Tap to continue
        </div>
      )}

      <style jsx>{`
        .welcome-splash {
          position: fixed;
          inset: 0;
          z-index: 100000;
          background: #000;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .welcome-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
          display: block;
        }
        .welcome-tap-hint {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 20px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #f6f4fa;
          font-family: "Inter", system-ui, sans-serif;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 600;
          pointer-events: none;
          animation: welcomeHintPulse 1.8s ease-in-out infinite;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        @keyframes welcomeHintPulse {
          0%,
          100% {
            opacity: 0.55;
            transform: translateX(-50%) translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateX(-50%) translateY(-3px);
          }
        }
      `}</style>
    </div>
  );
}
