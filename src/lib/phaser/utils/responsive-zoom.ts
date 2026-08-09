/**
 * @file responsive-zoom.ts
 * @description Single source of truth for map-scene camera zoom
 *   across viewport widths. Village map uses these values as the
 *   canonical "how zoomed-in should the world look" reference —
 *   product feedback (verbatim): "make sure all map zoom is like
 *   village map". Prior state had 6 different scenes with 3
 *   different bracket tables which drifted apart on every content
 *   change.
 *
 *   Callers use it like:
 *     const cam = this.cameras.main;
 *     cam.setZoom(getResponsiveZoom());
 *
 *   The single argument (viewport width) is optional — we fall
 *   through to `window.innerWidth` when called client-side. SSR
 *   defaults to the desktop bracket (1.4x) so any first render on
 *   the server doesn't inject an oddly-tiny zoom that flashes
 *   before hydration.
 */

const VILLAGE_ZOOM_BRACKETS: ReadonlyArray<{ maxWidth: number; zoom: number }> = [
  { maxWidth: 480, zoom: 0.55 },   // mobile portrait — small phones
  { maxWidth: 768, zoom: 0.7 },    // mobile landscape / small tablets
  { maxWidth: 1024, zoom: 1.0 },   // tablets / small laptops
  { maxWidth: Infinity, zoom: 1.4 }, // desktop and up — Village default
];

/**
 * Return the camera zoom to use for the current viewport, matching
 * VillageMapScene's brackets exactly. Every non-Village stage scene
 * (and TemplateMapScene) should call this instead of hardcoding its
 * own brackets, so map "feel" stays consistent when the user
 * navigates between stages.
 *
 * @param viewportWidth Override — defaults to window.innerWidth,
 *   or 1920 (desktop bracket) during SSR.
 */
export function getResponsiveZoom(viewportWidth?: number): number {
  const vw =
    viewportWidth ??
    (typeof window !== "undefined" ? window.innerWidth : 1920);
  for (const b of VILLAGE_ZOOM_BRACKETS) {
    if (vw < b.maxWidth) return b.zoom;
  }
  return VILLAGE_ZOOM_BRACKETS[VILLAGE_ZOOM_BRACKETS.length - 1].zoom;
}
