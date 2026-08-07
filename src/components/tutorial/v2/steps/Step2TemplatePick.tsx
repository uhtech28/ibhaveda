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

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { TutorialMascot, type SparkyMood } from "../TutorialMascot";
import { TutorialHighlight } from "../TutorialHighlight";
import { SuggestedContributorsDialog } from "../SuggestedContributorsDialog";
import { useTutorial } from "../useTutorial";

type DialogueState =
  | "intro"
  | "click_plus"
  | "pick_template"
  | "write_outline"
  | "posting"
  | "contributors"
  | "to_map";

function isComposeDialogOpen(): boolean {
  // Match ONLY the compose wizard (tagged with data-tutorial="compose-wizard"
  // on its DialogContent). Falling back to any [role="dialog"] would return
  // true for unrelated dialogs (notification panel, share panel fading out,
  // contributors modal, etc.) and stall the state machine on write_outline.
  const wizard = document.querySelector<HTMLElement>(
    '[data-tutorial="compose-wizard"]',
  );
  if (!wizard) return false;
  // Radix marks `data-state="closed"` during exit animation — treat that as
  // closed so the write_outline → posting transition fires immediately.
  const state = wizard.getAttribute("data-state");
  if (state === "closed") return false;
  return true;
}

/**
 * Find the compose wizard's DialogContent by its data-tutorial marker.
 * All wizard-scoped DOM queries flow through this helper so an unrelated
 * dialog opening on the page (share panel, notification bell, contributors
 * modal) can't accidentally satisfy them.
 */
function findComposeWizard(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[data-tutorial="compose-wizard"]',
  );
}

function findTemplateGrid(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[data-tutorial="template-grid"], [aria-label="Template options"]',
  );
}

function isTemplateSelected(): boolean {
  const dlg = findComposeWizard();
  if (!dlg) return false;
  return !!dlg.querySelector(
    'button[aria-pressed="true"], button[data-state="selected"], button.ring-2, button.ring-indigo-500',
  );
}

function findOutlineTextarea(): HTMLTextAreaElement | null {
  const dlg = findComposeWizard();
  if (!dlg) return null;
  return dlg.querySelector<HTMLTextAreaElement>("textarea");
}

/**
 * Which wizard screen is currently visible?
 *   "template"   → template picker grid is on screen
 *   "outline"    → "Describe Your Idea" textarea is on screen
 *   "preview"    → post-generation title+description form ("Your idea")
 *   null         → dialog closed, or something unrecognised
 *
 * We match by dialog title text because the wizard doesn't emit a
 * per-step data-* attribute. This is more reliable than watching for
 * template selection (which can happen without a visual aria-pressed).
 */
function detectWizardScreen():
  | "template"
  | "outline"
  | "preview"
  | null {
  const dlg = findComposeWizard();
  if (!dlg) return null;
  const text = (dlg.innerText || "").toLowerCase();
  // Order matters — check most-specific / latest screen first so we
  // don't mis-identify e.g. "Describe Your Idea" as the earlier
  // template step just because template buttons are still in the DOM.
  if (text.includes("your idea") && dlg.querySelector("input#wiz-title")) {
    return "preview";
  }
  if (text.includes("describe your idea")) {
    return "outline";
  }
  if (
    findTemplateGrid() ||
    text.includes("pick a template") ||
    text.includes("choose a template")
  ) {
    return "template";
  }
  // Dialog is open but we can't tell — assume outline so Sparky doesn't
  // sit there telling the user to pick a template that isn't visible.
  if (dlg.querySelector("textarea")) return "outline";
  return null;
}

/**
 * The post-publish share dialog ("Your idea is live" → Post on X / LinkedIn
 * / Facebook / Go to my world map). Not part of the tutorial flow — the
 * user should be free to click "GO TO MY WORLD MAP" without Sparky in the
 * way. Detected by the distinctive headline text.
 */
function isShareDialogOpen(): boolean {
  const dlgs = document.querySelectorAll('[role="dialog"]');
  for (const dlg of Array.from(dlgs)) {
    const text = (dlg as HTMLElement).innerText || "";
    if (text.includes("Your idea is live") || text.includes("Share your idea")) {
      return true;
    }
  }
  return false;
}

/** Find the compose form (the one containing title + description + Post Idea). */
function findComposeForm(): HTMLFormElement | null {
  const dlg = findComposeWizard();
  const scope: Document | Element = dlg ?? document;
  // Prefer a form that contains the known IDs, then fall back to any form.
  const explicit = scope.querySelector<HTMLFormElement>(
    "form:has(#wiz-title):has(#wiz-description), form:has(#wiz-title), form:has(#wiz-description)",
  );
  if (explicit) return explicit;
  return scope.querySelector<HTMLFormElement>("form");
}

/** Find the "Post Idea" submit button (for click fallback). */
function findPostIdeaButton(): HTMLButtonElement | null {
  const dlg = findComposeWizard();
  const scope: Document | Element = dlg ?? document;
  const buttons = scope.querySelectorAll<HTMLButtonElement>(
    'button[type="submit"], button',
  );
  for (const b of Array.from(buttons)) {
    const label = (b.textContent || "").trim().toLowerCase();
    if (
      (label.includes("post idea") ||
        label.includes("publish") ||
        label === "post") &&
      !b.disabled
    ) {
      return b;
    }
  }
  return null;
}

/**
 * Detect whether the AI has finished filling the form. Uses the specific
 * IDs (#wiz-title / #wiz-description) rather than input[type="text"] —
 * the shadcn Input component doesn't set an explicit type attribute, so
 * the type-based selector was missing the title field.
 */
function isFormReadyToPost(): boolean {
  const title = document.querySelector<HTMLInputElement>("#wiz-title");
  const desc = document.querySelector<HTMLTextAreaElement>("#wiz-description");
  const titleFilled = !!title && title.value.trim().length >= 3;
  const bodyFilled = !!desc && desc.value.trim().length >= 20;
  return titleFilled && bodyFilled;
}

export function Step2TemplatePick() {
  const tutorial = useTutorial();
  const pathname = usePathname();
  const router = useRouter();

  // Step numbering (Step2 owns 3-6):
  //   3 click + · 4 pick template · 5 write outline · 6 posted/heading map.
  // Active window covers the whole /feed phase so Sparky stays visible
  // while the internal dialogue state machine ticks between phases.
  // Force-advance below normalises stale lower steps to 3 on arrival.
  const onFeed = pathname === "/feed";
  const active =
    tutorial.active &&
    onFeed &&
    tutorial.step >= 1 &&
    tutorial.step <= 6;

  // PROGRESS ADVANCE — used to auto-bump to step 3 on /feed arrival,
  // which made the progress bar show 1/8 the moment Sparky's intro
  // pitch appeared (before the user had done anything). That felt like
  // "persona counted as step 1" from the user's POV.
  //
  // Now: we STAY at the real step (1 for a fresh user) while the intro
  // is on screen. The bar's display remap floors at 0, so during the
  // intro users see 0/8 (nothing filled). The moment they click
  // "Let's go" on the intro dialogue, that button handler below calls
  // goTo(3), which bumps the counter to 1/8 — the actual first
  // guided step (click +).
  const advancedRef = useRef(false);
  void advancedRef;

  // Start on `intro` for a fresh tutorial. Sparky introduces himself,
  // waits for the user to click Continue, then transitions into the
  // guided post-creation flow.
  const [dialogue, setDialogue] = useState<DialogueState>("intro");
  // Poll for the post-publish share dialog. When it opens, we hide the
  // tutorial (Sparky + scrim + highlight) so the user can interact with the
  // dialog's "GO TO MY WORLD MAP" button without interference. Step3 takes
  // over on /map/world.
  const [shareOpen, setShareOpen] = useState(false);

  // Ref-tracked flag: did we EVER see the outline textarea populated during
  // the write_outline beat? The textarea unmounts along with the compose
  // dialog, so we can't rely on `outlineHasText` at the exact moment of
  // dialog close — by then the textarea (and its value) are gone. This ref
  // records "yes, the user typed something" as a durable signal for the
  // write_outline → posting transition.
  const hadOutlineTextRef = useRef(false);

  // Watch the DOM each tick to detect dialog open / template pick / outline / submit.
  // We now key transitions on the *visible wizard screen* (detected from
  // dialog title text) rather than template-selection heuristics, which
  // were unreliable and left Sparky saying "pick a template" while the
  // user was already on the outline screen.
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      const shareUp = isShareDialogOpen();
      setShareOpen(shareUp);
      if (shareUp) return; // don't advance dialogue while share dialog is up

      const dlgOpen = isComposeDialogOpen();
      const screen = detectWizardScreen();
      const outline = findOutlineTextarea();
      const outlineHasText = !!outline && outline.value.trim().length >= 5;

      // Remember if the user ever populated the textarea during this beat.
      // Sticks true across the dialog-close → route-nav window so the
      // transition to `posting` can fire even after the textarea unmounts.
      if (outlineHasText) hadOutlineTextRef.current = true;

      setDialogue((prev) => {
        // Dialog just opened.
        if (prev === "click_plus" && dlgOpen) {
          // If the wizard opened directly on the outline screen (skipping
          // template because the user's flow doesn't have a template
          // step visible), jump straight to write_outline copy.
          if (screen === "outline" || screen === "preview") return "write_outline";
          return "pick_template";
        }
        // While on pick_template, watch for the wizard advancing to
        // the outline screen (or preview, which happens after Generate).
        if (prev === "pick_template" && (screen === "outline" || screen === "preview")) {
          return "write_outline";
        }
        // Wizard closed while on write_outline → posting.
        // Deliberately does NOT gate on outlineHasText: the textarea
        // unmounts with the dialog, so by the time we detect `!dlgOpen`
        // the value we'd read is already gone (false). The previous
        // guard here caused a ~1-2s stall on write_outline during the
        // /feed → /map/world route commit, which let the yellow
        // highlight box drift onto whatever random dialog-like element
        // happened to be in the DOM. hadOutlineTextRef is still tracked
        // above for future use / analytics but isn't needed to gate
        // this transition.
        if (prev === "write_outline" && !dlgOpen) return "posting";
        // After posting: show the suggested-contributors modal (step 5
        // per the script). User can send optional requests then hit
        // Continue to move on to the map.
        if (prev === "posting" && !dlgOpen) return "contributors";
        return prev;
      });
    }, 400);
    return () => window.clearInterval(id);
  }, [active]);

  // Bump the persisted tutorial step on each dialogue transition so the
  // top progress bar reflects progress through Step2's sub-phases:
  //   click_plus (3/7) → pick_template (4/7) → write_outline (5/7)
  //   → posting/to_map (6/7) — final bump to 7/7 happens on /map/world
  //   via Step3MapGuide.
  useEffect(() => {
    if (!active) return;
    if (dialogue === "pick_template" && tutorial.step < 4) {
      void tutorial.goTo(4);
    } else if (dialogue === "write_outline" && tutorial.step < 5) {
      void tutorial.goTo(5);
    } else if (
      (dialogue === "posting" ||
        dialogue === "contributors" ||
        dialogue === "to_map") &&
      tutorial.step < 6
    ) {
      void tutorial.goTo(6);
    }
  }, [active, dialogue, tutorial]);

  // When "posting" triggers, briefly cheer, then move to "contributors"
  // (script step 5 — suggested-contributors modal). Continue from that
  // modal advances to "to_map".
  //
  // Guarded on `!isComposeDialogOpen()` because we now set dialogue to
  // "posting" synchronously right before firing requestSubmit (so the
  // bubble doesn't linger on the outline copy while the router
  // transitions to /map/world). Without this guard, a slow mutation
  // could let the 2s timer overtake a still-open compose dialog and
  // render the contributors modal on top of the wizard. The poller
  // (`prev === "posting" && !dlgOpen`) still owns the happy-path
  // transition; this setTimeout is just a fallback if the DOM check
  // is somehow off.
  useEffect(() => {
    if (!active) return;
    if (dialogue === "posting") {
      const t = window.setTimeout(() => {
        if (isComposeDialogOpen()) return;
        setDialogue("contributors");
      }, 2000);
      return () => window.clearTimeout(t);
    }
  }, [active, dialogue]);

  // #2a — AUTO-CLICK POST IDEA once the AI has filled the form.
  // In write_outline state, wait ~3s after the form is ready-to-post
  // (title + description filled). If the user hasn't clicked Post Idea
  // themselves, do it for them — this drives the flow into the share
  // dialog which is then handled below.
  const autoPostRef = useRef(false);
  useEffect(() => {
    if (!active) return;
    if (dialogue !== "write_outline") {
      autoPostRef.current = false;
      return;
    }
    if (autoPostRef.current) return;

    // Poll for the ready state, then trigger post
    const id = window.setInterval(() => {
      if (autoPostRef.current) return;
      if (!isFormReadyToPost()) return;
      // Give the user a beat to read Sparky's message, then submit
      autoPostRef.current = true;
      window.setTimeout(() => {
        // Flip Sparky's copy to the "posting" transitional beat
        // BEFORE we trigger the wizard's submit. In tutorialMode the
        // wizard skips the share dialog and calls
        // router.push("/map/world?...") the moment the mutation
        // resolves, so the compose dialog closes and route navigation
        // starts within a few ms. Our DOM poller only ticks every
        // 400ms — without this synchronous transition, the bubble
        // stays on the stale "Great choice. Write a quick outline…"
        // instruction while the dialog is already gone and the route
        // hasn't committed yet, producing the orphaned-bubble glitch
        // on /feed for ~1s before /map/world lands.
        setDialogue("posting");

        // Preferred: fire the form's submit event so React's onSubmit
        // handler runs cleanly (regardless of button disabled state,
        // pointer-event quirks, or icon-nested labels).
        const form = findComposeForm();
        if (form && typeof form.requestSubmit === "function") {
          form.requestSubmit();
          return;
        }
        // Fallback: click the submit button
        const btn = findPostIdeaButton();
        if (!btn) return;
        try {
          btn.dispatchEvent(
            new PointerEvent("pointerdown", { bubbles: true }),
          );
          btn.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
        } catch {
          // PointerEvent unsupported — fall through to click
        }
        btn.click();
      }, 1500);
    }, 400);
    return () => window.clearInterval(id);
  }, [active, dialogue]);

  // #2b — DISMISS THE SHARE DIALOG AND SHOW STEP 5 (contributors).
  // When "Your idea is live" appears, we close the share panel and
  // transition the dialogue to `contributors` so the SuggestedContributors
  // modal renders. Step 5 owns navigation to /map/world (via Continue).
  const shareRedirectedRef = useRef(false);
  useEffect(() => {
    if (!active) return;
    if (!shareOpen) {
      shareRedirectedRef.current = false;
      return;
    }
    if (shareRedirectedRef.current) return;
    shareRedirectedRef.current = true;
    const t = window.setTimeout(() => {
      // Close the "Your idea is live" share dialog before showing the
      // contributors modal so the two don't stack on top of each other.
      // shadcn/Radix DialogContent renders a built-in [data-slot=
      // "dialog-close"] X button — click it to trigger the wizard's
      // onOpenChange(false) which unmounts the share panel cleanly.
      try {
        const dlgs = document.querySelectorAll('[role="dialog"]');
        for (const dlg of Array.from(dlgs)) {
          const text = (dlg as HTMLElement).innerText || "";
          if (
            text.includes("Your idea is live") ||
            text.includes("Share your idea")
          ) {
            const closeBtn = dlg.querySelector<HTMLButtonElement>(
              '[data-slot="dialog-close"], button[aria-label="Close"], button[aria-label="close"]',
            );
            if (closeBtn) {
              closeBtn.click();
            } else {
              // Radix DialogContent listens for Escape on itself — dispatch
              // the key event on the dialog element (not just document).
              (dlg as HTMLElement).dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: "Escape",
                  code: "Escape",
                  keyCode: 27,
                  bubbles: true,
                  cancelable: true,
                }),
              );
            }
            break;
          }
        }
      } catch {
        /* no-op */
      }
      void tutorial.goTo(6);
      setDialogue("contributors");
    }, 700);
    return () => window.clearTimeout(t);
  }, [active, shareOpen, tutorial]);

  // Dialogue copy + Sparky mood + highlight selector.
  const view = useMemo<{
    text: string;
    mood: SparkyMood;
    highlight: string | null;
    primary?: { label: string; onClick: () => void };
    skip?: { label: string; onClick: () => void };
  }>(() => {
    switch (dialogue) {
      case "intro":
        // First-meeting hello. Sparky introduces himself and waits for
        // the user to hit Continue before the guided flow kicks off.
        return {
          text: "Hi, I'm Sparky! I'll walk you through your entire journey, from your first idea to launching a real venture. Ready?",
          mood: "talking",
          highlight: null,
          primary: {
            label: "Let's go",
            onClick: () => {
              // Advance internal step to 3 (click_plus). Bar was hidden
              // at 0/8 during the intro pitch; now moves to 1/8.
              if (tutorial.step < 3) {
                void tutorial.goTo(3);
              }
              setDialogue("click_plus");
            },
          },
        };
      case "click_plus":
        return {
          text: "First up, let's create your first post. Tap the plus button at the top.",
          mood: "pointing",
          highlight: 'button[data-tutorial="compose"], button[aria-label="Post Idea"], button[aria-label="Post idea"]',
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "pick_template":
        return {
          text: "Now pick a template that fits what you're building. This decides what your quest looks like.",
          mood: "pointing",
          // Target ONLY the compose wizard (data-tutorial marker). Was
          // previously the broad `[role="dialog"]` selector which would
          // continue matching other dialogs (share panel exit animation,
          // notification bell, contributors modal, etc.) after the wizard
          // unmounted — producing a lingering yellow highlight box on
          // /feed for 1-2s during the route commit.
          highlight: '[data-tutorial="compose-wizard"]',
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "write_outline":
        return {
          text: "Great choice. Write a quick outline of your idea. Even one line works, I'll handle the rest.",
          mood: "pointing",
          // Highlight the WHOLE dialog so both the textarea AND the
          // Generate button are inside the scrim's punch-hole. Earlier
          // we only highlighted the textarea, which meant the scrim
          // swallowed clicks on Generate (user complaint: "generate
          // button not working").
          // Selector scoped to the compose wizard specifically (see
          // rationale on pick_template above).
          highlight: '[data-tutorial="compose-wizard"]',
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "posting":
        return {
          text: "Cool. Posting your idea now…",
          mood: "celebrating",
          highlight: null,
        };
      case "contributors":
        // Step 5 per script — SuggestedContributorsDialog is rendered
        // separately in the JSX below. Sparky lives OFF-SCREEN during
        // this beat so he doesn't overlap the modal. The dialog itself
        // owns the copy + Continue CTA.
        return {
          text: "These are people we think can help you. Send a contribution request if you'd like their help, or click continue and ask later.",
          mood: "talking",
          highlight: null,
        };
      case "to_map":
        return {
          text: "Yay! Your idea is live. Time to build. Let's head to your map.",
          mood: "celebrating",
          highlight: null,
          primary: {
            label: "Go to map",
            onClick: () => {
              // Bump 6 → 7 (task phase). Step3 handles 7 → 8 on combat.
              void tutorial.goTo(7);
              router.push("/map/world");
            },
          },
        };
    }
  }, [dialogue, tutorial, router]);

  // Fetch the user's most recent idea so we can target contribution
  // requests at it during the `contributors` step. Only queried once
  // the tutorial reaches that state so we don't fire the query on
  // every /feed visit.
  const userIdeas = useQuery(
    api.ideas.getUserIdeas,
    dialogue === "contributors" ? {} : "skip",
  );
  const latestIdeaId: Id<"ideas"> | null = useMemo(() => {
    if (!userIdeas || userIdeas.length === 0) return null;
    // getUserIdeas returns newest-first; take the top row.
    const first = userIdeas[0] as unknown as { _id: Id<"ideas"> };
    return first._id;
  }, [userIdeas]);

  if (!active) return null;
  // Hide the entire tutorial UI while the post-publish share dialog is up
  // — UNLESS we're already in the `contributors` beat, in which case the
  // Suggested-Contributors modal owns the screen and needs to render on
  // top even if the share dialog is momentarily still fading out.
  if (shareOpen && dialogue !== "contributors") return null;

  // Contributors beat owns the whole screen — render just the dialog,
  // no mascot on top. Sparky's speech content lives inside the modal.
  if (dialogue === "contributors") {
    if (!latestIdeaId) {
      // Query still loading — brief blank frame; auto-transitions
      // once ideaId resolves and the dialog can mount.
      return null;
    }
    return (
      <SuggestedContributorsDialog
        ideaId={latestIdeaId}
        onContinue={() => setDialogue("to_map")}
      />
    );
  }

  // Hide Sparky during the `posting` beat. The compose wizard unmounts
  // in one paint but the SuggestedContributorsDialog can't render
  // until userIdeas resolves (~400ms+), leaving Sparky sitting alone
  // on /feed typing "Cool. Posting your idea now…" for ~1-2s before
  // the contributors modal takes over. Product feedback: Sparky flash
  // bug — screenshot 2. Keeping the mascot mounted with visible=false
  // (rather than removing the element entirely) preserves the exit
  // animation and prevents a hard cut.
  const sparkyVisible = dialogue !== "posting";

  return (
    <>
      <TutorialHighlight
        visible={!!view.highlight}
        selector={view.highlight ?? null}
        padding={2}
        rx={12}
      />
      <TutorialMascot
        visible={sparkyVisible}
        text={view.text}
        mood={view.mood}
        primaryAction={view.primary}
        secondaryAction={view.skip}
        // Center Sparky on the intro pitch so he feels like a proper
        // "hello, welcome" moment instead of tucked in a corner. Every
        // subsequent step reverts to bottom-right so he doesn't cover
        // the underlying UI (compose dialog, checkpoint, etc.).
        anchor={dialogue === "intro" ? "center" : "bottom-right"}
        nearSelector={view.highlight ?? null}
      />    </>
  );
}
