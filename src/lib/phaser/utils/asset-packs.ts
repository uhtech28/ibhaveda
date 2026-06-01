/**
 * Lazy Phaser asset packs — keeps startup network requests under ~100.
 * Core pack loads in preload(); biome packs load when the camera nears a stage.
 */
import * as Phaser from "phaser";
import { AssetLoader } from "./asset-loader";

export type AssetPackId = "core" | "sprout" | "mine" | "tropical";

const loadedByScene = new WeakMap<Phaser.Scene, Set<AssetPackId>>();

function getLoaded(scene: Phaser.Scene): Set<AssetPackId> {
  let set = loadedByScene.get(scene);
  if (!set) {
    set = new Set();
    loadedByScene.set(scene, set);
  }
  return set;
}

export function markPackLoaded(scene: Phaser.Scene, pack: AssetPackId): void {
  getLoaded(scene).add(pack);
}

/** Visual themes that need optional packs beyond core fan-tasy tilemap assets. */
export function packsForVisualTheme(
  theme: string | undefined,
): AssetPackId[] {
  switch (theme) {
    case "forest":
      return ["sprout"];
    case "mine":
      return ["mine"];
    case "capital":
      return ["tropical"];
    default:
      return [];
  }
}

/**
 * Ensures packs are queued and loaded. Safe to call multiple times / concurrently.
 */
const batchInflight: WeakMap<Phaser.Scene, Promise<void>> = new WeakMap();

/** Queue missing packs in a single loader batch. */
export function ensureAssetPacks(
  scene: Phaser.Scene,
  packs: AssetPackId[],
): Promise<void> {
  const loaded = getLoaded(scene);
  const missing = [...new Set(packs)].filter((p) => !loaded.has(p) && p !== "core");
  if (missing.length === 0) return Promise.resolve();

  const existing = batchInflight.get(scene);
  if (existing) {
    return existing.then(() => ensureAssetPacks(scene, packs));
  }

  const promise = new Promise<void>((resolve) => {
    const onComplete = () => {
      scene.load.off(Phaser.Loader.Events.COMPLETE, onComplete);
      scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
      batchInflight.delete(scene);
      for (const pack of missing) loaded.add(pack);
      resolve();
    };
    const onError = (file: { key?: string }) => {
      console.warn("[AssetPacks] load error:", file?.key);
    };

    scene.load.once(Phaser.Loader.Events.COMPLETE, onComplete);
    scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);

    for (const pack of missing) AssetLoader.queuePack(scene, pack);

    if (!scene.load.isLoading()) scene.load.start();
  });

  batchInflight.set(scene, promise);
  return promise;
}
