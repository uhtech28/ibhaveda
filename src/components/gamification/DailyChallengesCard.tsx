"use client";

/**
 * @file DailyChallengesCard.tsx
 * @description Compact widget showing the authed user's 3 daily
 *  challenges + progress bars.  Auto-refreshes as bumpProgress fires
 *  on qualifying actions (Convex reactivity).  When all three are
 *  complete, a "Claim +75 XP" button appears; on claim the row
 *  transitions to a subtle "Claimed today" chip.
 *
 * Wire once into the map page (or profile) — it handles its own data.
 */

import { useQuery, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@convex/_generated/api";
import { Sparkles, Check, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export interface DailyChallengesCardProps {
  /** Optional compact mode for HUD placement. */
  compact?: boolean;
  className?: string;
}

export function DailyChallengesCard({
  compact = false,
  className = "",
}: DailyChallengesCardProps) {
  const state = useQuery(api.dailyChallenges.getMyDailyChallenges);
  const ensure = useMutation(api.dailyChallenges.ensureTodayChallenges);
  const claimBonus = useMutation(api.dailyChallenges.claimDailyBonus);
  const { toast } = useToast();
  const [claiming, setClaiming] = useState(false);

  // Lazily persist today's row so the header numbers don't jump when
  // the first action fires.  Idempotent server-side.
  useEffect(() => {
    if (!state) return;
    if (state.challenges.every((c) => c.progress === 0)) {
      ensure().catch(() => { /* non-fatal */ });
    }
  }, [state, ensure]);

  if (state === undefined) return null; // Loading
  if (state === null) return null; // Not authenticated

  const { challenges, allComplete, claimedAt, dailyBonusXp } = state;

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const result = await claimBonus();
      if (result.alreadyClaimed) {
        toast({
          title: "Already claimed",
          description: "You've already claimed today's bonus.",
          duration: 2500,
        });
      } else {
        toast({
          title: "🎯 Daily bonus!",
          description: `+${result.bonus} XP · Come back tomorrow`,
          duration: 3500,
        });
      }
    } catch (err) {
      toast({
        title: "Could not claim",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
        duration: 3500,
      });
    } finally {
      setClaiming(false);
    }
  };

  const cardBase = compact
    ? "rounded-xl border border-amber-500/25 bg-slate-950/60 p-3"
    : "rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900/80 via-slate-950/70 to-slate-900/70 p-4 shadow-lg";

  return (
    <div className={`${cardBase} ${className}`}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300" strokeWidth={2.4} />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/85">
            Daily Challenges
          </h3>
        </div>
        {claimedAt && (
          <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <Check className="h-3 w-3" strokeWidth={3} />
            Claimed
          </span>
        )}
      </header>

      <ul className="space-y-2.5">
        {challenges.map((c) => {
          const pct = Math.min(100, (c.progress / c.target) * 100);
          const done = c.progress >= c.target;
          return (
            <li key={c.id}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span
                  className={
                    done
                      ? "font-medium text-emerald-300 line-through decoration-emerald-400/60"
                      : "font-medium text-slate-100"
                  }
                >
                  {c.label}
                </span>
                <span className="tabular-nums text-[10px] font-bold text-slate-400">
                  {c.progress}/{c.target}
                  <span className="ml-1 text-amber-300">+{c.xpReward}</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/70">
                <motion.div
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    done
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                      : "bg-gradient-to-r from-amber-400 to-amber-600"
                  }`}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {allComplete && !claimedAt && (
          <motion.button
            key="claim"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={handleClaim}
            disabled={claiming}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-2 text-xs font-black uppercase tracking-widest text-slate-900 shadow-[0_6px_20px_rgba(251,191,36,0.4)] disabled:opacity-60"
          >
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.6} />
            {claiming ? "Claiming…" : `Claim +${dailyBonusXp} XP`}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
