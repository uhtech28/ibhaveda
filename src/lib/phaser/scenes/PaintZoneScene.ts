/**
 * @file PaintZoneScene.ts
 * @description Minimal Phaser scene used by /dev/paint-zones. Loads
 *  ANY painted map by path + attaches the walkability zone editor, so
 *  blockers can be authored for templates that don't have dedicated
 *  scenes yet (Academic / Lab / Creative).
 *
 *  Instantiated per-map — the /dev page rebuilds the whole Phaser game
 *  when the user picks a different map so we don't have to fight
 *  scene-registry reuse across different assets.
 */

import * as Phaser from "phaser";
import { attachZoneEditor } from "@/lib/phaser/systems/zoneEditor";
import { attachEditorTestWalk } from "@/lib/phaser/systems/editorTestWalk";
import {
  getCurrentPersonaId,
  loadPersonaSprites,
  personaSpriteKey,
} from "@/lib/phaser/persona-assets";

const CHAR_IDLE_ASSET = "/assets/fan-tasy/Character_Idle.webp";
const CHAR_WALK_ASSET = "/assets/fan-tasy/Character_Walk.webp";
const CHAR_SCALE = 2.2;

export interface PaintSceneConfig {
  mapKey: string;
  mapPath: string;
  mapWidth: number;
  mapHeight: number;
  /** localStorage key suffix — becomes ibhaveda-zones-<storageKey>. */
  storageKey: string;
}

/**
 * Factory that returns a fresh scene class bound to the given config.
 * Using a factory (not init data) so each rebuild gets a clean scene
 * key and Phaser doesn't try to reuse a cached texture from the last
 * map path.
 */
export function createPaintZoneScene(cfg: PaintSceneConfig): typeof Phaser.Scene {
  return class PaintZoneScene extends Phaser.Scene {
    constructor() {
      super({ key: `PaintZoneScene-${cfg.mapKey}` });
    }

    private character: Phaser.GameObjects.Sprite | null = null;

    preload(): void {
      this.load.image(cfg.mapKey, cfg.mapPath);
      // Load the user's picked persona (extended sheets if present).
      loadPersonaSprites(this, getCurrentPersonaId());
      // Legacy fallback so scenes still render if the picked persona
      // hasn't loaded (SSR-first paint, unset persona, etc.).
      if (!this.textures.exists("paint-persona-idle")) {
        this.load.spritesheet("paint-persona-idle", CHAR_IDLE_ASSET, {
          frameWidth: 32,
          frameHeight: 48,
        });
      }
      if (!this.textures.exists("paint-persona-walk")) {
        this.load.spritesheet("paint-persona-walk", CHAR_WALK_ASSET, {
          frameWidth: 32,
          frameHeight: 48,
        });
      }
    }

    create(): void {
      this.add.image(0, 0, cfg.mapKey).setOrigin(0, 0).setDepth(0);

      const cam = this.cameras.main;
      cam.setBounds(0, 0, cfg.mapWidth, cfg.mapHeight);
      const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
      let zoom: number;
      if (vw < 480) zoom = 0.45;
      else if (vw < 768) zoom = 0.6;
      else if (vw < 1024) zoom = 0.8;
      else zoom = 0.95;
      cam.setZoom(zoom);
      cam.centerOn(cfg.mapWidth / 2, cfg.mapHeight / 2);

      // Drag-to-pan is always DISABLED here — this scene exists purely
      // to draw blocker rectangles, so left-click-drag should belong to
      // the editor. Right-click-drag panning is provided by the editor
      // itself, and WASD/arrow keys still pan.
      const KEY_PAN_SPEED = 14;
      const keyboard = this.input.keyboard;
      if (keyboard) {
        const cursors = keyboard.createCursorKeys();
        const wasd = {
          W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
          A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
          S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
          D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
        this.events.on("update", () => {
          const left = cursors.left?.isDown || wasd.A.isDown;
          const right = cursors.right?.isDown || wasd.D.isDown;
          const up = cursors.up?.isDown || wasd.W.isDown;
          const down = cursors.down?.isDown || wasd.S.isDown;
          const step = KEY_PAN_SPEED / cam.zoom;
          if (left) cam.scrollX -= step;
          if (right) cam.scrollX += step;
          if (up) cam.scrollY -= step;
          if (down) cam.scrollY += step;
        });
      }

      // Attach the same zone editor used by real scenes. It reads
      // ?editZones=1 from the URL — /dev/paint-zones always adds that.
      const editor = attachZoneEditor(this, cfg.storageKey);

      // Resolve which texture to use — picked persona first, fallback
      // to the legacy paint-persona sheets.
      const personaId = getCurrentPersonaId();
      const personaIdleTex = personaSpriteKey(personaId, "idle");
      const personaWalkTex = personaSpriteKey(personaId, "walk");
      const idleTexKey = this.textures.exists(personaIdleTex)
        ? personaIdleTex
        : "paint-persona-idle";
      const walkTexKey = this.textures.exists(personaWalkTex)
        ? personaWalkTex
        : "paint-persona-walk";

      // Dynamic frame ranges so any persona (2-frame legacy, 4/8-frame
      // extended, etc.) plays without out-of-range errors.
      if (this.anims.exists("paint-idle")) this.anims.remove("paint-idle");
      if (this.anims.exists("paint-walk")) this.anims.remove("paint-walk");
      const idleFrames = this.textures.get(idleTexKey).frameTotal;
      this.anims.create({
        key: "paint-idle",
        frames: this.anims.generateFrameNumbers(idleTexKey, {
          start: 0,
          end: Math.max(0, Math.min(idleFrames - 1, 3)),
        }),
        frameRate: 6,
        repeat: -1,
      });
      const walkFrames = this.textures.get(walkTexKey).frameTotal;
      const walkStart = walkTexKey === "paint-persona-walk" ? 10 : 0;
      const walkEnd = walkTexKey === "paint-persona-walk"
        ? Math.min(walkFrames - 1, 14)
        : Math.min(walkFrames - 1, 5);
      this.anims.create({
        key: "paint-walk",
        frames: this.anims.generateFrameNumbers(walkTexKey, {
          start: walkStart,
          end: walkEnd,
        }),
        frameRate: 10,
        repeat: -1,
      });
      this.character = this.add.sprite(
        cfg.mapWidth / 2,
        cfg.mapHeight / 2,
        idleTexKey,
      );
      this.character.setOrigin(0.5, 1);
      this.character.setScale(CHAR_SCALE);
      this.character.setDepth(100);
      this.character.play("paint-idle");

      // Wire live test-walk. Blockers = whatever the editor currently
      // has (there's no hardcoded BLOCKED_ZONES for these maps yet).
      attachEditorTestWalk(this, {
        getCharacter: () => this.character,
        isBlocked: (x, y) => {
          for (const z of editor.getCustomZones()) {
            if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
              return true;
            }
          }
          return false;
        },
        mapWidth: cfg.mapWidth,
        mapHeight: cfg.mapHeight,
        idleAnimKey: "paint-idle",
        walkAnimKey: "paint-walk",
      });
    }
  };
}
