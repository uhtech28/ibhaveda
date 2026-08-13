/**
 * Pure checkpoint layout helper shared by React and Phaser scene code.
 * Keep this file free of Phaser imports so server-rendered React routes
 * can use it without pulling Phaser into the SSR bundle.
 */
export function generateCheckpointLayout(
  mapWidth: number,
  mapHeight: number,
  count: number,
  labelPrefix: string = "CP",
): Array<{ x: number; y: number; label: string }> {
  if (count <= 0) return [];
  const marginX = mapWidth * 0.08;
  const marginY = mapHeight * 0.08;
  const usableW = mapWidth - marginX * 2;
  const usableH = mapHeight - marginY * 2;
  const out: Array<{ x: number; y: number; label: string }> = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = marginX + usableW * t;
    const y =
      marginY +
      usableH * (0.5 + 0.48 * Math.sin(t * Math.PI * 2.4));
    out.push({
      x: Math.round(x),
      y: Math.round(y),
      label: `${labelPrefix} ${i + 1}`,
    });
  }
  return out;
}
