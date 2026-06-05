"use client";

/**
 * Composite component that ties the prompt, overlay, and result
 * panel together. Drop into the world-map page once, then call
 * `surface.engageWithSpawn(...)` from the spawn-point activate
 * callback.
 *
 * The component renders only its modal/overlay layers — there's no
 * background chrome — so it doesn't disturb the world-map layout.
 */

import React from "react";
import type { Id } from "@convex/_generated/dataModel";
import { MiniGameOverlay } from "./MiniGameOverlay";
import { MiniGamePromptDialog } from "./MiniGamePromptDialog";
import { MiniGameResultPanel } from "./MiniGameResultPanel";
import { useMiniGameLifecycle } from "@/lib/minigames/useMiniGameLifecycle";
import type { MiniGameSpawnConfig } from "@convex/miniGameConstants";

export interface MiniGameSurfaceHandle {
  engageWithSpawn: (spawn: MiniGameSpawnConfig) => void;
  completedSpawnIds: string[];
}

interface Props {
  ventureId?: Id<"ventures">;
  /** Wire the spawn-point Phaser entity to fire `handle.engageWithSpawn`. */
  onHandleReady: (handle: MiniGameSurfaceHandle) => void;
}

export function MiniGameSurface({ ventureId, onHandleReady }: Props) {
  const lifecycle = useMiniGameLifecycle(ventureId);

  // Surface the handle so the parent (world-map page) can wire the
  // spawn-point Phaser entities to call `engageWithSpawn`.
  React.useEffect(() => {
    onHandleReady({
      engageWithSpawn: lifecycle.engageWithSpawn,
      completedSpawnIds: lifecycle.completedSpawnIds,
    });
  }, [lifecycle.engageWithSpawn, lifecycle.completedSpawnIds, onHandleReady]);

  const phase = lifecycle.phase;

  return (
    <>
      <MiniGamePromptDialog
        spawn={phase.kind === "prompt" ? phase.spawn : null}
        onEngage={() => void lifecycle.acceptPrompt()}
        onDismiss={lifecycle.dismissPrompt}
      />

      {phase.kind === "playing" && (
        <MiniGameOverlay
          spawn={phase.spawn}
          onResult={(r) => void lifecycle.settle(r)}
          onAbandon={() => void lifecycle.abandon()}
        />
      )}

      {phase.kind === "result" && (
        <MiniGameResultPanel
          completion={phase.completion}
          onClose={lifecycle.closeResult}
        />
      )}
    </>
  );
}
