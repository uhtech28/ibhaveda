"use client";

/**
 * Step1Welcome — conversational tutorial that advances on FIELD BLUR,
 * not on every keystroke.
 *
 * Flow:
 *   1. name_talk    — "What should I call you?" (asking)
 *   2. name_idle    — user is typing
 *   3. name_cheer   — name field BLURS (user tabs/clicks away) with valid name
 *   4. user_talk    — "Now {name}, pick a username..."
 *   5. user_idle    — user is typing
 *   6. user_cheer   — username field BLURS with available username
 *   7. submit_talk  — "Hit Start building"
 *   8. final_cheer  — submit clicked
 */

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TutorialMascot, type SparkyMood } from "../TutorialMascot";
import { TutorialHighlight } from "../TutorialHighlight";
import { useTutorial } from "../useTutorial";

type DialogueState =
  | "name_talk"
  | "name_idle"
  | "name_cheer"
  | "user_talk"
  | "user_idle"
  | "user_cheer"
  | "submit_talk"
  | "final_cheer";

export function Step1Welcome() {
  const tutorial = useTutorial();
  const pathname = usePathname();
  const router = useRouter();

  const active = tutorial.active && tutorial.step === 1 && pathname === "/profile-setup";

  const [dialogue, setDialogue] = useState<DialogueState>("name_talk");
  const [collectedName, setCollectedName] = useState<string>("");

  // ── Single source of truth: focus + value events on the real inputs ──────
  // We bind DOM listeners directly (NOT polling) so we react to focus
  // changes immediately instead of every 300ms.
  useEffect(() => {
    if (!active) return;
    const nameEl = document.querySelector<HTMLInputElement>("input#displayName");
    const userEl = document.querySelector<HTMLInputElement>("input#username");
    if (!nameEl || !userEl) {
      // Inputs not mounted yet — retry shortly.
      const retryTimer = window.setTimeout(() => setDialogue((s) => s), 200);
      return () => window.clearTimeout(retryTimer);
    }

    // === NAME field handlers ===
    const onNameFocus = () => {
      // When the user clicks/tabs into the name field, switch to idle
      // (no more talking, give them quiet to type).
      setDialogue((prev) =>
        prev === "name_talk" || prev === "name_idle" ? "name_idle" : prev,
      );
    };
    const onNameBlur = () => {
      // Only cheer if there's a valid (≥2 char) name AND we were in
      // the name-typing phase.
      const v = nameEl.value.trim();
      if (v.length < 2) return;
      setDialogue((prev) => {
        if (prev === "name_talk" || prev === "name_idle") {
          setCollectedName(v);
          return "name_cheer";
        }
        return prev;
      });
    };

    // === USERNAME field handlers ===
    const onUserFocus = () => {
      // If we're still in name-phase but user jumped to username,
      // ALSO advance the name through cheer (using whatever they typed).
      const nv = nameEl.value.trim();
      if (nv.length >= 2) {
        setCollectedName(nv);
        setDialogue((prev) => {
          if (prev === "name_talk" || prev === "name_idle") return "name_cheer";
          if (prev === "user_talk") return "user_idle";
          return prev;
        });
      } else {
        setDialogue((prev) => (prev === "user_talk" ? "user_idle" : prev));
      }
    };
    const onUserBlur = () => {
      // Cheer if username is at least 3 chars AND "Available" badge is up.
      const v = userEl.value.trim();
      if (v.length < 3) return;
      const available = document.body.innerText.includes("Available");
      if (!available) return;
      setDialogue((prev) => {
        if (prev === "user_talk" || prev === "user_idle") return "user_cheer";
        return prev;
      });
    };

    nameEl.addEventListener("focus", onNameFocus);
    nameEl.addEventListener("blur", onNameBlur);
    userEl.addEventListener("focus", onUserFocus);
    userEl.addEventListener("blur", onUserBlur);
    return () => {
      nameEl.removeEventListener("focus", onNameFocus);
      nameEl.removeEventListener("blur", onNameBlur);
      userEl.removeEventListener("focus", onUserFocus);
      userEl.removeEventListener("blur", onUserBlur);
    };
  }, [active, dialogue]);

  // ── Brief-cheer timers — bridge cheer → next talking state ────────────────
  useEffect(() => {
    if (!active) return;
    if (dialogue === "name_cheer") {
      const t = window.setTimeout(() => setDialogue("user_talk"), 1600);
      return () => window.clearTimeout(t);
    }
    if (dialogue === "user_cheer") {
      const t = window.setTimeout(() => setDialogue("submit_talk"), 1600);
      return () => window.clearTimeout(t);
    }
  }, [active, dialogue]);

  // ── Listen for Start building click → final cheer + advance step ──────────
  useEffect(() => {
    if (!active) return;
    if (dialogue !== "submit_talk") return;

    const handleClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      const button = target.closest("button");
      if (!button) return;
      const label = (button.textContent || "").toLowerCase();
      if (
        label.includes("start building") ||
        label.includes("finish") ||
        label.includes("save") ||
        label.includes("update profile")
      ) {
        setDialogue("final_cheer");
        window.setTimeout(() => {
          void tutorial.advance();
          router.push("/feed?openCompose=1");
        }, 1500);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [active, dialogue, tutorial, router]);

  // Helpers to read field values on Continue-click.
  const readNameVal = () =>
    document.querySelector<HTMLInputElement>("input#displayName")?.value.trim() ?? "";
  const readUserVal = () =>
    document.querySelector<HTMLInputElement>("input#username")?.value.trim() ?? "";
  const isUserAvailable = () => document.body.innerText.includes("Available");

  // ── Dialogue copy + Sparky mood + highlight + CONTINUE button ─────────────
  const view = useMemo<{
    text: string;
    mood: SparkyMood;
    highlight: string | null;
    primary?: { label: string; onClick: () => void };
    skip?: { label: string; onClick: () => void };
  }>(() => {
    switch (dialogue) {
      case "name_talk":
        return {
          text: "Hi! I'm Sparky — what should I call you? Type your name in the box above.",
          mood: "talking",
          highlight: "input#displayName",
          primary: {
            label: "Continue →",
            onClick: () => {
              const v = readNameVal();
              if (v.length >= 2) {
                setCollectedName(v);
                setDialogue("name_cheer");
              } else {
                setDialogue("name_idle");
              }
            },
          },
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "name_idle":
        return {
          text: "Take your time. When you've typed your name, hit Continue.",
          mood: "idle",
          highlight: "input#displayName",
          primary: {
            label: "Continue →",
            onClick: () => {
              const v = readNameVal();
              if (v.length >= 2) {
                setCollectedName(v);
                setDialogue("name_cheer");
              }
            },
          },
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "name_cheer":
        return {
          text: `Nice to meet you, ${collectedName}!`,
          mood: "celebrating",
          highlight: null,
          primary: { label: "Continue →", onClick: () => setDialogue("user_talk") },
        };
      case "user_talk":
        return {
          text: `Awesome ${collectedName}! Now pick a username — your tag others find you by.`,
          mood: "talking",
          highlight: "input#username",
          primary: {
            label: "Continue →",
            onClick: () => {
              const v = readUserVal();
              if (v.length >= 3 && isUserAvailable()) {
                setDialogue("user_cheer");
              } else {
                setDialogue("user_idle");
              }
            },
          },
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "user_idle":
        return {
          text: "Type a unique username, then hit Continue.",
          mood: "idle",
          highlight: "input#username",
          primary: {
            label: "Continue →",
            onClick: () => {
              const v = readUserVal();
              if (v.length >= 3 && isUserAvailable()) {
                setDialogue("user_cheer");
              }
            },
          },
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "user_cheer":
        return {
          text: "Perfect — that username is yours!",
          mood: "celebrating",
          highlight: null,
          primary: { label: "Continue →", onClick: () => setDialogue("submit_talk") },
        };
      case "submit_talk":
        return {
          text: `All set, ${collectedName}! Hit Start building to launch.`,
          mood: "talking",
          highlight: 'form button[type="submit"]',
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "final_cheer":
        return {
          text: "Yay! Off to pick your first project →",
          mood: "celebrating",
          highlight: null,
        };
    }
  }, [dialogue, collectedName, tutorial.skip]);

  if (!active) return null;

  return (
    <>
      <TutorialHighlight
        visible={!!view.highlight}
        selector={view.highlight ?? null}
        padding={4}
      />
      <TutorialMascot
        visible
        text={view.text}
        mood={view.mood}
        primaryAction={view.primary}
        secondaryAction={view.skip}
        anchor="bottom-right"
      />
    </>
  );
}
