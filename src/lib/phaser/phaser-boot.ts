/**
 * Eager Phaser + game-config download for map routes.
 * Import this module (or call warmPhaserBoot) as early as possible so chunks
 * fetch in parallel with HTML/Convex, not after the world page hydrates.
 */
export const phaserBootPromise = Promise.all([
  import("phaser"),
  import("@/lib/phaser/game-config"),
]);

export function warmPhaserBoot(): void {
  void phaserBootPromise;
}
