/**
 * bossAnimator.ts
 *
 * Reusable procedural animation utilities for boss encounters.
 * Zero dependencies on new sprite art — everything here builds on
 * particle emitters, tint/alpha tweens, screen-shake, and lightweight
 * SVG-ish primitives.
 *
 * All functions take a Phaser.Scene + a target Sprite and return either
 * void (fire-and-forget) or a Promise<void> that resolves when the
 * animation finishes.
 *
 * Design invariant: no function mutates game state — only visual
 * effects. React/Convex still owns "what state the boss is in".
 */

import * as Phaser from "phaser";

// ─────────────────────────────────────────────────────────────────────────────
// Boss families — one particle style per family, shared across all stages.
// ─────────────────────────────────────────────────────────────────────────────

export type BossFamily =
  | "mist" // Fog of Vagueness, Everyone Chimera, Tide Caller (partial)
  | "undead" // Assumption Wraith, Gravemind, Hollow King
  | "plant" // Feature Hydra, Thornwarden
  | "machine" // Iron Bureaucrat, Automaton, Unfinished Golem
  | "serpent" // The Unraveller, Ashen Drake, Pale Architect
  | "arcane"; // Mirror Witch, Advocate, generic

interface FamilyStyle {
  particleColor: number; // Phaser hex color
  particleGravityY: number; // negative = rises, positive = falls
  particleSpeed: number;
  particleLifespan: number;
  particleCount: number; // per burst
  hitFlashColor: number; // brief flash on weakening
  auraColor: number; // ground ring color
  fadeAlpha: number; // final alpha at dispel end
}

const FAMILY_STYLES: Record<BossFamily, FamilyStyle> = {
  mist: {
    particleColor: 0xd8d8ee,
    particleGravityY: -60,
    particleSpeed: 90,
    particleLifespan: 1400,
    particleCount: 40,
    hitFlashColor: 0xaaccff,
    auraColor: 0x9999cc,
    fadeAlpha: 0,
  },
  undead: {
    particleColor: 0x8877aa,
    particleGravityY: -30,
    particleSpeed: 70,
    particleLifespan: 1600,
    particleCount: 50,
    hitFlashColor: 0xcc99ff,
    auraColor: 0x554466,
    fadeAlpha: 0,
  },
  plant: {
    particleColor: 0x66cc44,
    particleGravityY: 40,
    particleSpeed: 110,
    particleLifespan: 1200,
    particleCount: 45,
    hitFlashColor: 0xaaff88,
    auraColor: 0x336622,
    fadeAlpha: 0,
  },
  machine: {
    particleColor: 0xff9944,
    particleGravityY: 60,
    particleSpeed: 130,
    particleLifespan: 900,
    particleCount: 55,
    hitFlashColor: 0xffcc00,
    auraColor: 0x995500,
    fadeAlpha: 0,
  },
  serpent: {
    particleColor: 0x442266,
    particleGravityY: 20,
    particleSpeed: 100,
    particleLifespan: 1500,
    particleCount: 60,
    hitFlashColor: 0xcc44ff,
    auraColor: 0x220033,
    fadeAlpha: 0,
  },
  arcane: {
    particleColor: 0x66ccff,
    particleGravityY: -40,
    particleSpeed: 100,
    particleLifespan: 1300,
    particleCount: 50,
    hitFlashColor: 0xaaeeff,
    auraColor: 0x2244aa,
    fadeAlpha: 0,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared 1×1 white pixel texture — reused as the particle source across all
// families. Tinted per-family via emitter config. Generated lazily on first use.
// ─────────────────────────────────────────────────────────────────────────────

function ensurePixelTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("__bossPx")) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(3, 3, 3);
  g.generateTexture("__bossPx", 6, 6);
  g.destroy();
}

// ─────────────────────────────────────────────────────────────────────────────
// P0 #1, #2 — Dispel with family-specific particle burst
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Play a family-specific dispel animation on a boss sprite and fade it out.
 * Resolves when the animation finishes (~900ms).
 */
export function dispelBoss(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  family: BossFamily,
): Promise<void> {
  return new Promise((resolve) => {
    const style = FAMILY_STYLES[family];
    ensurePixelTexture(scene);

    // Particle burst centred on boss
    const emitter = scene.add.particles(sprite.x, sprite.y, "__bossPx", {
      speed: { min: style.particleSpeed * 0.5, max: style.particleSpeed },
      angle: { min: 0, max: 360 },
      gravityY: style.particleGravityY,
      lifespan: style.particleLifespan,
      scale: { start: 1.4, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: style.particleColor,
      quantity: style.particleCount,
      blendMode: Phaser.BlendModes.SCREEN,
    });
    emitter.setDepth(sprite.depth + 1);
    // Fire once then stop emitting
    emitter.explode(style.particleCount);

    // Boss sprite: puff up + fade
    scene.tweens.add({
      targets: sprite,
      alpha: style.fadeAlpha,
      scale: sprite.scale * 1.55,
      duration: 700,
      ease: "Sine.easeOut",
      onComplete: () => {
        sprite.setVisible(false);
      },
    });

    // Clean up emitter after particles finish
    scene.time.delayedCall(style.particleLifespan + 100, () => {
      emitter.destroy();
      resolve();
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// P0 #3 — Unraveller (super boss) reveal beat
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dramatic reveal for a hidden super boss: pan camera to sprite, ramp alpha
 * to full, brief screen shake + red flash. Resolves when reveal completes.
 */
export function revealBoss(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  opts: { panDurationMs?: number; shakeIntensity?: number } = {},
): Promise<void> {
  return new Promise((resolve) => {
    const panMs = opts.panDurationMs ?? 900;
    const shakeI = opts.shakeIntensity ?? 0.008;

    const cam = scene.cameras.main;
    // Pan the camera toward the boss
    cam.pan(sprite.x, sprite.y, panMs, "Cubic.easeOut");

    // Wait for pan to nearly finish, then dramatic reveal
    scene.time.delayedCall(panMs - 150, () => {
      // Alpha + tint burst to full colour
      scene.tweens.add({
        targets: sprite,
        alpha: 1,
        scale: sprite.scale * 1.08,
        duration: 400,
        ease: "Back.easeOut",
      });
      sprite.clearTint();
      // Screen shake
      cam.shake(650, shakeI);
      // Red flash overlay
      const flash = scene.add
        .rectangle(cam.midPoint.x, cam.midPoint.y, cam.width * 2, cam.height * 2, 0xff2222, 0.35)
        .setScrollFactor(0)
        .setDepth(9999);
      scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 600,
        ease: "Cubic.easeOut",
        onComplete: () => flash.destroy(),
      });

      scene.time.delayedCall(700, resolve);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// P0 #4 — Task-progress weakening
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Visually weaken a boss based on how many of its tasks (0-3) are done.
 * Combines tint desaturation + subtle scale wobble + optional crack overlay.
 * Idempotent — safe to call every time task state changes.
 */
export function weakenBoss(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  tasksDone: number,
  tasksTotal: number = 3,
): void {
  const t = Math.min(1, tasksDone / tasksTotal);

  // Interpolate tint from full colour (0xffffff) → dark gray (0x555555)
  const c = Math.floor(0xff - t * 0xaa);
  const tint = (c << 16) | (c << 8) | c;
  sprite.setTint(tint);

  // Subtle twitch — increases with damage
  const family = spriteFamily(sprite);
  const flash = FAMILY_STYLES[family].hitFlashColor;
  // Brief flash to the family colour
  scene.tweens.add({
    targets: sprite,
    duration: 120,
    yoyo: true,
    onStart: () => sprite.setTintFill(flash),
    onComplete: () => sprite.setTint(tint),
  });

  // Small scale kick — bigger for more damage
  const kick = 0.05 + t * 0.08;
  scene.tweens.add({
    targets: sprite,
    scale: sprite.scale * (1 - kick),
    duration: 90,
    yoyo: true,
    ease: "Sine.easeOut",
  });
}

/** Look up a boss's family from a data attribute stored on the sprite. */
function spriteFamily(sprite: Phaser.GameObjects.Sprite): BossFamily {
  return (sprite.getData("bossFamily") as BossFamily) ?? "mist";
}

// ─────────────────────────────────────────────────────────────────────────────
// P1 #5 — Boss faces the player
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flip a boss sprite horizontally so it "faces" a target world X position.
 * Works with any sprite where the default frame is facing SOUTH (as our
 * PixelLab exports are).
 */
export function bossFaceTarget(
  sprite: Phaser.GameObjects.Sprite,
  targetX: number,
): void {
  const dx = targetX - sprite.x;
  sprite.setFlipX(dx < 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// P1 #6 — Attack telegraph on active CP boss
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Every `intervalMs`, briefly swap to the boss's attack animation frames
 * before returning to idle. Returns a cleanup function that stops the loop.
 *
 * Requires two anim keys already registered on the scene:
 *   - `${baseKey}-loop` (the idle/run loop)
 *   - `${baseKey}-attack` (the attack animation — one-shot)
 */
export function startTauntLoop(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  idleAnimKey: string,
  attackAnimKey: string,
  intervalMs: number = 8000,
): () => void {
  let stopped = false;
  const run = () => {
    if (stopped || !sprite.active) return;
    sprite.play(attackAnimKey);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (stopped || !sprite.active) return;
      sprite.play(idleAnimKey);
    });
  };
  const timer = scene.time.addEvent({
    delay: intervalMs,
    callback: run,
    loop: true,
  });
  return () => {
    stopped = true;
    timer.remove();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// P1 #7 — Ambient tendril VFX around a boss
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Continuous slow particle drift emanating from a boss — sells "presence"
 * even at low alpha. Returns a stop function.
 */
export function startAmbientTendrils(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  family: BossFamily,
): () => void {
  ensurePixelTexture(scene);
  const style = FAMILY_STYLES[family];
  const emitter = scene.add.particles(sprite.x, sprite.y, "__bossPx", {
    speed: { min: 15, max: 35 },
    angle: { min: 0, max: 360 },
    gravityY: style.particleGravityY * 0.4,
    lifespan: 2200,
    scale: { start: 1.2, end: 0 },
    alpha: { start: 0.35, end: 0 },
    tint: style.particleColor,
    frequency: 220,
    blendMode: Phaser.BlendModes.SCREEN,
  });
  emitter.setDepth(sprite.depth - 1);

  // Follow the boss as it bobs. Sample every frame (~16ms) rather than
  // 60ms so the particle origin doesn't visibly lag behind the sprite.
  const followEvent = scene.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => emitter.setPosition(sprite.x, sprite.y),
  });

  return () => {
    followEvent.remove();
    emitter.destroy();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// P1 #8 — Aura ring under boss
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a soft coloured ellipse under a boss that pulses subtly. Returns the
 * ellipse so caller can dispose of it.
 */
export function addAuraRing(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  family: BossFamily,
): Phaser.GameObjects.Ellipse {
  const style = FAMILY_STYLES[family];

  // Subtle ground shadow — small dark oval under the boss's feet. No aura
  // ring, no additive blend, no glow. Just a hint of ground contact.
  const shadow = scene.add.ellipse(
    sprite.x,
    sprite.y + sprite.displayHeight * 0.45,
    sprite.displayWidth * 0.55,
    sprite.displayWidth * 0.14,
    0x000000,
    0.35,
  );
  shadow.setDepth(sprite.depth - 2);

  // Faint colored tint below the boss — much smaller than sprite width,
  // very low alpha, no blend mode. Reads as "boss is standing on
  // corrupted ground" rather than "searchlight beam".
  const ring = scene.add.ellipse(
    sprite.x,
    sprite.y + sprite.displayHeight * 0.44,
    sprite.displayWidth * 0.5,
    sprite.displayWidth * 0.13,
    style.auraColor,
    0.28,
  );
  ring.setDepth(sprite.depth - 1);

  // Gentle pulse (barely noticeable — just enough life)
  scene.tweens.add({
    targets: ring,
    scaleX: 1.08,
    scaleY: 1.1,
    alpha: 0.18,
    duration: 1800,
    ease: "Sine.easeInOut",
    yoyo: true,
    repeat: -1,
  });

  // Track boss position (shadow stays flat on ground, ring follows y-bob).
  // Sample every frame so the ring doesn't stutter behind the bob tween.
  scene.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (!sprite.active) return;
      ring.setPosition(sprite.x, sprite.y + sprite.displayHeight * 0.44);
      shadow.setPosition(sprite.x, shadow.y);
    },
  });

  return ring;
}

// ─────────────────────────────────────────────────────────────────────────────
// P2 #9 — Boss taunt speech bubble
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Show a small pixel-art bubble above a boss containing a taunt line.
 * Auto-dismisses after `durationMs`.
 */
export function showBossTaunt(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  text: string,
  durationMs: number = 3200,
): void {
  const bx = sprite.x;
  const by = sprite.y - sprite.displayHeight * 0.55;
  const container = scene.add.container(bx, by);
  container.setDepth(sprite.depth + 5);

  // Background rounded box (drawn as graphics)
  const paddingX = 8;
  const paddingY = 6;
  const label = scene.add
    .text(0, 0, text, {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#f5e6d3",
      align: "center",
      wordWrap: { width: 180 },
    })
    .setOrigin(0.5, 0.5);
  const w = label.width + paddingX * 2;
  const h = label.height + paddingY * 2;
  const bg = scene.add.graphics();
  bg.fillStyle(0x14121e, 0.92);
  bg.lineStyle(1, 0xc7a76a, 0.85);
  bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
  bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
  // Little tail
  bg.fillTriangle(-6, h / 2, 6, h / 2, 0, h / 2 + 6);
  bg.strokeTriangle(-6, h / 2, 6, h / 2, 0, h / 2 + 6);
  container.add([bg, label]);

  // Enter tween
  container.setScale(0.7);
  container.setAlpha(0);
  scene.tweens.add({
    targets: container,
    scale: 1,
    alpha: 1,
    duration: 200,
    ease: "Back.easeOut",
  });

  // Exit tween
  scene.time.delayedCall(durationMs, () => {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      y: container.y - 8,
      duration: 200,
      onComplete: () => container.destroy(),
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// P2 #10 — Small HP bar above boss
// ─────────────────────────────────────────────────────────────────────────────

export interface BossHpBar {
  /** Update the fill 0..1 (1 = full HP). */
  setHp(pct: number): void;
  /** Toggle visibility — hide when the boss is off-screen / cleared / future. */
  setVisible(visible: boolean): void;
  /** Destroy the bar. */
  destroy(): void;
}

/**
 * Draw a full boss HUD (name chip + HP bar with backing panel) above the
 * boss sprite. Uses pixel-art styling to match the map aesthetic.
 *
 * Composition (top → bottom):
 *   1. Boss name chip — dark rounded panel with gold border, boss name
 *      in bone-white pixel font
 *   2. HP bar — 8px tall, dark backing with gold border, red→gold fill
 *      that lerps color as HP drops, HP percentage text inside
 *
 * All caller has to do is call setHp(pct) on task submits — the visuals
 * update themselves. The whole HUD follows the boss sprite in world space.
 */
export function addBossHpBar(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  initialHpPct: number = 1,
  bossName?: string,
): BossHpBar {
  // Dimensions — 3-4x larger than the previous 60×5 sliver so the HUD
  // reads as a proper game UI element rather than a scratch.
  const barW = 120;
  const barH = 8;
  const chipH = 16;
  const totalH = chipH + 4 + barH; // chip + gap + bar
  const totalW = barW + 8; // 4px padding each side

  // Container anchored above the boss's head. Origin (0.5, 1) so the
  // chip's bottom aligns with the anchor point → nice visual gap to the
  // sprite crown.
  const anchorY = sprite.y - sprite.displayHeight * 0.55;
  const container = scene.add.container(sprite.x, anchorY);
  container.setDepth(sprite.depth + 4);

  // ── Boss name chip ──────────────────────────────────────────────
  const chipY = -totalH / 2 + chipH / 2;
  const chipBg = scene.add
    .rectangle(0, chipY, totalW, chipH, 0x0f0f18, 0.92)
    .setStrokeStyle(1.5, 0xd4af37, 1);
  const nameText = scene.add
    .text(0, chipY, (bossName ?? "").toUpperCase(), {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#f5e6c8",
      fontStyle: "bold",
      resolution: 2,
    } as unknown as Phaser.Types.GameObjects.Text.TextStyle)
    .setOrigin(0.5)
    .setLetterSpacing?.(2);
  // Fallback if setLetterSpacing isn't available on this Phaser version
  if (nameText.setLetterSpacing === undefined) {
    nameText.setText((bossName ?? "").toUpperCase().split("").join(" "));
  }
  container.add([chipBg, nameText]);

  // ── HP bar ──────────────────────────────────────────────────────
  const barY = chipY + chipH / 2 + 4 + barH / 2;
  const barBg = scene.add
    .rectangle(0, barY, totalW, barH, 0x0f0f18, 0.92)
    .setStrokeStyle(1.5, 0xd4af37, 1);
  const fill = scene.add.rectangle(
    -barW / 2,
    barY,
    barW * initialHpPct,
    barH - 3,
    0xef4444,
    1,
  );
  fill.setOrigin(0, 0.5);
  // Subtle inner highlight on top of fill for a "polished bar" look
  const highlight = scene.add.rectangle(
    -barW / 2,
    barY - (barH - 3) / 2 + 1,
    barW * initialHpPct,
    1,
    0xffffff,
    0.35,
  );
  highlight.setOrigin(0, 0.5);

  // HP percentage text on top of the bar
  const hpText = scene.add
    .text(0, barY, `${Math.round(initialHpPct * 100)}%`, {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#0f0f18",
      strokeThickness: 2,
      resolution: 2,
    } as unknown as Phaser.Types.GameObjects.Text.TextStyle)
    .setOrigin(0.5);

  container.add([barBg, fill, highlight, hpText]);

  // Follow boss. Poll every frame (~16ms) so the HP-bar container
  // stays glued to the sprite; a 60ms cadence made the bar visibly
  // wobble a frame behind the bob tween.
  const follow = scene.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (!sprite.active) return;
      container.setPosition(
        sprite.x,
        sprite.y - sprite.displayHeight * 0.55,
      );
    },
  });

  return {
    setHp(pct: number) {
      const p = Math.max(0, Math.min(1, pct));
      scene.tweens.add({
        targets: [fill, highlight],
        width: barW * p,
        duration: 400,
        ease: "Cubic.easeOut",
      });
      // Colour lerp: red (full) → orange (half) → gold (empty)
      const r = 0xef;
      const g = Math.floor(0x44 + (1 - p) * (0xcc - 0x44));
      const b = Math.floor(0x44 - (1 - p) * 0x44);
      fill.fillColor = (r << 16) | (g << 8) | b;
      hpText.setText(`${Math.round(p * 100)}%`);
    },
    setVisible(visible: boolean) {
      // The whole HP HUD is a single container — toggling its visibility
      // hides the name chip + HP bar + text + highlight together.
      container.setVisible(visible);
    },
    destroy() {
      follow.remove();
      container.destroy();
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// P2 #11 — Cross-question projectile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fire a glowing "question orb" from the boss toward a target position
 * (usually the player character or screen centre). Resolves on hit.
 */
export function throwProjectile(
  scene: Phaser.Scene,
  from: { x: number; y: number },
  to: { x: number; y: number },
  colour: number = 0xffcc00,
): Promise<void> {
  return new Promise((resolve) => {
    ensurePixelTexture(scene);
    const orb = scene.add.circle(from.x, from.y, 8, colour, 1);
    orb.setDepth(120);
    orb.setBlendMode(Phaser.BlendModes.SCREEN);
    const trail = scene.add.particles(from.x, from.y, "__bossPx", {
      speed: 10,
      angle: { min: 0, max: 360 },
      lifespan: 400,
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: colour,
      frequency: 30,
      blendMode: Phaser.BlendModes.SCREEN,
    });
    trail.setDepth(119);

    scene.tweens.add({
      targets: orb,
      x: to.x,
      y: to.y,
      duration: 700,
      ease: "Cubic.easeIn",
      onUpdate: () => {
        trail.setPosition(orb.x, orb.y);
      },
      onComplete: () => {
        trail.explode(20);
        scene.tweens.add({
          targets: orb,
          scale: 3.2,
          alpha: 0,
          duration: 260,
          onComplete: () => {
            orb.destroy();
            scene.time.delayedCall(400, () => trail.destroy());
            resolve();
          },
        });
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// P2 #12 — Retreat animation (flee east)
// ─────────────────────────────────────────────────────────────────────────────

export function retreatBoss(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  targetX: number,
  durationMs: number = 900,
): Promise<void> {
  return new Promise((resolve) => {
    bossFaceTarget(sprite, targetX);
    scene.tweens.add({
      targets: sprite,
      x: targetX,
      alpha: 0.15,
      scaleX: sprite.scaleX * 0.6,
      scaleY: sprite.scaleY * 0.6,
      duration: durationMs,
      ease: "Cubic.easeIn",
      onComplete: () => {
        sprite.setVisible(false);
        resolve();
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: tag a sprite with its family
// ─────────────────────────────────────────────────────────────────────────────

export function tagBossFamily(
  sprite: Phaser.GameObjects.Sprite,
  family: BossFamily,
): void {
  sprite.setData("bossFamily", family);
}
