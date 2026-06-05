"use client";

// First-time-user walkthrough. Full-screen lessons that demo each
// mechanic (spark, comment, post, world map, mini-game, contribution,
// XP, league, chat) inside a sandbox. Nothing touches the DB while the
// tour is running.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Sparkles,
  MessageCircle,
  Send,
  Map as MapIcon,
  Gamepad2,
  Users,
  Flame,
  Trophy,
  MessageSquare,
  PartyPopper,
  ArrowRight,
  X as XIcon,
  Lightbulb,
  Plus,
  Award,
  Zap,
  Check,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Props shape matches the previous tutorial so FeedClient doesn't need
// to change.
interface Props {
  show: boolean;
  initialStep?: number;
  onClose: () => void;
}

type LessonId =
  | "welcome"
  | "spark"
  | "comment"
  | "post"
  | "world"
  | "minigame"
  | "contribution"
  | "xpstreak"
  | "league"
  | "chat"
  | "finale";

const LESSONS: LessonId[] = [
  "welcome",
  "spark",
  "comment",
  "post",
  "world",
  "minigame",
  "contribution",
  "xpstreak",
  "league",
  "chat",
  "finale",
];

export function FeedTutorial({ show, initialStep = 0, onClose }: Props) {
  const safeStart = Math.max(0, Math.min(initialStep, LESSONS.length - 1));
  const [index, setIndex] = useState(safeStart);
  const [unlocked, setUnlocked] = useState(false);

  const advance = useMutation(api.tutorial.advanceFeedTutorial);
  const complete = useMutation(api.tutorial.completeFeedTutorial);
  const skip = useMutation(api.tutorial.skipFeedTutorial);

  useEffect(() => {
    if (show) setIndex(safeStart);
  }, [show, safeStart]);

  useEffect(() => {
    setUnlocked(false);
  }, [index]);

  // Stable reference so lesson effects with [onUnlock] in their deps don't
  // re-run on every parent re-render. Re-runs would cause time-based
  // lessons (chat scripts, world walker, league climb) to replay from
  // scratch and push duplicate items into their internal state.
  const handleUnlock = useCallback(() => setUnlocked(true), []);

  if (!show) return null;

  const current = LESSONS[index];
  const isLast = current === "finale";

  const goNext = () => {
    if (isLast) {
      void complete({}).catch(() => {});
      onClose();
      return;
    }
    const next = index + 1;
    setIndex(next);
    void advance({ step: next }).catch(() => {});
  };

  const goSkip = () => {
    void skip({}).catch(() => {});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#05080F] text-[#F9FAFB]">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-white/5 bg-[#070B16] px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={goSkip}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/5 hover:text-white"
          aria-label="Skip tutorial"
        >
          <XIcon className="h-5 w-5" />
        </button>
        <ProgressBar current={index} total={LESSONS.length} />
        <span className="hidden text-xs font-medium text-white/40 sm:inline">
          {index + 1} / {LESSONS.length}
        </span>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto flex min-h-full w-full max-w-[640px] flex-col items-stretch px-4 py-6 sm:px-6 sm:py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-1 flex-col"
            >
              {current === "welcome" && <WelcomeLesson onUnlock={handleUnlock} />}
              {current === "spark" && <SparkLesson onUnlock={handleUnlock} />}
              {current === "comment" && (
                <CommentLesson onUnlock={handleUnlock} />
              )}
              {current === "post" && <PostLesson onUnlock={handleUnlock} />}
              {current === "world" && <WorldLesson onUnlock={handleUnlock} />}
              {current === "minigame" && (
                <MiniGameLesson onUnlock={handleUnlock} />
              )}
              {current === "contribution" && (
                <ContributionLesson onUnlock={handleUnlock} />
              )}
              {current === "xpstreak" && (
                <XpStreakLesson onUnlock={handleUnlock} />
              )}
              {current === "league" && <LeagueLesson onUnlock={handleUnlock} />}
              {current === "chat" && <ChatLesson onUnlock={handleUnlock} />}
              {current === "finale" && <FinaleLesson onUnlock={handleUnlock} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#070B16] px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex w-full max-w-[640px] items-center justify-between gap-3">
          <button
            type="button"
            onClick={goSkip}
            className="text-xs font-medium text-white/40 transition hover:text-white/70"
          >
            Skip tour
          </button>
          <Button
            type="button"
            onClick={goNext}
            disabled={!unlocked}
            className={`h-12 min-w-[160px] gap-2 rounded-2xl text-sm font-semibold uppercase tracking-wide shadow-lg transition ${
              unlocked
                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-[#0A0E1A] hover:brightness-110"
                : "bg-white/5 text-white/30"
            }`}
          >
            {isLast ? "Start Building" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}

// Shared primitives

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

function LessonHeader({
  eyebrow,
  title,
  body,
  icon,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 ring-1 ring-amber-400/30">
        {icon}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-[440px] text-sm text-white/60 sm:text-base">
        {body}
      </p>
    </div>
  );
}

function ConfettiBurst({ trigger }: { trigger: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        tx: (Math.random() - 0.5) * 360,
        ty: -Math.random() * 240 - 60,
        rot: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.08,
        color: ["#FBBF24", "#F472B6", "#34D399", "#60A5FA", "#C084FC"][i % 5],
      })),
    // Re-randomise every time trigger increments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger],
  );
  if (trigger === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {particles.map((p) => (
        <motion.span
          key={`${trigger}-${p.id}`}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.tx, y: p.ty, opacity: 0, rotate: p.rot }}
          transition={{
            duration: 1.1,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="absolute left-1/2 top-1/2 h-3 w-2 rounded-sm"
          style={{ background: p.color }}
        />
      ))}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center justify-center gap-2 text-xs font-medium text-amber-300/90"
    >
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
      {children}
    </motion.div>
  );
}

// Mock idea card reused across the Spark + Comment lessons.
function MockIdeaCard({
  sparked,
  sparkCount,
  onSpark,
  highlightSpark,
  highlightComment,
  onComment,
  comments,
}: {
  sparked: boolean;
  sparkCount: number;
  onSpark?: () => void;
  highlightSpark?: boolean;
  highlightComment?: boolean;
  onComment?: () => void;
  comments: { id: string; author: string; text: string }[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0A0E1A] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
      {/* Author row */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-bold text-white">
          NA
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Nikita Aggarwal</p>
          <p className="text-[11px] text-white/40">@nikitaa · 2h ago</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-400/30">
          Public
        </span>
      </div>

      {/* Title + body */}
      <h3 className="text-base font-bold leading-snug sm:text-lg">
        Solar-powered backpack for trekkers
      </h3>
      <p className="mt-1 text-sm text-white/70">
        Lightweight backpack with a flexible solar panel that charges your phone
        + GPS on long treks. Looking for hardware folks to prototype.
      </p>

      {/* Faux attachment */}
      <div className="mt-3 flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 ring-1 ring-amber-400/20">
        <Lightbulb className="h-8 w-8 text-amber-300/70" />
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Hardware", "Sustainability", "Outdoor"].map((t) => (
          <span
            key={t}
            className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
          >
            #{t}
          </span>
        ))}
      </div>

      {/* Action row */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <button
          type="button"
          onClick={onSpark}
          className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
            highlightSpark
              ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0A0E1A]"
              : ""
          } ${sparked ? "bg-amber-500/15 text-amber-300" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
          aria-label="Spark this idea"
        >
          <motion.span
            key={`s-${sparked}`}
            initial={sparked ? { scale: 1.4, rotate: -10 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 12 }}
          >
            <Sparkles className="h-4 w-4" />
          </motion.span>
          <span className="text-xs font-semibold">{sparkCount}</span>
          {highlightSpark && !sparked && (
            <span className="absolute -right-2 -top-2 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onComment}
          className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white/60 transition hover:bg-white/5 hover:text-white ${
            highlightComment
              ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0A0E1A]"
              : ""
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs font-semibold">
            {3 + comments.length}
          </span>
          {highlightComment && comments.length === 0 && (
            <span className="absolute -right-2 -top-2 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-400" />
            </span>
          )}
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <Send className="h-4 w-4" />
          <span className="text-xs font-semibold">Share</span>
        </button>
      </div>

      {/* Comment list */}
      <AnimatePresence>
        {comments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 border-t border-white/5 pt-3"
          >
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-pink-500 text-[10px] font-bold">
                  You
                </div>
                <div className="flex-1 rounded-xl bg-white/5 px-3 py-1.5">
                  <p className="text-[11px] font-semibold text-white/80">
                    {c.author}
                  </p>
                  <p className="text-xs text-white/70">{c.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Lesson 1: Welcome

function WelcomeLesson({ onUnlock }: { onUnlock: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onUnlock, 900);
    return () => window.clearTimeout(t);
  }, [onUnlock]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="relative mb-6"
      >
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 shadow-[0_20px_60px_rgba(251,191,36,0.25)]">
          <Sparkles className="h-14 w-14 text-white" />
        </div>
        <motion.div
          className="absolute -inset-3 rounded-3xl border border-amber-300/30"
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
      </motion.div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
        Welcome, builder
      </p>
      <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
        Let&apos;s walk through Ibhaveda
      </h1>
      <p className="mx-auto mt-3 max-w-[420px] text-sm text-white/60 sm:text-base">
        Eleven short lessons. You&apos;ll Spark, Comment, post an idea, walk a
        venture world map, play a mini-game, and more — all hands-on. Takes
        about three minutes.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Pill icon={<Sparkles className="h-3.5 w-3.5" />}>Spark</Pill>
        <Pill icon={<MessageCircle className="h-3.5 w-3.5" />}>Comment</Pill>
        <Pill icon={<Send className="h-3.5 w-3.5" />}>Post</Pill>
        <Pill icon={<MapIcon className="h-3.5 w-3.5" />}>World map</Pill>
        <Pill icon={<Gamepad2 className="h-3.5 w-3.5" />}>Mini-game</Pill>
        <Pill icon={<Users className="h-3.5 w-3.5" />}>Contribute</Pill>
        <Pill icon={<Flame className="h-3.5 w-3.5" />}>Streak</Pill>
        <Pill icon={<Trophy className="h-3.5 w-3.5" />}>League</Pill>
        <Pill icon={<MessageSquare className="h-3.5 w-3.5" />}>Channels</Pill>
      </div>
    </div>
  );
}

function Pill({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
      {icon}
      {children}
    </span>
  );
}

// Lesson 2: Spark

function SparkLesson({ onUnlock }: { onUnlock: () => void }) {
  const [sparked, setSparked] = useState(false);
  const [count, setCount] = useState(247);
  const [confetti, setConfetti] = useState(0);

  const handleSpark = () => {
    if (sparked) return;
    setSparked(true);
    setCount((c) => c + 1);
    setConfetti((n) => n + 1);
    window.setTimeout(onUnlock, 500);
  };

  return (
    <div>
      <LessonHeader
        eyebrow="Lesson 1"
        title="Give a Spark"
        body="A Spark tells a builder you back them. It boosts the idea's visibility on the feed. Tap the lightning bolt below to spark this idea."
        icon={<Sparkles className="h-8 w-8 text-amber-300" />}
      />
      <div className="relative">
        <ConfettiBurst trigger={confetti} />
        <MockIdeaCard
          sparked={sparked}
          sparkCount={count}
          onSpark={handleSpark}
          highlightSpark={!sparked}
          comments={[]}
        />
      </div>
      <div className="mt-5">
        {sparked ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30"
          >
            <Check className="h-4 w-4" />
            Nice — Nikita just got a notification. +5 XP earned.
          </motion.div>
        ) : (
          <Hint>Tap the ⚡ Spark on the card above</Hint>
        )}
      </div>
    </div>
  );
}

// Lesson 3: Comment

const COMMENT_CHIPS = [
  "Love this! How can I help?",
  "What stage are you at?",
  "Have you tested with real users yet?",
];

function CommentLesson({ onUnlock }: { onUnlock: () => void }) {
  const [showChips, setShowChips] = useState(false);
  const [comments, setComments] = useState<
    { id: string; author: string; text: string }[]
  >([]);

  const handleChip = (text: string) => {
    setComments([{ id: "you", author: "You", text }]);
    window.setTimeout(onUnlock, 500);
  };

  return (
    <div>
      <LessonHeader
        eyebrow="Lesson 2"
        title="Drop a Comment"
        body="Comments move ideas forward — feedback, offers, questions. Tap the 💬 icon, then pick a quick reply."
        icon={<MessageCircle className="h-8 w-8 text-blue-300" />}
      />
      <MockIdeaCard
        sparked
        sparkCount={248}
        comments={comments}
        onComment={() => setShowChips(true)}
        highlightComment={!showChips}
      />

      <AnimatePresence>
        {showChips && comments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 rounded-2xl border border-white/10 bg-[#0A0E1A] p-4"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">
              Pick a quick reply
            </p>
            <div className="space-y-2">
              {COMMENT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChip(chip)}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 text-left text-sm transition hover:bg-white/10 hover:ring-1 hover:ring-blue-400/50"
                >
                  {chip}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5">
        {comments.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30"
          >
            <Check className="h-4 w-4" />
            Comment posted. +8 XP — and Nikita just pinged back.
          </motion.div>
        ) : showChips ? (
          <Hint>Pick a quick reply</Hint>
        ) : (
          <Hint>Tap the 💬 Comment on the card above</Hint>
        )}
      </div>
    </div>
  );
}

// Lesson 4: Post your own

const SAMPLE_TITLE = "AI-powered study planner for engineering students";
const SAMPLE_BODY =
  "An adaptive planner that learns from how you study, predicts which topics will appear in the exam, and builds a daily schedule. Looking for a backend engineer + ML buddy.";

function PostLesson({ onUnlock }: { onUnlock: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posted, setPosted] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [typing, setTyping] = useState(false);

  const fillSample = () => {
    if (typing) return;
    setTyping(true);
    typeOut(SAMPLE_TITLE, setTitle, 28, () => {
      typeOut(SAMPLE_BODY, setBody, 14, () => setTyping(false));
    });
  };

  const handlePost = () => {
    if (!title.trim() || !body.trim() || posted) return;
    setPosted(true);
    setConfetti((n) => n + 1);
    window.setTimeout(onUnlock, 700);
  };

  return (
    <div>
      <LessonHeader
        eyebrow="Lesson 3"
        title="Post your first idea"
        body="The compose button on the header opens this. Fill in a title + description, pick a template, and ship it. We'll auto-tag the rest."
        icon={<Plus className="h-8 w-8 text-emerald-300" />}
      />
      <div className="relative">
        <ConfettiBurst trigger={confetti} />
        <div className="rounded-2xl border border-white/10 bg-[#0A0E1A] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              New idea
            </p>
            <button
              type="button"
              onClick={fillSample}
              disabled={typing || posted}
              className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/30 transition hover:brightness-110 disabled:opacity-40"
            >
              Use sample
            </button>
          </div>

          <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={typing || posted}
            placeholder="What's the idea?"
            className="mt-1 w-full rounded-xl bg-white/5 px-4 py-3 text-sm outline-none ring-1 ring-white/5 transition focus:ring-amber-400/50 disabled:opacity-60"
          />

          <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Description
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={typing || posted}
            placeholder="What's the problem you're solving?"
            rows={4}
            className="mt-1 w-full resize-none rounded-xl bg-white/5 px-4 py-3 text-sm outline-none ring-1 ring-white/5 transition focus:ring-amber-400/50 disabled:opacity-60"
          />

          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300 ring-1 ring-purple-400/30">
                Venture
              </span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                Public
              </span>
            </div>
            <button
              type="button"
              onClick={handlePost}
              disabled={!title.trim() || !body.trim() || posted}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                posted
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                  : title.trim() && body.trim()
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-[#0A0E1A] hover:brightness-110"
                    : "bg-white/5 text-white/30"
              }`}
            >
              {posted ? (
                <>
                  <Check className="h-4 w-4" /> Posted
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Post
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {posted ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30"
          >
            <Check className="h-4 w-4" />
            Live on the feed. +15 XP — and your venture world map just opened.
          </motion.div>
        ) : (
          <Hint>
            Tap <span className="font-semibold">Use sample</span> to fill it
            in, then hit Post
          </Hint>
        )}
      </div>
    </div>
  );
}

function typeOut(
  text: string,
  setter: (s: string) => void,
  speed: number,
  done?: () => void,
) {
  let i = 0;
  const tick = () => {
    i += 1;
    setter(text.slice(0, i));
    if (i < text.length) {
      window.setTimeout(tick, speed);
    } else {
      done?.();
    }
  };
  tick();
}

// Lesson 5: World transition

const WORLD_STAGES = [
  { name: "Village", color: "#34D399", x: 12 },
  { name: "Forest", color: "#22C55E", x: 32 },
  { name: "Arena", color: "#C084FC", x: 52 },
  { name: "Quarter", color: "#FBBF24", x: 72 },
  { name: "Harbour", color: "#60A5FA", x: 92 },
];

function WorldLesson({ onUnlock }: { onUnlock: () => void }) {
  const [walkerX, setWalkerX] = useState(WORLD_STAGES[0].x);
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    const timers: number[] = [];
    WORLD_STAGES.forEach((s, i) => {
      timers.push(
        window.setTimeout(() => {
          setWalkerX(s.x);
          setStageIdx(i);
        }, i * 700 + 400),
      );
    });
    timers.push(window.setTimeout(onUnlock, WORLD_STAGES.length * 700 + 600));
    return () => timers.forEach(window.clearTimeout);
  }, [onUnlock]);

  return (
    <div>
      <LessonHeader
        eyebrow="Lesson 4"
        title="Every idea becomes a world"
        body="When you post a public idea, Ibhaveda turns it into a venture with its own world map — five biomes, each a stage of the journey from Ideation to Scale."
        icon={<MapIcon className="h-8 w-8 text-violet-300" />}
      />

      <div className="relative h-[260px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0A0E1A] via-[#0F1525] to-[#1A0F2D] shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        {/* Stars */}
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-0.5 w-0.5 rounded-full bg-white/40"
            style={{
              top: `${Math.random() * 50}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.2,
            }}
          />
        ))}

        {/* Path */}
        <svg
          className="absolute inset-x-0 bottom-12 h-24 w-full"
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
        >
          <path
            d="M 5 20 Q 25 5, 50 15 T 95 12"
            stroke="rgba(251,191,36,0.4)"
            strokeWidth="0.6"
            strokeDasharray="2 1.5"
            fill="none"
          />
        </svg>

        {/* Stage nodes */}
        {WORLD_STAGES.map((s, i) => (
          <div
            key={s.name}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${s.x}%`, bottom: "30%" }}
          >
            <motion.div
              animate={{
                scale: stageIdx >= i ? [1, 1.25, 1] : 1,
                opacity: stageIdx >= i ? 1 : 0.4,
              }}
              transition={{ duration: 0.4 }}
              className="relative flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white/10"
              style={{ background: stageIdx >= i ? s.color : "#1A2030" }}
            >
              {stageIdx > i && <Check className="h-4 w-4 text-white" />}
            </motion.div>
            <p className="mt-1 text-center text-[9px] font-semibold uppercase tracking-wider text-white/50">
              {s.name}
            </p>
          </div>
        ))}

        {/* Walker */}
        <motion.div
          className="absolute -translate-x-1/2"
          animate={{ left: `${walkerX}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ bottom: "37%" }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]">
            <span className="text-xs">🧙</span>
          </div>
        </motion.div>

        {/* Ground */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#1A1F2E] to-transparent" />
      </div>

      <p className="mt-4 text-center text-sm text-white/60">
        Clear checkpoints in each biome to advance. Each cleared stage unlocks
        new perks and badges.
      </p>
    </div>
  );
}

// Lesson 6: Mini-game (5x5 Reflex Tap simulation)

const GAME_DURATION_MS = 15000;
const GAME_GRID = 5;
const TARGET_LIFETIME_MS = 1200;
const SPAWN_INTERVAL_MS = 720;

function MiniGameLesson({ onUnlock }: { onUnlock: () => void }) {
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS);
  const [targets, setTargets] = useState<
    Map<string, { kind: "normal" | "golden"; spawnedAt: number }>
  >(new Map());

  const tickRef = useRef<number | null>(null);
  const spawnRef = useRef<number | null>(null);
  const startedAt = useRef<number>(0);

  const start = () => {
    setPhase("playing");
    setScore(0);
    setTimeLeft(GAME_DURATION_MS);
    setTargets(new Map());
    startedAt.current = performance.now();
  };

  useEffect(() => {
    if (phase !== "playing") return;
    // Master tick (drives time + lifetime cleanup).
    tickRef.current = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - startedAt.current;
      const left = Math.max(0, GAME_DURATION_MS - elapsed);
      setTimeLeft(left);
      setTargets((prev) => {
        const next = new Map(prev);
        for (const [k, v] of next) {
          if (now - v.spawnedAt > TARGET_LIFETIME_MS) next.delete(k);
        }
        return next;
      });
      if (left <= 0) {
        if (tickRef.current) window.clearInterval(tickRef.current);
        if (spawnRef.current) window.clearInterval(spawnRef.current);
        setPhase("done");
        window.setTimeout(onUnlock, 400);
      }
    }, 60);

    // Spawner.
    spawnRef.current = window.setInterval(() => {
      setTargets((prev) => {
        if (prev.size >= 5) return prev;
        const cells: string[] = [];
        for (let r = 0; r < GAME_GRID; r += 1) {
          for (let c = 0; c < GAME_GRID; c += 1) {
            const key = `${r}-${c}`;
            if (!prev.has(key)) cells.push(key);
          }
        }
        if (cells.length === 0) return prev;
        const key = cells[Math.floor(Math.random() * cells.length)];
        const isGold = Math.random() < 0.15;
        const next = new Map(prev);
        next.set(key, {
          kind: isGold ? "golden" : "normal",
          spawnedAt: performance.now(),
        });
        return next;
      });
    }, SPAWN_INTERVAL_MS);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      if (spawnRef.current) window.clearInterval(spawnRef.current);
    };
  }, [phase, onUnlock]);

  const tap = (key: string) => {
    const t = targets.get(key);
    if (!t) return;
    setScore((s) => s + (t.kind === "golden" ? 50 : 10));
    setTargets((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  };

  return (
    <div>
      <LessonHeader
        eyebrow="Lesson 5"
        title="Mini-games on the map"
        body="Every venture world has surprise mini-games tucked into checkpoints. Reflex Tap rewards quick reactions — tap the orbs before they fade. Gold ones are worth 5x."
        icon={<Gamepad2 className="h-8 w-8 text-pink-300" />}
      />

      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0A0E1A] to-[#0E1428] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        <div className="mb-3 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            <span>{score}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
            <span className="text-white/50">Time</span>
            <span>{(timeLeft / 1000).toFixed(1)}s</span>
          </div>
        </div>

        <div
          className="grid w-full gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${GAME_GRID}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: GAME_GRID * GAME_GRID }).map((_, i) => {
            const r = Math.floor(i / GAME_GRID);
            const c = i % GAME_GRID;
            const key = `${r}-${c}`;
            const t = targets.get(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => tap(key)}
                disabled={phase !== "playing"}
                className="relative aspect-square rounded-lg bg-white/[0.03] ring-1 ring-white/5"
              >
                <AnimatePresence>
                  {t && (
                    <motion.span
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 320, damping: 16 }}
                      className={`absolute inset-1 rounded-full ${
                        t.kind === "golden"
                          ? "bg-gradient-to-br from-yellow-300 to-amber-500 shadow-[0_0_18px_rgba(251,191,36,0.7)]"
                          : "bg-gradient-to-br from-pink-400 to-fuchsia-500 shadow-[0_0_18px_rgba(244,114,182,0.6)]"
                      }`}
                    />
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center">
          {phase === "ready" && (
            <Button
              type="button"
              onClick={start}
              className="h-11 gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-5 text-sm font-bold"
            >
              <Gamepad2 className="h-4 w-4" />
              Start 15-second drill
            </Button>
          )}
          {phase === "playing" && (
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Tap orbs as fast as you can
            </p>
          )}
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30"
            >
              <Check className="mr-1 inline h-4 w-4" />
              Score {score} · +25 XP
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// Lesson 7: Contribution

function ContributionLesson({ onUnlock }: { onUnlock: () => void }) {
  const [decided, setDecided] = useState<null | "accepted" | "declined">(null);
  const [confetti, setConfetti] = useState(0);

  const accept = () => {
    setDecided("accepted");
    setConfetti((n) => n + 1);
    window.setTimeout(onUnlock, 600);
  };

  return (
    <div>
      <LessonHeader
        eyebrow="Lesson 6"
        title="Build with others"
        body="Anyone can request to contribute to your venture. When you accept, they join your project channel and can submit checkpoint work alongside you."
        icon={<Users className="h-8 w-8 text-cyan-300" />}
      />

      <div className="relative">
        <ConfettiBurst trigger={confetti} />
        <div className="rounded-2xl border border-white/10 bg-[#0A0E1A] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-base font-bold">
              AR
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Aryan Awasthi</p>
              <p className="text-[11px] text-white/40">@aryan · ML engineer</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["Python", "PyTorch", "Recommender systems"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-white/70">
                &ldquo;Hey! Loved your study planner idea. I&apos;ve built two
                recommender models before — happy to own the ML side. Available
                ~10 hrs/week.&rdquo;
              </p>
            </div>
          </div>

          {!decided && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDecided("declined")}
                className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/10"
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={accept}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-4 py-3 text-sm font-bold text-[#0A0E1A] transition hover:brightness-110"
              >
                Accept
              </button>
            </div>
          )}

          {decided === "accepted" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30"
            >
              <Check className="h-4 w-4" />
              Aryan joined your project. Channel #study-planner unlocked.
            </motion.div>
          )}

          {decided === "declined" && (
            <div className="mt-4 text-center text-xs text-white/50">
              No worries — try Accept to see what happens.
              <button
                type="button"
                onClick={() => setDecided(null)}
                className="ml-2 text-amber-300 underline"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {!decided && (
        <div className="mt-5">
          <Hint>Tap Accept to bring Aryan onto your project</Hint>
        </div>
      )}
    </div>
  );
}

// Lesson 8: XP + Streak

function XpStreakLesson({ onUnlock }: { onUnlock: () => void }) {
  const [xp, setXp] = useState(220);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setXp(320), 600);
    const t2 = window.setTimeout(() => setStreak(1), 1100);
    const t3 = window.setTimeout(() => setStreak(2), 1500);
    const t4 = window.setTimeout(() => setStreak(5), 1900);
    const t5 = window.setTimeout(() => setStreak(12), 2400);
    const t6 = window.setTimeout(onUnlock, 3100);
    return () => [t1, t2, t3, t4, t5, t6].forEach(window.clearTimeout);
  }, [onUnlock]);

  const xpPct = Math.min(100, ((xp - 200) / 200) * 100);

  return (
    <div>
      <LessonHeader
        eyebrow="Lesson 7"
        title="XP & Streaks"
        body="Every spark, comment, contribution, and checkpoint earns XP. Show up four qualifying actions in a day and your streak grows. Streaks unlock bonus XP and badges."
        icon={<Flame className="h-8 w-8 text-orange-400" />}
      />

      {/* XP card */}
      <div className="rounded-2xl border border-white/10 bg-[#0A0E1A] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-base font-bold text-[#0A0E1A]">
            L4
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Level 4 · Apprentice</span>
              <motion.span
                key={xp}
                initial={{ scale: 1.3, color: "#FBBF24" }}
                animate={{ scale: 1, color: "#FFFFFF" }}
                className="font-bold"
              >
                {xp} XP
              </motion.span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                initial={false}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="mt-1 text-[10px] text-white/40">
              {400 - xp} XP to Level 5
            </p>
          </div>
        </div>
      </div>

      {/* Streak card */}
      <div className="mt-4 rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5 p-5">
        <div className="flex items-center gap-4">
          <motion.div
            animate={
              streak > 0 ? { scale: [1, 1.2, 1], rotate: [0, -6, 6, 0] } : {}
            }
            transition={{ duration: 0.5 }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_30px_rgba(249,115,22,0.6)]"
          >
            <Flame className="h-10 w-10 text-white" />
            {streak > 0 && (
              <motion.span
                className="absolute -inset-2 rounded-full border-2 border-orange-400/40"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}
          </motion.div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300">
              Current streak
            </p>
            <motion.p
              key={streak}
              initial={{ scale: 1.3, y: -4, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="mt-1 text-3xl font-bold text-white sm:text-4xl"
            >
              {streak} {streak === 1 ? "day" : "days"}
            </motion.p>
            <p className="mt-1 text-xs text-white/50">
              4 qualifying actions per day keeps it alive
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Lesson 9: League / Leaderboard

const LEAGUE_ROWS = [
  { name: "Aanya", xp: 1240, you: false },
  { name: "Dev", xp: 1180, you: false },
  { name: "Ishaan", xp: 980, you: false },
  { name: "Riya", xp: 870, you: false },
  { name: "Karan", xp: 820, you: false },
  { name: "You", xp: 760, you: true },
  { name: "Meera", xp: 710, you: false },
  { name: "Vikram", xp: 660, you: false },
];

function LeagueLesson({ onUnlock }: { onUnlock: () => void }) {
  // Sort drives the row order, so only the user's XP needs to animate.
  const [yourXp, setYourXp] = useState(LEAGUE_ROWS.find((r) => r.you)?.xp ?? 760);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setYourXp(880), 700),
      window.setTimeout(() => setYourXp(960), 1300),
      window.setTimeout(() => setYourXp(1080), 1900),
      window.setTimeout(onUnlock, 2600),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [onUnlock]);

  const rows = useMemo(() => {
    const others = LEAGUE_ROWS.filter((r) => !r.you);
    return [...others, { name: "You", xp: yourXp, you: true }].sort(
      (a, b) => b.xp - a.xp,
    );
  }, [yourXp]);

  return (
    <div>
      <LessonHeader
        eyebrow="Lesson 8"
        title="Climb the league"
        body="Every week, the top builders in your league earn promotion. Earn XP, climb the ladder, and unlock new league perks. Resets every Monday."
        icon={<Trophy className="h-8 w-8 text-yellow-300" />}
      />

      <div className="rounded-2xl border border-white/10 bg-[#0A0E1A] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        <div className="mb-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wide text-amber-300">
            <Trophy className="h-3.5 w-3.5" />
            Sapphire League · Week 24
          </div>
          <span className="text-white/40">8 builders</span>
        </div>
        <div className="space-y-1.5">
          {rows.map((r, idx) => (
            <motion.div
              key={r.name}
              layout
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                r.you
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 ring-1 ring-amber-400/40"
                  : "bg-white/[0.03]"
              }`}
            >
              <span
                className={`w-6 text-center text-sm font-bold ${
                  idx < 3 ? "text-amber-300" : "text-white/40"
                }`}
              >
                {idx + 1}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  r.you
                    ? "bg-gradient-to-br from-amber-400 to-pink-500"
                    : "bg-white/10 text-white/70"
                }`}
              >
                {r.name.slice(0, 1)}
              </div>
              <span
                className={`flex-1 text-sm font-semibold ${
                  r.you ? "text-amber-200" : "text-white/80"
                }`}
              >
                {r.name}
              </span>
              <span className="text-xs font-semibold text-white/60">
                {r.xp} XP
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Lesson 10: Chat / Channels

interface ChatMsg {
  id: string;
  author: string;
  initials: string;
  text: string;
  self?: boolean;
  emoji?: boolean;
}

const CHAT_SCRIPT: ChatMsg[] = [
  {
    id: "m1",
    author: "Aryan",
    initials: "AR",
    text: "Hey! Welcome to the team — pushed the first model spec to /docs.",
  },
  {
    id: "m2",
    author: "You",
    initials: "YO",
    text: "Reviewing now. Let’s ship the v0 by Friday?",
    self: true,
  },
  {
    id: "m3",
    author: "Aryan",
    initials: "AR",
    text: "Locked in. 🚀",
  },
  {
    id: "m4",
    author: "Nikita",
    initials: "NA",
    text: "Welcome to Ibhaveda — you’re ready to ship!",
    emoji: true,
  },
];

function ChatLesson({ onUnlock }: { onUnlock: () => void }) {
  const [visible, setVisible] = useState<ChatMsg[]>([]);
  const [typingFrom, setTypingFrom] = useState<string | null>(null);

  useEffect(() => {
    // Always start from an empty list so a re-mount (StrictMode dev or
    // hot reload) doesn't push the same message id twice.
    setVisible([]);
    setTypingFrom(null);

    let i = 0;
    let cancelled = false;
    const step = () => {
      if (cancelled) return;
      if (i >= CHAT_SCRIPT.length) {
        setTypingFrom(null);
        window.setTimeout(onUnlock, 400);
        return;
      }
      const msg = CHAT_SCRIPT[i];
      setTypingFrom(msg.self ? null : msg.author);
      window.setTimeout(() => {
        if (cancelled) return;
        setTypingFrom(null);
        setVisible((prev) =>
          prev.some((p) => p.id === msg.id) ? prev : [...prev, msg],
        );
        i += 1;
        window.setTimeout(step, 700);
      }, 700);
    };
    step();
    return () => {
      cancelled = true;
    };
  }, [onUnlock]);

  return (
    <div>
      <LessonHeader
        eyebrow="Lesson 9"
        title="Project channels"
        body="Each venture gets its own private channel. Contributors join automatically — share files, ask questions, ship updates."
        icon={<MessageSquare className="h-8 w-8 text-blue-300" />}
      />

      <div className="rounded-2xl border border-white/10 bg-[#0A0E1A] shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <Hash className="h-4 w-4 text-white/40" />
          <span className="text-sm font-semibold">study-planner</span>
          <span className="ml-auto text-[11px] text-white/40">
            3 contributors
          </span>
        </div>
        <div className="space-y-3 px-4 py-4">
          <AnimatePresence>
            {visible.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-2 ${m.self ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    m.self
                      ? "bg-gradient-to-br from-amber-400 to-pink-500"
                      : "bg-gradient-to-br from-cyan-400 to-blue-600"
                  }`}
                >
                  {m.initials}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.self
                      ? "bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/30"
                      : "bg-white/5 text-white/80"
                  } ${m.emoji ? "font-semibold" : ""}`}
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {typingFrom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-[11px] text-white/40"
            >
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:240ms]" />
              </span>
              {typingFrom} is typing…
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// Lesson 11: Finale

function FinaleLesson({ onUnlock }: { onUnlock: () => void }) {
  const [confetti, setConfetti] = useState(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setConfetti((n) => n + 1), 200);
    const t2 = window.setTimeout(() => setConfetti((n) => n + 1), 1200);
    const t3 = window.setTimeout(onUnlock, 400);
    return () => [t1, t2, t3].forEach(window.clearTimeout);
  }, [onUnlock]);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center text-center">
      <ConfettiBurst trigger={confetti} />
      <motion.div
        initial={{ scale: 0.4, rotate: -10, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 shadow-[0_20px_60px_rgba(251,191,36,0.4)]"
      >
        <PartyPopper className="h-16 w-16 text-white" />
        <motion.span
          className="absolute -inset-3 rounded-full border-2 border-amber-400/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </motion.div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
        You&apos;re ready
      </p>
      <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
        Time to build something real
      </h1>
      <p className="mx-auto mt-3 max-w-[440px] text-sm text-white/60 sm:text-base">
        You earned <span className="font-semibold text-amber-300">+85 XP</span>{" "}
        in the tutorial. Post your first idea, accept your first contributor,
        and let Ibhaveda turn it into a venture.
      </p>
      <div className="mt-6 grid w-full max-w-[420px] gap-2 sm:grid-cols-3">
        <Stat icon={<Sparkles className="h-4 w-4" />} label="XP earned" value="85" />
        <Stat icon={<Award className="h-4 w-4" />} label="Badge" value="Initiate" />
        <Stat icon={<Flame className="h-4 w-4" />} label="Streak" value="Day 1" />
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
        {icon}
      </div>
      <p className="text-base font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-white/50">{label}</p>
    </div>
  );
}
