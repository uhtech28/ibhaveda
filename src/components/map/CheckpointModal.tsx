/**
 * Checkpoint Detail Modal
 * 
 * Opens when user clicks on a checkpoint/room in the map.
 * Shows tasks, progress, and allows starting/completing tasks.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Lock, CheckCircle, Circle, Star, Sparkles, ArrowRight } from "lucide-react";
import { TaskSubmissionModal } from "./TaskSubmissionModal";
import type { Id } from "@convex/_generated/dataModel";

interface CheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkpoint: {
    id: string;
    stage: number;
    checkpoint: number;
    status: "locked" | "active" | "in_progress" | "completed" | "gold";
    t1: boolean;
    t2: boolean;
    t3: boolean;
  } | null;
}

const STAGE_NAMES = [
  "Ideation",
  "Research",
  "Validation",
  "Offer Design",
  "Build & Deliver",
  "Launch",
  "Iteration",
  "Scale",
];

const TASK_DESCRIPTIONS = {
  t1: {
    level: "T1",
    title: "Foundation Task",
    description: "Complete the basic requirements for this checkpoint",
    points: 20
  },
  t2: {
    level: "T2",
    title: "Advanced Task",
    description: "Take it to the next level with additional work",
    points: 20
  },
  t3: {
    level: "T3",
    title: "Excellence Task",
    description: "Go above and beyond for maximum impact",
    points: 35
  },
};

export function CheckpointModal({ isOpen, onClose, checkpoint }: CheckpointModalProps) {
  const [selectedTask, setSelectedTask] = useState<{
    id: Id<"ventureTasks">;
    checkpointId: Id<"ventureCheckpoints">;
    taskLevel: "t1" | "t2" | "t3";
    title: string;
    description: string;
    toolType: string;
    points: number;
  } | null>(null);

  if (!checkpoint) return null;

  const stageName = STAGE_NAMES[checkpoint.stage - 1] || "Unknown";
  const isLocked = checkpoint.status === "locked";
  const isCompleted = checkpoint.status === "completed" || checkpoint.status === "gold";
  const isGold = checkpoint.status === "gold";

  const completedTasks = [checkpoint.t1, checkpoint.t2, checkpoint.t3].filter(Boolean).length;
  const totalPoints =
    (checkpoint.t1 ? 20 : 0) +
    (checkpoint.t2 ? 20 : 0) +
    (checkpoint.t3 ? 35 : 0);

  const handleTaskClick = (taskLevel: "t1" | "t2" | "t3") => {
    const taskData = TASK_DESCRIPTIONS[taskLevel];
    setSelectedTask({
      id: `${checkpoint.id}_${taskLevel}` as Id<"ventureTasks">, // Temporary - will be replaced with real task ID
      checkpointId: checkpoint.id as Id<"ventureCheckpoints">,
      taskLevel,
      title: taskData.title,
      description: taskData.description,
      toolType: "write", // Default tool - will be enhanced later
      points: taskData.points,
    });
  };

  const handleSubmissionSuccess = () => {
    setSelectedTask(null);
    // Refresh checkpoint data
    window.location.reload(); // Simple refresh for now - can be optimized with proper state management
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50"
          >
            <div className="bg-[#111827] border-2 border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className={`relative p-6 ${
                isGold ? 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20' :
                isCompleted ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20' :
                isLocked ? 'bg-gradient-to-r from-gray-600/20 to-gray-700/20' :
                'bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/20'
              }`}>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-black/20 hover:bg-black/40 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <motion.div
                    initial={{ scale: 0.84, rotate: -8 }}
                    animate={{
                      scale: 1,
                      rotate: 0,
                      boxShadow: isGold
                        ? [
                            "0 0 0 rgba(245,158,11,0)",
                            "0 0 34px rgba(245,158,11,0.45)",
                            "0 0 18px rgba(245,158,11,0.22)",
                          ]
                        : "0 16px 40px rgba(0,0,0,0.22)",
                    }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className={`relative w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden ${
                      isGold ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500' :
                      isCompleted ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                      isLocked ? 'bg-gradient-to-br from-gray-500 to-gray-600' :
                      'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]'
                    }`}
                  >
                    {!isLocked && (
                      <motion.span
                        className="absolute inset-y-0 -left-8 w-6 rotate-12 bg-white/40 blur-sm"
                        animate={{ x: [0, 112] }}
                        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
                      />
                    )}
                    {isGold ? <Star className="relative w-8 h-8 text-white" fill="currentColor" /> :
                     isCompleted ? <CheckCircle className="relative w-8 h-8 text-white" /> :
                     isLocked ? <Lock className="relative w-8 h-8 text-white" /> :
                     <Circle className="relative w-8 h-8 text-white" />}
                  </motion.div>

                  {/* Title */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Stage {checkpoint.stage} - Checkpoint {checkpoint.checkpoint}
                    </h2>
                    <p className="text-gray-300">
                      {stageName} Phase
                    </p>
                  </div>

                  {/* Points Badge */}
                  {!isLocked && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">{totalPoints}</div>
                      <div className="text-sm text-gray-300">Points</div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {!isLocked && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                      <span>Progress</span>
                      <span>{completedTasks}/3 Tasks</span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(completedTasks / 3) * 100}%` }}
                        className={`h-full ${
                          isGold ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {isLocked ? (
                  <div className="text-center py-12">
                    <Lock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Checkpoint Locked
                    </h3>
                    <p className="text-gray-400">
                      Complete previous checkpoints to unlock this one
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Task 1 */}
                    <TaskCard
                      index={0}
                      completed={checkpoint.t1}
                      onTaskClick={() => handleTaskClick("t1")}
                      {...TASK_DESCRIPTIONS.t1}
                    />

                    {/* Task 2 */}
                    <TaskCard
                      index={1}
                      completed={checkpoint.t2}
                      onTaskClick={() => handleTaskClick("t2")}
                      {...TASK_DESCRIPTIONS.t2}
                    />

                    {/* Task 3 */}
                    <TaskCard
                      index={2}
                      completed={checkpoint.t3}
                      onTaskClick={() => handleTaskClick("t3")}
                      {...TASK_DESCRIPTIONS.t3}
                    />

                    {/* Gold Badge */}
                    {isGold && (
                      <motion.div
                        initial={{ opacity: 0, y: 14, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.24, type: "spring", stiffness: 220, damping: 18 }}
                        className="relative mt-6 overflow-hidden rounded-xl border-2 border-yellow-400/35 bg-gradient-to-r from-yellow-500/15 via-amber-400/10 to-orange-500/15 p-4 text-center shadow-[0_0_34px_rgba(245,158,11,0.16)]"
                      >
                        <motion.div
                          className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.18),transparent)]"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
                        />
                        <div className="relative mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-black shadow-[0_0_22px_rgba(251,191,36,0.45)]">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <p className="relative text-yellow-300 font-bold">
                          Gold Checkpoint unlocked
                        </p>
                        <p className="relative mt-1 text-xs text-yellow-100/75">
                          All three tasks are complete.
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-black/20 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="text-gray-400 hover:text-white"
                  >
                    Close
                  </Button>
                  
                  {!isLocked && !isCompleted && (
                    <Button
                      className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5558E3] hover:to-[#7C3AED]"
                      onClick={() => {
                        // TODO: Navigate to task completion page
                        console.log("Start working on checkpoint:", checkpoint.id);
                      }}
                    >
                      Start Working
                    </Button>
                  )}

                  {isCompleted && (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Task Submission Modal */}
          <TaskSubmissionModal
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            task={selectedTask}
            onSuccess={handleSubmissionSuccess}
          />
        </>
      )}
    </AnimatePresence>
  );
}

function TaskCard({ 
  level,
  title, 
  description, 
  points, 
  completed,
  onTaskClick,
  index,
}: { 
  level: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  onTaskClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -18, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      whileHover={completed ? undefined : { y: -2, scale: 1.01 }}
      whileTap={completed ? undefined : { scale: 0.99 }}
      transition={{ delay: 0.06 * index, type: "spring", stiffness: 260, damping: 22 }}
      onClick={completed ? undefined : onTaskClick}
      disabled={completed}
      className={`group relative w-full overflow-hidden p-4 text-left rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/70 ${
        completed
          ? 'bg-emerald-500/10 border-emerald-400/35 shadow-[0_0_24px_rgba(16,185,129,0.08)]'
          : 'bg-white/5 border-white/10 hover:border-indigo-300/35 hover:bg-white/[0.07] cursor-pointer'
      }`}
    >
      <motion.span
        className={`absolute inset-y-0 left-0 w-1 ${
          completed ? "bg-emerald-400" : "bg-indigo-400"
        }`}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.12 + index * 0.06, duration: 0.34, ease: "easeOut" }}
      />
      {!completed && (
        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_16%_20%,rgba(99,102,241,0.22),transparent_30%)]" />
      )}
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <motion.div
          initial={false}
          animate={completed ? { scale: [1, 1.16, 1] } : { scale: 1 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
          className={`relative w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
          completed
            ? 'bg-emerald-500 border-emerald-400 text-white'
            : 'border-gray-500 text-gray-500 group-hover:border-indigo-300 group-hover:text-indigo-300'
        }`}
        >
          {completed && (
            <>
              <span className="absolute inset-[-5px] rounded-full bg-emerald-400/20 motion-safe:animate-ping" />
              <CheckCircle className="relative w-4 h-4" />
            </>
          )}
        </motion.div>

        {/* Content */}
        <div className="relative flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-black ${
                completed
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-indigo-300/25 bg-indigo-400/10 text-indigo-200"
              }`}>
                {level}
              </span>
              <h4 className={`truncate font-semibold ${completed ? 'text-emerald-300' : 'text-white'}`}>
                {title}
              </h4>
            </div>
            <span className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-black ${
              completed ? 'bg-emerald-400/10 text-emerald-300' : 'bg-indigo-400/10 text-indigo-200'
            }`}>
              +{points} pts
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {description}
          </p>
          {!completed && (
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 transition-colors group-hover:text-cyan-200">
              Work on task
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
