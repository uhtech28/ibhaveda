"use client";

// First-time user walkthrough (PRD §6). Visual format mirrors
// WorldMapTour. Step list is data-driven; edit STEPS to change order.

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Sparkles,
  MessageCircle,
  Award,
  TrendingUp,
  Lightbulb,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

// ────────────────────────────────────────────────────────────────────
// Step list — edit-friendly (AC7)
// ────────────────────────────────────────────────────────────────────

type ActionWatch =
  | { kind: "spark"; minCount: number }
  | { kind: "comment"; minCount: number };

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  sparkyTip: string;
  /** CSS selector to spotlight. Null = no spotlight (centered intro). */
  selector: string | null;
  fallbackSelector?: string | null;
  shape?: "circle" | "rect" | "none";
  rx?: number;
  padding?: number;
  /** When set, Next is disabled until the action is observed. */
  action?: ActionWatch;
}

const STEPS: TutorialStep[] = [
  {
    title: "Welcome to the Feed!",
    description:
      "This is where every builder shares ideas, asks for help, and finds collaborators. Each card represents a real venture in motion.",
    icon: <Compass className="w-8 h-8 text-yellow-400" />,
    sparkyTip:
      "Hi! I'm Sparky ✨ — your builder companion. Let's walk through how the platform works so you can hit the ground running!",
    selector: null,
    shape: "none",
  },
  {
    title: "Give a Spark",
    description:
      "A Spark is your signal of support — it boosts the idea's visibility and tells the author you back them. Find any post on the feed and tap the ⚡ Spark icon on its bottom row.",
    icon: <Sparkles className="w-8 h-8 text-orange-400" />,
    sparkyTip:
      "Sparks are free and unlimited — give them generously to ideas that resonate. The first one earns you XP!",
    selector: "[data-idea-spark]",
    fallbackSelector: "article",
    shape: "rect",
    rx: 12,
    padding: 8,
    action: { kind: "spark", minCount: 1 },
  },
  {
    title: "Drop a Comment",
    description:
      "Tap the 💬 Comment icon on any post to share feedback, ask a question, or offer help. Real comments move ideas forward.",
    icon: <MessageCircle className="w-8 h-8 text-blue-400" />,
    sparkyTip:
      "Thoughtful comments are the fastest way to get noticed by other builders. Post your first one!",
    selector: "[data-idea-comment]",
    fallbackSelector: "article",
    shape: "rect",
    rx: 12,
    padding: 8,
    action: { kind: "comment", minCount: 1 },
  },
  {
    title: "Level Up with XP",
    description:
      "Every meaningful action — Sparking, commenting, posting, building — earns XP that levels up your profile. Watch the XP bar near your avatar; it pops when you gain points.",
    icon: <TrendingUp className="w-8 h-8 text-emerald-400" />,
    sparkyTip:
      "You just earned XP from the actions above! Levels unlock badges, league standing, and visible builder cred.",
    selector: "#xp-bar, [data-xp-bar]",
    fallbackSelector: "header",
    shape: "rect",
    rx: 10,
    padding: 6,
  },
  {
    title: "Earn Badges",
    description:
      "Badges mark milestones — your first venture, your tenth spark, weekly streaks, league promotions. They appear on your profile and on every comment you make.",
    icon: <Award className="w-8 h-8 text-amber-400" />,
    sparkyTip:
      "Some badges are rare and visible only to the people who earn them. Aim for the gold ones!",
    selector: "[data-badges-bar], #equipped-badges",
    fallbackSelector: "header",
    shape: "rect",
    rx: 10,
    padding: 8,
  },
  {
    title: "Create Your First Venture",
    description:
      "Tap the + button to start a new venture. You'll name it, pick a project template (Venture / Academic / Lab / Creative), and unlock its own world map of checkpoints to clear.",
    icon: <Lightbulb className="w-8 h-8 text-violet-400" />,
    sparkyTip:
      "Each venture becomes a quest — checkpoints, mini-boss combats, and easter-egg mini-games await on its overworld!",
    selector: "[data-create-venture], #create-idea-button",
    fallbackSelector: "header",
    shape: "rect",
    rx: 16,
    padding: 6,
  },
  {
    title: "Complete a Task",
    description:
      "Each venture map has checkpoint tasks — submit work, get AI-scored, and clear the checkpoint to advance. Completing tasks is the core loop that drives your venture forward.",
    icon: <CheckSquare className="w-8 h-8 text-green-400" />,
    sparkyTip:
      "Tasks reward XP, points, and progress toward bosses. Your first completed task is the real start of the journey!",
    selector: null,
    shape: "none",
  },
];

// ────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────

interface Props {
  /** Initial visibility. Page-level hook decides this based on Convex state. */
  show: boolean;
  /** Resume from this step (PRD AC4). */
  initialStep?: number;
  /** Fired on close (skip + complete both use this). */
  onClose: () => void;
}

export function FeedTutorial({ show, initialStep = 0, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [targetRect, setTargetRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    rx: number;
    shape: "circle" | "rect" | "none";
  }>({ x: 0, y: 0, width: 0, height: 0, rx: 8, shape: "none" });

  const advance = useMutation(api.tutorial.advanceFeedTutorial);
  const complete = useMutation(api.tutorial.completeFeedTutorial);
  const skip = useMutation(api.tutorial.skipFeedTutorial);

  // Action watchers — keep tutorial honest (PRD AC2).
  // Direct references (no optional chain) so a missing function on
  // the Convex side surfaces a typed compile-time error instead of
  // silently always returning undefined.
  const mySparkCount = useQuery(api.tutorial_metrics.getMySparkCount, {});
  const myCommentCount = useQuery(api.tutorial_metrics.getMyCommentCount, {});

  // Snapshot the counts the moment a gated step opens so we can tell
  // "the user just performed the action" from "the user already had
  // a previous spark/comment". Without this, a tutorial replay would
  // auto-advance every gated step the moment it opened (because the
  // count would already be >= 1).
  const [gateBaseline, setGateBaseline] = useState<{
    spark: number | null;
    comment: number | null;
  }>({ spark: null, comment: null });

  const step = STEPS[currentStep];

  // Reset baselines at every step change.
  useEffect(() => {
    setGateBaseline({
      spark: typeof mySparkCount === "number" ? mySparkCount : null,
      comment: typeof myCommentCount === "number" ? myCommentCount : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const actionSatisfied = useMemo(() => {
    if (!step?.action) return true;
    if (step.action.kind === "spark") {
      if (typeof mySparkCount !== "number") return true;
      return mySparkCount > (gateBaseline.spark ?? 0);
    }
    if (step.action.kind === "comment") {
      if (typeof myCommentCount !== "number") return true;
      return myCommentCount > (gateBaseline.comment ?? 0);
    }
    return true;
  }, [step, mySparkCount, myCommentCount, gateBaseline]);

  // Reset to initial step whenever the tour is opened.
  useEffect(() => {
    if (show) setCurrentStep(initialStep);
  }, [show, initialStep]);

  // Spotlight target tracking — clones WorldMapTour's pattern.
  useEffect(() => {
    if (!show) return;
    const updateTargetRect = () => {
      if (!step || !step.selector) {
        setTargetRect({ x: 0, y: 0, width: 0, height: 0, rx: 0, shape: "none" });
        return;
      }
      let el = document.querySelector(step.selector) as HTMLElement | null;
      if (!el && step.fallbackSelector) {
        el = document.querySelector(step.fallbackSelector) as HTMLElement | null;
      }
      if (el) {
        const rect = el.getBoundingClientRect();
        const padding = step.padding ?? 8;
        setTargetRect({
          x: rect.left - padding,
          y: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          rx: step.rx ?? 16,
          shape: step.shape ?? "rect",
        });
        document.querySelectorAll(".feed-tour-glow").forEach((n) => {
          if (n !== el) n.classList.remove("feed-tour-glow");
        });
        el.classList.add("feed-tour-glow");
      } else {
        setTargetRect({ x: 0, y: 0, width: 0, height: 0, rx: 0, shape: "none" });
      }
    };
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    const interval = window.setInterval(updateTargetRect, 250);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
      window.clearInterval(interval);
      document
        .querySelectorAll(".feed-tour-glow")
        .forEach((n) => n.classList.remove("feed-tour-glow"));
    };
  }, [currentStep, show, step]);

  // Auto-advance action steps when the action is observed (PRD edge
  // case: user already performed the action outside the tour).
  useEffect(() => {
    if (!show || !step?.action || !actionSatisfied) return;
    // Pause a beat so the user sees the reward animation before we move on.
    const t = window.setTimeout(() => handleNext(), 900);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, currentStep, actionSatisfied]);

  if (!show) return null;

  const handleNext = () => {
    // Always allow Next to progress. When a step has an action gate,
    // the auto-advance still fires the moment we see the real action.
    // But if the user wants to skip or our watcher missed it, this
    // doesn't trap them.
    if (currentStep < STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      void advance({ step: next }).catch(() => {});
    } else {
      void complete({}).catch(() => {});
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      void advance({ step: prev }).catch(() => {});
    }
  };

  const handleSkip = () => {
    void skip({}).catch(() => {});
    onClose();
  };

  const isLast = currentStep === STEPS.length - 1;
  // Visually de-emphasise (not disable) Next when an action is pending,
  // so the user is nudged to try the real action but never trapped.
  const nextPending = !!step?.action && !actionSatisfied;

  // Position the card OPPOSITE the spotlight so it never overlaps the
  // element being highlighted. If the spotlight is in the top half of
  // the viewport, pin the card to the bottom; if it's in the bottom
  // half, pin it to the top. Falls back to centered when there's no
  // spotlight target.
  const hasSpotlight = targetRect.shape !== "none";
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 0;
  const spotlightCenterY = targetRect.y + targetRect.height / 2;
  const cardSlot: "top" | "bottom" | "center" = !hasSpotlight
    ? "center"
    : spotlightCenterY < viewportH / 2
      ? "bottom"
      : "top";

  const cardAlignClass =
    cardSlot === "top"
      ? "items-start pt-4"
      : cardSlot === "bottom"
        ? "items-end pb-4"
        : "items-center";

  return (
    <AnimatePresence>
      <div
        // The root must not intercept pointer events — otherwise it
        // blocks clicks to the spotlighted element underneath
        // (post's spark / comment buttons). Children re-enable
        // pointer-events as needed (the tour card does; the SVG mask
        // explicitly disables them).
        className={`fixed inset-0 z-[10000] flex justify-center overflow-hidden pointer-events-none ${cardAlignClass}`}
      >
        {/* Spotlight glow keyframes — scoped name to avoid clash with WorldMapTour. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes feed-tour-pulse-glow {
                0%, 100% {
                  box-shadow: 0 0 15px rgba(99, 102, 241, 0.5), 0 0 25px rgba(99, 102, 241, 0.25);
                }
                50% {
                  box-shadow: 0 0 30px rgba(99, 102, 241, 0.9), 0 0 50px rgba(99, 102, 241, 0.45);
                }
              }
              .feed-tour-glow {
                animation: feed-tour-pulse-glow 1.5s infinite ease-in-out !important;
                /* Stay below the tour card (z-[10001]) but above the dim overlay. */
                z-index: 9990 !important;
                position: relative !important;
              }
            `,
          }}
        />

        {/* SVG spotlight mask */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <mask id="feed-tour-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect.shape !== "none" && (
                <motion.rect
                  animate={{
                    x: targetRect.x,
                    y: targetRect.y,
                    width: targetRect.width,
                    height: targetRect.height,
                    rx:
                      targetRect.shape === "circle"
                        ? targetRect.width / 2
                        : targetRect.rx,
                  }}
                  transition={{ type: "spring", stiffness: 140, damping: 22 }}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(5, 8, 16, 0.82)"
            mask="url(#feed-tour-spotlight-mask)"
          />
        </svg>

        {/*
         * NO click-blocker here. Action steps require the user to
         * interact with the spotlighted element (spark a post,
         * comment, etc.), so clicks must pass through the dim mask
         * to the page underneath. The SVG mask already has
         * `pointer-events-none` so it doesn't intercept.
         */}

        {/* Tour card — always above the spotlighted element (z 10001 > 9990).
         *  pointer-events: auto re-enables interaction with the card
         *  itself (root is pointer-events-none). */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          style={{ width: "min(380px, 94%)", zIndex: 10001, pointerEvents: "auto" }}
          className="relative bg-slate-900/95 border border-white/10 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-4"
        >
          {/* Close (skip) */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex gap-4 items-start">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <h2 className="text-xl font-extrabold text-white leading-tight drop-shadow-md">
                {step.title}
              </h2>
              <div className="text-[11px] font-bold text-yellow-500/80 uppercase tracking-widest mt-1">
                Step {currentStep + 1} of {STEPS.length}
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>

          <div className="bg-slate-950/50 border border-indigo-500/20 p-4 rounded-2xl flex gap-3 items-start relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <div className="text-2xl shrink-0 mt-0.5 animate-bounce select-none">✨</div>
            <div className="flex-1 text-xs text-indigo-200 leading-relaxed font-medium italic">
              {step.sparkyTip}
            </div>
          </div>

          {nextPending && (
            <p className="text-xs text-amber-300/80 -mt-2">
              Try the action above to auto-advance — or tap{" "}
              <span className="font-bold text-amber-200">Skip</span> to move on.
            </p>
          )}

          <div className="flex justify-between items-center mt-2">
            <button
              onClick={handleSkip}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex gap-2 items-center">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="h-9 px-3 rounded-xl border border-white/10 flex items-center justify-center gap-1 text-xs font-extrabold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              {nextPending && (
                <button
                  onClick={handleNext}
                  className="h-9 px-3 rounded-xl border border-white/10 flex items-center justify-center gap-1 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                className={`h-10 px-5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:brightness-110 active:scale-95 ${
                  nextPending ? "opacity-80" : ""
                }`}
              >
                {isLast ? "Start Building" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-1.5 justify-center mt-1">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "w-6 bg-yellow-400" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
