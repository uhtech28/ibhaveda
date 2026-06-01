/**
 * Task Submission Modal
 *
 * Opens when user clicks a task to work on it.
 * Routes to the correct tool component based on task.toolType.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { audioManager } from "@/lib/audio/audioManager";

// Tool components
import { WriteTool } from "@/components/tools/write-tool";
import { TableTool } from "@/components/tools/table-tool";
import { MapTool } from "@/components/tools/map-tool";
import { SurveyTool } from "@/components/tools/survey-tool";
import { PollTool } from "@/components/tools/poll-tool";
import { LinkTool } from "@/components/tools/link-tool";
import { UploadTool } from "@/components/tools/upload-tool";
import { SelfReportTool } from "@/components/tools/self-report-tool";
import { JournalTool } from "@/components/tools/journal-tool";
import { KanbanTool } from "@/components/tools/kanban-tool";
import { CalendarTool } from "@/components/tools/calendar-tool";
import { OAuthTool } from "@/components/tools/oauth-tool";

interface TaskSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    checkpointId: Id<"ventureCheckpoints">;
    taskLevel: "t1" | "t2" | "t3";
    title: string;
    description: string;
    toolType: string;
    points: number;
  } | null;
  onSuccess: (result: {
    taskId: string;
    checkpointId: Id<"ventureCheckpoints">;
    taskLevel: "t1" | "t2" | "t3";
  }) => void;
}

/** Returns a human-readable minimum requirement label per PRD §8 */
function getMinRequirementLabel(toolType: string): string {
  switch (toolType) {
    case "write":
      return "Minimum 50 words";
    case "table":
      return "At least 2 rows + headers";
    case "map":
      return "At least 1 element placed";
    case "survey":
      return "Survey created & at least 1 response";
    case "poll":
      return "Poll created & published";
    case "link":
      return "At least 1 URL with annotation";
    case "upload":
      return "At least 1 file attached";
    case "self_report":
      return "Form completed & confirmed";
    case "journal":
      return "At least 1 entry written";
    case "kanban":
      return "Board with at least 2 columns & 1 card";
    case "calendar":
      return "At least 1 event or milestone placed";
    case "oauth":
      return "Select provider and enter valid URL";
    default:
      return "Complete the form";
  }
}

export function TaskSubmissionModal({
  isOpen,
  onClose,
  task,
  onSuccess,
}: TaskSubmissionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [animationFinished, setAnimationFinished] = useState(false);
  const submitTask = useMutation(api.worldMap.submitTaskContent);

  const draftKey = useMemo(
    () =>
      task ? `venture-task-draft:${task.checkpointId}:${task.taskLevel}` : "",
    [task],
  );

  useEffect(() => {
    const syncOnlineStatus = () => setIsOnline(window.navigator.onLine);
    syncOnlineStatus();
    window.addEventListener("online", syncOnlineStatus);
    window.addEventListener("offline", syncOnlineStatus);
    return () => {
      window.removeEventListener("online", syncOnlineStatus);
      window.removeEventListener("offline", syncOnlineStatus);
    };
  }, []);

  // Reset error/message when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
      setAnimationFinished(false);
    } else {
      setAnimationFinished(false);
    }
  }, [isOpen, task]);

  if (!task) return null;

  const handleToolSubmit = async (content: unknown) => {
    if (!isOnline) {
      audioManager.playUI("error");
      setError(
        "You are offline. Your draft is saved locally until you reconnect.",
      );
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

      audioManager.playUI("confirm");
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(draftKey);
      }
      onSuccess({
        taskId: task.id,
        checkpointId: task.checkpointId,
        taskLevel: task.taskLevel,
      });
    } catch (err) {
      audioManager.playUI("error");
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Renders the appropriate tool component for this task type */
  const renderTool = () => {
    switch (task.toolType) {
      case "write":
        return (
          <WriteTool
            prompt={task.description}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
            initialContent={
              typeof window !== "undefined"
                ? (window.localStorage.getItem(draftKey) ?? undefined)
                : undefined
            }
          />
        );

      case "table":
        return (
          <TableTool
            prompt={task.description}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
          />
        );

      case "map":
        return (
          <MapTool
            prompt={task.description}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
            layout="compact"
          />
        );

      case "survey":
        return (
          <SurveyTool
            prompt={task.description}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
          />
        );

      case "poll":
        return (
          <PollTool
            prompt={task.description}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
          />
        );

      case "link":
        return (
          <LinkTool
            prompt={task.description}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
          />
        );

      case "upload":
        // UploadTool requires taskId to generate a scoped Convex upload URL
        return (
          <UploadTool
            prompt={task.description}
            taskId={task.id}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
          />
        );

      case "self_report":
        // SelfReportTool requires explicit field definitions.
        // These generic fields cover most self-report tasks; extend per PRD §8.
        return (
          <SelfReportTool
            prompt={task.description}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
            fields={[
              {
                key: "what_happened",
                label: "What happened / what did you do?",
                type: "textarea",
              },
              { key: "outcome", label: "Outcome or result", type: "textarea" },
              {
                key: "learning",
                label: "Key learning or next step",
                type: "textarea",
              },
            ]}
          />
        );

      case "journal":
        return (
          <JournalTool
            prompt={task.description}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
          />
        );

      case "kanban":
        return (
          <KanbanTool
            prompt={task.description}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
          />
        );

      case "calendar":
        return (
          <CalendarTool
            prompt={task.description}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
          />
        );

      case "oauth":
        return (
          <OAuthTool
            prompt={task.description}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
          />
        );

      default:
        // Fallback: generic write tool for unknown tool types
        return (
          <WriteTool
            prompt={task.description}
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
            initialContent={
              typeof window !== "undefined"
                ? (window.localStorage.getItem(draftKey) ?? undefined)
                : undefined
            }
          />
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Closable */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal - Compact responsive */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onAnimationComplete={() => {
              if (isOpen) {
                setAnimationFinished(true);
              }
            }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-none"
          >
            <div className="bg-[#111827] border border-white/10 rounded-xl shadow-2xl flex flex-col w-[96vw] sm:w-[min(92vw,860px)] h-auto max-h-[min(90vh,760px)] overflow-hidden pointer-events-auto">
              {/* Header - Compact */}
              <div className="p-3 sm:px-5 sm:py-3.5 border-b border-white/10 bg-gradient-to-r from-[#6366F1]/15 to-[#8B5CF6]/15 flex-shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      audioManager.playUI("click");
                      onClose();
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 transition-all flex-shrink-0 touch-manipulation group"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  </button>
                </div>
              </div>

              {/* Content Area - Compact responsive with hidden scrollbar */}
              <div 
                className="flex-1 overflow-y-auto p-3 sm:p-5 min-h-0 safe-bottom [&>div]:border-0 [&>div]:bg-transparent [&>div]:shadow-none [&>div>div:first-child]:hidden [&>div>div:last-child]:p-0"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <style dangerouslySetInnerHTML={{__html: `
                  .flex-1::-webkit-scrollbar {
                    display: none !important;
                  }
                `}} />
                {!isOnline && (
                  <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs sm:text-sm text-amber-200">
                    Offline mode detected. Your draft will stay on this device until you reconnect.
                  </div>
                )}

                {/* Delayed Tool Component for Buttery Smooth Opening */}
                {animationFinished ? (
                  renderTool()
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[250px] gap-2">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-[11px] text-slate-400 animate-pulse">Initializing tool...</span>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
