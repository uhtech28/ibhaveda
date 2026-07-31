/**
 * @file editorTestWalk.ts
 * @description Live test-walk mode that piggybacks the zone editor.
 *
 * When `?editZones=1` is on the URL, this attaches a WASD/arrow-key
 * driven movement loop to the given character sprite, respecting the
 * scene's blocker function (which should merge BLOCKED_ZONES + custom
 * editor zones). Camera follows the character. Right-click-drag still
 * pans (owned by the zone editor).
 *
 * The point: while drawing rectangles in the editor, you can walk the
 * real persona into them and confirm they hard-stop you — instant
 * feedback loop for authoring blockers.
 *
 * Scenes that call this should NOT bind WASD to camera panning while
 * `?editZones=1` is on, otherwise the keys collide.
 */

import * as Phaser from "phaser";

export interface EditorTestWalkOptions {
  /** Returns the character sprite once spawned, or null. */
  getCharacter: () => Phaser.GameObjects.Sprite | null;
  /** Returns true if the given map-space point is blocked. */
  isBlocked: (x: number, y: number) => boolean;
  mapWidth: number;
  mapHeight: number;
  /** Pixels-per-second at speed 1. Defaults to 220. */
  speed?: number;
  /** Half-width of the map inset (feet can't go past edge). Default 30. */
  insetX?: number;
  /** Half-height of the map inset. Default 60. */
  insetY?: number;
  /** Feet Y-offset from sprite y-coord.
   *  Default 0 — assumes sprite origin (0.5, 1) so `sprite.y` IS the feet.
   *  Village-style origin (0.5, 0.75) should pass +4. */
  feetOffsetY?: number;
  /** Anim key to play while moving. Default `"persona-walk"`. */
  walkAnimKey?: string;
  /** Anim key to play when idle. Default `"persona-idle"`. */
  idleAnimKey?: string;
}

export function attachEditorTestWalk(
  scene: Phaser.Scene,
  opts: EditorTestWalkOptions,
): void {
  // Only when the editor is active.
  const enabled =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("editZones") === "1";
  if (!enabled) return;

  const speed = opts.speed ?? 220;
  const insetX = opts.insetX ?? 30;
  const insetY = opts.insetY ?? 60;
  const feetOffsetY = opts.feetOffsetY ?? 0;
  const walkAnimKey = opts.walkAnimKey ?? "persona-walk";
  const idleAnimKey = opts.idleAnimKey ?? "persona-idle";

  const keyboard = scene.input.keyboard;
  if (!keyboard) return;
  const cursors = keyboard.createCursorKeys();
  const wasd = {
    W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
  };

  // Track which anim we last requested so we only call .play() on state
  // change (Phaser restarts the clip every call — spamming freezes it).
  let isWalking = false;

  const step = (_time: number, delta: number) => {
    const char = opts.getCharacter();
    if (!char) return;

    const left = cursors.left?.isDown || wasd.A.isDown;
    const right = cursors.right?.isDown || wasd.D.isDown;
    const up = cursors.up?.isDown || wasd.W.isDown;
    const down = cursors.down?.isDown || wasd.S.isDown;

    let dx = 0;
    let dy = 0;
    if (left) dx -= 1;
    if (right) dx += 1;
    if (up) dy -= 1;
    if (down) dy += 1;

    if (dx === 0 && dy === 0) {
      // No input this frame — swap back to idle exactly once.
      if (isWalking) {
        if (scene.anims.exists(idleAnimKey)) char.play(idleAnimKey, true);
        isWalking = false;
      }
      return;
    }

    // Normalise so diagonals aren't faster than orthogonal.
    const mag = Math.hypot(dx, dy);
    const inv = mag > 1 ? 1 / mag : 1;
    const nx = dx * inv;
    const ny = dy * inv;
    const px = speed * (delta / 1000);

    const targetX = char.x + nx * px;
    const targetY = char.y + ny * px;
    const clampedX = Phaser.Math.Clamp(targetX, insetX, opts.mapWidth - insetX);
    const clampedY = Phaser.Math.Clamp(targetY, insetY, opts.mapHeight - insetY);

    // Axis-separated so persona slides along walls. Feet-sample at
    // (x, y + feetOffsetY) so the collision follows where the character
    // actually touches the ground. NO alreadyBlocked escape hatch here —
    // that hatch was causing "some blockers don't block" because if a
    // character spawned inside/near a rect it went into free-walk mode
    // permanently.
    if (!opts.isBlocked(clampedX, char.y + feetOffsetY)) char.x = clampedX;
    if (!opts.isBlocked(char.x, clampedY + feetOffsetY)) char.y = clampedY;

    // Face the movement direction using flipX if the sprite defaults to
    // facing right. Skip if we're just going up/down.
    if (Math.abs(nx) > 0.05) char.setFlipX(nx < 0);

    // Swap to walk anim exactly once per idle→walk transition.
    if (!isWalking) {
      if (scene.anims.exists(walkAnimKey)) char.play(walkAnimKey, true);
      isWalking = true;
    }

    // Camera follow — center on character each tick.
    scene.cameras.main.centerOn(char.x, char.y);
  };

  scene.events.on(Phaser.Scenes.Events.UPDATE, step);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, step);
  });
}
