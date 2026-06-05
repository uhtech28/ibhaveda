"use client";

/**
 * Hook that ties the spawn-prompt → overlay → server completion flow
 * together. Mount once on the world-map screen and call
 * `engageWithSpawn` when the Phaser spawn-point entity emits its
 * activate event.
 *
 * Three phases:
 *   - prompt   — user has activated a spawn, dialog visible
 *   - playing  — overlay mounted, Phaser scene running
 *   - result   — server settled the session, result panel visible
 */

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { MiniGameSpawnConfig } from "@convex/miniGameConstants";
import type {
  MiniGameCompletionView,
  MiniGameSceneResult,
} from "@convex/miniGameTypes";

export type MiniGamePhase =
  | { kind: "idle" }
  | { kind: "prompt"; spawn: MiniGameSpawnConfig }
  | { kind: "playing"; spawn: MiniGameSpawnConfig; sessionId: Id<"miniGameSessions"> }
  | { kind: "result"; completion: MiniGameCompletionView };

export function useMiniGameLifecycle(ventureId?: Id<"ventures">) {
  const [phase, setPhase] = useState<MiniGamePhase>({ kind: "idle" });

  const completedSpawnIds = useQuery(api.miniGames.getMyCompletedSpawnIds, {});
  const startSession = useMutation(api.miniGames.startSession);
  const completeSession = useMutation(api.miniGames.completeSession);
  const abandonSession = useMutation(api.miniGames.abandonSession);

  /** Show the prompt for a spawn that the player activated. */
  const engageWithSpawn = useCallback((spawn: MiniGameSpawnConfig) => {
    setPhase({ kind: "prompt", spawn });
  }, []);

  /** User accepted the prompt — kick off the server session and overlay. */
  const acceptPrompt = useCallback(async () => {
    if (phase.kind !== "prompt") return;
    try {
      const { sessionId } = await startSession({
        spawnPointId: phase.spawn.id,
        ventureId,
      });
      setPhase({ kind: "playing", spawn: phase.spawn, sessionId });
    } catch (err) {
      // Treat any start error (already-completed, etc.) as a return-to-idle.
      console.warn("[minigames] startSession failed:", err);
      setPhase({ kind: "idle" });
    }
  }, [phase, startSession, ventureId]);

  /** User dismissed the prompt — back to idle. */
  const dismissPrompt = useCallback(() => {
    setPhase({ kind: "idle" });
  }, []);

  /** Phaser resolved with a result — settle on the server, show result. */
  const settle = useCallback(
    async (result: MiniGameSceneResult) => {
      if (phase.kind !== "playing") return;
      try {
        const completion = await completeSession({
          sessionId: phase.sessionId,
          result,
        });
        setPhase({ kind: "result", completion });
      } catch (err) {
        console.warn("[minigames] completeSession failed:", err);
        setPhase({ kind: "idle" });
      }
    },
    [phase, completeSession],
  );

  /** Phaser was abandoned — server-side abandon and return to idle. */
  const abandon = useCallback(async () => {
    if (phase.kind !== "playing") return;
    try {
      await abandonSession({ sessionId: phase.sessionId });
    } catch (err) {
      console.warn("[minigames] abandonSession failed:", err);
    }
    setPhase({ kind: "idle" });
  }, [phase, abandonSession]);

  /** Close the result panel — return to idle. */
  const closeResult = useCallback(() => {
    setPhase({ kind: "idle" });
  }, []);

  // If a spawn the user just cleared is still rendered on the map,
  // surface the latest completion list so the spawn entity can hide.
  useEffect(() => {
    // No-op — the world map polls `completedSpawnIds` to decide
    // which entities to hide. Returning it from the hook lets the
    // caller pass it into the spawn-point manager.
  }, [completedSpawnIds]);

  return {
    phase,
    completedSpawnIds: completedSpawnIds ?? [],
    engageWithSpawn,
    acceptPrompt,
    dismissPrompt,
    settle,
    abandon,
    closeResult,
  };
}
