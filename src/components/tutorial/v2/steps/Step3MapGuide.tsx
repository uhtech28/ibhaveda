"use client";

/**
 * Step3MapGuide -- Sparky guides the user through their first task
 * + AI combat on /map/world.
 *
 * CRITICAL: This step is "sticky". On arrival at /map/world, if the
 * user's tutorial step is still 0, 1, or 2 (e.g., because they were
 * auto-redirected after posting before clicking Sparky's "Go to map"
 * button), we FORCE-ADVANCE to step 3. This:
 *   1. makes Sparky appear on the map
 *   2. advances the progress bar (1/7 -> 3/7)
 *   3. prevents Step2 from re-firing if user goes back to /feed
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TutorialMascot, type SparkyMood } from "../TutorialMascot";
import { useTutorial } from "../useTutorial";

type Stage =
  | "arrived"
  | "checkpoint"
  | "task_open"
  | "submitted"
  | "combat"
  | "done";

function findCheckpointPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[data-tutorial="checkpoint-panel"], [aria-label="Checkpoint"], [data-checkpoint-panel], .checkpoint-panel',
  );
}

function findTaskModal(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[role="dialog"][data-state="open"], [data-tutorial="task-modal"]',
  );
}

function findCombatPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[data-tutorial="combat-panel"], [aria-label="AI Combat"], [data-combat-panel]',
  );
}

export function Step3MapGuide() {
  const tutorial = useTutorial();
  const pathname = usePathname();
  const onMap = pathname?.startsWith("/map/") ?? false;

  // FORCE-ADVANCE: when we land on /map/ and tutorial is active but
  // step is still < 3, push it to 3 immediately. This guarantees the
  // progress bar moves AND Sparky appears here even if the user got
  // auto-redirected from /feed before clicking Step2's "Go to map".
  const advancedRef = useRef(false);
  useEffect(() => {
    if (!onMap) return;
    if (!tutorial.active) return;
    if (advancedRef.current) return;
    if (tutorial.step < 3) {
      advancedRef.current = true;
      void tutorial.goTo(3);
    }
  }, [onMap, tutorial]);

  // Reset force-advance flag when we leave the map (so re-entry works)
  useEffect(() => {
    if (!onMap) {
      advancedRef.current = false;
    }
  }, [onMap]);

  const active =
    tutorial.active &&
    onMap &&
    (tutorial.step === 3 || tutorial.step === 4 || tutorial.step === 5);

  const [stage, setStage] = useState<Stage>("arrived");

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      const panel = !!findCheckpointPanel();
      const modal = !!findTaskModal();
      const combat = !!findCombatPanel();

      setStage((prev) => {
        if (combat && prev !== "done") return "combat";
        if (modal) return "task_open";
        if (panel && (prev === "arrived" || prev === "checkpoint")) {
          return "checkpoint";
        }
        if (prev === "task_open" && !modal && !combat) {
          return "submitted";
        }
        if (prev === "combat" && !combat) return "done";
        return prev;
      });
    }, 500);
    return () => window.clearInterval(id);
  }, [active]);

  // Sync persisted step as user progresses through the map flow
  useEffect(() => {
    if (!active) return;
    if (stage === "task_open" && tutorial.step === 3) {
      void tutorial.advance();  // 3 -> 4
    } else if (stage === "combat" && tutorial.step === 4) {
      void tutorial.advance();  // 4 -> 5
    }
  }, [stage, active, tutorial]);

  const view = useMemo<{
    text: string;
    mood: SparkyMood;
    primary?: { label: string; onClick: () => void };
    skip?: { label: string; onClick: () => void };
  }>(() => {
    switch (stage) {
      case "arrived":
        return {
          text: "Welcome to your map! Click any checkpoint to start your first task.",
          mood: "pointing",
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "checkpoint":
        return {
          text: "Pick a task from the list -- start with the easiest one to get a feel for the flow.",
          mood: "pointing",
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "task_open":
        return {
          text: "Write your answer in the box below. Be specific! The more details you give, the better the AI feedback.",
          mood: "pointing",
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "submitted":
        return {
          text: "Nice work! The AI is reviewing your answer. Get ready -- it might ask you a tough follow-up question.",
          mood: "celebrating",
        };
      case "combat":
        return {
          text: "This is the AI cross-question! It's a Tier-1 VC partner probing your idea. Answer honestly -- vague answers score low.",
          mood: "pointing",
        };
      case "done":
        return {
          text: "Yay! You finished your first task. Keep going -- every checkpoint earns XP and unlocks more!",
          mood: "celebrating",
          primary: {
            label: "Got it!",
            onClick: () => void tutorial.complete(),
          },
        };
    }
  }, [stage, tutorial]);

  if (!active) return null;

  return (
    <TutorialMascot
      visible
      text={view.text}
      mood={view.mood}
      primaryAction={view.primary}
      secondaryAction={view.skip}
      anchor="bottom-right"
    />
  );
}
