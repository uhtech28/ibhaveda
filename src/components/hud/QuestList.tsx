"use client";

import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Scroll } from "lucide-react";
import { atom } from "jotai";

// Quest data structure
export interface QuestTask {
  label: string;
  description: string;
  tool: string;
  done: boolean;
}

export interface CurrentQuest {
  checkpointName: string;
  tasks: QuestTask[];
  stage: number;
  checkpoint: number;
}

// Atom for current quest data
export const currentQuestAtom = atom<CurrentQuest | null>(null);

export function QuestList() {
  const [currentQuest] = useAtom(currentQuestAtom);

  if (!currentQuest || currentQuest.tasks.length === 0) {
    return null;
  }

  const completedCount = currentQuest.tasks.filter((t) => t.done).length;
  const totalCount = currentQuest.tasks.length;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-20 right-4 z-40 w-80 font-sans"
    >
      {/* Modern glassmorphic panel */}
      <div
        className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div
          className="px-4 py-3 bg-slate-800/40 border-b border-white/10"
        >
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-indigo-400" />
            <div className="flex-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wider drop-shadow-sm">
                Quest Log
              </h3>
              <p className="text-xs text-gray-400">
                Stage {currentQuest.stage} · CP {currentQuest.checkpoint}
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
              <span className="text-xs font-black text-indigo-400">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>

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
                className={`relative p-3 border rounded-xl transition-all ${
                  task.done
                    ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                    : "bg-slate-800/30 border-white/5 hover:border-white/10 hover:bg-slate-800/50"
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
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="w-5 h-5 bg-indigo-500 border border-indigo-400 flex items-center justify-center rounded-md shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                      >
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
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
                          task.done ? "text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" : "text-violet-300"
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
                        task.done ? "text-slate-500 line-through" : "text-slate-300"
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
      </div>

      {/* Completion banner */}
      <AnimatePresence>
        {completedCount === totalCount && (
          <motion.div
            initial={{ y: -10, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.95 }}
            className="mt-3 p-2.5 bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 rounded-xl text-center shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          >
            <p className="text-xs font-bold text-white uppercase tracking-wider">
              ✨ Quest Complete! ✨
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
