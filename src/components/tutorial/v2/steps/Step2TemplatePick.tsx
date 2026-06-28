"use client";

/**
 * Step2TemplatePick — guided "create your first post" flow.
 *
 * Flow:
 *   1. click_plus      — Highlight the "+" button. Sparky tells the user to click.
 *   2. pick_template   — Compose dialog opens. Sparky points at template grid.
 *   3. write_outline   — User picked a template. Sparky points at the outline textarea.
 *   4. posting         — Outline written. Sparky cheers while wizard auto-posts.
 *   5. to_map          — Post complete. Sparky offers a button to go to the map.
 */

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TutorialMascot, type SparkyMood } from "../TutorialMascot";
import { TutorialHighlight } from "../TutorialHighlight";
import { useTutorial } from "../useTutorial";

type DialogueState =
  | "click_plus"
  | "pick_template"
  | "write_outline"
  | "posting"
  | "to_map";

function isComposeDialogOpen(): boolean {
  return !!document.querySelector('[role="dialog"][data-state="open"]') ||
         !!document.querySelector('[role="dialog"]');
}

function findTemplateGrid(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[data-tutorial="template-grid"], [aria-label="Template options"]',
  );
}

function isTemplateSelected(): boolean {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return false;
  return !!dlg.querySelector(
    'button[aria-pressed="true"], button[data-state="selected"], button.ring-2, button.ring-indigo-500',
  );
}

function findOutlineTextarea(): HTMLTextAreaElement | null {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  return dlg.querySelector<HTMLTextAreaElement>("textarea");
}

export function Step2TemplatePick() {
  const tutorial = useTutorial();
  const pathname = usePathname();
  const router = useRouter();

  const active =
    tutorial.active &&
    tutorial.step === 1 &&
    pathname === "/feed";

  const [dialogue, setDialogue] = useState<DialogueState>("click_plus");

  // Watch the DOM each tick to detect dialog open / template pick / outline / submit.
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      const dlgOpen = isComposeDialogOpen();
      const tplSelected = isTemplateSelected();
      const outline = findOutlineTextarea();
      const outlineHasText = !!outline && outline.value.trim().length >= 5;

      setDialogue((prev) => {
        if (prev === "click_plus" && dlgOpen) return "pick_template";
        if (prev === "pick_template" && tplSelected) return "write_outline";
        if (prev === "write_outline" && outlineHasText && !dlgOpen) return "posting";
        if (prev === "posting" && !dlgOpen) return "to_map";
        return prev;
      });
    }, 400);
    return () => window.clearInterval(id);
  }, [active]);

  // When "posting" triggers, briefly cheer, then move to "to_map".
  useEffect(() => {
    if (!active) return;
    if (dialogue === "posting") {
      const t = window.setTimeout(() => setDialogue("to_map"), 2000);
      return () => window.clearTimeout(t);
    }
  }, [active, dialogue]);

  // Dialogue copy + Sparky mood + highlight selector.
  const view = useMemo<{
    text: string;
    mood: SparkyMood;
    highlight: string | null;
    primary?: { label: string; onClick: () => void };
    skip?: { label: string; onClick: () => void };
  }>(() => {
    switch (dialogue) {
      case "click_plus":
        return {
          text: "Let's create your first post! Click the + button up top.",
          mood: "pointing",
          highlight: 'button[data-tutorial="compose"], button[aria-label="Post Idea"], button[aria-label="Post idea"]',
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "pick_template":
        return {
          text: "Nice! Now pick a template that fits what you're building.",
          mood: "pointing",
          highlight: '[role="dialog"]',
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "write_outline":
        return {
          text: "Great choice! Write a quick outline of your idea — even one line works. I'll handle the rest.",
          mood: "pointing",
          highlight: '[role="dialog"] textarea',
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "posting":
        return {
          text: "Cool! Posting your idea now…",
          mood: "celebrating",
          highlight: null,
        };
      case "to_map":
        return {
          text: "Yay! Your idea is live. Time to build — let's head to your map.",
          mood: "celebrating",
          highlight: null,
          primary: {
            label: "Go to map →",
            onClick: () => {
              void tutorial.advance();
              router.push("/map/world");
            },
          },
        };
    }
  }, [dialogue, tutorial, router]);

  if (!active) return null;

  return (
    <>
      <TutorialHighlight
        visible={!!view.highlight}
        selector={view.highlight ?? null}
        padding={2}
        rx={12}
      />
      <TutorialMascot
        visible
        text={view.text}
        mood={view.mood}
        primaryAction={view.primary}
        secondaryAction={view.skip}
        anchor="bottom-right"
      />    </>
  );
}
