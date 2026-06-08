"use client";

// First-run product tour. Walks a new user through the real platform:
// post an idea, land on the venture map, complete a task, fight the
// boss, then circle back to the feed to help someone else's project.
//
// Tour progress is tracked via the feedTutorialState mutation/query
// pair on Convex, so the tour resumes wherever the user left off even
// across page reloads.

import React, { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import {
  Sparkles,
  Plus,
  ArrowRight,
  X as XIcon,
  MapPin,
  Swords,
  HandHelping,
} from "lucide-react";

interface Props {
  show: boolean;
  initialStep?: number;
  onClose: () => void;
  /** Idea count piped down from the parent so we don't open a duplicate
   *  Convex subscription. Undefined while parent's query is still
   *  loading. */
  myIdeaCount?: number;
}

// Phases are derived from the user's real platform state, so we always
// pick up where they actually are. The numeric feedTutorialStep doubles
// as the phase index when persisted back to Convex.
const PHASES = [
  "compose",
  "map",
  "task",
  "combat",
  "contribute",
  "done",
] as const;
type Phase = (typeof PHASES)[number];

function FeedTutorialInner({
  show,
  onClose,
  myIdeaCount,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const advance = useMutation(api.tutorial.advanceFeedTutorial);
  const complete = useMutation(api.tutorial.completeFeedTutorial);
  const skip = useMutation(api.tutorial.skipFeedTutorial);

  // Pull what we need to detect real platform progress. myIdeaCount
  // comes from the parent as a prop to avoid a duplicate Convex
  // websocket subscription (FeedClient already queries it).
  const myTaskCount = useQuery(api.tutorial_metrics.getMyCompletedTaskCount, {});
  const myCombatCount = useQuery(api.tutorial_metrics.getMyCombatCount, {});

  const phase: Phase = useMemo(() => {
    if (typeof myIdeaCount !== "number") return "compose";
    if (myIdeaCount === 0) return "compose";
    if (typeof myTaskCount !== "number") return "map";
    if (myTaskCount === 0) return "task";
    if (typeof myCombatCount !== "number") return "combat";
    if (myCombatCount === 0) return "combat";
    return "contribute";
  }, [myIdeaCount, myTaskCount, myCombatCount]);

  // Persist phase index whenever it changes.
  useEffect(() => {
    if (!show) return;
    void advance({ step: PHASES.indexOf(phase) }).catch(() => {});
  }, [phase, show, advance]);

  // Auto-redirect when the tour and the page get out of sync.
  useEffect(() => {
    if (!show) return;
    if (
      (phase === "map" || phase === "task" || phase === "combat") &&
      pathname?.startsWith("/feed")
    ) {
      // Hand-off after the user posts: go to their newest venture.
      // The post-create flow already does this, so no-op here.
    }
    if (phase === "contribute" && !pathname?.startsWith("/feed")) {
      router.push("/feed");
    }
  }, [phase, pathname, router, show]);

  const handleFinish = () => {
    void complete({}).catch(() => {});
    onClose();
  };

  const handleSkip = () => {
    void skip({}).catch(() => {});
    onClose();
  };

  // Step back while any Radix dialog is open so the dim/modal don't
  // layer on top of the composer, checkpoint modal, etc. The dialog's
  // own backdrop handles the focus.
  const anyDialogOpen = useAnyDialogOpen();

  if (!show) return null;
  if (anyDialogOpen) return null;

  // Each page renders its own slice of the tour. We render the right
  // overlay based on (phase, pathname).
  const onFeed = pathname?.startsWith("/feed");
  const onMap = pathname?.startsWith("/map/");
  const onCheckpoint = pathname?.includes("/checkpoint");

  return (
    <>
      {phase === "compose" && onFeed && (
        <ComposeStep onSkip={handleSkip} />
      )}
      {phase === "map" && onMap && (
        <MapTour onSkip={handleSkip} />
      )}
      {phase === "task" && onMap && !onCheckpoint && (
        <TaskStep onSkip={handleSkip} />
      )}
      {phase === "combat" && onMap && (
        <CombatStep onSkip={handleSkip} />
      )}
      {phase === "contribute" && onFeed && (
        <ContributeStep onFinish={handleFinish} onSkip={handleSkip} />
      )}
    </>
  );
}

// Hook returning the live bounding rect for an element selector. Polls
// + listens for scroll/resize so the rect stays in sync as the user
// moves around the page.
// Watches the DOM for any open modal dialog. Matches both Radix's
// data-state="open" pattern and bare role="dialog" + aria-modal="true"
// (used by CombatPanel and other custom modals). MutationObserver
// fires only when dialogs actually mount/unmount or toggle their open
// state — no polling cost while a dialog is steady-open or absent.
function useAnyDialogOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const check = () => {
      const hasOpen =
        !!document.querySelector('[role="dialog"][data-state="open"]') ||
        !!document.querySelector('[role="dialog"][aria-modal="true"]');
      setOpen((prev) => (prev === hasOpen ? prev : hasOpen));
    };
    check();

    let rafId: number | null = null;
    const schedule = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        check();
      });
    };

    const obs = new MutationObserver(schedule);
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["role", "data-state", "aria-modal"],
    });
    return () => {
      obs.disconnect();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);
  return open;
}

function useTargetRect(selector: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    // Comma-separated priority list — try each part left-to-right and
    // pick the first painted match. Within one part we still walk
    // candidates in DOM order so mobile/desktop variants both work.
    const parts = selector.split(",").map((s) => s.trim()).filter(Boolean);
    const resolveTarget = (): HTMLElement | null => {
      for (const part of parts) {
        const candidates = Array.from(
          document.querySelectorAll(part),
        ) as HTMLElement[];
        for (const el of candidates) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) return el;
        }
      }
      return null;
    };

    let currentTarget: HTMLElement | null = null;
    let lastRect: DOMRect | null = null;
    const pushRect = () => {
      if (!currentTarget) {
        if (lastRect !== null) {
          lastRect = null;
          setRect(null);
        }
        return;
      }
      const r = currentTarget.getBoundingClientRect();
      // Skip update if rect hasn't visually moved more than a pixel.
      if (
        lastRect &&
        Math.abs(r.left - lastRect.left) < 1 &&
        Math.abs(r.top - lastRect.top) < 1 &&
        Math.abs(r.width - lastRect.width) < 1 &&
        Math.abs(r.height - lastRect.height) < 1
      ) {
        return;
      }
      lastRect = r;
      setRect(r);
    };

    let resizeObs: ResizeObserver | null = null;
    let rafId: number | null = null;
    const schedulePush = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        pushRect();
      });
    };

    // Watch DOM for the target appearing / disappearing without polling.
    // When mutations change the layout we re-resolve in case a better
    // candidate appeared (mobile→desktop nav swap, for example).
    const mutObs = new MutationObserver(() => {
      const next = resolveTarget();
      if (next !== currentTarget) {
        currentTarget = next;
        if (resizeObs) {
          resizeObs.disconnect();
          resizeObs = null;
        }
        if (currentTarget) {
          resizeObs = new ResizeObserver(schedulePush);
          resizeObs.observe(currentTarget);
        }
      }
      schedulePush();
    });
    mutObs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "data-state"],
    });

    // Initial resolve.
    currentTarget = resolveTarget();
    if (currentTarget) {
      resizeObs = new ResizeObserver(schedulePush);
      resizeObs.observe(currentTarget);
    }
    schedulePush();

    window.addEventListener("resize", schedulePush);
    window.addEventListener("scroll", schedulePush, true);

    return () => {
      mutObs.disconnect();
      if (resizeObs) resizeObs.disconnect();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", schedulePush);
      window.removeEventListener("scroll", schedulePush, true);
    };
  }, [selector]);
  return rect;
}

// Full-screen dim with a click-through cutout around the target. Built
// from four divs that cover everything EXCEPT the target rect, each one
// blocking pointer events. The target sits in the un-covered hole so
// clicks pass through to the real element underneath.
function TourSpotlight({
  rect,
  onBlockedClick,
}: {
  rect: DOMRect | null;
  onBlockedClick?: () => void;
}) {
  if (!rect) {
    // No target — just dim everything and block all clicks.
    return (
      <div
        onClick={onBlockedClick}
        className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-[2px]"
      />
    );
  }
  const pad = 14;
  const x = rect.left - pad;
  const y = rect.top - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  const dimClass =
    "fixed bg-black/75 backdrop-blur-[2px] z-[90] transition-opacity";
  // Place the "Tap here" badge above the target, unless the target is
  // near the top of the screen (then put it below).
  const badgeBelow = y < 80;
  return (
    <>
      <div
        onClick={onBlockedClick}
        className={dimClass}
        style={{ top: 0, left: 0, width: "100vw", height: y }}
      />
      <div
        onClick={onBlockedClick}
        className={dimClass}
        style={{
          top: y + h,
          left: 0,
          width: "100vw",
          height: `calc(100vh - ${y + h}px)`,
        }}
      />
      <div
        onClick={onBlockedClick}
        className={dimClass}
        style={{ top: y, left: 0, width: x, height: h }}
      />
      <div
        onClick={onBlockedClick}
        className={dimClass}
        style={{
          top: y,
          left: x + w,
          width: `calc(100vw - ${x + w}px)`,
          height: h,
        }}
      />
      {/* Static amber ring with strong glow. */}
      <motion.div
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="pointer-events-none fixed z-[91]"
        style={{ top: y, left: x, width: w, height: h }}
      >
        <span className="absolute inset-0 rounded-2xl border-[3px] border-amber-300 shadow-[0_0_60px_rgba(251,191,36,0.8),0_0_24px_rgba(251,191,36,1)_inset]" />
      </motion.div>
      <div
        className="pointer-events-none fixed z-[92] flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0A0E1A] shadow-[0_8px_24px_rgba(251,191,36,0.5)]"
        style={{
          left: x + w / 2,
          top: badgeBelow ? y + h + 12 : y - 32,
          transform: "translateX(-50%)",
          animation: badgeBelow
            ? "tap-pulse-down 2.4s ease-in-out infinite"
            : "tap-pulse-up 2.4s ease-in-out infinite",
        }}
      >
        {badgeBelow ? "↑" : "↓"} Tap here
      </div>
      <style>{`
        @keyframes tap-pulse-up{0%,100%{transform:translateX(-50%) translateY(0);opacity:1}50%{transform:translateX(-50%) translateY(-3px);opacity:0.85}}
        @keyframes tap-pulse-down{0%,100%{transform:translateX(-50%) translateY(0);opacity:1}50%{transform:translateX(-50%) translateY(3px);opacity:0.85}}
      `}</style>
    </>
  );
}

// Big centered tour modal. Smart-positions vertically so it doesn't
// land on top of the spotlight rect.
function TourModal({
  eyebrow,
  title,
  body,
  icon,
  cta,
  onCtaClick,
  onSkip,
  spotlightRect,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  cta?: string;
  onCtaClick?: () => void;
  onSkip: () => void;
  spotlightRect?: DOMRect | null;
}) {
  // If the spotlight is on the bottom half of the screen, put the modal
  // at the top. Otherwise bottom. If there's no spotlight, centre it.
  const placement = (() => {
    if (typeof window === "undefined" || !spotlightRect) return "center";
    return spotlightRect.top > window.innerHeight / 2 ? "top" : "bottom";
  })();

  const positionStyles =
    placement === "top"
      ? "top-[8vh] left-1/2 -translate-x-1/2"
      : placement === "bottom"
        ? "bottom-[6vh] left-1/2 -translate-x-1/2"
        : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

  return (
    <motion.div
      initial={{ opacity: 0, y: placement === "top" ? -20 : 30, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className={`fixed z-[100] w-[min(92vw,480px)] rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#0A0E1A] to-[#0E1428] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.7)] ${positionStyles}`}
    >
      <button
        type="button"
        onClick={onSkip}
        aria-label="Skip tour"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition hover:bg-white/5 hover:text-white"
      >
        <XIcon className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/25 to-orange-500/15 ring-1 ring-amber-400/40">
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/90">
          {eyebrow}
        </p>
      </div>
      <h2 className="text-2xl font-bold leading-tight text-white sm:text-[26px]">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
        {body}
      </p>
      {cta && (
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-bold text-[#0A0E1A] transition hover:brightness-110"
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}

// Helper so callers can render the spotlight + modal together with one
// shared rect lookup.
function GuidedStep({
  selector,
  eyebrow,
  title,
  body,
  icon,
  cta,
  onCtaClick,
  onSkip,
}: {
  selector?: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  cta?: string;
  onCtaClick?: () => void;
  onSkip: () => void;
}) {
  const rect = useTargetRect(selector ?? null);
  return (
    <>
      <TourSpotlight rect={rect} />
      <TourModal
        eyebrow={eyebrow}
        title={title}
        body={body}
        icon={icon}
        cta={cta}
        onCtaClick={onCtaClick}
        onSkip={onSkip}
        spotlightRect={rect}
      />
    </>
  );
}

function ComposeStep({ onSkip }: { onSkip: () => void }) {
  return (
    <GuidedStep
      selector="[data-tutorial='compose']"
      eyebrow="Step 1 of 4"
      title="Make your first idea"
      body="Tap the glowing + button at the top of the screen. We'll walk you through the rest."
      icon={<Plus className="h-6 w-6 text-amber-300" />}
      onSkip={onSkip}
    />
  );
}

const MAP_STEPS: ReadonlyArray<{
  title: string;
  body: string;
  selector?: string;
}> = [
  {
    title: "Welcome to your venture",
    body: "Every public idea you post becomes a world. The biomes here are the stages of shipping your project, from ideation to scaling.",
  },
  {
    title: "Your character",
    body: "That's you on the map. You'll walk between checkpoints as you complete tasks. The XP bar at the bottom fills as you ship.",
    selector: "#bottom-hud-control",
  },
  {
    title: "Tools sidebar",
    body: "Notes, Kanban, Calendar, Settings live on the left. Open it any time without leaving the map.",
    selector: "#left-control-panel",
  },
  {
    title: "Quest log",
    body: "Your active tasks live here. Tap one to jump straight to the work view.",
    selector: "#hud-quest-log",
  },
  {
    title: "Open a checkpoint",
    body: "Tap a glowing checkpoint on the map to enter it. Submit any task to clear the checkpoint and earn XP.",
  },
];

function MapTour({ onSkip }: { onSkip: () => void }) {
  const [step, setStep] = useState(0);
  const current = MAP_STEPS[step];
  const isLast = step === MAP_STEPS.length - 1;

  return (
    <GuidedStep
      selector={current.selector}
      eyebrow={`Map ${step + 1} of ${MAP_STEPS.length}`}
      title={current.title}
      body={current.body}
      icon={<MapPin className="h-6 w-6 text-violet-300" />}
      cta={isLast ? "Got it" : "Next"}
      onCtaClick={() => {
        if (!isLast) setStep((s) => s + 1);
      }}
      onSkip={onSkip}
    />
  );
}

function TaskStep({ onSkip }: { onSkip: () => void }) {
  return (
    <GuidedStep
      selector="[data-tutorial='first-task']"
      eyebrow="Step 2 of 4"
      title="Open your first task"
      body="Tap any glowing task tile to open it. Submit anything — text, a link, an image — to clear it and advance the venture."
      icon={<Sparkles className="h-6 w-6 text-emerald-300" />}
      onSkip={onSkip}
    />
  );
}

function CombatStep({ onSkip }: { onSkip: () => void }) {
  const startFight = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("tutorial:force-combat"));
  };
  return (
    <GuidedStep
      eyebrow="Step 3 of 4"
      title="Defeat the doubt"
      body="The Doubt Imp guards the end of every stage. Tap below to face it now and answer one AI-scored question."
      icon={<Swords className="h-6 w-6 text-rose-300" />}
      cta="Start the fight"
      onCtaClick={startFight}
      onSkip={onSkip}
    />
  );
}

function ContributeStep({
  onFinish,
  onSkip,
}: {
  onFinish: () => void;
  onSkip: () => void;
}) {
  const router = useRouter();
  return (
    <GuidedStep
      selector="[data-tutorial='contribute']"
      eyebrow="Last step"
      title="Help someone else ship"
      body="Scroll the feed. When you find an idea you can help with, tap Contribute to join their project. That's the loop — all the best, builder."
      icon={<HandHelping className="h-6 w-6 text-emerald-300" />}
      cta="I understand"
      onCtaClick={() => {
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/feed")
        ) {
          router.push("/feed");
        }
        onFinish();
      }}
      onSkip={onSkip}
    />
  );
}

// Memoize the whole tour so parent re-renders (feed scroll, idea card
// updates) don't cascade through. Props are primitives + onClose
// callback identity, so shallow compare is enough.
export const FeedTutorial = memo(FeedTutorialInner);
