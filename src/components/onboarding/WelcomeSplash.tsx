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
  // Device orientation — `null` until measured, NOT `false`.
  //
  // Defaulting to "desktop" meant a phone began downloading the 2.1 MB
  // landscape clip, then the detect effect flipped `isMobile`, the
  // `key` below remounted the <video>, and the browser threw that away
  // to start the 2.6 MB portrait clip from scratch. Users saw a long
  // black wait for a video that was being fetched twice. Holding at
  // `null` for one frame (against an already-black backdrop, so it is
  // invisible) means exactly one clip is ever requested.
  //
  // Safe against hydration mismatch: the parent only mounts this
  // component from a client effect, so it never renders on the server.
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  // Playback actually began (the `playing` event), as opposed to merely
  // having loaded. Everything below distinguishes those two: on a phone
  // they come apart, and treating "loaded" as "playing" is what let the
  // splash give up on a video that was still perfectly alive.
  const [started, setStarted] = useState(false);
  // Autoplay was refused, so the user has to start it. Muted inline
  // autoplay is normally allowed on mobile, but iOS Low Power Mode and
  // Android Data Saver both veto it outright.
  const [needsTap, setNeedsTap] = useState(false);
  const doneRef = useRef(false);
  const safetyTimerRef = useRef<number | null>(null);
  // Once the user has a way forward -- playback started, or a visible
  // "Tap to play" -- the valve is done for good. It has to LATCH: media
  // elements keep emitting progress/suspend/canplay events after they
  // have finished loading, and each of those rearmed the deadline. That
  // is why clearing it on `needsTap` alone was not enough; a later
  // event armed it again and it expired 15s afterwards, taking the intro
  // with it.
  const valveDisarmedRef = useRef(false);

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

  // Start (or resume) playback from a real user gesture.
  const startPlayback = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => { /* no-op */ });
  };

  // Clear the safety-valve timer. Called once playback actually
  // starts (onPlay) — from that point on we trust `onEnded` and the
  // click handler to advance, never a wall-clock timer.
  const disarmSafetyValve = () => {
    valveDisarmedRef.current = true;
    clearSafetyTimer();
  };

  const clearSafetyTimer = () => {
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  // Safety valve, REARMED on every sign of life.
  //
  // This used to be one fixed 15s deadline from mount, cleared by
  // `loadeddata`. On a phone that is the wrong shape twice over. The
  // mobile clip is the BIGGEST of the set (2.6 MB mp4 / 2.0 MB webm,
  // larger than either desktop variant), so on cellular it can easily
  // still be downloading at 15s -- at which point the valve fired and
  // skipped the intro out from under a video that was loading fine. That
  // is the reported "came up with a pause icon and went straight to
  // username setup without playing": not a broken video, an impatient
  // timer.
  //
  // Now the deadline means "15 seconds with NO PROGRESS AT ALL". Every
  // buffering event pushes it out, so a slow download is waited on for as
  // long as it keeps making headway, while a genuinely dead load still
  // releases the user instead of stranding them.
  const armSafetyTimer = () => {
    if (valveDisarmedRef.current) return;
    clearSafetyTimer();
    safetyTimerRef.current = window.setTimeout(
      fireDone,
      NEVER_LOADED_TIMEOUT_MS,
    );
  };
  useEffect(() => {
    armSafetyTimer();
    return clearSafetyTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kick playback on mount. iOS Safari sometimes needs an explicit
  // .play() call even with autoPlay attribute, and Chrome's
  // autoplay-with-sound policy requires we start muted (we do).
  // Depends on `isMobile` because the <video> element does not exist
  // until orientation is measured — on an empty dep array this ran
  // against a null ref and never kicked playback.
  useEffect(() => {
    if (isMobile === null) return;
    const v = videoRef.current;
    if (!v) return;
    // Set BOTH as properties before calling play(). React renders `muted`
    // as a property rather than an HTML attribute, and a video the engine
    // does not consider muted at the moment autoplay is evaluated gets
    // refused on every mobile browser.
    v.muted = true;
    v.playsInline = true;
    let cancelled = false;
    const attempt = v.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        // Refused. Do NOT silently sit on a paused first frame with no
        // affordance -- that is the stuck state the user hit. Ask for a
        // tap instead.
        if (!cancelled) setNeedsTap(true);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [isMobile]);

  // Offer the tap when the video is READY BUT PAUSED.
  //
  // Readiness is the important half. Being paused on its own is also true
  // all through a normal slow load, and prompting then would be wrong --
  // there is nothing a tap can do about bytes that have not arrived.
  // readyState >= HAVE_FUTURE_DATA means the browser could play it right
  // now and has chosen not to, which is precisely a refused autoplay.
  useEffect(() => {
    if (isMobile === null || started || ended) return;
    const id = window.setInterval(() => {
      const v = videoRef.current;
      if (!v) return;
      if (v.paused && v.readyState >= 3) setNeedsTap(true);
    }, 500);
    return () => window.clearInterval(id);
  }, [isMobile, started, ended]);

  // A visible "Tap to play" IS a way forward, so the safety valve has no
  // more work to do. Leaving it armed is what made the harness -- and the
  // phone -- skip the intro out from under a video that was loaded, ready,
  // and simply waiting to be started: a paused video emits no progress
  // events, so nothing rearmed the deadline and it expired on the spot.
  useEffect(() => {
    if (needsTap) disarmSafetyValve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsTap]);

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
      // Two jobs, depending on where we are:
      //   ended        -> advance to profile setup (the artwork's own
      //                   Continue button is what the user is aiming at)
      //   not started  -> START the video. A tap is a user gesture, which
      //                   is exactly what a browser that refused autoplay
      //                   is waiting for. Previously this handler was
      //                   undefined until `ended`, so a phone that blocked
      //                   autoplay showed a paused frame that could not be
      //                   dismissed OR started by tapping it.
      // Mid-playback it stays inert, so a stray tap cannot skip the intro.
      onClick={ended ? fireDone : started ? undefined : startPlayback}
      role={ended || !started ? "button" : undefined}
      aria-label={
        ended
          ? "Continue to profile setup"
          : started
            ? "Welcome video playing"
            : "Play the welcome video"
      }
      style={{ cursor: ended || !started ? "pointer" : "default" }}
    >
      {isMobile === null ? null : (
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
        // Fetch the whole clip, not just metadata. This is a ~2 MB
        // full-screen intro the user is staring at a black frame
        // waiting for — buffering it lazily is the one thing we don't
        // want. /profile-setup also prefetches these bytes while Clerk
        // and Convex resolve, so this usually hits a warm cache.
        preload="auto"
        // No `loop` — spec says play once + pause at end.
        // Playback started for real — kill the never-loaded safety
        // valve so it can't dismiss the splash mid-video.
        // `playing` is the only event that means pixels are moving, so
        // it is the only one that retires the safety valve outright.
        onPlaying={() => {
          disarmSafetyValve();
          setStarted(true);
          setNeedsTap(false);
        }}
        // Everything below is evidence the load is alive but not yet
        // playing. Each one pushes the deadline out rather than clearing
        // it -- see armSafetyTimer for why that distinction matters on a
        // phone.
        onLoadStart={armSafetyTimer}
        onLoadedMetadata={armSafetyTimer}
        onLoadedData={armSafetyTimer}
        onProgress={armSafetyTimer}
        onCanPlay={armSafetyTimer}
        onWaiting={armSafetyTimer}
        onStalled={armSafetyTimer}
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
      )}

      {/* Tap-to-play, shown ONLY when the browser refused to autoplay.
          Desktop never sees it. On a phone where autoplay is vetoed --
          iOS Low Power Mode, Android Data Saver -- this is the difference
          between "a paused video with a pause icon on it" and something
          the user can actually start. The whole splash is the tap target
          (see onClick above); this is just the visible affordance. */}
      {needsTap && !started && !ended && (
        <div className="welcome-tap" aria-hidden="true">
          <span className="welcome-tap-glyph">▶</span>
          <span className="welcome-tap-label">Tap to play</span>
        </div>
      )}

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
        .welcome-tap {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          pointer-events: none;
          background: rgba(0, 0, 0, 0.45);
          color: #fff;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .welcome-tap-glyph {
          display: grid;
          place-items: center;
          width: 74px;
          height: 74px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.75);
          background: rgba(0, 0, 0, 0.35);
          font-size: 26px;
          line-height: 1;
          padding-left: 5px;
        }
        .welcome-tap-label {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.85;
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
