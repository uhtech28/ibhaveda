/**
 * Mini-boss combat reaction animations.
 *
 * Bolts onto the existing `MiniBoss` class (in MiniBoss.ts) via a mixin
 * pattern so we don't have to touch the 1,800-line entity file. Each
 * reaction corresponds to a 1-5 answer score from the combat round and
 * is keyed by the strings declared in `COMBAT_CONFIG.BOSS_REACTIONS`.
 *
 * Animation strategy:
 *   - For the v1 ship we use procedural tweens (no new sprite work
 *     required) — the existing mini-boss sprite is offset, tinted, and
 *     scaled to convey hit / block / damage / defeat.
 *   - Each reaction is composed of small motion primitives in this
 *     module so swapping to bespoke sprite animations later only
 *     touches the inside of these methods, not call sites.
 *   - Animations are queued via a small in-class promise chain so
 *     calling 5 reactions in rapid succession (one per question)
 *     plays them sequentially instead of stomping each other.
 *
 * Wiring into MiniBoss:
 *   - Import `installCombatReactions(scene, boss)` from MiniBoss.ts
 *     after the boss sprite is created.
 *   - Subscribe to the bridge event "combat:reactions_ready" — when it
 *     fires, iterate `payload.keys` and call `playReaction(key)` on
 *     each, awaiting completion.
 */

import * as Phaser from "phaser";

/** Names emitted by `COMBAT_CONFIG.BOSS_REACTIONS`. */
export type CombatReactionKey =
  | "player_defeated"
  | "player_solid_hit"
  | "attack_blocked"
  | "minor_damage"
  | "major_damage";

interface ReactionTarget {
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
  scene: Phaser.Scene;
}

interface ReactionQueue {
  current: Promise<void>;
}

const queueByTargetId = new WeakMap<object, ReactionQueue>();

/**
 * Returns a function that plays a single reaction. Reactions for the
 * same target are serialised so they never overlap.
 */
export function createReactionPlayer(target: ReactionTarget) {
  const initialQueue: ReactionQueue = { current: Promise.resolve() };
  queueByTargetId.set(target.sprite, initialQueue);

  return async function playReaction(key: CombatReactionKey): Promise<void> {
    const queue = queueByTargetId.get(target.sprite) ?? initialQueue;
    const next = queue.current.then(() => animate(target, key));
    queue.current = next.catch(() => undefined);
    return next;
  };
}

/** Fan-out helper: play a list of reactions back-to-back. */
export async function playReactionSequence(
  target: ReactionTarget,
  keys: readonly CombatReactionKey[],
): Promise<void> {
  const play = createReactionPlayer(target);
  for (const k of keys) {
    await play(k);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Reaction implementations
// ─────────────────────────────────────────────────────────────────────

async function animate(
  { sprite, scene }: ReactionTarget,
  key: CombatReactionKey,
): Promise<void> {
  switch (key) {
    case "player_defeated":
      return defeatedAnimation(scene, sprite);
    case "player_solid_hit":
      return solidHitAnimation(scene, sprite);
    case "attack_blocked":
      return blockedAnimation(scene, sprite);
    case "minor_damage":
      return minorDamageAnimation(scene, sprite);
    case "major_damage":
      return majorDamageAnimation(scene, sprite);
  }
}

/** 1/5 — boss wins, player takes the hit. Boss puffs up and laughs. */
function defeatedAnimation(
  scene: Phaser.Scene,
  sprite: ReactionTarget["sprite"],
): Promise<void> {
  return tween(scene, sprite, {
    scaleX: sprite.scaleX * 1.18,
    scaleY: sprite.scaleY * 1.18,
    duration: 220,
    yoyo: true,
    repeat: 1,
    ease: "Sine.easeInOut",
    onStart: () => sprite.setTint(0xff6666),
    onComplete: () => sprite.clearTint(),
  });
}

/** 2/5 — boss lands a solid hit. Sprite leans forward then back. */
function solidHitAnimation(
  scene: Phaser.Scene,
  sprite: ReactionTarget["sprite"],
): Promise<void> {
  const x0 = sprite.x;
  return tween(scene, sprite, {
    x: x0 - 12,
    duration: 110,
    yoyo: true,
    repeat: 1,
    ease: "Cubic.easeOut",
    onStart: () => sprite.setTint(0xffaa66),
    onComplete: () => {
      sprite.setX(x0);
      sprite.clearTint();
    },
  });
}

/** 3/5 — exchange of blows blocked. Quick flash, no movement. */
function blockedAnimation(
  scene: Phaser.Scene,
  sprite: ReactionTarget["sprite"],
): Promise<void> {
  return tween(scene, sprite, {
    duration: 90,
    yoyo: true,
    repeat: 2,
    ease: "Linear",
    alpha: 0.4,
    onStart: () => sprite.setTint(0xffe066),
    onComplete: () => {
      sprite.setAlpha(1);
      sprite.clearTint();
    },
  });
}

/** 4/5 — boss takes minor damage. Knockback + slight shrink. */
function minorDamageAnimation(
  scene: Phaser.Scene,
  sprite: ReactionTarget["sprite"],
): Promise<void> {
  const x0 = sprite.x;
  return tween(scene, sprite, {
    x: x0 + 18,
    scaleX: sprite.scaleX * 0.94,
    scaleY: sprite.scaleY * 0.94,
    duration: 180,
    yoyo: true,
    ease: "Cubic.easeOut",
    onStart: () => sprite.setTint(0x88e0a0),
    onComplete: () => {
      sprite.setX(x0);
      sprite.clearTint();
    },
  });
}

/** 5/5 — boss takes a major hit. Bigger knockback, screen-shake. */
function majorDamageAnimation(
  scene: Phaser.Scene,
  sprite: ReactionTarget["sprite"],
): Promise<void> {
  const x0 = sprite.x;
  scene.cameras.main.shake(220, 0.005);
  return tween(scene, sprite, {
    x: x0 + 36,
    scaleX: sprite.scaleX * 0.88,
    scaleY: sprite.scaleY * 0.88,
    angle: -8,
    duration: 240,
    yoyo: true,
    ease: "Quart.easeOut",
    onStart: () => sprite.setTint(0xa0ff80),
    onComplete: () => {
      sprite.setX(x0);
      sprite.setAngle(0);
      sprite.clearTint();
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// Promise-wrapped tween helper
// ─────────────────────────────────────────────────────────────────────

interface TweenConfig {
  duration: number;
  yoyo?: boolean;
  repeat?: number;
  ease?: string;
  scaleX?: number;
  scaleY?: number;
  x?: number;
  y?: number;
  alpha?: number;
  angle?: number;
  onStart?: () => void;
  onComplete?: () => void;
}

function tween(
  scene: Phaser.Scene,
  sprite: ReactionTarget["sprite"],
  cfg: TweenConfig,
): Promise<void> {
  return new Promise((resolve) => {
    const { onStart, onComplete, ...tweenProps } = cfg;
    scene.tweens.add({
      targets: sprite,
      ...tweenProps,
      onStart: () => onStart?.(),
      onComplete: () => {
        onComplete?.();
        resolve();
      },
    });
  });
}
