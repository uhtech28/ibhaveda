"use client";

/**
 * Step4Contribute — FINAL beat of the tour on /feed.
 *
 *   Step 8 (internal step 10) — CONTRIBUTE. Every Contribute button on
 *                                every idea card pulses; user scrolls
 *                                and sends a contribution request on
 *                                a card that isn't theirs. Modal
 *                                closes → tutorial.complete() → sword
 *                                drop celebration.
 *
 * NOTE: the flare beat used to live here too, but flares can only be
 * fired from inside a project (CheckpointPanel on the map), so the
 * flare step was moved to Step3MapGuide. Step4Contribute now handles
 * only the contribute step.
 *
 * Data-tutorial anchors:
 *   - [data-tutorial="contribute"]         → per-card contribute chip
 *   - [role="dialog"] with "Contribute"    → contribute modal fallback
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TutorialMascot, type SparkyMood } from "../TutorialMascot";
import { TutorialHighlight } from "../TutorialHighlight";
import { useTutorial } from "../useTutorial";

type Stage = "contribute" | "contribute_opened" | "complete";

function findContributeModal(): HTMLElement | null {
  const dlgs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
  for (const dlg of Array.from(dlgs)) {
    const text = (dlg.innerText || "").toLowerCase();
    if (
      text.includes("contribution request") ||
      text.includes("send request") ||
      text.includes("request to contribute")
    ) {
      return dlg;
    }
  }
  return null;
}

export function Step4Contribute() {
  const tutorial = useTutorial();
  const pathname = usePathname();
  const onFeed = pathname === "/feed";

  // Owns internal step 10 (contribute). Flare (step 9) lives on the
  // map and is owned by Step3MapGuide. We stay dormant until the user
  // arrives here from the map with step >= 9 (the flare beat is done
  // or in progress).
  const active =
    tutorial.active && onFeed && tutorial.step >= 9 && tutorial.step <= 10;

  const [stage, setStage] = useState<Stage>("contribute");

  // Poll DOM for stage transitions — the contribute modal opening
  // signals the user has clicked a Contribute button on one of the
  // idea cards; closing it moves to "complete" which fires the
  // tutorial completion.
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      const contribModal = !!findContributeModal();
      setStage((prev) => {
        if (prev === "contribute" && contribModal) return "contribute_opened";
        if (prev === "contribute_opened" && !contribModal) return "complete";
        return prev;
      });
    }, 400);
    return () => window.clearInterval(id);
  }, [active]);

  // Persist internal step 10 while on any contribute stage so the
  // display bar reflects reality.
  useEffect(() => {
    if (!active) return;
    if (
      (stage === "contribute" || stage === "contribute_opened") &&
      tutorial.step < 10
    ) {
      void tutorial.goTo(10);
    }
  }, [active, stage, tutorial]);

  // Complete the tutorial when the contribute modal closes.
  const completeFiredRef = useRef(false);
  useEffect(() => {
    if (!active) return;
    if (stage !== "complete") return;
    if (completeFiredRef.current) return;
    completeFiredRef.current = true;
    void tutorial.complete().catch(() => {
      /* no-op — TutorialProvider will still hide the overlay */
    });
  }, [active, stage, tutorial]);

  // NOTE: previous versions of this file had four fallback timers
  // (60s + 8s) that auto-advanced flare → contribute and contribute →
  // complete if the user was idle. Those were removed on user request
  // — the tutorial must be event-driven only. Stages now advance
  // strictly on real user actions: opening the flare/contribute modal
  // (detected by the DOM poller above) or clicking the primary CTA on
  // the "contribute_opened" beat.

  const view = useMemo<{
    text: string;
    mood: SparkyMood;
    near: string | null;
    highlight: string | null;
    primary?: { label: string; onClick: () => void };
  }>(() => {
    switch (stage) {
      case "contribute":
        // Copy per the onboarding-script table (verbatim). Sparky
        // sits fixed in the bottom-right corner so scrolling the feed
        // doesn't carry him away. NO Continue CTA on this beat — the
        // user must click Contribute on a project and then Send
        // Contribution Request to actually complete the step. The
        // stage machine advances on modal open/close, not a button.
        return {
          text: "This is the feed, all our live projects. Send a contribution request to any idea that isn't yours. That's how you plug into a team.",
          mood: "pointing",
          near: null,
          highlight: null,
        };
      case "contribute_opened":
        return {
          text: "Nice, that's a contribution request. Fill it in when you're ready, or hit Continue to move on.",
          mood: "celebrating",
          near: null,
          highlight: null,
          primary: {
            label: "Continue",
            onClick: () => setStage("complete"),
          },
        };
      case "complete":
        return {
          text: "",
          mood: "celebrating",
          near: null,
          highlight: null,
        };
    }
  }, [stage]);

  if (!active) return null;
  if (stage === "complete") return null;

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
        anchor="bottom-right"
        nearSelector={view.near}
        // Contribute stage needs free scroll on the feed so users can
        // browse all the cards; no click-blocking scrim.
        noScrim={stage === "contribute"}
      />
      {/* Global CSS pulse — one ring around whichever affordance is
          currently the user's target for this stage. Auto-clears when
          the modal opens (stage_opened) so the ring doesn't fight the
          dialog. */}
      {stage === "contribute" && (
        <style jsx global>{`
          /* Yellow pulse ring around every Contribute chip on the
             feed so the user can visually find them. */
          [data-tutorial="contribute"] {
            position: relative !important;
            box-shadow:
              0 0 0 2px rgba(253, 224, 71, 0.85),
              0 0 18px rgba(253, 224, 71, 0.55),
              0 0 42px rgba(253, 224, 71, 0.28) !important;
            border-radius: 12px !important;
            animation: sparky-contribute-pulse 1.4s ease-in-out infinite !important;
          }
          @keyframes sparky-contribute-pulse {
            0%, 100% {
              box-shadow:
                0 0 0 2px rgba(253, 224, 71, 0.85),
                0 0 18px rgba(253, 224, 71, 0.55),
                0 0 42px rgba(253, 224, 71, 0.28);
            }
            50% {
              box-shadow:
                0 0 0 3px rgba(253, 224, 71, 1),
                0 0 28px rgba(253, 224, 71, 0.85),
                0 0 60px rgba(253, 224, 71, 0.45);
            }
          }

          /* Click-lockdown: block ALL pointer events on the page
             during the contribute step. Only the Contribute chips
             (and Sparky's own primary-action button, which sets its
             own pointer-events:auto in TutorialSpeechBubble) remain
             interactive. Scroll still works — pointer-events:none
             disables click/hover but not wheel/touchmove scrolling
             on the document. */
          body > *:not(script):not(style):not(link) {
            pointer-events: none !important;
          }
          [data-tutorial="contribute"],
          [data-tutorial="contribute"] * {
            pointer-events: auto !important;
            cursor: pointer !important;
          }
        `}</style>
      )}
    </>
  );
}
