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
      root.style.setProperty("--app-vv-comments-height", `${Math.min(height * 0.76, 688)}px`);
      root.style.setProperty("--app-vv-comments-keyboard-height", `${Math.min(height * 0.82, 448)}px`);
      root.style.setProperty("--app-vv-contribution-height", `${Math.min(height * 0.78, 544)}px`);
      root.style.setProperty("--app-vv-contribution-keyboard-height", `${Math.min(height * 0.82, 432)}px`);
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
