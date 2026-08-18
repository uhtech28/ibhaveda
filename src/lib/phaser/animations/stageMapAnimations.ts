/**
 * @file stageMapAnimations.ts
 * @description Shared "Village-parity" helper for every non-village
 *  stage scene (Forest / Arena / Artisans / Mine / GoldenHarbor /
 *  Crossroads). Ports the moving-boss + retreat + full anim state
 *  machine + persona combat states + super-boss reveal choreography
 *  out of `VillageMapScene.ts` so we don't copy-paste 6×.
 *
 *  Design principles:
 *  - Every function accepts a Phaser.Scene + a StageBoss + typed
 *    options. Nothing here reads Convex or React — pure Phaser.
 *  - Graceful fallback on missing anim clips: defeat→hurt→idle,
 *    victory→attack→idle. Scenes get a working state machine even
 *    if the boss only ships an idle.png.
 *  - Idempotent registration — animations are keyed by
 *    `boss-anim:<stage>:<slug>:<state>` and skipped if already made.
 *  - Persona uses `personaAnimKey(..., "attack"|"hurt"|...)`
 *    from persona-assets.ts. Legacy personas fall back to idle/walk.
 *
 *  Product intent (per user ask): "implement persona bosses
 *  animations checkpoint movement in each and every map". This is
 *  the runtime primitive that makes that possible.
 */

import * as Phaser from "phaser";
import type { StageBoss } from "@/config/stage-bosses";
import type { PersonaId } from "@/config/personas";
import {
  getCurrentPersonaId,
  personaAnimKey,
  personaHasExtended,
  personaSpriteKey,
  directionalWalkAnimKey,
} from "@/lib/phaser/persona-assets";
import { addBossHpBar, type BossHpBar } from "./bossAnimator";

// ─────────────────────────────────────────────────────────────────────
// Keying helpers
// ─────────────────────────────────────────────────────────────────────

type BossState = "idle" | "attack" | "hurt" | "defeat" | "victory";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function bossTextureKey(stage: number, boss: StageBoss, state: BossState): string {
  return `boss-tex:${stage}:${slugify(boss.name)}:${state}`;
}

function bossAnimKey(stage: number, boss: StageBoss, state: BossState): string {
  return `boss-anim:${stage}:${slugify(boss.name)}:${state}`;
}

// ─────────────────────────────────────────────────────────────────────
// Loading
// ─────────────────────────────────────────────────────────────────────

/**
 * Queue every available anim clip for a boss. Call from `preload()`.
 * Idempotent — if a texture key already exists, the load is skipped.
 * Falls back to loading `idleAsset` as a plain image when no clip
 * metadata is provided, matching the pre-parity scene behavior.
 */
export function loadBossAssets(
  scene: Phaser.Scene,
  stage: number,
  boss: StageBoss,
): void {
  const clips: Array<[BossState, StageBoss["idleClip"]]> = [
    ["idle", boss.idleClip],
    ["attack", boss.attackClip],
    ["hurt", boss.hurtClip],
    ["defeat", boss.defeatClip],
    ["victory", boss.victoryClip],
  ];
  let idleLoaded = false;
  for (const [state, clip] of clips) {
    if (!clip) continue;
    const texKey = bossTextureKey(stage, boss, state);
    if (scene.textures.exists(texKey)) {
      if (state === "idle") idleLoaded = true;
      continue;
    }
    if (clip.frameCount > 1 && clip.frameWidth && clip.frameHeight) {
      scene.load.spritesheet(texKey, clip.asset, {
        frameWidth: clip.frameWidth,
        frameHeight: clip.frameHeight,
      });
    } else {
      scene.load.image(texKey, clip.asset);
    }
    if (state === "idle") idleLoaded = true;
  }
  // Fallback: no idleClip but boss has a static idleAsset — load as image.
  if (!idleLoaded) {
    const texKey = bossTextureKey(stage, boss, "idle");
    if (!scene.textures.exists(texKey)) {
      scene.load.image(texKey, boss.idleAsset);
    }
  }
}

/**
 * Register anims for every available clip after preload completes.
 * Call from `create()` AFTER the loader has fired. Skips clips whose
 * texture didn't load (asset missing) so the scene never crashes.
 */
export function registerBossAnimations(
  scene: Phaser.Scene,
  stage: number,
  boss: StageBoss,
): void {
  const clips: Array<{ state: BossState; clip: StageBoss["idleClip"]; repeat: number }> = [
    { state: "idle", clip: boss.idleClip, repeat: -1 },
    { state: "attack", clip: boss.attackClip, repeat: 0 },
    { state: "hurt", clip: boss.hurtClip, repeat: 0 },
    { state: "defeat", clip: boss.defeatClip, repeat: 0 },
    { state: "victory", clip: boss.victoryClip, repeat: 0 },
  ];
  for (const { state, clip, repeat } of clips) {
    if (!clip || clip.frameCount <= 1) continue;
    const animKey = bossAnimKey(stage, boss, state);
    if (scene.anims.exists(animKey)) continue;
    const texKey = bossTextureKey(stage, boss, state);
    if (!scene.textures.exists(texKey)) continue;
    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNumbers(texKey, {
        start: 0,
        end: Math.max(0, clip.frameCount - 1),
      }),
      frameRate: clip.fps ?? (state === "idle" ? 6 : 10),
      repeat,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────
// Fallback chain — mirrors Village's "missing defeat → hurt, missing
// victory → attack" pattern. Every scene benefits from the same
// resolution so partial-asset bosses never render a broken frame.
// ─────────────────────────────────────────────────────────────────────

function resolveState(
  scene: Phaser.Scene,
  stage: number,
  boss: StageBoss,
  requested: BossState,
): BossState {
  const chain: Record<BossState, BossState[]> = {
    idle: ["idle"],
    attack: ["attack", "idle"],
    hurt: ["hurt", "idle"],
    defeat: ["defeat", "hurt", "idle"],
    victory: ["victory", "attack", "idle"],
  };
  for (const candidate of chain[requested]) {
    const animKey = bossAnimKey(stage, boss, candidate);
    if (scene.anims.exists(animKey)) return candidate;
  }
  return "idle";
}

// ─────────────────────────────────────────────────────────────────────
// Spawn
// ─────────────────────────────────────────────────────────────────────

export interface MovingBossHandle {
  sprite: Phaser.GameObjects.Sprite;
  /** Legacy body-shadow anchor. The dark-ellipse implementation was
   *  removed 2026-08-16 (see spawnMovingBoss); this is now a
   *  hidden zero-size rectangle so existing setVisible / setPosition
   *  calls stay no-op safe. Widened the type to GameObject so future
   *  callers can drop the field entirely without another type break. */
  anchor: Phaser.GameObjects.GameObject;
  hpBar: BossHpBar | null;
  boss: StageBoss;
  stage: number;
  /** Which CP the boss is CURRENTLY standing on (mutated by retreat). */
  cpIndex: number;
  /** Whether the boss is currently mid state-transition anim. Used to
   *  guard concurrent playBossState calls from stomping on each other. */
  busy: boolean;
}

/**
 * Spawn ONE moving boss at the given CP. Village-parity: the boss
 * has an anchor ellipse (contrast against ground), plays its idle
 * anim, and returns a handle scenes can pass to retreatBossTo /
 * playBossState / defeatBoss.
 */
export function spawnMovingBoss(
  scene: Phaser.Scene,
  stage: number,
  boss: StageBoss,
  cp: { x: number; y: number },
  opts: { showHpBar?: boolean; depth?: number } = {},
): MovingBossHandle {
  const idleTex = bossTextureKey(stage, boss, "idle");
  const scale = boss.spriteScale ?? 1.9;
  const yOffset = boss.spriteYOffset ?? 62;
  const xOffset = boss.spriteXOffset ?? 0;
  const depth = opts.depth ?? 60;

  const sprite = scene.add.sprite(cp.x + xOffset, cp.y + yOffset, idleTex);
  sprite.setOrigin(0.5, 1); // Feet at yOffset
  sprite.setScale(scale);
  sprite.setDepth(depth);

  // Contrast anchor removed 2026-08-16 ("remove this black circle from
  // all maps"). Was a wide 0x0a0a1a dark ellipse behind the sprite
  // meant as a subtle body-shadow for pale-palette bosses, but on the
  // template maps it read as an ominous black halo. VillageMapScene
  // dropped the same anchor earlier; parity here fixes academic /
  // lab / creative. Downstream `handle.anchor` accessors now receive
  // a lightweight placeholder rectangle at alpha 0 so any code that
  // calls setVisible / setPosition on it stays no-op safe.
  const anchor = scene.add.rectangle(sprite.x, sprite.y, 1, 1, 0x000000, 0);
  anchor.setDepth(depth - 3);
  anchor.setVisible(false);

  // Play idle animation if available; else the static image is already
  // painted by the constructor call.
  const idleAnim = bossAnimKey(stage, boss, "idle");
  if (scene.anims.exists(idleAnim)) sprite.play(idleAnim);

  // Subtle idle bob to give static images some life (skipped when the
  // sprite is animating so the two motions don't fight).
  if (!scene.anims.exists(idleAnim)) {
    scene.tweens.add({
      targets: sprite,
      y: sprite.y - 6,
      duration: 1400,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  const hpBar = opts.showHpBar !== false
    ? addBossHpBar(scene, sprite, 1, boss.name)
    : null;

  return { sprite, anchor, hpBar, boss, stage, cpIndex: 0, busy: false };
}

// ─────────────────────────────────────────────────────────────────────
// State machine
// ─────────────────────────────────────────────────────────────────────

/**
 * Play a boss state animation. Handles the fallback chain, marks the
 * handle busy for the duration, and auto-returns to idle when the
 * clip completes (unless state === "defeat", in which case the last
 * frame is held). Safe to call repeatedly; overlapping calls short-
 * circuit if `busy && !force`.
 */
export function playBossState(
  scene: Phaser.Scene,
  handle: MovingBossHandle,
  state: BossState,
  opts: { force?: boolean } = {},
): void {
  if (handle.busy && !opts.force) return;
  const resolved = resolveState(scene, handle.stage, handle.boss, state);
  const animKey = bossAnimKey(handle.stage, handle.boss, resolved);
  if (!scene.anims.exists(animKey)) return;

  handle.busy = state !== "idle";
  handle.sprite.play(animKey);

  // For one-shot clips, listen for completion → return to idle (except
  // defeat, which holds the KO frame per Village convention).
  if (state !== "idle" && state !== "defeat") {
    const onDone = () => {
      handle.busy = false;
      const idleAnim = bossAnimKey(handle.stage, handle.boss, "idle");
      if (scene.anims.exists(idleAnim) && handle.sprite.active) {
        handle.sprite.play(idleAnim);
      }
    };
    handle.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, onDone);
    // Safety-net — clear busy in case ANIMATION_COMPLETE never fires
    // (e.g. sprite destroyed mid-clip).
    scene.time.delayedCall(1800, () => {
      if (handle.busy) handle.busy = false;
    });
  }
  if (state === "defeat") {
    handle.busy = false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Retreat / advance
// ─────────────────────────────────────────────────────────────────────

/**
 * Village-parity boss retreat: tween the sprite east/west to the
 * target CP, flip to face the travel direction, then face the
 * character again on complete. Fires a callback when the tween ends
 * so the scene can chain into `walkCharacterTo`.
 *
 * Product rule (verbatim from user): "if any animation is missing
 * for a boss use can use defeat animation also in retreat and
 * attack animation for victory". So during the retreat tween we
 * play the boss's defeat animation if it exists — the resolveState
 * chain (defeat → hurt → idle) then picks the best available clip,
 * meaning bosses without any defeat/hurt anim just keep their idle
 * during retreat instead of freezing on a single frame. Once the
 * tween completes we bounce back to idle so the boss reads as
 * "settled" at the new CP.
 */
export function retreatBossTo(
  scene: Phaser.Scene,
  handle: MovingBossHandle,
  target: { x: number; y: number },
  opts: {
    durationMs?: number;
    faceX?: number; // where to face after arrival (character pos)
    onComplete?: () => void;
  } = {},
): void {
  const duration = opts.durationMs ?? 1400;
  const startX = handle.sprite.x;
  const targetX = target.x + (handle.boss.spriteXOffset ?? 0);
  const targetY = target.y + (handle.boss.spriteYOffset ?? 62);

  // Face the travel direction while retreating (looks like it's running
  // away, not sliding backwards).
  handle.sprite.setFlipX(targetX < startX);

  // Play the "retreating" animation — defeat by product rule, with
  // resolveState fallback through hurt → idle. Force=true so we
  // preempt whatever state was playing before the retreat began.
  playBossState(scene, handle, "defeat", { force: true });

  scene.tweens.add({
    targets: handle.sprite,
    x: targetX,
    y: targetY,
    duration,
    ease: "Sine.easeInOut",
    onComplete: () => {
      // Face the character on arrival — bosses look toward where the
      // persona will walk from (which is CP top-left, matching
      // VillageMapScene's CHAR_X_OFFSET convention).
      const faceX = opts.faceX ?? target.x - 60;
      handle.sprite.setFlipX(faceX < handle.sprite.x);
      // Settle back to idle so the boss reads as alive/breathing at
      // the new CP instead of holding the last defeat frame.
      playBossState(scene, handle, "idle", { force: true });
      opts.onComplete?.();
    },
  });
}

/**
 * Village-parity dispel/dissolve: fade the boss out with a slight
 * upward drift + hp bar zeroed. Used when the boss FINALLY dies at
 * the last CP (not on intermediate retreats).
 */
export function dissolveBoss(
  scene: Phaser.Scene,
  handle: MovingBossHandle,
  opts: { durationMs?: number; onComplete?: () => void } = {},
): void {
  const duration = opts.durationMs ?? 900;
  if (handle.hpBar) handle.hpBar.setHp(0);
  playBossState(scene, handle, "defeat", { force: true });
  scene.tweens.add({
    targets: [handle.sprite, handle.anchor],
    alpha: 0,
    y: `-=20`,
    duration,
    ease: "Sine.easeIn",
    onComplete: () => {
      handle.sprite.setVisible(false);
      handle.anchor.setVisible(false);
      if (handle.hpBar) handle.hpBar.setVisible(false);
      opts.onComplete?.();
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// Persona spawn + state machine
// ─────────────────────────────────────────────────────────────────────

export interface PersonaHandle {
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  personaId: PersonaId;
  isExtended: boolean;
  busy: boolean;
  /** Ground Y (feet baseline) — kept for shadow re-positioning. */
  groundY: number;
}

/**
 * Spawn a persona sprite at the CP's top-left (Village convention —
 * see VillageMapScene.ts:330-331). Uses the extended Pixellab sheet
 * if available, else the legacy 32×48 sheet. Registers ANIMATION_
 * COMPLETE listener so combat one-shots auto-return to idle.
 *
 * Requires `loadPersonaSprites` in the scene's preload and
 * `registerPersonaAnimations` before this call.
 */
export function spawnPersonaCharacter(
  scene: Phaser.Scene,
  cp: { x: number; y: number },
  opts: {
    /** Legacy fallback texture key when the persona spritesheet failed. */
    legacyIdleKey?: string;
    /** Legacy fallback walk key. */
    legacyWalkKey?: string;
    /** X/Y offset from CP marker — defaults to Village convention (top-left). */
    xOffset?: number;
    yOffset?: number;
    /** Sprite scale. */
    scale?: number;
    depth?: number;
  } = {},
): PersonaHandle | null {
  const personaId = getCurrentPersonaId();
  const isExtended = personaHasExtended(personaId);
  const idleTex = personaSpriteKey(personaId, "idle");
  const walkTex = isExtended
    ? personaSpriteKey(personaId, "walk-south")
    : personaSpriteKey(personaId, "walk");

  const resolvedIdleTex = scene.textures.exists(idleTex)
    ? idleTex
    : opts.legacyIdleKey && scene.textures.exists(opts.legacyIdleKey)
      ? opts.legacyIdleKey
      : null;
  if (!resolvedIdleTex) return null;

  const xOffset = opts.xOffset ?? -60;
  const yOffset = opts.yOffset ?? -45;
  const depth = opts.depth ?? 100;

  const groundY = cp.y + yOffset + 4;
  const shadow = scene.add
    .ellipse(cp.x + xOffset, groundY, 54, 14, 0x000000, 0.42)
    .setDepth(depth - 5);

  const sprite = scene.add.sprite(cp.x + xOffset, cp.y + yOffset, resolvedIdleTex);
  // Extended personas: 88 or 92 px tall, feet at ~row 65 → origin y=0.75
  // Legacy fantasy sheet is 32x48 with feet at bottom → origin y=1.0
  sprite.setOrigin(0.5, isExtended ? 0.75 : 1);
  const frameH = sprite.texture.getSourceImage().height / (isExtended ? 1 : 1);
  void frameH; // The extended sheets are 88 or 92 tall; scale set below.
  sprite.setScale(opts.scale ?? (isExtended ? 1.6 : 2.05));
  sprite.setDepth(depth);

  const idleAnim = personaAnimKey(personaId, "idle");
  if (scene.anims.exists(idleAnim)) sprite.play(idleAnim);

  // Combat one-shots return to idle when they finish. Defeat holds the
  // last frame (matches VillageMapScene.ts:1740-1774 convention).
  sprite.on(
    Phaser.Animations.Events.ANIMATION_COMPLETE,
    (anim: Phaser.Animations.Animation) => {
      const key = anim.key;
      const isDefeat = key === personaAnimKey(personaId, "defeat");
      if (isDefeat) return; // hold KO frame
      const isCombatOneShot =
        key === personaAnimKey(personaId, "attack") ||
        key === personaAnimKey(personaId, "hurt") ||
        key === personaAnimKey(personaId, "victory");
      if (!isCombatOneShot) return;
      const idle = personaAnimKey(personaId, "idle");
      if (scene.anims.exists(idle) && sprite.active) sprite.play(idle);
    },
  );

  const handle: PersonaHandle = {
    sprite,
    shadow,
    personaId,
    isExtended,
    busy: false,
    groundY,
  };

  // Keep shadow glued to feet as the sprite tweens/bobs.
  scene.time.addEvent({
    delay: 60,
    loop: true,
    callback: () => {
      if (!sprite.active || !shadow.active) return;
      shadow.setPosition(sprite.x, handle.groundY);
    },
  });

  return handle;
}

/**
 * Play a persona one-shot state (attack/hurt/victory/defeat). Handles
 * both extended and legacy personas — legacy personas only have idle/
 * walk, so combat states no-op cleanly.
 */
export function playPersonaState(
  scene: Phaser.Scene,
  handle: PersonaHandle,
  state: "idle" | "attack" | "hurt" | "defeat" | "victory",
): void {
  if (!handle.isExtended && state !== "idle") return;
  const key = personaAnimKey(handle.personaId, state);
  if (!scene.anims.exists(key)) return;
  handle.busy = state !== "idle";
  handle.sprite.play(key);
  if (state === "defeat") handle.busy = false;
  // Safety-net auto-clear if the anim never completes (sprite destroyed
  // mid-clip, etc.). ANIMATION_COMPLETE listener registered at spawn
  // handles the happy path.
  scene.time.delayedCall(1800, () => {
    if (handle.busy) handle.busy = false;
  });
}

/**
 * Village-parity directional walk: pick the correct extended walk anim
 * from a direction vector, tween the sprite, and return to idle on
 * arrival. Falls back to non-directional legacy walk when the persona
 * doesn't have the extended sheet.
 */
export function walkPersonaTo(
  scene: Phaser.Scene,
  handle: PersonaHandle,
  target: { x: number; y: number },
  opts: { durationMs?: number; onComplete?: () => void } = {},
): void {
  const sprite = handle.sprite;
  const duration = opts.durationMs ?? 1800;
  const dx = target.x - sprite.x;
  const dy = target.y - sprite.y;
  const walkAnim = directionalWalkAnimKey(handle.personaId, dx, dy);
  if (scene.anims.exists(walkAnim)) sprite.play(walkAnim);
  // Legacy personas: flip horizontally toward travel direction so
  // sprite reads as facing the CP.
  if (!handle.isExtended) sprite.setFlipX(dx < 0);

  const newGroundY = target.y + 4;
  handle.groundY = newGroundY;

  scene.tweens.add({
    targets: sprite,
    x: target.x,
    y: target.y,
    duration,
    ease: "Sine.easeInOut",
    onComplete: () => {
      if (!handle.isExtended) sprite.setFlipX(false);
      const idle = personaAnimKey(handle.personaId, "idle");
      if (scene.anims.exists(idle) && sprite.active) sprite.play(idle);
      opts.onComplete?.();
    },
  });
}

/**
 * Village-parity "the persona reacts to the super-boss reveal":
 * face the reveal, small vertical hop with scale kick, gold aura
 * particles, and a brief victory pose. Skipped for legacy personas
 * (no victory anim) — they just get the hop + particles.
 *
 * Matches VillageMapScene.ts:1873-1934 "playPersonaVictoryPose".
 */
export function playPersonaVictoryPose(
  scene: Phaser.Scene,
  handle: PersonaHandle,
  faceX: number,
): void {
  const sprite = handle.sprite;
  if (!handle.isExtended) sprite.setFlipX(faceX < sprite.x);

  // Gold particle burst
  const originalY = sprite.y;
  const particles = scene.add.particles(sprite.x, sprite.y - 20, "__WHITE", {
    color: [0xffd700, 0xffb74d, 0xffff88],
    speed: { min: 60, max: 140 },
    lifespan: 700,
    quantity: 24,
    scale: { start: 0.6, end: 0 },
    gravityY: -80,
    blendMode: Phaser.BlendModes.ADD,
    emitting: false,
  });
  particles.explode(24, sprite.x, sprite.y - 20);
  scene.time.delayedCall(900, () => particles.destroy());

  // Hop + scale kick
  const baseScale = sprite.scale;
  scene.tweens.add({
    targets: sprite,
    y: originalY - 24,
    duration: 260,
    ease: "Sine.easeOut",
    yoyo: true,
    onYoyo: () => {
      scene.tweens.add({
        targets: sprite,
        scaleY: baseScale * 1.12,
        scaleX: baseScale * 0.92,
        duration: 100,
        yoyo: true,
      });
    },
  });

  // Victory anim (only fires for extended personas — legacy is idle-only)
  playPersonaState(scene, handle, "victory");
}

// ─────────────────────────────────────────────────────────────────────
// Super-boss reveal
// ─────────────────────────────────────────────────────────────────────

/**
 * Village-parity super-boss reveal: pan the camera, rise the sprite in
 * with alpha+scale tween, spawn HP bar. Returns a handle scenes can
 * later pass to `dissolveBoss` after combat.
 */
export function revealSuperBoss(
  scene: Phaser.Scene,
  stage: number,
  boss: StageBoss,
  pos: { x: number; y: number },
  opts: { panDurationMs?: number; onArrived?: () => void } = {},
): MovingBossHandle {
  const panDuration = opts.panDurationMs ?? 1400;
  scene.cameras.main.pan(pos.x, pos.y, panDuration, "Sine.easeInOut");

  const idleTex = bossTextureKey(stage, boss, "idle");
  const scale = boss.spriteScale ?? 2.6;
  const yOffset = boss.spriteYOffset ?? 40;
  const xOffset = boss.spriteXOffset ?? 0;

  const finalX = pos.x + xOffset;
  const finalY = pos.y + yOffset;
  const startY = finalY + 260;

  const sprite = scene.add.sprite(finalX, startY, idleTex);
  sprite.setOrigin(0.5, 1);
  sprite.setScale(0);
  sprite.setDepth(70);
  sprite.setAlpha(0);

  // Anchor ellipse for consistent silhouette
  const anchor = scene.add.ellipse(
    finalX,
    startY,
    120,
    40,
    0x0a0a1a,
    0.28,
  );
  anchor.setDepth(67);
  anchor.setAlpha(0);

  scene.tweens.add({
    targets: [sprite, anchor],
    y: finalY,
    alpha: 1,
    duration: 1600,
    delay: 400,
    ease: "Sine.easeOut",
  });
  scene.tweens.add({
    targets: sprite,
    scale,
    duration: 1600,
    delay: 400,
    ease: "Sine.easeOut",
    onComplete: () => {
      const idleAnim = bossAnimKey(stage, boss, "idle");
      if (scene.anims.exists(idleAnim)) sprite.play(idleAnim);
      opts.onArrived?.();
    },
  });

  // Anchor follow
  scene.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (!sprite.active) return;
      anchor.setPosition(sprite.x, sprite.y - sprite.displayHeight * 0.35);
      anchor.setAlpha(sprite.alpha * 0.6);
    },
  });

  const hpBar = addBossHpBar(scene, sprite, 1, boss.name);

  return {
    sprite,
    anchor,
    hpBar,
    boss,
    stage,
    cpIndex: -1,
    busy: false,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Combat-round hooks — thin wrappers scenes can call from React events
// ─────────────────────────────────────────────────────────────────────

/** Player took damage this round — flash the persona hurt + boss victory. */
export function onCombatDamage(
  scene: Phaser.Scene,
  bossHandle: MovingBossHandle,
  personaHandle: PersonaHandle | null,
): void {
  playBossState(scene, bossHandle, "attack");
  if (personaHandle) {
    scene.time.delayedCall(300, () => playPersonaState(scene, personaHandle, "hurt"));
  }
}

/** Boss took damage this round — persona attack + boss hurt. */
export function onCombatHit(
  scene: Phaser.Scene,
  bossHandle: MovingBossHandle,
  personaHandle: PersonaHandle | null,
): void {
  if (personaHandle) playPersonaState(scene, personaHandle, "attack");
  scene.time.delayedCall(200, () => playBossState(scene, bossHandle, "hurt"));
}

/** Combat won — persona victory pose + boss defeat/dissolve. */
export function onCombatVictory(
  scene: Phaser.Scene,
  bossHandle: MovingBossHandle,
  personaHandle: PersonaHandle | null,
  onDissolved?: () => void,
): void {
  if (personaHandle) {
    playPersonaVictoryPose(scene, personaHandle, bossHandle.sprite.x);
  }
  scene.time.delayedCall(300, () => {
    dissolveBoss(scene, bossHandle, { onComplete: onDissolved });
  });
}

// ─────────────────────────────────────────────────────────────────────
// Pool super-boss support (project-scoped villains from
// SUPER_BOSS_POOL in venture.config.ts). Same clip shape as a
// StageBoss, so we adapt the entry into a StageBoss-compatible
// object and reuse the existing load/register/spawn/play helpers.
// Per user ask: "wire all of them with code and if any animation
// is missing for a boss use can use defeat animation also in
// retreat and attack animation for victory. do everything
// professionally." — the resolveState fallback chain already covers
// victory→attack→idle and defeat→hurt→idle, so pool bosses inherit
// those graceful fallbacks automatically.
// ─────────────────────────────────────────────────────────────────────

import type { SuperBossPoolEntry } from "@/config/templates/venture.config";
import type { VillageBossFamily } from "@/config/village-bosses";

/** Turn a SuperBossPoolEntry into a StageBoss-compatible object so
 *  every helper below (load / register / spawn / play / retreat /
 *  dissolve) can accept it without a second code path. */
function poolAsStageBoss(entry: SuperBossPoolEntry): StageBoss {
  // Pool bosses default to "serpent" family palette (matches the
  // Unraveller / Ashen Drake / Tide Caller flavor) — used only for
  // aura tint by bossAnimator. Individual entries can override by
  // extending SuperBossPoolEntry with a `family` field later.
  const family: VillageBossFamily = "serpent";
  return {
    checkpointIndex: -1,
    isSuper: true,
    name: entry.name,
    family,
    idleAsset: entry.idleAsset ?? "",
    introLine: `* ${entry.name} rises. ${entry.represents}.`,
    idleClip: entry.idleClip,
    attackClip: entry.attackClip,
    hurtClip: entry.hurtClip,
    defeatClip: entry.defeatClip,
    victoryClip: entry.victoryClip,
    spriteScale: entry.spriteScale ?? 2.4,
    spriteYOffset: entry.spriteYOffset ?? 40,
    spriteXOffset: entry.spriteXOffset ?? 0,
  };
}

/** Preload every clip a pool boss ships (idle/attack/hurt/defeat/
 *  victory + optional rotations). Call from a scene's preload().
 *  Skips clips that don't exist on disk cleanly — the state machine
 *  falls back through resolveState() at play time. */
export function loadPoolBossAssets(
  scene: Phaser.Scene,
  entry: SuperBossPoolEntry,
): void {
  const boss = poolAsStageBoss(entry);
  // Pool bosses go under stage=0 in the texture-key namespace so they
  // never collide with stage-1..7 mini/super bosses.
  loadBossAssets(scene, 0, boss);
  // Optional directional rotations — load each as a plain image so
  // the map's walk code can `setTexture()` on facing change.
  if (entry.rotations) {
    for (const [dir, path] of Object.entries(entry.rotations)) {
      if (!path) continue;
      const key = `pool-rot:${slugify(entry.name)}:${dir}`;
      if (scene.textures.exists(key)) continue;
      scene.load.image(key, path);
    }
  }
}

/** Register anims for every pool-boss clip that loaded. */
export function registerPoolBossAnimations(
  scene: Phaser.Scene,
  entry: SuperBossPoolEntry,
): void {
  const boss = poolAsStageBoss(entry);
  registerBossAnimations(scene, 0, boss);
}

/** Spawn a pool boss as a MovingBossHandle at a specific map point.
 *  Returns a handle scenes can pass to playBossState / retreatBossTo /
 *  dissolveBoss just like a stage boss. */
export function spawnPoolBoss(
  scene: Phaser.Scene,
  entry: SuperBossPoolEntry,
  pos: { x: number; y: number },
  opts: { showHpBar?: boolean; depth?: number } = {},
): MovingBossHandle {
  const boss = poolAsStageBoss(entry);
  const handle = spawnMovingBoss(scene, 0, boss, pos, opts);
  return handle;
}

/** Reveal a pool super boss with the full cinematic (pan + rise +
 *  scale-in + HP bar). Same choreography as revealSuperBoss for
 *  stage-final bosses. */
export function revealPoolSuperBoss(
  scene: Phaser.Scene,
  entry: SuperBossPoolEntry,
  pos: { x: number; y: number },
  opts: { panDurationMs?: number; onArrived?: () => void } = {},
): MovingBossHandle {
  const boss = poolAsStageBoss(entry);
  return revealSuperBoss(scene, 0, boss, pos, opts);
}

/** Swap a pool boss's on-screen facing to the direction closest to a
 *  given vector, using the 8 rotation images if the entry ships them.
 *  No-op when the entry has no rotations block — the current sprite
 *  frame stays. */
export function setPoolBossFacing(
  scene: Phaser.Scene,
  handle: MovingBossHandle,
  entry: SuperBossPoolEntry,
  dx: number,
  dy: number,
): void {
  if (!entry.rotations) return;
  // 8-direction picker — atan2 → nearest 45° bucket.
  const angle = Math.atan2(dy, dx); // -PI..PI, 0 = east
  const octant = Math.round(((angle + Math.PI) / (Math.PI / 4))) % 8;
  const dirs: Array<keyof NonNullable<SuperBossPoolEntry["rotations"]>> = [
    "west", "south-west", "south", "south-east",
    "east", "north-east", "north", "north-west",
  ];
  const dir = dirs[octant];
  const key = `pool-rot:${slugify(entry.name)}:${dir}`;
  if (scene.textures.exists(key)) {
    handle.sprite.setTexture(key);
  }
}

// Re-exports for scene convenience
export type { BossState, StageBoss };
export type { SuperBossPoolEntry };
