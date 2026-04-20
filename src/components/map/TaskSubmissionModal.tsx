/**
 * Task Submission Modal
 * 
 * Opens when user clicks on a task to work on it.
 * Provides tool-specific interface for submitting work.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

interface TaskSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: Id<"ventureTasks">;
    checkpointId: Id<"ventureCheckpoints">;
    taskLevel: "t1" | "t2" | "t3";
    title: string;
    description: string;
    toolType: string;
    points: number;
  } | null;
  onSuccess: () => void;
}

export function TaskSubmissionModal({
  isOpen,
  onClose,
  task,
  onSuccess,
}: TaskSubmissionModalProps) {
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitTask = useMutation(api.worldMap.submitTaskContent);

  if (!task) return null;

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    const words = newContent.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    setError(null);
  };

  const handleSubmit = async () => {
    if (wordCount < 50) {
      setError("Please write at least 50 words");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitTask({
        checkpointId: task.checkpointId,
        taskLevel: task.taskLevel,
        content,
      });

      onSuccess();
      onClose();
      setContent("");
      setWordCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = wordCount >= 50;

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] z-50 overflow-hidden"
          >
            <div className="bg-[#111827] border-2 border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {task.title}
                    </h2>
                    <p className="text-gray-300 text-sm mb-3">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                        Tool: {task.toolType}
                      </span>
                      <span className="text-xs text-gray-400">
                        Minimum: 50 words
                      </span>
                      <span className="text-xs text-[#6366F1] font-bold">
                        +{task.points} points
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-black/20 hover:bg-black/40 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6">
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Write your response here... (minimum 50 words)"
                  className="w-full h-64 p-4 bg-black/20 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#6366F1] focus:outline-none resize-none"
                />

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl flex items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 bg-black/20">
                <div className="flex items-center justify-between">
                  {/* Word Count */}
                  <div className="text-sm">
                    <span
                      className={
                        isValid ? "text-green-400" : "text-gray-400"
                      }
                    >
                      {wordCount} words
                    </span>
                    {!isValid && (
                      <span className="text-gray-500 ml-2">
                        ({50 - wordCount} more needed)
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="text-gray-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!isValid || isSubmitting}
                      className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5558E3] hover:to-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Submit Task
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
