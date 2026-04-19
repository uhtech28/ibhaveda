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
      className="fixed top-20 right-4 z-40 w-80"
    >
      {/* Pixel-art styled panel */}
      <div
        className="relative bg-[#0f1419] border-2 border-white/20 rounded-none"
        style={{
          boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.8), inset 2px 2px 0px rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 bg-gradient-to-r from-[#1a1f2e] to-[#252a3a] border-b-2 border-white/20"
          style={{
            boxShadow: "inset 0 -2px 0px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-400" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Quest Log
              </h3>
              <p className="text-xs text-gray-400">
                Stage {currentQuest.stage} · CP {currentQuest.checkpoint}
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-[#0f1419] border border-white/20 rounded-none">
              <span className="text-xs font-bold text-amber-400">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>

        {/* Quest name */}
        <div className="px-4 py-2 bg-[#1a1f2e]/50 border-b border-white/10">
          <p className="text-xs font-semibold text-gray-300">
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
                className={`relative p-3 border-2 rounded-none transition-all ${
                  task.done
                    ? "bg-emerald-950/50 border-emerald-500/50"
                    : "bg-[#1a1f2e] border-white/20"
                }`}
                style={{
                  boxShadow: task.done
                    ? "2px 2px 0px rgba(16, 185, 129, 0.3)"
                    : "2px 2px 0px rgba(0, 0, 0, 0.5)",
                }}
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
                        className="w-5 h-5 bg-emerald-500 border-2 border-emerald-400 flex items-center justify-center rounded-none"
                      >
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </motion.div>
                    ) : (
                      <div className="w-5 h-5 bg-[#0f1419] border-2 border-white/30 rounded-none" />
                    )}
                  </div>

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          task.done ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {task.label}
                      </span>
                      {!task.done && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#0f1419] border border-white/20 rounded-none">
                          <span className="text-[10px] text-gray-400 uppercase">
                            {task.tool}
                          </span>
                        </div>
                      )}
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        task.done ? "text-gray-400 line-through" : "text-gray-300"
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
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none"
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Pixel-art corner decorations */}
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white/20 border border-white/40" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/20 border border-white/40" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white/20 border border-white/40" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white/20 border border-white/40" />
      </div>

      {/* Completion banner */}
      <AnimatePresence>
        {completedCount === totalCount && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="mt-2 p-2 bg-gradient-to-r from-amber-600 to-amber-500 border-2 border-amber-400 rounded-none text-center"
            style={{
              boxShadow: "3px 3px 0px rgba(0, 0, 0, 0.8)",
            }}
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
