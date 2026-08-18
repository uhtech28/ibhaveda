/**
 * @file checkpoint-layout.ts
 * @description Pure helper for computing serpentine checkpoint
 *   coordinates from (mapWidth × mapHeight × count). Extracted from
 *   TemplateMapScene.ts so React server components can import the
 *   layout math without pulling Phaser (which references `window` at
 *   module top-level and crashes Next.js SSR — "window is not defined"
 *   at `import * as Phaser from 'phaser'`).
 *
 *   Zero runtime deps — safe to import from any file, any environment.
 */

/**
 * Generate a default checkpoint layout for a biome that hasn't been
 * hand-tuned yet. Positions N checkpoints in a serpentine curve that
 * weaves top → bottom → top across the map (1.5 cycles), leaving 8%
 * margin so gold discs never sit against the edge.
 *
 * Coordinates are in map-image pixels — the caller (usually the map
 * page's Phaser routing effect) passes them into TemplateMapScene as
 * `checkpoints` init data.
 */
export function generateCheckpointLayout(
  mapWidth: number,
  mapHeight: number,
  count: number,
  labelPrefix: string = "CP",
): Array<{ x: number; y: number; label: string }> {
  if (count <= 0) return [];
  // 8% margins on both axes so CP discs cover most of the visible
  // playfield without touching the frame — matches Village-parity
  // spacing for consistency across all templates.
  const marginX = mapWidth * 0.08;
  const marginY = mapHeight * 0.08;
  const usableW = mapWidth - marginX * 2;
  const usableH = mapHeight - marginY * 2;
  const out: Array<{ x: number; y: number; label: string }> = [];
  for (let i = 0; i < count; i++) {
    // Linear progress left → right.
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = marginX + usableW * t;
    // Serpentine sine wave — 1.5 full cycles across the map so the
    // path visibly weaves top → bottom → top instead of clustering
    // low. Amplitude 0.48 uses ~96% of the vertical usable area.
    const y =
      marginY + usableH * (0.5 + 0.48 * Math.sin(t * Math.PI * 2.4));
    out.push({
      x: Math.round(x),
      y: Math.round(y),
      label: `${labelPrefix} ${i + 1}`,
    });
  }
  return out;
}
