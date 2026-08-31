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
import { useActiveVentureTemplateId } from "@/lib/tutorial/useActiveVentureTemplateId";
import { resolveTutorialCopy } from "@/config/templates/tutorialCopy";

// "finale" — final send-off message shown after the user hits Send
// Request. Sparky congratulates them and offers a Continue CTA that
// triggers the actual tutorial.complete() persist. "complete" is
// the terminal state where the mascot unmounts. Product ask:
// "AFTER last step sparky should say last message Tutorial
// complete! …"
type Stage = "contribute" | "contribute_opened" | "finale" | "complete";

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

/**
 * Find the primary "Send Request" button inside the currently-open
 * contribute modal. Matches on visible text so it works across
 * refactors that don't change copy. Returns null when the modal
 * isn't mounted or the button hasn't rendered yet.
 */
function findSendRequestButton(): HTMLButtonElement | null {
  const modal = findContributeModal();
  if (!modal) return null;
  const buttons = modal.querySelectorAll<HTMLButtonElement>("button");
  for (const b of Array.from(buttons)) {
    const label = (b.textContent || "").trim().toLowerCase();
    if (
      label === "send request" ||
      label.startsWith("send request") ||
      label.includes("send contribution")
    ) {
      return b;
    }
  }
  return null;
}

export function Step4Contribute() {
  const tutorial = useTutorial();
  const pathname = usePathname();
  const onFeed = pathname === "/feed";
  // Template-aware feed tagline — "projects" for venture, "theses" for
  // academic, "experiments" for lab, "creations" for creative. See
  // tutorialCopy.ts. Falls back to venture wording for null template.
  const activeTemplateId = useActiveVentureTemplateId();
  const copy = resolveTutorialCopy(activeTemplateId);

  // Owns internal step 10 (contribute). Flare (step 9) lives on the
  // map and is owned by Step3MapGuide. We stay dormant until the user
  // arrives here from the map with step >= 9 (the flare beat is done
  // or in progress).
  // `contribute_done` is the durable record that this beat is finished.
  // Without it, a user who sent their request but whose `complete()` call
  // never landed (closed the tab on the finale, offline blip) came back to
  // step 10 and was walked through the whole contribute beat again.
  const active =
    tutorial.active &&
    onFeed &&
    tutorial.step >= 9 &&
    tutorial.step <= 10 &&
    tutorial.milestonesLoaded &&
    !tutorial.hasMilestone("contribute_done");

  const [stage, setStage] = useState<Stage>("contribute");
  // Set to true the instant the user commits to Send Request. Until
  // this flag is true, we treat the contribute modal closing as an
  // ESCAPE (user tried to X-out or backdrop-dismiss) and re-open the
  // stage rather than advancing the tutorial. Per product rule:
  // "for the contribution part of tutorial it's compulsory to send
  //  request — till then Continue and other buttons should not work".
  const sentRequestRef = useRef(false);

  // Attach a click listener to the "Send Request" button whenever the
  // modal is up. Fires sentRequestRef=true synchronously on click so
  // the "modal closed" handler below can tell a real send from an
  // escape. Re-installed on every stage/tick — button remounts and
  // enable/disable transitions won't strand a stale handler.
  useEffect(() => {
    if (!active) return;
    if (stage !== "contribute_opened") return;
    const install = () => {
      const btn = findSendRequestButton();
      if (!btn) return null;
      const onClick = () => {
        sentRequestRef.current = true;
      };
      btn.addEventListener("click", onClick, { capture: true });
      return () => btn.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
    };
    // First install attempt + re-check every 400ms until we bind. The
    // modal renders lazily so the button isn't necessarily present on
    // the first tick.
    let cleanup: (() => void) | null = install();
    const id = window.setInterval(() => {
      if (cleanup) return;
      cleanup = install();
    }, 400);
    return () => {
      window.clearInterval(id);
      if (cleanup) cleanup();
    };
  }, [active, stage]);

  // Poll DOM for stage transitions — the contribute modal opening
  // signals the user has clicked a Contribute button on one of the
  // idea cards; closing it moves to "complete" ONLY IF the user
  // actually pressed Send Request. Otherwise we revert to the
  // "contribute" stage so the user has to reopen the modal and
  // actually submit — no ESC / X escape from this tutorial beat.
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      const contribModal = !!findContributeModal();
      setStage((prev) => {
        if (prev === "contribute" && contribModal) return "contribute_opened";
        if (prev === "contribute_opened" && !contribModal) {
          // Route the "sent request" branch through the new "finale"
          // beat so Sparky can deliver the closing message before we
          // actually persist tutorial.complete(). The "no-send"
          // branch still bounces the user back to the contribute
          // stage — Send Request remains compulsory to finish.
          return sentRequestRef.current ? "finale" : "contribute";
        }
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
      (stage === "contribute" ||
        stage === "contribute_opened" ||
        stage === "finale") &&
      tutorial.step < 10
    ) {
      void tutorial.goTo(10);
    }
  }, [active, stage, tutorial]);

  // Block Escape from dismissing the contribute modal while it's
  // open — Radix Dialog closes on Escape by default, which would let
  // the user skip Send Request. Capture-phase listener swallows the
  // event before Radix sees it. Only active during contribute_opened
  // so users can still ESC out of everything else on the page.
  useEffect(() => {
    if (!active) return;
    if (stage !== "contribute_opened") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey, {
        capture: true,
      } as EventListenerOptions);
    };
  }, [active, stage]);

  // Mark the beat the moment the user commits, NOT when the tutorial
  // finishes completing. These are different instants and the gap is a
  // real failure mode: the user sends the request, reaches the finale,
  // then closes the tab without pressing Continue. `complete()` never
  // fires, the record stays in_progress at step 10, and the whole
  // contribute beat replays on their next visit. The milestone closes it.
  useEffect(() => {
    if (!active) return;
    if (stage !== "finale" && stage !== "complete") return;
    if (tutorial.hasMilestone("contribute_done")) return;
    tutorial.markMilestone("contribute_done");
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

  // ── One-shot scroll to the first Contribute button ──────────────────
  // The feed opens with the FLARES rail on top, and during the tutorial
  // that rail always has at least one entry (the flare the user just
  // fired two steps ago). That pushes the first idea card's Contribute
  // chip below the fold, so Sparky says "send a contribution request"
  // while the button he means is off screen.
  //
  // Scroll to it exactly once on entering the stage. `didScrollRef`
  // makes it one-shot so the user is never fighting the page afterwards,
  // and the retry loop covers the feed still streaming in from Convex
  // when the stage flips (poll ~200ms, give up after ~4s).
  const didScrollRef = useRef(false);
  useEffect(() => {
    if (!active || stage !== "contribute") return;
    if (didScrollRef.current) return;
    if (typeof window === "undefined") return;

    let tries = 0;
    const tick = window.setInterval(() => {
      tries += 1;
      const el = document.querySelector('[data-tutorial="contribute"]');
      if (el) {
        didScrollRef.current = true;
        window.clearInterval(tick);
        // `center` rather than `start` so the whole card stays readable
        // and Sparky's bottom-docked bubble doesn't cover the button.
        (el as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else if (tries > 20) {
        window.clearInterval(tick);
      }
    }, 200);
    return () => window.clearInterval(tick);
  }, [active, stage]);

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
          text: "This is the feed, all projects are shown here. Send a contribution request to any idea that you like. That's how you gain experience!",
          mood: "pointing",
          near: null,
          highlight: null,
        };
      case "contribute_opened":
        // Continue CTA REMOVED per product rule: sending the request
        // is compulsory to finish the tutorial — no bypass. Sparky
        // just cheers the user on; the ONLY way forward is clicking
        // Send Request inside the modal. The click-lock CSS block
        // below disables the modal's X and backdrop so users can't
        // dismiss without committing either.
        return {
          text: "Fill it in and hit Send Request!",
          mood: "celebrating",
          near: null,
          highlight: null,
        };
      case "finale":
        // Product-authored closing message. Continue click flips to
        // the terminal "complete" stage, whose effect (see above)
        // calls tutorial.complete() and persists the finished state
        // to Convex — that persist is what stops the tour from ever
        // coming back on subsequent visits (hard refresh included).
        return {
          text:
            "Tutorial complete, you did it! You're ready now. Start building, explore other projects, and remember, It's dangerous to go alone, take this.",
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
    // `copy` (template-aware feed tagline) participates in the memo
    // so switching templates mid-session refreshes the Sparky line.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, copy]);

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
        // Suppress the click-blocking scrim on BOTH:
        //   - "contribute" stage — user needs to scroll and click
        //     Contribute on any of the feed cards.
        //   - "contribute_opened" stage — the Radix dialog is open
        //     and the ONLY control the user must click is inside it
        //     (Send Request). The scrim's full-viewport shield was
        //     intercepting the Send Request button click, making the
        //     button appear "dead". Dismissal is already blocked by
        //     the CSS lockdown below (X + backdrop + Escape all
        //     no-op during this stage) so the scrim isn't needed for
        //     containment either.
        noScrim={stage === "contribute" || stage === "contribute_opened"}
      />
      {/* ── Contribute-modal lockdown ───────────────────────────────
          Once the modal is open, the ONLY way forward is Send Request.
          We visually pulse the button and disable both the X close
          button and the backdrop-dismiss so the user can't skip the
          step by dismissing the dialog. Textareas / inputs / the
          submit button remain fully interactive. */}
      {stage === "contribute_opened" && (
        <style jsx global>{`
          /* Disable the modal's X close button — user MUST press
             Send Request to advance the tutorial. */
          [role="dialog"] button[aria-label="Close"],
          [role="dialog"] [data-slot="dialog-close"] {
            pointer-events: none !important;
            opacity: 0.25 !important;
            cursor: not-allowed !important;
          }
          /* Disable backdrop click-to-dismiss on the Radix overlay.
             The modal content sits above the overlay in z-order so
             its interactivity is unaffected. */
          [data-slot="dialog-overlay"] {
            pointer-events: none !important;
          }
        `}</style>
      )}
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
