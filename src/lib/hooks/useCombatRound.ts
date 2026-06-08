"use client";

/**
 * Drives the lifecycle of a combat round on the client.
 *
 * Reads the round state via Convex subscription so the UI updates the
 * moment the server schedules the next question or settles the round.
 * Exposes a small typed action surface for the panel.
 *
 * The hook is intentionally state-machine-shaped: `phase` is a
 * discriminated union the panel switches on. The panel never asks
 * "is the round done yet?" — it asks "what phase am I in?"
 */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type {
  CombatRoundResult,
  CombatRoundView,
  KeystrokeTelemetry,
} from "@/lib/combat/types";
import { eventBridge } from "@/lib/phaser/utils/event-bridge";

export type CombatPhase =
  | { kind: "loading" }
  | { kind: "cap_exhausted" }
  | { kind: "active"; view: CombatRoundView }
  | { kind: "settled"; view: CombatRoundView; result: CombatRoundResult };

export interface UseCombatRound {
  phase: CombatPhase;
  submitAnswer: (
    answer: string,
    telemetry: KeystrokeTelemetry,
    wasExpiry: boolean,
  ) => Promise<void>;
  retryCombat: () => Promise<{ roundId: Id<"combatRounds"> }>;
  abandon: () => Promise<void>;
}

export function useCombatRound(
  roundId: Id<"combatRounds">,
  /** Used by the retry path; matches the round's checkpoint. */
  checkpointId: Id<"ventureCheckpoints">,
): UseCombatRound {
  const view = useQuery(api.combat.getRoundState, { roundId });
  const result = useQuery(
    api.combat.getRoundResult,
    view && (view.status === "won" || view.status === "lost")
      ? { roundId }
      : "skip",
  );

  const submitAnswerMut = useMutation(api.combat.submitAnswer);
  const retryMut = useMutation(api.combat.retryCombat);
  const abandonMut = useMutation(api.combat.abandonCombatRound);

  const submitAnswer = useCallback(
    async (
      answer: string,
      telemetry: KeystrokeTelemetry,
      wasExpiry: boolean,
    ) => {
      if (!view?.currentQuestion) return;
      await submitAnswerMut({
        questionId: view.currentQuestion._id as Id<"combatQuestions">,
        answer,
        telemetry,
        wasExpiry,
      });
    },
    [submitAnswerMut, view?.currentQuestion],
  );

  const retryCombat = useCallback(async () => {
    return await retryMut({ checkpointId });
  }, [retryMut, checkpointId]);

  const abandon = useCallback(async () => {
    await abandonMut({ roundId });
  }, [abandonMut, roundId]);

  const phase: CombatPhase = useMemo(() => {
    if (!view) return { kind: "loading" };
    if (view.status === "cap_exhausted") return { kind: "cap_exhausted" };
    if (view.status === "active") {
      return { kind: "active", view: viewToShape(view) };
    }
    // won / lost / abandoned — settled
    if (result) {
      // Fan out the boss reaction sequence to Phaser. Idempotent —
      // event handler should de-dup if called twice on the same result.
      eventBridge.emit("combat:reactions_ready", {
        keys: result.bossReactionKeys,
      });
      return { kind: "settled", view: viewToShape(view), result };
    }
    return { kind: "loading" };
  }, [view, result]);

  return { phase, submitAnswer, retryCombat, abandon };
}

function viewToShape(
  raw: NonNullable<ReturnType<typeof useQuery<typeof api.combat.getRoundState>>>,
): CombatRoundView {
  return {
    roundId: raw.roundId,
    status: raw.status,
    tier: raw.tier,
    totalQuestions: raw.totalQuestions,
    currentQuestionIndex: raw.currentQuestionIndex,
    bossHpInitial: raw.bossHpInitial,
    playerHpInitial: raw.playerHpInitial,
    bossHpCurrent: raw.bossHpCurrent,
    playerHpCurrent: raw.playerHpCurrent,
    attemptNumber: raw.attemptNumber,
    currentQuestion: raw.currentQuestion,
  };
}
