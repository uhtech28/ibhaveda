/**
 * Persona asset loading helper for Phaser scenes.
 *
 * Every stage scene (Village, Forest, Arena, Mine, Harbor, Artisans,
 * Crossroads, WorldMap) used to hardcode a single `CHAR_IDLE_ASSET` /
 * `CHAR_WALK_ASSET`. Now each scene should call:
 *
 *     preload() {
 *       loadPersonaSprites(this, personaId);  // in preload
 *     }
 *     create() {
 *       registerPersonaAnimations(this, personaId);  // in create
 *       const idleKey = personaSpriteKey(personaId, "idle");
 *       // ... spawn Phaser.GameObjects.Sprite with this key
 *     }
 *
 * All scenes share the same texture keys (via personaSpriteKey) so
 * switching stages doesn't force a re-download.
 */

import type * as Phaser from "phaser";
import { getPersona, isValidPersonaId, type PersonaId } from "@/config/personas";

// ─── Module-level current persona ─────────────────────────────────────
// React resolves the current user's personaId via a Convex query and
// pushes it here before spinning up the Phaser game. Every scene's
// preload reads through getCurrentPersonaId() so the correct
// spritesheet is loaded on first paint.
let currentPersonaId: PersonaId | null = null;

/** Set the current persona. Call this BEFORE creating the Phaser.Game
 *  (typically from map/world/page.tsx once the personaId query
 *  resolves). Safe to call multiple times. */
export function setCurrentPersonaId(id: PersonaId | null | undefined): void {
  currentPersonaId = isValidPersonaId(id) ? id : null;
}

/** Read the current persona. Falls back to "alchemist" if unset —
 *  alchemist is the only persona with a full Pixellab spritesheet set
 *  (idle + 4-directional walk + combat states), so unpicked users get
 *  the richest visuals for the demo. */
export function getCurrentPersonaId(): PersonaId {
  return currentPersonaId ?? "alchemist";
}

/** Anim families a persona can play. Extended personas support all of them;
 *  legacy personas fall back to just "idle" | "walk". */
export type PersonaAnimKind =
  | "idle"
  | "walk"
  | "walk-north"
  | "walk-south"
  | "walk-east"
  | "walk-west"
  | "attack"
  | "hurt"
  | "defeat"
  | "victory";

/** Stable Phaser texture key for a persona's spritesheet. */
export function personaSpriteKey(
  personaId: PersonaId | null | undefined,
  kind: PersonaAnimKind,
): string {
  const id = isValidPersonaId(personaId) ? personaId : "alchemist";
  return `persona:${id}:${kind}`;
}

/** Stable animation key for a persona's clip. */
export function personaAnimKey(
  personaId: PersonaId | null | undefined,
  kind: PersonaAnimKind,
): string {
  const id = isValidPersonaId(personaId) ? personaId : "alchemist";
  return `persona-anim:${id}:${kind}`;
}

/** True if the persona has the full Pixellab-generated animation set
 *  (directional walk + combat states). Used by scenes to branch between
 *  the legacy idle/walk pair and the extended state machine. */
export function personaHasExtended(
  personaId: PersonaId | null | undefined,
): boolean {
  return !!getPersona(personaId).extended;
}

/** Load the idle + walk spritesheets for a persona. Idempotent.
 *  If the persona has an `extended` block (full Pixellab set), this loader
 *  ALSO queues the 4-direction walk + combat one-shots (attack/hurt/
 *  defeat/victory) under keys `persona:<id>:<kind>`. */
export function loadPersonaSprites(
  scene: Phaser.Scene,
  personaId: PersonaId | null | undefined,
): void {
  const persona = getPersona(personaId);
  const { frameWidth, frameHeight } = persona.sprite;
  const ext = persona.extended;

  // Legacy idle + walk sheets — skip if this persona has an extended set,
  // since the same key (`persona:<id>:idle`) is loaded below with the
  // extended frameWidth/Height and pointing at the Pixellab sheet.
  if (!ext) {
    const idleKey = personaSpriteKey(persona.id, "idle");
    if (!scene.textures.exists(idleKey)) {
      scene.load.spritesheet(idleKey, persona.assets.idle, {
        frameWidth,
        frameHeight,
      });
    }
    const walkKey = personaSpriteKey(persona.id, "walk");
    if (!scene.textures.exists(walkKey)) {
      scene.load.spritesheet(walkKey, persona.assets.walk, {
        frameWidth,
        frameHeight,
      });
    }
  }

  // Extended set — Pixellab pipeline. Loaded under the same
  // `persona:<id>:<kind>` key namespace so scenes can look them up
  // via `personaSpriteKey(id, kind)` with no other bookkeeping.
  if (!ext) return;
  const extLoads: Array<[PersonaAnimKind, string]> = [
    ["idle", ext.assets.idle],
    ["walk-north", ext.assets.walkNorth],
    ["walk-south", ext.assets.walkSouth],
    ["walk-east", ext.assets.walkEast],
    ["walk-west", ext.assets.walkWest],
    ["attack", ext.assets.attack],
    ["hurt", ext.assets.hurt],
    ["defeat", ext.assets.defeat],
    ["victory", ext.assets.victory],
  ];
  for (const [kind, path] of extLoads) {
    const key = personaSpriteKey(persona.id, kind);
    // Extended idle key collides with legacy idle key — reload as extended
    // spritesheet dims (Pixellab may use 88x88, legacy default is 32x48).
    // Skip only if it already exists AND has the same frameSize; simplest
    // approach: for extended personas we override with extended dims here.
    if (scene.textures.exists(key)) continue;
    scene.load.spritesheet(key, path, {
      frameWidth: ext.frameWidth,
      frameHeight: ext.frameHeight,
    });
  }
}

/** Register the idle + walk animations for a persona. Idempotent.
 *  Must be called AFTER the spritesheet has finished loading (i.e.
 *  in `create`, not `preload`). */
export function registerPersonaAnimations(
  scene: Phaser.Scene,
  personaId: PersonaId | null | undefined,
): void {
  const persona = getPersona(personaId);
  const ext = persona.extended;

  // Extended personas: register idle + 4-directional walks + combat one-shots
  // and skip the legacy 2-anim pair (same key namespace).
  if (ext) {
    const clips: Array<{
      kind: PersonaAnimKind;
      frames: number;
      fps: number;
      repeat: number;
    }> = [
      { kind: "idle", frames: ext.idleFrames, fps: ext.idleFps, repeat: -1 },
      { kind: "walk-north", frames: ext.walkFrames, fps: ext.walkFps, repeat: -1 },
      { kind: "walk-south", frames: ext.walkFrames, fps: ext.walkFps, repeat: -1 },
      { kind: "walk-east", frames: ext.walkFrames, fps: ext.walkFps, repeat: -1 },
      { kind: "walk-west", frames: ext.walkFrames, fps: ext.walkFps, repeat: -1 },
      { kind: "attack", frames: ext.attackFrames, fps: ext.combatFps, repeat: 0 },
      { kind: "hurt", frames: ext.hurtFrames, fps: ext.combatFps, repeat: 0 },
      { kind: "defeat", frames: ext.defeatFrames, fps: ext.combatFps, repeat: 0 },
      { kind: "victory", frames: ext.victoryFrames, fps: ext.combatFps, repeat: 0 },
    ];
    for (const c of clips) {
      const animKey = personaAnimKey(persona.id, c.kind);
      if (scene.anims.exists(animKey)) continue;
      const texKey = personaSpriteKey(persona.id, c.kind);
      if (!scene.textures.exists(texKey)) continue;
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(texKey, {
          start: 0,
          end: Math.max(0, c.frames - 1),
        }),
        frameRate: c.fps,
        repeat: c.repeat,
      });
    }
    return;
  }

  const { idleFrames, idleFps, walkFrames, walkFps } = persona.sprite;

  const idleAnim = personaAnimKey(persona.id, "idle");
  if (!scene.anims.exists(idleAnim)) {
    const idleKey = personaSpriteKey(persona.id, "idle");
    if (scene.textures.exists(idleKey)) {
      scene.anims.create({
        key: idleAnim,
        frames: scene.anims.generateFrameNumbers(idleKey, {
          start: 0,
          end: Math.max(0, idleFrames - 1),
        }),
        frameRate: idleFps,
        repeat: -1,
      });
    }
  }

  const walkAnim = personaAnimKey(persona.id, "walk");
  if (!scene.anims.exists(walkAnim)) {
    const walkKey = personaSpriteKey(persona.id, "walk");
    if (scene.textures.exists(walkKey)) {
      scene.anims.create({
        key: walkAnim,
        frames: scene.anims.generateFrameNumbers(walkKey, {
          start: 0,
          end: Math.max(0, walkFrames - 1),
        }),
        frameRate: walkFps,
        repeat: -1,
      });
    }
  }
}

/** Given a normalized direction vector, pick the correct extended
 *  directional-walk animation key. Uses the DOMINANT axis so the
 *  animation reads clearly; ties go to horizontal. Returns the
 *  fallback legacy walk anim key when the persona doesn't have
 *  the extended set. */
export function directionalWalkAnimKey(
  personaId: PersonaId | null | undefined,
  dx: number,
  dy: number,
): string {
  const persona = getPersona(personaId);
  if (!persona.extended) {
    return personaAnimKey(persona.id, "walk");
  }
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  let kind: PersonaAnimKind = "walk-south";
  if (ax >= ay) {
    kind = dx >= 0 ? "walk-east" : "walk-west";
  } else {
    kind = dy >= 0 ? "walk-south" : "walk-north";
  }
  return personaAnimKey(persona.id, kind);
}
