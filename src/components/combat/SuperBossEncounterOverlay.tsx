"use client";

/**
 * @file SuperBossEncounterOverlay.tsx
 * @description Super-boss combat encounter for stages 2-4.
 *  Multi-phase HP loop against the stage-final super boss (Forest
 *  Colossus / Leviathan / Forge Dragon). Each boss has 3 thematic
 *  questions defined in stage-bosses.ts. Answering each question drops
 *  the boss HP by 1/3. On third answer, defeat animation fires and
 *  parent's onStrike is called (which triggers scene.defeatSuperBoss →
 *  STAGE_COMPLETE).
 *
 *  Design notes:
 *   - z-[10024] — above map, below venture finale
 *   - Uses acquireBodyScrollLock for nesting safety
 *   - Questions are meaningful founder prompts disguised as combat
 *   - Free-form text input with min-length gate (thematic bosses have
 *     different minimums — set in question config)
 *   - Boss image + HP bar always visible; questions appear one at a time
 *   - "The boss reels" animation between questions (screen shake + hp drop)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Crown, Send } from "lucide-react";
import { acquireBodyScrollLock } from "@/lib/ui/bodyScrollLock";
import type { StageBoss, SuperBossQuestion } from "@/config/stage-bosses";

const ARENA_BG = "/assets/maps-v2/arena/arena-background.png";

export interface SuperBossEncounterOverlayProps {
  open: boolean;
  stage: number;
  boss: StageBoss | null;
  /** Called when the fight is won (last question answered). */
  onStrike: () => void;
  /** Called if player dismisses without completing (Esc). */
  onDismiss?: () => void;
}

// Fallback questions for bosses without their own question bank.
const FALLBACK_QUESTIONS: readonly SuperBossQuestion[] = [
  {
    framing: "The boss circles",
    prompt: "State your resolve — one sentence on why you keep going.",
    minLength: 15,
  },
  {
    framing: "It presses",
    prompt: "Name the fear that's been slowing you down.",
    minLength: 15,
  },
  {
    framing: "Final breath",
    prompt: "Commit to one action you'll take this week.",
    minLength: 15,
  },
];

export default function SuperBossEncounterOverlay({
  open,
  stage,
  boss,
  onStrike,
  onDismiss,
}: SuperBossEncounterOverlayProps) {
  const questions = useMemo(
    () => boss?.questions ?? FALLBACK_QUESTIONS,
    [boss?.questions],
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bossReeling, setBossReeling] = useState(false);
  const [finalDefeat, setFinalDefeat] = useState(false);

  // Reset state whenever the overlay opens fresh
  useEffect(() => {
    if (open) {
      setCurrentQ(0);
      setAnswer("");
      setSubmitting(false);
      setBossReeling(false);
      setFinalDefeat(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const release = acquireBodyScrollLock();
    return release;
  }, [open]);

  const active = questions[currentQ];
  const minLen = active?.minLength ?? 15;
  const canSubmit = !submitting && answer.trim().length >= minLen && !bossReeling;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    setSubmitting(true);
    setBossReeling(true);
    // Beat: boss reels (~700ms), HP drops, next question appears
    window.setTimeout(() => {
      const nextQ = currentQ + 1;
      if (nextQ >= questions.length) {
        // All questions answered — final defeat beat
        setFinalDefeat(true);
        window.setTimeout(() => {
          onStrike();
        }, 1400);
        return;
      }
      setCurrentQ(nextQ);
      setAnswer("");
      setBossReeling(false);
      setSubmitting(false);
    }, 720);
  }, [canSubmit, currentQ, questions.length, onStrike]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onDismiss) {
        onDismiss();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, canSubmit, handleSubmit, onDismiss]);

  // HP percentage — full at start, drops with each answered question
  const hpPct = Math.max(0, 1 - currentQ / questions.length);
  const hpDisplayPct = bossReeling
    ? Math.max(0, 1 - (currentQ + 1) / questions.length)
    : hpPct;

  return (
    <AnimatePresence>
      {open && boss && (
        <motion.div
          key={`super-boss-${stage}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="fixed inset-0 z-[10024] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="super-boss-title"
          style={{
            backgroundColor: "rgba(2, 6, 23, 0.86)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {/* Arena backdrop */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url(${ARENA_BG})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.6) saturate(1.1)",
            }}
          />

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{
              scale: 1,
              y: 0,
              opacity: 1,
              x: bossReeling ? [0, -12, 12, -8, 0] : 0,
            }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{
              duration: bossReeling ? 0.5 : 0.75,
              ease: bossReeling ? "easeInOut" : [0.16, 1, 0.3, 1],
              delay: bossReeling ? 0 : 0.2,
            }}
            className="relative mx-3 flex w-full max-w-[720px] flex-col items-center px-3 sm:mx-4 sm:px-6"
          >
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/90 sm:text-xs sm:tracking-[0.32em]"
            >
              <Crown className="h-4 w-4" strokeWidth={2.4} />
              Stage {stage} · Super Boss · Round {currentQ + 1} / {questions.length}
            </motion.p>

            <motion.h2
              id="super-boss-title"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              className="break-words px-2 text-center text-2xl font-black uppercase tracking-wide text-transparent sm:text-4xl md:text-5xl"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #fef3c7 0%, #fbbf24 50%, #d97706 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                textShadow: "0 0 40px rgba(251,191,36,0.35)",
              }}
            >
              {boss.name}
            </motion.h2>

            {/* Boss portrait + HP bar */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: finalDefeat ? 0.4 : 1,
                opacity: finalDefeat ? 0.2 : 1,
                rotate: finalDefeat ? 25 : 0,
              }}
              transition={{
                type: finalDefeat ? "tween" : "spring",
                stiffness: 160,
                damping: 15,
                delay: finalDefeat ? 0 : 0.9,
                duration: finalDefeat ? 1.2 : undefined,
              }}
              className="relative mt-5 flex h-40 w-40 items-center justify-center sm:h-56 sm:w-56 md:h-64 md:w-64"
            >
              <motion.div
                animate={{
                  scale: bossReeling ? [1, 1.3, 1] : [1, 1.14, 1],
                  opacity: bossReeling ? [0.7, 0.3, 0.35] : [0.35, 0.55, 0.35],
                }}
                transition={{
                  duration: bossReeling ? 0.5 : 2.6,
                  repeat: bossReeling ? 0 : Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: bossReeling
                    ? "radial-gradient(closest-side, rgba(255,120,60,0.7) 0%, rgba(255,120,60,0) 70%)"
                    : "radial-gradient(closest-side, rgba(251,60,60,0.5) 0%, rgba(251,60,60,0) 70%)",
                }}
              />
              <img
                src={boss.idleAsset}
                alt={boss.name}
                className="relative h-full w-full object-contain drop-shadow-[0_10px_35px_rgba(0,0,0,0.7)]"
                style={{ imageRendering: "pixelated" }}
              />
            </motion.div>

            {/* HP bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.4 }}
              className="mt-3 flex w-full max-w-md items-center gap-2"
            >
              <div className="flex-1 overflow-hidden rounded-full border border-red-500/40 bg-slate-900/70 p-0.5">
                <motion.div
                  animate={{ width: `${hpDisplayPct * 100}%` }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="h-2 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #fb7185 0%, #ef4444 50%, #b91c1c 100%)",
                    boxShadow: "0 0 12px rgba(239,68,68,0.6)",
                  }}
                />
              </div>
              <span className="w-14 text-right text-xs font-bold text-red-300 tabular-nums">
                {Math.round(hpDisplayPct * 100)}%
              </span>
            </motion.div>

            {/* Question card */}
            {!finalDefeat && (
              <AnimatePresence mode="wait">
                {active && (
                  <motion.div
                    key={`question-${currentQ}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: bossReeling ? 0.4 : 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4 }}
                    className="mt-6 flex w-full max-w-lg flex-col gap-2 rounded-xl border border-amber-500/25 bg-slate-950/70 p-4 shadow-inner sm:p-5"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/80">
                      {active.framing}
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-slate-100 sm:text-base">
                      {active.prompt}
                    </p>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={submitting || bossReeling}
                      placeholder="Speak plainly. Ship it, don't polish it."
                      rows={3}
                      className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/40 disabled:opacity-50"
                      autoFocus
                    />
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500">
                        {answer.trim().length} / {minLen} min chars ·
                        <span className="ml-1 opacity-60">
                          {typeof navigator !== "undefined" && /Mac/.test(navigator.platform)
                            ? "⌘"
                            : "Ctrl"}
                          +Enter to strike
                        </span>
                      </span>
                      <motion.button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        whileHover={canSubmit ? { scale: 1.03 } : undefined}
                        whileTap={canSubmit ? { scale: 0.97 } : undefined}
                        className="flex min-h-[40px] items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-4 py-2 text-sm font-bold uppercase tracking-wider text-slate-900 shadow-[0_6px_20px_rgba(251,191,36,0.4)] transition-shadow disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-[0_10px_28px_rgba(251,191,36,0.55)] focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900"
                      >
                        <Swords className="h-4 w-4" strokeWidth={2.4} />
                        Strike
                        <Send className="h-3.5 w-3.5" strokeWidth={2.4} />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Final defeat message */}
            {finalDefeat && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mt-6 text-center"
              >
                <p className="text-lg font-black uppercase tracking-widest text-amber-300 sm:text-2xl">
                  Boss Defeated
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  You spoke plainly. You committed. The path clears.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
