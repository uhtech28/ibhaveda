"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Scroll, ChevronUp, Zap } from "lucide-react";
import { currentQuestAtom, submittingTaskAtom } from "@/lib/stores/hudStore";

// Stage names for display in the completion banner
const STAGE_NAMES: Record<number, string> = {
  1: "Ideation",
  2: "Research",
  3: "Validation",
  4: "Design",
  5: "Development",
  6: "Launch",
  7: "Iteration",
  8: "Scale",
};

// Total checkpoints per stage (for display in header)
const STAGE_TOTAL_CHECKPOINTS: Record<number, number> = {
  1: 4,
  2: 5,
  3: 4,
  4: 5,
  5: 6,
  6: 3,
  7: 4,
  8: 5,
};

export function QuestList() {
  const [currentQuest] = useAtom(currentQuestAtom);
  const [, setSubmittingTask] = useAtom(submittingTaskAtom);
  const [isFolded, setIsFolded] = useState(false);

  if (!currentQuest || currentQuest.tasks.length === 0) {
    return null;
  }

  const completedCount = currentQuest.tasks.filter((t) => t.done).length;
  const totalCount = currentQuest.tasks.length;
  const allDone = completedCount === totalCount;

  const stageName =
    STAGE_NAMES[currentQuest.stage] ?? `Stage ${currentQuest.stage}`;
  const nextStageName =
    STAGE_NAMES[currentQuest.stage + 1] ?? `Level ${currentQuest.stage + 1}`;
  const totalInStage = STAGE_TOTAL_CHECKPOINTS[currentQuest.stage] ?? 4;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed right-2 top-[calc(env(safe-area-inset-top)+6.25rem)] z-40 w-[min(92vw,320px)] font-sans sm:right-4 sm:top-[calc(env(safe-area-inset-top)+5.75rem)] sm:w-[min(74vw,340px)] md:right-5 md:top-[calc(env(safe-area-inset-top)+6rem)] md:w-[min(44vw,320px)] lg:top-20 lg:w-80"
    >
      {/* Modern glassmorphic panel */}
      <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Header (Clickable for folding) */}
        <div
          className="px-4 py-3 bg-slate-800/40 border-b border-white/10 cursor-pointer hover:bg-slate-800/60 transition-colors"
          onClick={() => setIsFolded(!isFolded)}
        >
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-indigo-400" />
            <div className="flex-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wider drop-shadow-sm">
                Quest Log
              </h3>
              <p className="text-xs text-gray-400">
                Stage {currentQuest.stage} · GP {currentQuest.checkpoint}/
                {totalInStage}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
                <span
                  className={`text-xs font-black ${allDone ? "text-amber-400" : "text-indigo-400"}`}
                >
                  {completedCount}/{totalCount}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isFolded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronUp className="w-4 h-4 text-gray-400" />
              </motion.div>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!isFolded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {/* Quest name */}
              <div className="px-4 py-2 bg-slate-800/20 border-b border-white/5">
                <p className="text-xs font-bold text-indigo-200/80 uppercase tracking-widest">
                  {currentQuest.checkpointName}
                </p>
              </div>

              {/* Task list */}
              <div className="p-3 space-y-2">
                <AnimatePresence mode="popLayout">
                  {currentQuest.tasks.map((task, index) => (
                    <motion.div
                      key={task.label}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        if (!task.done) {
                          setSubmittingTask({
                            id: task.id,
                            checkpointId: task.checkpointId,
                            taskLevel: task.taskLevel,
                            title: `${task.label}: ${currentQuest.checkpointName}`,
                            description: task.description,
                            toolType: task.tool,
                            points: task.points,
                          });
                        }
                      }}
                      className={`relative p-3 border rounded-xl transition-all ${
                        task.done
                          ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                          : "bg-slate-800/30 border-white/5 hover:border-indigo-500/50 hover:bg-slate-800/50 cursor-pointer group/task"
                      }`}
                    >
                      {/* Task header */}
                      <div className="flex items-start gap-2">
                        {/* Checkbox */}
                        <div className="mt-0.5 flex-shrink-0">
                          {task.done ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 25,
                              }}
                              className="w-5 h-5 bg-indigo-500 border border-indigo-400 flex items-center justify-center rounded-md shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            >
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                            </motion.div>
                          ) : (
                            <div className="w-5 h-5 bg-slate-900/50 border border-white/20 rounded-md shadow-inner" />
                          )}
                        </div>

                        {/* Task info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-black uppercase tracking-wider ${
                                task.done
                                  ? "text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]"
                                  : "text-violet-300"
                              }`}
                            >
                              {task.label}
                            </span>
                            {!task.done && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-md">
                                <span className="text-[9px] text-indigo-200/60 uppercase font-bold tracking-widest">
                                  {task.tool}
                                </span>
                              </div>
                            )}
                          </div>
                          <p
                            className={`text-xs leading-relaxed ${
                              task.done
                                ? "text-slate-500 line-through"
                                : "text-slate-300"
                            }`}
                          >
                            {task.description}
                          </p>
                        </div>
                      </div>

                      {/* Completion glow effect */}
                      {task.done && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.3, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent pointer-events-none rounded-xl"
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Completion banner — shows stage completion + next level info */}
      <AnimatePresence>
        {!isFolded && allDone && (
          <motion.div
            initial={{ y: -10, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.95 }}
            className="mt-3 overflow-hidden rounded-xl border border-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
            style={{
              background:
                "linear-gradient(135deg, rgba(234,179,8,0.15), rgba(180,120,0,0.10))",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="px-3 py-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-xs font-black text-white uppercase tracking-wider">
                  ✨ Quest Complete! ✨
                </p>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              {currentQuest.stage < 8 && (
                <p className="text-[10px] font-bold text-amber-300/80 tracking-wider">
                  {stageName} → Advancing to Level {currentQuest.stage + 1}:{" "}
                  {nextStageName}
                </p>
              )}
            </div>
            {/* Shimmer bar */}
            <motion.div
              className="h-0.5 w-full"
              style={{
                background: "linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)",
                backgroundSize: "200% 100%",
              }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
