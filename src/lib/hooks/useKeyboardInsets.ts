"use client";

/**
 * @file useKeyboardInsets.ts
 * @description Cross-platform on-screen-keyboard detection for
 *   mobile-first modal layouts (compose dialogs, chat inputs, etc).
 *
 *   Background — every mobile browser handles the software keyboard
 *   slightly differently and the naive approaches all break:
 *
 *   - iOS Safari (< iOS 17): `100vh` includes the keyboard region, so
 *     absolutely-positioned modals overflow past the visible area.
 *   - iOS Safari (≥ iOS 17): `100dvh` shrinks with the keyboard, but
 *     the "Passwords / cards / location" autofill toolbar still
 *     eats another ~48px that `dvh` does NOT account for.
 *   - Android Chrome: `100dvh` behaves correctly, but only after a
 *     ~250ms animation — reading window.innerHeight synchronously
 *     during the transition returns stale numbers.
 *   - Samsung Internet + in-app WebViews (Instagram, LinkedIn):
 *     visualViewport is the only reliable signal.
 *
 *   The single source of truth that works everywhere is
 *   `window.visualViewport`. This hook subscribes to its `resize` +
 *   `scroll` events and returns:
 *
 *     - `keyboardHeight` — pixels the keyboard (+ autofill bar) is
 *       covering, ready to plug into `paddingBottom` / `marginBottom`
 *       or subtracted from `maxHeight`.
 *     - `viewportHeight` — the currently VISIBLE viewport height in
 *       px (visualViewport.height, falls back to innerHeight).
 *     - `isKeyboardOpen` — heuristic (keyboardHeight > 100px), useful
 *       for switching layout entirely when the keyboard is up.
 *
 *   SSR-safe (returns zeros until mounted). No dependencies.
 */

import { useEffect, useState, type CSSProperties } from "react";

export interface KeyboardInsets {
  /** Height in px the software keyboard (+ autofill bar) is occluding. */
  keyboardHeight: number;
  /** Currently visible viewport height in px. */
  viewportHeight: number;
  /** Currently visible viewport width in px. */
  viewportWidth: number;
  /** Visual viewport's top offset in px. */
  viewportOffsetTop: number;
  /**
   * Visual viewport's LEFT offset in px. Non-zero whenever iOS has shifted
   * the visible window horizontally — which it does when a focused input
   * sits inside a wide/transformed container, and whenever the user has
   * pinch-zoomed. Fixed elements are positioned against the LAYOUT
   * viewport, so ignoring this is what pushed the flare and contribution
   * dialogs off the left edge of the screen while the keyboard was up.
   */
  viewportOffsetLeft: number;
  /** True when keyboardHeight exceeds ~100px (rough "keyboard open" gate). */
  isKeyboardOpen: boolean;
  /** True for phone/tablet-sized layouts where keyboard-safe centering matters. */
  isMobileViewport: boolean;
}

const EMPTY: KeyboardInsets = {
  keyboardHeight: 0,
  viewportHeight: 0,
  viewportWidth: 0,
  viewportOffsetTop: 0,
  viewportOffsetLeft: 0,
  isKeyboardOpen: false,
  isMobileViewport: false,
};

export function useKeyboardInsets(): KeyboardInsets {
  const [insets, setInsets] = useState<KeyboardInsets>(EMPTY);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const vv = window.visualViewport;

    const compute = (): KeyboardInsets => {
      // window.innerHeight is the LAYOUT viewport (stable across
      // keyboard show/hide on iOS <17). visualViewport.height is the
      // VISUAL viewport (shrinks with keyboard). The delta is the
      // keyboard + autofill bar height.
      const layoutH = window.innerHeight;
      const layoutW = window.innerWidth;
      const visualH = vv ? vv.height : layoutH;
      const visualW = vv ? vv.width : layoutW;
      const keyboardH = Math.max(0, layoutH - visualH);
      return {
        keyboardHeight: keyboardH,
        viewportHeight: visualH,
        viewportWidth: visualW,
        viewportOffsetTop: vv?.offsetTop ?? 0,
        viewportOffsetLeft: vv?.offsetLeft ?? 0,
        // Heuristic — a small ~40px browser chrome shift shouldn't
        // count as "keyboard open". Real keyboards are 240–380px.
        isKeyboardOpen: keyboardH > 100,
        isMobileViewport: Math.min(visualW, layoutW) < 768,
      };
    };

    // Seed after mount so first render doesn't cause a resize flash.
    setInsets(compute());

    const onChange = () => setInsets(compute());

    // visualViewport fires resize + scroll independently on iOS.
    if (vv) {
      vv.addEventListener("resize", onChange);
      vv.addEventListener("scroll", onChange);
    }
    // Fall back to window resize for the (rare) browsers without
    // visualViewport — old Chrome, some in-app WebViews.
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);

    return () => {
      if (vv) {
        vv.removeEventListener("resize", onChange);
        vv.removeEventListener("scroll", onChange);
      }
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, []);

  return insets;
}

/**
 * Convenience style helper — plug into a modal container's `style`
 * prop to give it a keyboard-safe max-height + bottom offset.
 *
 * Usage:
 *   const insets = useKeyboardInsets();
 *   <div style={keyboardSafeStyle(insets, { reserveVh: 0.9 })} />
 *
 * `reserveVh` (0..1) is the fraction of the VISIBLE viewport the
 * modal is allowed to occupy. Defaults to 0.92 — plenty of headroom
 * on tall screens, and shrinks proportionally when the keyboard is up.
 */
export function keyboardSafeStyle(
  insets: KeyboardInsets,
  opts: { reserveVh?: number } = {},
): CSSProperties {
  const { reserveVh = 0.92 } = opts;
  if (insets.viewportHeight === 0) {
    // SSR / pre-mount — let CSS defaults (e.g. max-h-[90dvh]) drive.
    return {};
  }
  return {
    maxHeight: `${Math.floor(insets.viewportHeight * reserveVh)}px`,
  };
}

/**
 * Recenter fixed DialogContent inside the visible viewport on mobile.
 * Desktop keeps the shared primitive's default top/left centering.
 */
export function keyboardSafeDialogStyle(
  insets: KeyboardInsets,
  opts: { reserveVh?: number; mobileOnly?: boolean } = {},
): CSSProperties {
  const { reserveVh = 0.92, mobileOnly = true } = opts;
  if (insets.viewportHeight === 0) return {};
  const style: CSSProperties = {
    maxHeight: `${Math.floor(insets.viewportHeight * reserveVh)}px`,
  };
  if (!mobileOnly || insets.isMobileViewport) {
    style.top = `${Math.floor(
      insets.viewportOffsetTop + insets.viewportHeight / 2,
    )}px`;
    // Pin the HORIZONTAL axis too. The dialog primitive centres with
    // `left: 50%` + `translateX(-50%)`, which resolves against the LAYOUT
    // viewport. Once iOS shifts the visible window sideways to clear a
    // focused input (viewportOffsetLeft > 0) that centre is no longer the
    // centre of anything the user can see, and the dialog hangs off the
    // left edge — the reported flare and contribution layout bugs.
    style.left = `${Math.floor(
      insets.viewportOffsetLeft + insets.viewportWidth / 2,
    )}px`;
    // And clamp the width to the VISIBLE viewport. `w-[min(100%-2rem,…)]`
    // measures the layout viewport, so on a shifted/zoomed visual viewport
    // the dialog could still be wider than the window it has to fit in.
    const safeW = Math.max(240, Math.floor(insets.viewportWidth) - 24);
    style.width = `${safeW}px`;
    style.maxWidth = `${safeW}px`;
  }
  return style;
}
