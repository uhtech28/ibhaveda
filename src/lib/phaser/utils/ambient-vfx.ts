/**
 * @file ambient-vfx.ts
 * @description Shared ambient particle effects for stage biomes.
 *  Each biome exports its own particle set:
 *   - Forest: fireflies (glowing dots) + drifting leaves
 *   - Harbor: seagull silhouettes + sea mist wisps
 *   - Artisans: forge sparks + rising smoke motes
 *
 *  Implementation uses pure Phaser primitives (circles + rectangles +
 *  tweens) — no external particle systems. Keeps bundle small and lets
 *  us reuse the same helpers on lower-end devices.
 *
 *  Usage:
 *   ```ts
 *   private vfxController: AmbientVFXController | null = null;
 *
 *   create() {
 *     this.vfxController = attachAmbientVFX(this, "forest", {
 *       mapWidth: MAP_WIDTH,
 *       mapHeight: MAP_HEIGHT,
 *     });
 *   }
 *
 *   shutdown() {
 *     this.vfxController?.dispose();
 *   }
 *   ```
 */

import * as Phaser from "phaser";

export type VFXBiome = "forest" | "harbor" | "artisan";

export interface AmbientVFXController {
  /** Cleanup — call from scene.shutdown(). */
  dispose(): void;
}

interface AttachOptions {
  mapWidth: number;
  mapHeight: number;
  /** How dense should the effect be? Multiplied against defaults. Default: 1.0. */
  density?: number;
}

/**
 * Attach biome-appropriate ambient VFX to a Phaser scene.
 */
export function attachAmbientVFX(
  scene: Phaser.Scene,
  biome: VFXBiome,
  opts: AttachOptions,
): AmbientVFXController {
  const density = opts.density ?? 1.0;
  const objects: Phaser.GameObjects.GameObject[] = [];

  if (biome === "forest") {
    // Fireflies — small glowing yellow dots that drift and pulse
    const fireflyCount = Math.round(28 * density);
    for (let i = 0; i < fireflyCount; i++) {
      const x = Math.random() * opts.mapWidth;
      const y = Math.random() * opts.mapHeight;
      const dot = scene.add
        .circle(x, y, 3, 0xfff2a0, 0.85)
        .setDepth(80)
        .setBlendMode(Phaser.BlendModes.ADD);
      objects.push(dot);

      // Gentle drift
      scene.tweens.add({
        targets: dot,
        x: x + (Math.random() - 0.5) * 220,
        y: y + (Math.random() - 0.5) * 160,
        duration: 6000 + Math.random() * 3000,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000,
      });
      // Pulse
      scene.tweens.add({
        targets: dot,
        alpha: 0.15,
        scale: 1.4,
        duration: 900 + Math.random() * 700,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 1500,
      });
    }

    // Drifting leaves — small brownish rectangles falling slowly
    const leafCount = Math.round(14 * density);
    for (let i = 0; i < leafCount; i++) {
      const x = Math.random() * opts.mapWidth;
      const y = Math.random() * opts.mapHeight;
      const leaf = scene.add
        .rectangle(x, y, 5, 3, 0x8b5a2b, 0.7)
        .setDepth(78)
        .setRotation(Math.random() * Math.PI);
      objects.push(leaf);

      scene.tweens.add({
        targets: leaf,
        y: y + 400 + Math.random() * 200,
        x: x + (Math.random() - 0.5) * 120,
        rotation: leaf.rotation + Math.PI * 4,
        duration: 12000 + Math.random() * 4000,
        ease: "Sine.easeInOut",
        repeat: -1,
        delay: Math.random() * 3000,
      });
    }
  } else if (biome === "harbor") {
    // Sea mist wisps — pale semi-transparent ovals drifting horizontally
    const mistCount = Math.round(20 * density);
    for (let i = 0; i < mistCount; i++) {
      const x = Math.random() * opts.mapWidth;
      const y = Math.random() * opts.mapHeight;
      const wisp = scene.add
        .ellipse(x, y, 60 + Math.random() * 40, 20, 0xc8d8ea, 0.16)
        .setDepth(82)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      objects.push(wisp);

      scene.tweens.add({
        targets: wisp,
        x: x + (Math.random() < 0.5 ? -1 : 1) * (250 + Math.random() * 200),
        alpha: 0.05,
        duration: 8000 + Math.random() * 4000,
        ease: "Sine.easeInOut",
        repeat: -1,
        delay: Math.random() * 3000,
      });
    }

    // Seagull silhouettes — tiny grey V-shapes flying overhead
    const gullCount = Math.round(6 * density);
    for (let i = 0; i < gullCount; i++) {
      const y = 80 + Math.random() * 200;
      const gull = scene.add
        .text(-40, y, "/\\", {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#4a5568",
        } as unknown as Phaser.Types.GameObjects.Text.TextStyle)
        .setDepth(83)
        .setAlpha(0.75);
      objects.push(gull);

      scene.tweens.add({
        targets: gull,
        x: opts.mapWidth + 40,
        y: y + (Math.random() - 0.5) * 60,
        duration: 18000 + Math.random() * 8000,
        ease: "Linear",
        repeat: -1,
        delay: Math.random() * 12000,
      });
    }
  } else if (biome === "artisan") {
    // Forge sparks — small orange dots rising then fading (spawned periodically)
    const sparkTimer = scene.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        // Spawn several sparks per tick clustered near "kiln" areas
        const kilnAreas = [
          { x: 900, y: 720 },
          { x: 1350, y: 500 },
          { x: 2400, y: 480 },
        ];
        for (const area of kilnAreas) {
          const spark = scene.add
            .circle(
              area.x + (Math.random() - 0.5) * 80,
              area.y + (Math.random() - 0.5) * 40,
              1.5 + Math.random() * 1.5,
              Math.random() > 0.4 ? 0xffb057 : 0xff6a1a,
              0.9,
            )
            .setDepth(84)
            .setBlendMode(Phaser.BlendModes.ADD);
          objects.push(spark);
          scene.tweens.add({
            targets: spark,
            y: spark.y - 60 - Math.random() * 40,
            alpha: 0,
            duration: 1400 + Math.random() * 800,
            ease: "Sine.easeOut",
            onComplete: () => {
              spark.destroy();
              const idx = objects.indexOf(spark);
              if (idx >= 0) objects.splice(idx, 1);
            },
          });
        }
      },
    });
    // Track the timer as a disposable "object" via a shim
    objects.push({
      destroy: () => sparkTimer.remove(),
    } as unknown as Phaser.GameObjects.GameObject);

    // Smoke motes — grey ellipses drifting up and fading
    const moteCount = Math.round(18 * density);
    for (let i = 0; i < moteCount; i++) {
      const x = Math.random() * opts.mapWidth;
      const y = opts.mapHeight - 100 - Math.random() * 300;
      const mote = scene.add
        .ellipse(x, y, 24, 14, 0x6b6863, 0.18)
        .setDepth(81)
        .setBlendMode(Phaser.BlendModes.NORMAL);
      objects.push(mote);
      scene.tweens.add({
        targets: mote,
        y: y - 260 - Math.random() * 100,
        x: x + (Math.random() - 0.5) * 60,
        alpha: 0.04,
        scale: 1.6,
        duration: 9000 + Math.random() * 3000,
        ease: "Sine.easeOut",
        repeat: -1,
        delay: Math.random() * 4000,
      });
    }
  }

  return {
    dispose: () => {
      for (const obj of objects) {
        try {
          obj.destroy();
        } catch {
          /* ignore */
        }
      }
    },
  };
}
