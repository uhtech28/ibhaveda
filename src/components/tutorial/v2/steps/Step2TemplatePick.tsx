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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { TutorialMascot, type SparkyMood } from "../TutorialMascot";
import { TutorialHighlight } from "../TutorialHighlight";
import { SuggestedContributorsDialog } from "../SuggestedContributorsDialog";
import { useTutorial } from "../useTutorial";
import { useActiveVentureTemplateId } from "@/lib/tutorial/useActiveVentureTemplateId";
import { resolveTutorialCopy } from "@/config/templates/tutorialCopy";

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
  // Template-aware Sparky vocabulary — the welcome pitch and the
  // suggested-contributors prompt read differently for a Venture
  // founder vs an Academic scholar vs a Lab researcher vs a Creative
  // maker. See src/config/templates/tutorialCopy.ts for the full map.
  // Falls back to VENTURE when the user hasn't created a venture yet
  // (first-ever tutorial run), so the intro line stays sensible.
  const activeTemplateId = useActiveVentureTemplateId();
  const copy = resolveTutorialCopy(activeTemplateId);

  // Step numbering (Step2 owns 3-6):
  //   3 click + · 4 pick template · 5 write outline · 6 posted/heading map.
  // Active window covers the whole /feed phase so Sparky stays visible
  // while the internal dialogue state machine ticks between phases.
  // Force-advance below normalises stale lower steps to 3 on arrival.
  const onFeed = pathname === "/feed";
  // Bridge flag — set by /persona-setup's "Let's go" click right
  // before it hard-nav'd here. Lets us mount the tutorial Sparky
  // IMMEDIATELY on /feed load without waiting for Convex tutorial
  // state to hydrate (~300-800ms), so users never see a "no Sparky"
  // gap between persona-setup and Step2's mascot. Cleared after
  // first use so refreshes don't force-mount indefinitely.
  const [bridgeActive, setBridgeActive] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("sparkyBridgeFromPersonaSetup") === "1") {
        setBridgeActive(true);
        sessionStorage.removeItem("sparkyBridgeFromPersonaSetup");
      }
    } catch {
      /* no-op */
    }
  }, []);
  // Auto-clear the bridge flag when tutorial state advances past
  // Step2's range OR when Step2's own dialogue finishes. Without
  // this the bridgeActive flag persisted for the entire session
  // (component stays mounted at the root, useState survives route
  // changes) — user returning to /feed at Step 10 for the
  // Contribute step saw Step2's mascot rendered ALONGSIDE Step4's,
  // producing two Sparky bubbles simultaneously. Product ask
  // 2026-08-20: "instead this is coming with 2 SPARKY".
  useEffect(() => {
    if (bridgeActive && tutorial.step > 6) {
      setBridgeActive(false);
    }
  }, [bridgeActive, tutorial.step]);

  // Bridge is ONLY allowed to override the Convex-still-loading
  // gate — it must NOT extend Step2's step-range into Step4's
  // territory. Even if bridgeActive is true, tutorial.step > 6
  // means Step2 stays dormant.
  const inStep2Range = tutorial.step >= 1 && tutorial.step <= 6;
  const active =
    onFeed &&
    inStep2Range &&
    (bridgeActive || tutorial.active);

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
  // EXCEPT: when the user arrived from /persona-setup's Sparky-intro
  // overlay (which already fired goTo(3) before hard-navigating here),
  // the tutorial step is already at 3+ — in that case jump STRAIGHT to
  // "click_plus" so /feed doesn't re-play the intro pitch. This is
  // what prevents the second Sparky bubble users used to see on /feed
  // after the persona-setup intro.
  // ── Resolved starting beat ──────────────────────────────────────────
  // `null` = not decided yet.
  //
  // This used to be a lazy initialiser reading
  //   tutorial.step >= 3 ? "click_plus" : "intro"
  // which collapsed EVERY persisted position (4 = pick a template, 5 =
  // write the outline, 6 = idea posted) back to the very first
  // instruction. Refreshing mid-flow left the progress bar showing real
  // progress while Sparky restarted from "tap the plus button" — the
  // "I was on step 4, refreshed, and came back to the start" report.
  //
  // Step 6 was the damaging case: the idea is already published by then,
  // so telling the user to tap + and create a project asks them to make a
  // SECOND one.
  //
  // The step IS persisted correctly; it was only ever ignored here. A
  // lazy initialiser also necessarily runs before Convex resolves, so it
  // would read step 0 on a cold load — hence resolving in an effect once
  // the query has landed, rendering nothing until then.
  const [dialogue, setDialogueRaw] = useState<DialogueState | null>(null);
  const dialogueResolvedRef = useRef(false);
  useEffect(() => {
    if (dialogueResolvedRef.current) return;
    if (!tutorial.milestonesLoaded) return; // Convex has answered
    if (!active) return;
    dialogueResolvedRef.current = true;
    const s = tutorial.step;
    if (s >= 6) {
      // Step 6 means "idea posted, contributors beat NOT finished" --
      // completing that beat is what fires goTo(7), from either the
      // dialog's onContinue or the to_map CTA. So a user sitting at 6 was
      // last seen on the send-invite screen and that is where they
      // resume. Resuming at to_map instead skipped them past it with a
      // "Go to map" card they never asked for.
      setDialogueRaw("contributors");
    } else if (s >= 3) {
      // Steps 3-5 all live inside the compose wizard, which does not
      // survive a reload — so the honest resume is "open it again".
      setDialogueRaw("click_plus");
    } else {
      setDialogueRaw("intro");
    }
  }, [tutorial, active]);

  // Guarded setter: never walk the machine BACKWARDS past a beat the
  // persisted step says is already done. Without this a DOM poll that
  // briefly sees no compose dialog could knock a resumed session back to
  // click_plus.
  const setDialogue = useCallback(
    (next: DialogueState | ((prev: DialogueState) => DialogueState)) => {
      setDialogueRaw((prev) => {
        const resolved =
          typeof next === "function"
            ? next((prev ?? "intro") as DialogueState)
            : next;
        const ORDER: DialogueState[] = [
          "intro",
          "click_plus",
          "pick_template",
          "write_outline",
          "posting",
          "contributors",
          "to_map",
        ];
        // Floor the machine at whatever the server says we reached, beat
        // by beat. Previously this only floored at step 6, so a DOM poll
        // or a late-arriving effect could still knock a resumed session
        // all the way back to "intro" for a frame -- the "starting Sparky
        // box appeared for a second" flash. Now every persisted step has
        // a floor and nothing can paint a beat the user is already past.
        const floor: DialogueState =
          tutorial.step >= 6
            ? "contributors"
            : tutorial.step >= 5
              ? "write_outline"
              : tutorial.step >= 4
                ? "pick_template"
                : tutorial.step >= 3
                  ? "click_plus"
                  : "intro";
        if (ORDER.indexOf(resolved) < ORDER.indexOf(floor)) return prev;
        return resolved;
      });
    },
    [tutorial.step],
  );
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

  // ── Warm /map/world before the user asks for it ─────────────────────
  // Sending an invite pushes straight to the map, and nothing prefetched
  // it -- so the browser started pulling a 728 kB first load (350 kB of
  // it route-specific, plus Phaser) cold at the exact moment the user
  // clicked, then still had to boot the scene and fetch the map art.
  // That is the "takes a little long to load map" wait.
  //
  // Start as soon as the idea is posted: from `posting` onward the map is
  // the only place this flow goes, so this is a certain navigation rather
  // than a speculative one, and the user spends several seconds on the
  // contributors modal for the chunks to arrive in.
  const mapPrefetchedRef = useRef(false);
  useEffect(() => {
    if (!active) return;
    if (mapPrefetchedRef.current) return;
    if (
      dialogue !== "posting" &&
      dialogue !== "contributors" &&
      dialogue !== "to_map"
    ) {
      return;
    }
    mapPrefetchedRef.current = true;
    try {
      router.prefetch("/map/world");
    } catch {
      /* prefetch is best-effort; navigation still works without it */
    }
  }, [active, dialogue, router]);

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
    // Starting beat not resolved yet — silent Sparky. The component also
    // returns null in this state, so this never actually paints; it just
    // keeps the switch total.
    if (!dialogue) {
      return { text: "", mood: "idle", highlight: null };
    }
    switch (dialogue) {
      case "intro":
        // First-meeting hello. Sparky introduces himself and waits for
        // the user to hit Continue before the guided flow kicks off.
        return {
          text: copy.welcomeLine,
          mood: "talking",
          highlight: null,
          primary: {
            label: "Let's go",
            onClick: () => {
              // Clear the feed-intro flash guard so FeedClient starts
              // rendering its real markup as of THIS tick — otherwise
              // it would keep painting the black backdrop until the
              // sessionStorage 5s safety timer fires.
              if (typeof window !== "undefined") {
                try {
                  sessionStorage.removeItem("gateFeedForTutorialIntro");
                } catch {
                  /* no-op */
                }
              }
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
          text: "First up, let's create your project. Tap the plus button at the top.",
          mood: "pointing",
          highlight: 'button[data-tutorial="compose"], button[aria-label="Post Idea"], button[aria-label="Post idea"]',
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "pick_template":
        return {
          text: "Now pick a template that fits what you're building. This decides what tasks you need to build your idea.",
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
          // Kept in sync with the bubble the JSX branch below actually
          // renders (search `collaboratorNounPlural`), so the two can't
          // drift if that early return is ever removed.
          text: "These are potential contributors for your project. Send a request to anyone you'd like on board, or hit continue and ask later.",
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
    // `copy` (template-aware welcome + collaborator noun) participates
    // in the memo so switching templates mid-session refreshes the
    // Sparky lines.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogue, tutorial, router, copy]);

  // Fetch the user's most recent idea so we can target contribution
  // requests at it during the `contributors` step. We WARM this query
  // early — from write_outline onward — instead of waiting until the
  // `contributors` beat. Otherwise the subscription starts cold exactly
  // when we need the id, and its round-trip is the "few second break in
  // the handoff" the user sees the bare feed through between Create and
  // the Potential-Contributors modal. Subscribing during write_outline
  // means the just-posted idea arrives reactively and latestIdeaId is
  // ready the instant we reach `contributors`. Still skipped on ordinary
  // /feed visits (gated on the active tutorial being in these beats).
  const userIdeas = useQuery(
    api.ideas.getUserIdeas,
    active &&
      (dialogue === "write_outline" ||
        dialogue === "posting" ||
        dialogue === "contributors")
      ? {}
      : "skip",
  );
  // LATCHED. Convex's useQuery returns `undefined` on any re-subscription
  // -- a gate flipping, args changing, a socket reconnect -- not just
  // before the first result. Reading that as "no idea yet" made the
  // contributors branch fall back to <HandoffScrim />, a full-screen
  // near-black overlay. So the modal appeared, blanked to black for ~0.5s,
  // then came back: the reported "looks like a bug" flash.
  //
  // Once we have seen an id it cannot become un-known — the idea exists.
  // Holding the last value means a transient undefined is invisible,
  // while the genuine "not posted yet" case (ref still null) still shows
  // the scrim, which is what it is for.
  // Latches once the contributors modal is actually on screen. See the
  // block above the render gates for why this is a latch and not a
  // condition.
  const contributorsLatchedRef = useRef(false);
  const lastIdeaIdRef = useRef<Id<"ideas"> | null>(null);
  const latestIdeaId: Id<"ideas"> | null = useMemo(() => {
    if (!userIdeas || userIdeas.length === 0) {
      return lastIdeaIdRef.current;
    }
    // getUserIdeas returns newest-first; take the top row.
    const first = userIdeas[0] as unknown as { _id: Id<"ideas"> };
    lastIdeaIdRef.current = first._id;
    return first._id;
  }, [userIdeas]);

  // Holding the contributors beat back until the share panel is gone is
  // right, but it must not be able to dead-end: the panel is closed by a
  // DOM click on its X, and if that click ever misses, the user would sit
  // on the scrim forever. After 2.5s, show the modal regardless.
  const [shareBlockExpired, setShareBlockExpired] = useState(false);
  useEffect(() => {
    if (dialogue !== "contributors" || !shareOpen) {
      setShareBlockExpired(false);
      return;
    }
    const t = window.setTimeout(() => setShareBlockExpired(true), 2500);
    return () => window.clearTimeout(t);
  }, [dialogue, shareOpen]);
  const shareBlocking = shareOpen && !shareBlockExpired;

  // ── CONTRIBUTORS IS A TERMINAL BEAT ──────────────────────────────────
  // Reported: the invite list appears for ~2s, goes black for ~0.5s, then
  // "restarts" and stays. That shape is the modal MOUNTING TWICE -- its
  // own backdrop is rgba(5,8,20,0.88) and its card animates in over
  // 450ms, so an unmount/remount reads as exactly that black gap.
  //
  // Every gate below can tear it down for a frame, and each one can flip
  // spuriously: `active` folds in `tutorial.active`, which is derived
  // from a Convex query that returns undefined on ANY re-subscription --
  // and the `goTo(6)` fired on entering this very beat causes one;
  // `shareOpen` is a 400ms DOM text poll over an element that is
  // animating; `latestIdeaId` re-resolves whenever its own query
  // re-subscribes.
  //
  // Rather than harden three independent gates against the same class of
  // transient, treat the beat as what it actually is: once the invite
  // list is up it OWNS the screen until the user continues. Latching in
  // render (not an effect) is deliberate -- an effect runs after paint,
  // by which point the black frame has already been shown.
  if (dialogue === "contributors" && latestIdeaId && !shareBlocking) {
    contributorsLatchedRef.current = true;
  }
  // Released when the beat is genuinely over: the user continued (step
  // moves past 6) or left /feed. Without this the modal would follow the
  // user onto the map.
  if (!onFeed || tutorial.step >= 7) {
    contributorsLatchedRef.current = false;
  }
  const showContributors =
    contributorsLatchedRef.current ||
    (dialogue === "contributors" && !!latestIdeaId && !shareBlocking);

  if (showContributors) return renderContributors();

  if (!active) return null;
  // Starting beat not resolved yet (Convex still answering). Paint
  // nothing rather than defaulting — defaulting is what restarted the
  // flow from "tap the plus button" for users mid-way through.
  if (!dialogue) return null;
  // Hide the entire tutorial UI while the post-publish share dialog is up.
  // The contributors beat is handled above -- it does not mount until the
  // share panel is gone, so the two never stack and the share panel can
  // never close out from under it.
  if (shareOpen) return null;

  // ── HANDOFF BRIDGE ────────────────────────────────────────────────────
  // Between clicking Create and the Potential-Contributors modal there's
  // a window where the compose wizard has closed but the contributors
  // dialog can't mount yet (the posted idea is still resolving). Without
  // cover the user sees the bare feed for a few seconds — a jarring break
  // in the flow. Drop a full-screen dark scrim over that window so the
  // handoff reads as one continuous beat. It sits BEHIND the compose
  // wizard's exit animation (z-400 vs the dialog's z-10000), so as the
  // wizard fades out the scrim — not the feed — is what's revealed.
  if (dialogue === "posting") {
    return <HandoffScrim />;
  }

  // Reached only when the beat is NOT showable yet -- the id is still
  // resolving, or the share panel is still up. Keep the scrim rather than
  // a blank frame so the feed never flashes through.
  if (dialogue === "contributors") {
    return <HandoffScrim />;
  }

  // The `posting` and `contributors` beats are handled above (posting is
  // covered by the HandoffScrim, contributors renders its own dialog), so
  // by here Sparky is always meant to be on screen.
  return renderSparky();

  // ── Contributors beat ────────────────────────────────────────────────
  // Rendered via the latch above rather than inline, so the gates that
  // precede it cannot tear it down mid-beat.
  //
  // Sparky renders BESIDE the dialog (he used to be suppressed here and
  // the beat happened silently). The dialog itself still enforces "at
  // least one invite" before Continue unlocks; Sparky just narrates.
  function renderContributors() {
    // Guaranteed non-null by `showContributors` (the latch is only set
    // once an id has been seen, and `lastIdeaIdRef` never clears), but
    // that reasoning runs through a ref the compiler cannot follow.
    if (!latestIdeaId) return <HandoffScrim />;
    return (
      <>
        <SuggestedContributorsDialog
          ideaId={latestIdeaId}
          onContinue={() => {
            // Product spec (2026-08-10): after Send Request in the
            // tutorial contributors beat, go DIRECTLY to the map.
            // No Sparky "Yay! Your idea is live. Go to map" bubble
            // in between — that was one tap the user didn't need.
            // Advance the tutorial past the map-nav gate (step 6 -> 7
            // per the state machine; Step3MapGuide takes over from 7)
            // and push the route in the same tick.
            if (tutorial.step < 7) {
              void tutorial.goTo(7);
            }
            router.push("/map/world");
          }}
        />
        <TutorialMascot
          visible
          // Leads by naming what the list IS, rather than jumping
          // straight to an instruction — the user is looking at a
          // modal full of strangers and needs to know why they're
          // being shown before being told what to do with them.
          // "builders" → template-aware ("collaborators" for academic,
          // "lab partners" for lab, "co-creators" for creative). Falls
          // back to "builders" for venture / null template.
          // Trimmed 2026-09-01: the tail ("and I'll write the pitch, then
          // take you straight to your map") described plumbing the user
          // does not need to know about, and pushed the bubble to six
          // lines on a phone. The instruction ends where the user's job
          // ends.
          text={`These are potential ${copy.collaboratorNounPlural} for your ${copy.projectNoun}. Tap Send request on anyone you like.`}
          mood="pointing"
          // Bottom-left so Sparky sits BESIDE the centered contributor
          // modal (max-w-560px) instead of overlapping its Send
          // buttons on the right. `nearSelector={null}` keeps him at
          // the fallback anchor; no need to follow a specific card
          // inside the modal.
          anchor="bottom-left"
          nearSelector={null}
          noScrim
        />
      </>
    );
  }

  function renderSparky() {
    return (
    <>
      <TutorialHighlight
        visible={!!view.highlight}
        selector={view.highlight ?? null}
        padding={2}
        rx={12}
        // Suppress the amber ring on the write-outline step per
        // product ask ("remove golden hilight only from this part
        // of the tutorial"). Every other step keeps its ring.
        noRing={dialogue === "write_outline"}
      />
      <TutorialMascot
        visible
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
        // Describe-Your-Idea is a typing step: use the compact corner
        // layout on mobile so Sparky sits beside the modal (top-right)
        // instead of on the textarea — and so the on-screen keyboard
        // never shoves him onto it. (Corner mode also auto-engages
        // whenever a keyboard is detected, but this covers the
        // keyboard-down state where the user hasn't focused yet.)
        mobileCorner={dialogue === "write_outline"}
      />
      </>
    );
  }
}

/**
 * Full-screen dark bridge shown during the Create → Contributors handoff
 * so the feed never flashes through while the posted idea resolves. Same
 * deep-navy palette as the rest of the platform's tutorial scrims, with a
 * quiet spinner + line so the pause reads as intentional, not a stall.
 */
function HandoffScrim() {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse 900px 600px at 50% 40%, rgba(99,102,241,0.10), transparent 60%), #05070f",
        animation: "tutorialHandoffFade 160ms ease-out",
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        <p className="text-sm font-medium text-white/80">Posting your idea…</p>
      </div>
      <style jsx>{`
        @keyframes tutorialHandoffFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
