"use client";

import { useEffect, useState } from "react";

export function useMobileVisualViewport() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    const updateViewportVars = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;

      root.style.setProperty("--app-vv-height", `${height}px`);
      root.style.setProperty("--app-vv-center-y", `${offsetTop + height / 2}px`);
      // HORIZONTAL AXIS -- the mirror of the two above, and it was missing.
      //
      // The mobile dialog rules centre with `left: 50vw`, the centre of the
      // LAYOUT viewport. On iOS that stops being the centre of anything
      // visible the moment Safari shifts or zooms the visual viewport to
      // bring a focused input into view: offsetLeft goes non-zero, width
      // shrinks, and a dialog pinned to 50vw hangs off the side of the
      // screen. The vertical axis has been corrected this way for a while;
      // the horizontal one never was, which is why the flare composer
      // rendered half off the left edge.
      root.style.setProperty("--app-vv-width", `${viewport?.width ?? window.innerWidth}px`);
      root.style.setProperty(
        "--app-vv-center-x",
        `${(viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) / 2}px`,
      );
      root.style.setProperty("--app-vv-comments-height", `${Math.min(height * 0.76, 688)}px`);
      root.style.setProperty("--app-vv-comments-keyboard-height", `${Math.min(height * 0.82, 448)}px`);
      root.style.setProperty("--app-vv-contribution-height", `${Math.min(height * 0.78, 544)}px`);
      root.style.setProperty("--app-vv-contribution-keyboard-height", `${Math.min(height * 0.9, 390)}px`);
      root.style.setProperty("--app-vv-map-feed-keyboard-height", `${Math.min(height * 0.9, 386)}px`);
      root.style.setProperty("--app-vv-kanban-keyboard-height", `${Math.min(height * 0.9, 392)}px`);
      root.style.setProperty("--app-vv-flare-height", `${Math.min(height * 0.74, 480)}px`);
      root.style.setProperty("--app-vv-flare-keyboard-height", `${Math.min(height * 0.9, 360)}px`);
    };

    updateViewportVars();
    window.addEventListener("resize", updateViewportVars);
    window.visualViewport?.addEventListener("resize", updateViewportVars);
    window.visualViewport?.addEventListener("scroll", updateViewportVars);

    return () => {
      window.removeEventListener("resize", updateViewportVars);
      window.visualViewport?.removeEventListener("resize", updateViewportVars);
      window.visualViewport?.removeEventListener("scroll", updateViewportVars);
    };
  }, []);
}

export function useMobilePopupMode() {
  const [isMobilePopup, setIsMobilePopup] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const queries = [
      window.matchMedia("(max-width: 639px)"),
      window.matchMedia("(hover: none) and (pointer: coarse)"),
    ];

    const update = () => {
      setIsMobilePopup(queries.some((query) => query.matches));
    };

    update();
    queries.forEach((query) => query.addEventListener("change", update));
    window.addEventListener("resize", update);

    return () => {
      queries.forEach((query) => query.removeEventListener("change", update));
      window.removeEventListener("resize", update);
    };
  }, []);

  return isMobilePopup;
}
