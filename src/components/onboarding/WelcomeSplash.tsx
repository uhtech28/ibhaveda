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

// Video sources — two variants keyed by device orientation. The mobile
// variant (720x1280 portrait) shows the arched-portal shot; the desktop
// variant (1280x720 landscape) shows the throne room. Both are Gemini
// watermark-stripped via ffmpeg `delogo`. Legacy welcome-intro.mp4 kept
// as a final fallback for cases where neither variant loads.
const VIDEO_SRC_DESKTOP_MP4 = "/assets/videos/welcome-intro-desktop.mp4";
const VIDEO_SRC_DESKTOP_WEBM = "/assets/videos/welcome-intro-desktop.webm";
const VIDEO_SRC_MOBILE_MP4 = "/assets/videos/welcome-intro-mobile.mp4";
const VIDEO_SRC_MOBILE_WEBM = "/assets/videos/welcome-intro-mobile.webm";
const VIDEO_SRC_FALLBACK = "/assets/videos/welcome-intro.mp4";

/** Hard upper bound — only kicks in if the video never loads AND
 *  never fires `onError` (offline dev, blocked domain, whatever).
 *  Cleared the moment the video's `onPlay` event fires, so once
 *  playback starts the user gets the full clip no matter how long. */
const NEVER_LOADED_TIMEOUT_MS = 15_000;

export function WelcomeSplash({ durationMs: _unused, onDone }: Props) {
  void _unused; // silence unused-var lint without changing the API
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ended, setEnded] = useState(false);
  // Device orientation — mounted at "desktop" default (matches SSR),
  // flipped to true inside effect if the viewport is portrait / narrow.
  // Prevents SSR/hydration mismatch (server can't know viewport size).
  const [isMobile, setIsMobile] = useState(false);
  const doneRef = useRef(false);
  const safetyTimerRef = useRef<number | null>(null);

  // Pick the video variant based on viewport orientation. Portrait or
  // narrow (<= 768px) → mobile clip (720x1280); everything else → the
  // desktop clip (1280x720). Detected client-side to avoid SSR mismatch.
  useEffect(() => {
    const detect = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsMobile(w <= 768 || h > w);
    };
    detect();
    window.addEventListener("resize", detect);
    window.addEventListener("orientationchange", detect);
    return () => {
      window.removeEventListener("resize", detect);
      window.removeEventListener("orientationchange", detect);
    };
  }, []);

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
        // `key` forces React to fully remount the <video> element when
        // orientation flips, so the browser reads the new <source> set
        // instead of continuing with the previously-loaded stream.
        key={isMobile ? "mobile" : "desktop"}
        className="welcome-video"
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
      >
        {/* Device-appropriate variant loads first (WebM preferred for
            smaller size in Chrome/Firefox; MP4 fallback for Safari).
            Fallback path is the legacy welcome-intro.mp4 if variants
            fail to load. All variants are watermark-stripped via
            ffmpeg delogo. */}
        {isMobile ? (
          <>
            <source src={VIDEO_SRC_MOBILE_WEBM} type="video/webm" />
            <source src={VIDEO_SRC_MOBILE_MP4} type="video/mp4" />
          </>
        ) : (
          <>
            <source src={VIDEO_SRC_DESKTOP_WEBM} type="video/webm" />
            <source src={VIDEO_SRC_DESKTOP_MP4} type="video/mp4" />
          </>
        )}
        <source src={VIDEO_SRC_FALLBACK} type="video/mp4" />
      </video>

      {/* Product ask: no separate "Tap to continue" button. Once the
          video ends, the whole splash (which includes the baked-in red
          "Continue" button on the scroll artwork) becomes the click
          target — tapping the video advances to profile setup, exactly
          as the old button did. The parent onClick handler above is
          what fires that. */}

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
          /* Full-screen coverage on every device — product ask
             2026-08-22: video must cover the whole viewport with no
             letterbox bars. cover=fill viewport, crop overflow. Since
             we ship a desktop-aspect (16:9) clip AND a mobile-aspect
             (9:16) clip, the device-appropriate variant matches the
             viewport aspect closely and crop is minimal. */
          object-fit: cover;
          object-position: center;
          background: #000;
          display: block;
        }
      `}</style>
    </div>
  );
}
