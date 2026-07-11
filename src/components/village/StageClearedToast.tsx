"use client";

/**
 * @file StageClearedToast.tsx
 * @description Brief celebratory overlay shown between mid-arc stage
 *  transitions (Forest→Harbor, Harbor→Artisans). Village→Forest has the
 *  fuller VillageCompleteCelebration; Stage 4 finish has the venture
 *  finale overlay. This fills the middle gap.
 *
 *  Auto-dismisses after ~2500ms so the URL swap continues cleanly.
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronsRight, Sparkles } from "lucide-react";

const STAGE_NAMES: Record<number, { cleared: string; next: string }> = {
  2: { cleared: "Forest of Perfectionism", next: "Golden Harbor" },
  3: { cleared: "Golden Harbor", next: "Artisans District" },
};

export interface StageClearedToastProps {
  open: boolean;
  stage: number;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 2500;

export default function StageClearedToast({
  open,
  stage,
  onDismiss,
}: StageClearedToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [open, onDismiss]);

  const names = STAGE_NAMES[stage] ?? { cleared: `Stage ${stage}`, next: `Stage ${stage + 1}` };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key={`stage-cleared-${stage}`}
          initial={{ opacity: 0, y: 40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96, transition: { duration: 0.35 } }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed inset-x-0 top-24 z-[10023] mx-auto flex max-w-[520px] justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div className="relative flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-slate-900/95 via-slate-950/95 to-slate-900/95 px-5 py-3 shadow-[0_20px_50px_rgba(251,191,36,0.28)] backdrop-blur-md">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-[0_4px_18px_rgba(251,191,36,0.55)]"
            >
              <Sparkles className="h-5 w-5 text-white" strokeWidth={2.4} />
            </motion.div>
            <div className="flex flex-col">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/80">
                Stage {stage} Cleared
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <span className="opacity-70 line-through decoration-amber-400/70">
                  {names.cleared}
                </span>
                <ChevronsRight className="h-4 w-4 text-amber-300" strokeWidth={2.4} />
                <span>{names.next}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
