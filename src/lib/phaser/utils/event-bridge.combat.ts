/**
 * Combat-related event-bridge additions.
 *
 * The existing `event-bridge.ts` declares a typed bidirectional pub/sub
 * channel between React and Phaser. This file documents the additional
 * combat events and provides the type extensions to splice into the
 * bridge's union types.
 *
 * Splice into event-bridge.ts:
 *
 *   1. Add the entries below to `ReactToPhaserEvent` and
 *      `PhaserToReactEvent` unions (look for the existing
 *      `union` definitions in event-bridge.ts and add new members).
 *
 *   2. Add the matching `case` branches in any switch statements
 *      that map event names to handlers.
 *
 * Splicing this is a 5-line edit. We keep the additions here so the
 * combat feature owns its own event contract.
 */

import type { CombatReactionKey } from "../entities/MiniBossCombatReactions";

/**
 * Events that React sends INTO Phaser.
 */
export type CombatReactToPhaserEvent =
  | {
      type: "combat:open";
      payload: { ventureId: string; checkpointId: string };
    }
  | {
      type: "combat:close";
      payload: Record<string, never>;
    }
  | {
      type: "combat:reactions_ready";
      payload: { keys: CombatReactionKey[] };
    };

/**
 * Events that Phaser sends BACK to React.
 */
export type CombatPhaserToReactEvent =
  | {
      type: "combat:reaction_played";
      payload: { key: CombatReactionKey; index: number };
    }
  | {
      type: "combat:miniboss_spawned";
      payload: { spriteId: string };
    }
  | {
      type: "combat:miniboss_dismissed";
      payload: Record<string, never>;
    };

/* Splice instructions for event-bridge.ts:
 *
 *   // 1. Import at top of file:
 *   import type {
 *     CombatReactToPhaserEvent,
 *     CombatPhaserToReactEvent,
 *   } from "./event-bridge.combat";
 *
 *   // 2. Extend the existing unions:
 *   export type ReactToPhaserEvent =
 *     | ExistingReactToPhaserEvent
 *     | CombatReactToPhaserEvent;
 *
 *   export type PhaserToReactEvent =
 *     | ExistingPhaserToReactEvent
 *     | CombatPhaserToReactEvent;
 *
 *   // 3. In the WorldMapScene that subscribes to the bridge, add:
 *   gameEventBridge.on("combat:reactions_ready", ({ keys }) => {
 *     if (!this.miniBoss) return;
 *     playReactionSequence(
 *       { sprite: this.miniBoss.sprite, scene: this },
 *       keys,
 *     );
 *   });
 */
