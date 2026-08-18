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
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { TutorialMascot, type SparkyMood } from "../TutorialMascot";
import { TutorialHighlight } from "../TutorialHighlight";
import { useTutorial } from "../useTutorial";
import { getVillageBoss } from "@/config/village-bosses";
import { getTemplateStageBoss } from "@/config/template-stage-bosses";
import { useActiveVentureTemplateId } from "@/lib/tutorial/useActiveVentureTemplateId";
import {
  resolveTutorialCopy,
  firstMonsterIntro,
} from "@/config/templates/tutorialCopy";
import type { TemplateId } from "@/config/templates/templateTypes";

/**
 * Resolve the first-checkpoint monster name for the tutorial, keyed by
 * the user's active venture template. Every template's stage-1 monster
 * lives in a different registry:
 *   - venture  → getVillageBoss(0)  (Fog of Vagueness family)
 *   - academic → getTemplateStageBoss("academic", 1)  (Librarian…)
 *   - lab      → getTemplateStageBoss("lab", 1)       (Silencer…)
 *   - creative → getTemplateStageBoss("creative", 1)  (Silence…)
 *
 * Falls back to a safe generic label if the config lookup returns
 * nothing (e.g. the user hasn't created a venture yet).
 */
function resolveFirstMonsterName(
  templateId: TemplateId | null | undefined,
): string {
  if (!templateId || templateId === "venture") {
    return getVillageBoss(0)?.name ?? "the first monster";
  }
  return getTemplateStageBoss(templateId, 1)?.name ?? "the first monster";
}

type Stage =
  // PRODUCT DECISION: the map tutorial now skips the "click first task,
  // write an answer, submit" flow entirely. On arrival at /map/world
  // we fire the `tutorial:force-combat` window event (handled on the
  // map page) which opens AI Combat immediately on the active
  // checkpoint. The old "checkpoint / task_open / submitted" states
  // are kept in the union for backward compat but the state machine
  // no longer routes through them.
  //
  // After combat wins → "victory" (congrats + Continue CTA, per the
  // onboarding script) → "flare" (highlight CheckpointPanel flare
  // button) → "flare_opened" (user is filling the compose dialog) →
  // "done" (auto-navigate to /feed for the contribute step).
  | "checkpoint"
  | "task_open"
  | "submitted"
  | "boss_intro"
  | "combat"
  | "victory"
  // NEW — saddlebag onboarding beat. The Flare button was moved out
  // of the CheckpointPanel into the Adventurer's Menu (opened by the
  // saddlebag icon in the map HUD), so we now walk the user to that
  // saddlebag first. Sparky points at the icon, everything else is
  // click-blocked. When the user opens the menu we advance to
  // "flare" which now points at the Flare tile inside the menu.
  | "saddlebag"
  | "flare"
  | "flare_opened"
  | "done";

function findCheckpointPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[data-tutorial="checkpoint-panel"], [aria-label="Checkpoint"], [data-checkpoint-panel], .checkpoint-panel',
  );
}

function findTaskModal(): HTMLElement | null {
  // TaskSubmissionModal now marks itself with data-tutorial="task-modal".
  // Kept the role="dialog"[data-state="open"] and the textarea id fallbacks
  // for other modals that use different conventions.
  return (
    document.querySelector<HTMLElement>(
      '[data-tutorial="task-modal"][data-state="open"], [data-tutorial="task-modal"], [role="dialog"][data-state="open"]',
    ) ||
    // Fallback: if the textarea itself is visible, treat that as the modal
    (document.querySelector<HTMLTextAreaElement>("#write-response")?.offsetParent
      ? (document.querySelector<HTMLElement>("#write-response") as HTMLElement)
      : null)
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
  const router = useRouter();
  const onMap = pathname?.startsWith("/map/") ?? false;
  // Template-aware first-monster name and Sparky vocabulary. Every
  // template has its own stage-1 boss (venture: Fog of Vagueness,
  // academic: Librarian of Lost Questions, lab: Silencer of Findings,
  // creative: Silence That Smothers), so the "you're about to face…"
  // and "…retreated!" lines must interpolate the correct name.
  const activeTemplateId = useActiveVentureTemplateId();
  const tutorialMonsterName = useMemo(
    () => resolveFirstMonsterName(activeTemplateId),
    [activeTemplateId],
  );
  const copy = resolveTutorialCopy(activeTemplateId);

  // Step numbering: 1=name, 2=username, 3=click+, 4=pick template,
  // 5=write outline, 6=posted, 7=map task, 8=combat/done.
  // Force-advance to 7 on map arrival so the bar advances the moment the
  // user reaches the map — Step3 sub-advances handle 7 → 8 as they open
  // the task modal, then complete AI combat.
  const advancedRef = useRef(false);
  useEffect(() => {
    if (!onMap) return;
    if (!tutorial.active) return;
    if (advancedRef.current) return;
    // Never resurrect a completed/skipped tutorial — if the user finished
    // the tour previously, they should NOT be walked into combat again on
    // map revisit. Guarded here as a second belt-and-braces defence on
    // top of the provider's `remoteLoaded` gate.
    if (
      tutorial.backendState === "completed" ||
      tutorial.backendState === "skipped"
    ) {
      return;
    }
    if (tutorial.step < 7) {
      advancedRef.current = true;
      void tutorial.goTo(7);
    }
  }, [onMap, tutorial]);

  // Reset force-advance flag when we leave the map (so re-entry works)
  useEffect(() => {
    if (!onMap) {
      advancedRef.current = false;
    }
  }, [onMap]);

  // Step3 covers combat (step 8) AND flare (step 9). Contribute
  // (step 10) is owned by Step4Contribute on /feed. If the user is
  // already at step >= 10, they've finished the flare beat and
  // shouldn't see Step3 again.
  const active =
    tutorial.active &&
    onMap &&
    tutorial.step >= 6 &&
    tutorial.step <= 9;

  // Initial stage:
  //   step >= 9 → "flare" (user is returning to the map to fire a flare,
  //               e.g. after a refresh mid-flow)
  //   otherwise → "combat" (first visit — auto-fires the combat panel)
  const [stage, setStage] = useState<Stage>(() =>
    tutorial.step >= 9 ? "flare" : "combat",
  );

  // Sub-state for the boss-intro cinematic: TRUE while the villain is
  // actively speaking (intro monologue OR minions taunt). We poll the
  // [data-boss-speaking] attribute the cinematic sets on its root, and
  // use this to blank out Sparky's bubble so the two speakers never
  // overlap. Flips to false at the finale phase — that's when Sparky
  // steps in with "You're about to face…".
  const [bossSpeaking, setBossSpeaking] = useState(false);
  // Latches true the first time the FlareComposeDialog actually mounts.
  // Guards the `flare_opened → done` transition so a false-positive on
  // the DOM check (e.g. the dialog briefly matching then unmatching)
  // can't auto-advance the tutorial without the user opening the
  // compose dialog.
  const flareWasOpenRef = useRef(false);
  // TRUE while the AI combat panel is on screen. React state (not a
  // sync DOM check inside the memo) so the view updates the moment the
  // panel mounts — the previous inline check ran only when the memo's
  // deps changed and captured a stale value.
  const [combatOpenState, setCombatOpenState] = useState(false);
  // Latches TRUE the first time the CombatPanel mounts. Used by the
  // stage machine so the "victory" transition only fires AFTER the
  // user has actually seen combat — not on the initial "no panel yet"
  // window before force-combat has spawned it. Prevents the tutorial
  // from jumping straight to "Congratulations!" on map arrival.
  const combatWasOpenRef = useRef(false);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      const root = document.querySelector<HTMLElement>(
        '[data-boss-intro="active"]',
      );
      const speaking =
        !!root && root.getAttribute("data-boss-speaking") === "true";
      setBossSpeaking(speaking);

      const combatUp = !!document.querySelector<HTMLElement>(
        '[data-tutorial="combat-panel"]',
      );
      if (combatUp) combatWasOpenRef.current = true;
      setCombatOpenState(combatUp);
    }, 200);
    return () => window.clearInterval(id);
  }, [active]);

  // BOSS-INTRO GATE — read the Convex flag directly so we know whether
  // the cinematic will play on THIS map visit. If it will, force-combat
  // must wait until the user hits "Face them" (which removes the
  // [data-boss-intro="active"] marker from the DOM). If the flag is
  // already true (or the query returns null for guests), we don't gate.
  const bossIntroSeen = useQuery(api.users.getMyBossIntroSeen, {});
  // Track whether the cinematic ever mounted this session — used so
  // "not-currently-up" doesn't count as "dismissed" when the intro is
  // still spinning up. We flip the flag on first sighting, and treat
  // "was up, is now gone" as the dismissal signal.
  const introMountedRef = useRef(false);
  const introDismissedRef = useRef(false);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      const up = !!document.querySelector('[data-boss-intro="active"]');
      if (up) introMountedRef.current = true;
      if (!up && introMountedRef.current && !introDismissedRef.current) {
        introDismissedRef.current = true;
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [active]);

  // FORCE-COMBAT DISPATCH — as soon as Step3 becomes active on the
  // map, fire the window event the map page already listens for. The
  // map page finds the active checkpoint and opens the CombatPanel
  // without the user having to click through tasks first. Retries a
  // few times in case the map (Convex venture query, Phaser boot,
  // BossIntroCinematic mount, etc.) isn't fully ready on the first
  // attempt.
  const forceCombatFiredRef = useRef(false);
  useEffect(() => {
    if (!active) return;
    if (forceCombatFiredRef.current) return;
    // DON'T re-fire combat if the user has already progressed past
    // it. Step >= 9 = flare (map flare beat). Skip combat and drop
    // straight into the flare stage so re-visits mid-flow (e.g.
    // browser refresh) resume where they were.
    if (tutorial.step >= 9) {
      forceCombatFiredRef.current = true;
      setStage("flare");
      return;
    }
    // Two INDEPENDENT counters so waiting-for-intro doesn't burn the
    // dispatch budget. Previously both phases shared one counter — if
    // the cinematic ran ~15s (30 ticks), the dispatch phase inherited
    // `attempts=30` and its `< 20` reschedule check was already false,
    // so we'd fire the event ONCE and give up. If that one dispatch
    // hit before activeVenture/checkpoints hydrated on the map page,
    // the listener silently returned and combat never opened.
    let introAttempts = 0;   // capped at 60 (~30s) while intro plays
    let dispatchAttempts = 0; // capped at 30 (~15s) once we start firing
    let cancelled = false;
    const tryDispatch = () => {
      if (cancelled || forceCombatFiredRef.current) return;
      const combatOpen = !!findCombatPanel();
      if (combatOpen) {
        forceCombatFiredRef.current = true;
        return;
      }

      // GATE ON BOSS INTRO — if the cinematic is queued (or currently
      // on screen), do NOT fire combat yet. We check three signals:
      //   - Convex query still loading (undefined) → keep waiting
      //   - Convex flag says false (unseen) → wait for the cinematic
      //     to mount AND then be dismissed
      //   - [data-boss-intro="active"] currently on the DOM → wait
      const introUp = !!document.querySelector('[data-boss-intro="active"]');
      const introWillPlay = bossIntroSeen === false;
      const introQueryLoading = bossIntroSeen === undefined;
      if (introUp) {
        // Cinematic is on screen right now — hold combat.
        introAttempts++;
        if (introAttempts < 60) {
          window.setTimeout(tryDispatch, 500);
        } else {
          forceCombatFiredRef.current = true;
        }
        return;
      }
      if (introWillPlay && !introDismissedRef.current) {
        // Cinematic hasn't mounted yet OR mounted-and-not-yet-dismissed.
        // Give it up to ~30s to appear + finish before we bail.
        introAttempts++;
        if (introAttempts < 60) {
          window.setTimeout(tryDispatch, 500);
        } else {
          forceCombatFiredRef.current = true;
        }
        return;
      }
      if (introQueryLoading) {
        // Wait for the query to resolve before deciding.
        introAttempts++;
        if (introAttempts < 40) {
          window.setTimeout(tryDispatch, 500);
          return;
        }
        // Query never resolved after ~20s — fall through and dispatch
        // anyway rather than dead-end the whole tutorial.
      }

      // Dispatch phase — fires the event once per tick until either
      // the combat panel appears or we hit the dispatch budget.
      dispatchAttempts++;
      try {
        window.dispatchEvent(new CustomEvent("tutorial:force-combat"));
      } catch {
        /* no-op */
      }
      // Poll for combat to appear; keep firing for ~15s so
      // activeVenture / checkpoints have plenty of time to hydrate
      // even on slow Convex round-trips.
      if (dispatchAttempts < 30) {
        window.setTimeout(tryDispatch, 500);
      } else {
        forceCombatFiredRef.current = true; // give up, don't retry forever
      }
    };
    // Give the map a moment to boot (Phaser, Convex hydration) before
    // the first dispatch — firing too early misses because activeVenture
    // hasn't loaded yet on the map page.
    const kick = window.setTimeout(tryDispatch, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(kick);
    };
  }, [active, bossIntroSeen]);

  // Reset the fire-once ref when Step3 deactivates so re-entering the
  // tutorial (e.g. via restart) triggers combat again. Same treatment
  // for the flare-open latch so a restart doesn't inherit a stale
  // "was already open" signal from a prior run.
  useEffect(() => {
    if (!active) {
      forceCombatFiredRef.current = false;
      flareWasOpenRef.current = false;
    }
  }, [active]);

  // WATCHDOG — "stuck at Sparky's about-to-face line, needed refresh"
  // fix. The primary force-combat dispatch above is one-shot (retries
  // for ~15s then gives up). If ANY of these race conditions hit
  // during that window the panel never opens:
  //   - Convex `startCombatRound` mutation stalled or errored silently
  //   - CheckpointPanel opened first (from URL param) and swallowed
  //     the render slot the CombatPanel needs
  //   - Browser tab was backgrounded during the retry budget → all
  //     setTimeouts throttled → budget burned without a real attempt
  //   - `bossCombatTarget` was set but `activeCombatRoundId` never
  //     landed, leaving the "The boss is awakening…" spinner up
  //     without ever mounting CombatPanel
  // While the tutorial is parked at `stage === "combat"` and neither
  // the combat panel nor the awakening spinner is visible, re-fire
  // the event every 3 s. Cancels itself as soon as combat opens.
  useEffect(() => {
    if (!active) return;
    if (stage !== "combat") return;
    const tick = window.setInterval(() => {
      const combatOpen = !!findCombatPanel();
      // Awakening spinner has this exact text — if it's up, combat
      // IS starting, don't spam more dispatches.
      const spinnerUp =
        typeof document !== "undefined" &&
        document.body.innerText.includes("The boss is awakening");
      if (combatOpen || spinnerUp) return;
      // Reset the one-shot latch so Step3's tryDispatch loop can run
      // again the next time this effect ticks. Then fire the event
      // directly so we don't wait a full poll cycle.
      forceCombatFiredRef.current = false;
      try {
        window.dispatchEvent(new CustomEvent("tutorial:force-combat"));
      } catch {
        /* no-op */
      }
    }, 3000);
    return () => window.clearInterval(tick);
    // findCombatPanel is stable via useCallback in the enclosing scope
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stage]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      const combat = !!findCombatPanel();
      // Boss intro cinematic overlay marker — set by BossIntroCinematic
      // on its root element. When present, Sparky shows villain-intro
      // copy; when it disappears (user hit "Face them"), we fall into
      // the combat stage.
      const bossIntroUp = !!document.querySelector('[data-boss-intro="active"]');
      // Detect the boss-victory screen even while the combat modal is
      // still on screen (CombatResultPanel lives inside the same
      // fixed inset-0 wrapper, so findCombatPanel() stays true after
      // victory until the user clicks Advance). Text-match "Boss
      // defeated" so we advance the tutorial WITHOUT waiting on the
      // user to click Advance — that's what the product wants.
      let bossDefeated = false;
      try {
        const combatEl = document.querySelector<HTMLElement>(
          '[data-tutorial="combat-panel"]',
        );
        if (combatEl) {
          const text = (combatEl.innerText || "").toLowerCase();
          if (text.includes("boss defeated") || text.includes("victory")) {
            bossDefeated = true;
          }
        }
      } catch {
        /* no-op */
      }
      // Detect the FlareComposeDialog by its own data-tutorial marker.
      let flareModalOpen = false;
      try {
        const el = document.querySelector<HTMLElement>(
          '[data-tutorial="flare-compose"]',
        );
        if (el) {
          // During the exit animation Radix keeps the element mounted
          // with data-state="closed" — treat that as already closed so
          // flare_opened → done still fires without a lag.
          const state = el.getAttribute("data-state");
          flareModalOpen = state !== "closed";
        }
      } catch {
        /* no-op */
      }
      if (flareModalOpen) flareWasOpenRef.current = true;

      // Detect the Adventurer's Menu modal being open — this is what
      // advances the saddlebag → flare beat. The menu tiles carry
      // `data-tutorial="menu-tile-*"` markers only when the menu is
      // mounted, so querying for the Flare tile is a clean 1:1
      // signal that the menu is open AND our target is on screen.
      let adventurersMenuOpen = false;
      try {
        adventurersMenuOpen = !!document.querySelector(
          '[data-tutorial="menu-tile-flare"]',
        );
      } catch {
        /* no-op */
      }

      // NEW FLOW: after combat is dismissed OR the boss-defeated
      // victory screen appears we DO the flare step on the map (the
      // flare button lives inside the CheckpointPanel — "task bar of
      // the map"). Only after the user fires a flare do we navigate
      // to /feed for the contribute step.
      setStage((prev) => {
        // Cinematic just went up — switch to villain-intro copy.
        if (bossIntroUp && prev !== "boss_intro") {
          return "boss_intro";
        }
        // Cinematic dismissed — fall into combat copy.
        if (!bossIntroUp && prev === "boss_intro") {
          return "combat";
        }
        // Combat cleared → show the victory beat (congrats + Continue
        // CTA per the onboarding script). Only "victory" advances to
        // "flare" — that transition happens on the user's Continue
        // click, not automatically here.
        //
        // STEP-BASED (not timer-based): require that the combat panel
        // was ACTUALLY visible at some point before we call it a
        // victory. Previously `!combat` was true both AFTER combat
        // closed AND BEFORE it ever spawned — so the tutorial jumped
        // straight to "Congratulations!" the instant the user landed
        // on the map, before they'd even entered combat.
        if (
          prev === "combat" &&
          forceCombatFiredRef.current &&
          combatWasOpenRef.current &&
          (!combat || bossDefeated)
        ) {
          return "victory";
        }
        // User opened the Adventurer's Menu (saddlebag → flare).
        // Only triggers from the saddlebag stage — we don't want a
        // menu-open at some later moment to yank the tutorial back.
        if (prev === "saddlebag" && adventurersMenuOpen) {
          return "flare";
        }
        // User opened the flare compose dialog.
        if (prev === "flare" && flareModalOpen) {
          return "flare_opened";
        }
        // User closed (submitted or dismissed) the flare compose dialog.
        // Belt-and-braces guard: require flareWasOpenRef so a single
        // transient false-positive from the DOM check can't drive
        // the tutorial through flare → flare_opened → done in one
        // polling cycle.
        if (
          prev === "flare_opened" &&
          !flareModalOpen &&
          flareWasOpenRef.current
        ) {
          return "done";
        }
        return prev;
      });
    }, 500);
    return () => window.clearInterval(id);
  }, [active]);

  // Sub-advance the progress bar as user moves through map phases.
  //   combat        -> step 8 (only AFTER boss-intro cinematic has
  //                    finished — bumping too early flips the map's
  //                    `tutorialPastCombat` gate and hides the intro).
  //   flare         -> step 9 (map flare step opens after combat)
  //   flare_opened  -> stays on step 9 (user is filling the flare)
  //   done          -> stays on step 9 until the /feed nav completes;
  //                    Step4Contribute persists step 10 once the user
  //                    is on the contribute stage.
  useEffect(() => {
    if (!active) return;
    if (stage === "combat" && tutorial.step < 8) {
      // Wait for the boss-intro cinematic: if the Convex flag says
      // false and the intro hasn't been dismissed yet, hold the step
      // bump so the map's shouldShowBossIntro check stays true.
      const introWillPlay = bossIntroSeen === false;
      if (introWillPlay && !introDismissedRef.current) {
        return;
      }
      void tutorial.goTo(8);
    }
    if (
      (stage === "victory" ||
        stage === "flare" ||
        stage === "flare_opened" ||
        stage === "done") &&
      tutorial.step < 9
    ) {
      void tutorial.goTo(9);
      // Defensive local flag: if the Convex mutation ACK is slow and
      // the user hard-refreshes in the ~500ms window, `tutorial.step`
      // might still read 8 on next mount and the combat tutorial
      // would replay. This flag is checked on mount below and forces
      // an immediate re-advance so the AI-combat tutorial never
      // re-triggers after victory. Product ask: "if i used ai combat
      // in tutorial and came till victory board i should never get
      // back the tutorial of ai combat".
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("tutorial-combat-done", "1");
          localStorage.setItem("tutorial-combat-done", "1");
        } catch {
          /* no-op */
        }
      }
    }
  }, [stage, active, tutorial, bossIntroSeen]);

  // Mount-time reconciliation — if the persisted tutorial.step lags
  // behind our local "combat done" markers (hard-refresh during the
  // mutation ack window), force-advance to step 9 immediately so the
  // combat tutorial doesn't replay from stage-1 defaults.
  useEffect(() => {
    if (!active) return;
    if (tutorial.step >= 9) return;
    if (typeof window === "undefined") return;
    let done = false;
    try {
      done =
        sessionStorage.getItem("tutorial-combat-done") === "1" ||
        localStorage.getItem("tutorial-combat-done") === "1";
    } catch {
      /* no-op */
    }
    if (done) {
      void tutorial.goTo(9);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Auto-navigate to /feed on done. Runs once per active session.
  // Uses a fire-and-forget setTimeout OUTSIDE the effect's cleanup
  // window — the previous implementation was cancelled every time
  // tutorial.goTo(9) mutated the context, because the effect deps
  // include `tutorial` and the cleanup zeroed `cancelled`. Now the
  // timeout fires regardless of subsequent re-renders.
  const navigatedRef = useRef(false);
  const routerRef = useRef(router);
  routerRef.current = router;
  const tutorialRef = useRef(tutorial);
  tutorialRef.current = tutorial;
  useEffect(() => {
    if (!active) return;
    if (stage !== "done") return;
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    // Persist step 9 optimistically; ignore errors — the provider
    // has the optimistic value locally either way.
    try {
      void tutorialRef.current.goTo(9);
    } catch {
      /* no-op */
    }
    // Fire-and-forget push after a short beat. Not tied to the
    // cleanup, so re-renders during the 1.5s wait can't cancel it.
    window.setTimeout(() => {
      try {
        routerRef.current.push("/feed");
      } catch {
        /* no-op */
      }
    }, 1500);
  }, [active, stage]);

  const view = useMemo<{
    text: string;
    mood: SparkyMood;
    /** Selector Sparky floats next to. */
    near: string | null;
    /** Selector the amber highlight ring wraps. When set, it also punches
     *  a hole in the scrim so only this element is interactive. */
    highlight: string | null;
    primary?: { label: string; onClick: () => void };
    skip?: { label: string; onClick: () => void };
  }>(() => {
    switch (stage) {
      case "checkpoint":
        // Panel is open on the right. Sparky sits LEFT of the target and
        // highlights the FIRST not-done task inside it. Scrim blocks
        // everything else on the page.
        // Fallbacks: [data-tutorial="first-task"] → [data-tutorial-task-index="0"]
        // → any child of the task-list container, so the ring shows even
        // if the "first not-done" logic is briefly out of sync.
        return {
          text: "Here's your first task. Click it and answer in your own words.",
          mood: "pointing",
          near: '[data-tutorial="first-task"], [data-tutorial-task-index="0"], [data-tutorial="task-list"] > div:first-child',
          highlight:
            '[data-tutorial="first-task"], [data-tutorial-task-index="0"], [data-tutorial="task-list"] > div:first-child',
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "task_open":
        return {
          text: "Write your answer here. Be specific. The more detail, the better the AI feedback.",
          mood: "pointing",
          // Target the whole modal container so:
          //  - Sparky positions relative to the modal (sits beside it)
          //  - The SCRIM HOLE covers the entire modal — textarea,
          //    formatting toolbar, Submit Response, and close button all
          //    stay clickable.
          //  - The highlight ring wraps the modal as one clear zone.
          // Falls back to the textarea if the modal marker isn't found.
          near: '[data-tutorial="task-modal"] > div, [data-tutorial="task-modal"], #write-response',
          highlight:
            '[data-tutorial="task-modal"] > div, [data-tutorial="task-modal"], #write-response',
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "submitted":
        return {
          text: "Nice work! The AI is reviewing your answer. Get ready, it might ask a tough follow up.",
          mood: "celebrating",
          near: null,
          highlight: null,
        };
      case "boss_intro":
        // Sparky stays SILENT for the entire boss cinematic per
        // product ask ("here sparky will speak at end when the boss
        // dialog is over remove this one"). The old fallback line
        // ("You're about to face …") that used to fire once the
        // villain finished has been removed — the villain gets the
        // stage to themselves. Sparky's "you're about to face" beat
        // still lives in the `combat` step below, so users get the
        // heads-up right before combat opens instead.
        return {
          text: "",
          mood: "idle",
          near: null,
          highlight: null,
        };
      case "combat":
        // Step 6c — right BEFORE combat opens Sparky reads the
        // "you're about to face…" line. Once the combat panel is up
        // (step 6d) Sparky goes silent AND idle: empty text hides
        // the bubble; mood="idle" means no mouth-flapping "talk"
        // animation; suppressRoll (wired via TutorialMascot below)
        // keeps him from rolling on the floor mid-fight. Net effect
        // — a calm puppy sitting in the corner while the user
        // focuses on the boss.
        return {
          text: combatOpenState
            ? ""
            // Template-aware intro line — see tutorialCopy.ts. Falls
            // back to venture wording for null template.
            : firstMonsterIntro(activeTemplateId, tutorialMonsterName),
          mood: combatOpenState ? "idle" : "pointing",
          near: '[data-tutorial="combat-panel"], [aria-label="AI Combat"], [data-combat-panel]',
          highlight: combatOpenState
            ? null
            : '[data-tutorial="combat-panel"], [aria-label="AI Combat"], [data-combat-panel]',
        };
      case "victory":
        // Post-combat victory beat — script line verbatim. Continue
        // ALSO programmatically clicks the combat panel's Advance
        // button so the VICTORY overlay closes and the CheckpointPanel
        // (with the flare-button target) becomes visible — otherwise
        // the user would land on the flare copy while the victory
        // panel is still covering the checkpoint UI.
        return {
          // Copy correction per product: the boss doesn't get truly
          // DEFEATED after a single AI-combat round — that only happens
          // after every task under this checkpoint is complete. What
          // just happened is a retreat. Sparky says so explicitly so
          // the user understands why the map still shows the boss.
          // Template-aware victory line — see tutorialCopy.ts.
          text: copy.firstMonsterVictory(tutorialMonsterName),
          mood: "celebrating",
          // Anchor Sparky next to the Victory PANEL specifically —
          // combat-victory-panel is a ~720px centered card, small
          // enough for TutorialMascot's beside-placement to compute
          // a real coordinate. Falls back to the outer combat-panel
          // wrapper (full-screen) only if the victory sub-panel
          // isn't mounted yet, at which point Sparky lands in the
          // bottom-right fallback for a beat until the victory
          // panel renders and the follow-target loop re-anchors.
          near: '[data-tutorial="combat-victory-panel"], [data-tutorial="combat-panel"], [aria-label="AI Combat"], [data-combat-panel]',
          highlight: null,
          primary: {
            label: "Continue",
            onClick: () => {
              try {
                const buttons = document.querySelectorAll<HTMLButtonElement>(
                  '[data-tutorial="combat-panel"] button',
                );
                for (const b of Array.from(buttons)) {
                  const label = (b.textContent || "").trim().toLowerCase();
                  if (
                    label.startsWith("advance") ||
                    label === "advance ▶" ||
                    label.includes("advance")
                  ) {
                    b.click();
                    break;
                  }
                }
              } catch {
                /* no-op */
              }
              setStage("saddlebag");
            },
          },
        };
      case "saddlebag":
        // NEW onboarding beat — Flare was moved from the CP panel
        // into the Adventurer's Menu (saddlebag). Sparky points at
        // the saddlebag icon in the HUD, everything else is
        // click-blocked (see noScrim below — saddlebag is NOT in
        // the noScrim list, so the scrim's punch-out is around only
        // the saddlebag). When the user opens the menu we advance
        // to "flare".
        return {
          text:
            "This is your saddlebag. It holds every tool you'll need on your journey. Tap to open!",
          mood: "pointing",
          near: '[data-tutorial="saddlebag-button"]',
          highlight: '[data-tutorial="saddlebag-button"]',
        };
      case "flare":
        // Fires once the Adventurer's Menu is open. Sparky points at
        // the Flare TILE inside the menu (previously the Flare
        // button lived on the CheckpointPanel; product moved it to
        // the menu so this step now targets `menu-tile-flare`).
        // Advance is driven by the DOM poller detecting the
        // FlareComposeDialog opening.
        return {
          text: "Nice work! If you're ever stuck, fire a Flare from here. People can jump in to help without joining your project.",
          mood: "pointing",
          near: '[data-tutorial="menu-tile-flare"]',
          highlight: '[data-tutorial="menu-tile-flare"]',
        };
      case "flare_opened":
        // Flare compose dialog is up — Sparky sits back and cheers
        // while the user writes their flare. No CTA — poller advances
        // to "done" when the dialog closes (submitted or dismissed).
        return {
          text: "Perfect. Write what you're stuck on and fire it away.",
          mood: "celebrating",
          near: null,
          highlight: null,
        };
      case "done":
        // Flare done — one line of praise, then the auto-navigate
        // effect below pushes to /feed for the contribute step.
        return {
          text: `Great job! Now let's head back to the feed for one last thing.`,
          mood: "celebrating",
          near: null,
          highlight: null,
        };
    }
    // Include the template-aware monster name + vocab in deps so the
    // memoized Sparky lines refresh when the active venture's template
    // changes (rare but happens when the user switches ventures without
    // remounting the tutorial provider).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, tutorial, bossSpeaking, combatOpenState, tutorialMonsterName, activeTemplateId]);

  if (!active) return null;

  return (
    <>
      <TutorialHighlight
        visible={!!view.highlight}
        selector={view.highlight ?? null}
        padding={4}
      />
      <TutorialMascot
        // Hide Sparky entirely during the boss-intro cinematic — the
        // villain owns the whole stage. Previously Sparky rendered
        // with an empty text bubble for the 500-800ms curtain/main-
        // reveal window before bossSpeaking flipped true, which looked
        // like a flashing empty box (product report: "before the
        // unraveller starts speaking sparky conversation box is there
        // for 1-2 seconds then it gets remove").
        visible={stage !== "boss_intro"}
        text={view.text}
        mood={view.mood}
        primaryAction={view.primary}
        secondaryAction={view.skip}
        anchor="bottom-right"
        nearSelector={view.near}
        // Skip the click-blocking scrim on beats where the user needs
        // to interact freely with the underlying UI:
        //   - boss_intro / victory / done: overlays that own their own
        //     CTAs (Face them / Continue) — a scrim would eat clicks
        //   - flare_opened: user is inside the flare compose dialog
        //     which sits on top of everything, no scrim needed
        // NOTE: the `flare` stage KEEPS the scrim on so the user can
        // ONLY click the Flare tile — the other 8 Adventurer's Menu
        // tiles were previously all clickable during this step, which
        // let users wander off the guided path. TutorialScrim punches
        // a hole around the highlighted target so the Flare tile
        // itself stays fully interactive.
        // "victory" was previously in this list, which disabled the
        // click-blocking scrim and let users tap the Victory panel's
        // own Continue button independent of Sparky. Product ask:
        // "block the continue button in victory box". Removing
        // "victory" here re-enables the transparent full-viewport
        // scrim (see TutorialMascot.tsx:559-568) so the ONLY way to
        // advance is Sparky's Continue button. The scrim is
        // transparent — the Victory panel stays fully visible
        // underneath, its Continue just isn't clickable until Sparky
        // is done.
        noScrim={
          stage === "boss_intro" ||
          stage === "done" ||
          stage === "flare_opened"
        }
        // Silence the roll animation whenever the villain is speaking
        // OR the user is inside AI combat. In both moments a rolling
        // puppy would pull attention off the primary content.
        suppressRoll={bossSpeaking || combatOpenState}
      />
      {/* Global CSS pulse ring around the Flare tile inside the
          Adventurer's Menu during the flare step. NOTE: the selector
          was previously `[data-tutorial="flare-button"]` (from when
          Flare was a CheckpointPanel button), but the button was
          moved into the menu tiles and now carries
          `data-tutorial="menu-tile-flare"` — so the old selector
          matched nothing and the tile rendered without any
          highlight. */}
      {stage === "flare" && (
        <style jsx global>{`
          [data-tutorial="menu-tile-flare"] {
            position: relative !important;
            z-index: 10006 !important;
            box-shadow:
              0 0 0 3px rgba(253, 224, 71, 0.9),
              0 0 22px rgba(253, 224, 71, 0.65),
              0 0 48px rgba(253, 224, 71, 0.32) !important;
            border-radius: 12px !important;
            animation: sparky-map-flare-pulse 1.4s ease-in-out infinite !important;
          }
          @keyframes sparky-map-flare-pulse {
            0%, 100% {
              box-shadow:
                0 0 0 3px rgba(253, 224, 71, 0.9),
                0 0 22px rgba(253, 224, 71, 0.65),
                0 0 48px rgba(253, 224, 71, 0.32);
            }
            50% {
              box-shadow:
                0 0 0 4px rgba(253, 224, 71, 1),
                0 0 32px rgba(253, 224, 71, 0.9),
                0 0 66px rgba(253, 224, 71, 0.5);
            }
          }
        `}</style>
      )}
    </>
  );
}
