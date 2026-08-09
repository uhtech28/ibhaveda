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
  /** Max time to keep splash mounted if the video never fires
   *  `ended` (network stall, codec fail). Defaults to 30 s — comfy
   *  headroom above the 10 s clip length. */
  durationMs?: number;
  onDone: () => void;
}

const VIDEO_SRC = "/assets/videos/welcome-intro.mp4";

export function WelcomeSplash({ durationMs = 30_000, onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ended, setEnded] = useState(false);
  const doneRef = useRef(false);

  // Wrap onDone in a fire-once guard so a rapid keyboard-and-click
  // combo can't fire twice (would cause a double router.replace on
  // the parent and stack navigations).
  const fireDone = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  // Safety-valve auto-dismiss — if the video never ends (broken
  // mp4, dropped connection, autoplay blocked and user never
  // interacts) we still advance after durationMs so signup doesn't
  // dead-end. Cleared on unmount so a normal end→click path can't
  // fire this after we've already navigated.
  useEffect(() => {
    const t = window.setTimeout(fireDone, durationMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs]);

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
