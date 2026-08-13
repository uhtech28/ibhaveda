/**
 * Task Submission Modal
 *
 * Opens when user clicks a task to work on it.
 * Routes to the correct tool component based on task.toolType.
 */

"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { audioManager } from "@/lib/audio/audioManager";

// Tool components
import { WriteTool } from "@/components/tools/write-tool";
// TableTool import removed — the legacy grid was replaced by
// jspreadsheet-ce (SpreadsheetTool); both `table` and `spreadsheet`
// toolTypes now render that. Left the file on disk for now in case a
// migration references it; delete when safe.
import { MapTool } from "@/components/tools/map-tool";
import { ExcalidrawTool } from "@/components/tools/excalidraw-tool";
import { SpreadsheetTool } from "@/components/tools/spreadsheet-tool";
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

// memo wrapper — INP trace showed 2.2s per keystroke when the parent
// MapPage was re-rendering on every Convex tick. Now the modal only
// reconciles when its own props (isOpen / task / onClose / onSuccess)
// change reference.
function TaskSubmissionModalInner({
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

  // Depend on the primitive fields, not the task object identity — parents
  // tend to pass new task object references on every render.
  const draftKey = useMemo(
    () =>
      task ? `venture-task-draft:${task.checkpointId}:${task.taskLevel}` : "",
    [task?.checkpointId, task?.taskLevel],
  );

  // Only attach the online/offline listeners while the modal is actually
  // mounted on screen — otherwise we pay for two window listeners forever.
  useEffect(() => {
    if (!isOpen) return;
    const syncOnlineStatus = () => setIsOnline(window.navigator.onLine);
    syncOnlineStatus();
    window.addEventListener("online", syncOnlineStatus);
    window.addEventListener("offline", syncOnlineStatus);
    return () => {
      window.removeEventListener("online", syncOnlineStatus);
      window.removeEventListener("offline", syncOnlineStatus);
    };
  }, [isOpen]);

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

  // Read the saved draft once per (open + task) — without this useMemo,
  // every parent re-render would call localStorage.getItem in render path
  // and pass a fresh string to WriteTool, which would reset its editor.
  const initialDraft = useMemo(() => {
    if (!isOpen || !draftKey) return undefined;
    if (typeof window === "undefined") return undefined;
    return window.localStorage.getItem(draftKey) ?? undefined;
  }, [isOpen, draftKey]);

  // Early return BEFORE rendering anything else — keeps the hook order
  // stable but stops the renderTool / tool subscriptions from happening
  // when the modal is closed.
  if (!isOpen || !task) return null;

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
      const raw = err instanceof Error ? err.message : "Submission failed";
      // Convex serializes throws as "[CONVEX M(...)] [Request ID: ...]
      // Server Error Uncaught Error: <real message> at handler ..."
      // — extract just the real message so users don't see a
      // stack-trace-style dump inside the task modal.
      const match = raw.match(/Uncaught Error:\s*(.+?)\s*at handler/i);
      const friendly = match?.[1]
        ? match[1]
        : raw
            .replace(/^\[CONVEX[^\]]*\]\s*\[[^\]]*\]\s*Server Error\s*/i, "")
            .split("\n")[0];
      setError(friendly);
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
            initialContent={initialDraft}
          />
        );

      case "table":
      case "spreadsheet":
        // Both `table` and `spreadsheet` toolTypes now render the
        // jspreadsheet-ce grid. The legacy `TableTool` (Column 1/2/3
        // stub with a "Paste from Excel/CSV" toggle) was replaced per
        // product feedback — "we use excel third-party now, why is
        // the old table tool still showing?" — since the two tools
        // shipped side-by-side and older tasks in the seeded config
        // still declare `toolType: "table"`. Routing both here means
        // every task gets the Excel-like grid without a schema
        // migration. `initialContent` is cast because the two tools
        // used different payload shapes; SpreadsheetTool safely
        // ignores unrecognised keys.
        return (
          <SpreadsheetTool
            prompt={task.description}
            hidePrompt
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
            initialContent={initialDraft as never}
          />
        );

      case "map":
        // Custom MapTool replaced with the professional Excalidraw
        // whiteboard per product request. Same onSubmit contract; the
        // JSON payload just carries an Excalidraw scene now.
        // hidePrompt: the modal header already renders the description
        // as a subheading — passing this stops the tool from showing
        // the same text again inside its canvas frame.
        return (
          <ExcalidrawTool
            prompt={task.description}
            hidePrompt
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
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
            hidePrompt
            isSubmitting={isSubmitting}
            onSubmit={handleToolSubmit}
          />
        );

      case "kanban":
        return (
          <KanbanTool
            prompt={task.description}
            hidePrompt
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
            initialContent={initialDraft}
          />
        );
    }
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
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm"
          />

          {/* Modal - Compact responsive */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            onAnimationComplete={() => {
              if (isOpen) {
                setAnimationFinished(true);
              }
            }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-none"
            role="dialog"
            aria-modal="true"
            data-tutorial="task-modal"
            data-state={isOpen ? "open" : "closed"}
          >
            <div className="bg-[#111827] border border-white/10 rounded-xl shadow-2xl flex flex-col w-[96vw] sm:w-[min(88vw,640px)] h-auto max-h-[min(88vh,720px)] overflow-hidden pointer-events-auto">
              {/* Header — ONLY the task TITLE lives inside the blue
                  gradient bar (per product ask: "only heading in blue
                  headline for all task, not sub heading in blue"). The
                  task DESCRIPTION is rendered directly below the blue
                  bar as plain body copy so it still reads as a
                  subheading right under the title, just no longer
                  tinted by the blue block. Title is sentence-case
                  ("Chart the affliction" instead of "CHART THE
                  AFFLICTION") to match the CheckpointPanel row style. */}
              <div className="px-3 py-2 sm:px-5 sm:py-2.5 border-b border-white/10 bg-gradient-to-r from-[#6366F1]/15 to-[#8B5CF6]/15 flex-shrink-0">
                {/* items-center (was items-start) so the title text
                    and the × button share a vertical center line —
                    the × sat noticeably higher than the title before
                    because items-start pinned both to the top edge
                    but the title's larger font pushed its baseline
                    down. */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {task.title && task.title.trim().length > 0 ? (
                      <h2 className="text-base sm:text-lg font-black tracking-wide text-white leading-tight">
                        {(() => {
                          // Title Case with common small-word
                          // exceptions: capitalise the first letter
                          // of every word EXCEPT short articles /
                          // prepositions / conjunctions (unless
                          // they're the first or last word). Gives
                          // "Chart the Affliction" instead of the
                          // sentence-case "Chart the affliction"
                          // (user asked: "just capital A for
                          // affliction").
                          const SMALL_WORDS = new Set([
                            "a", "an", "and", "as", "at", "but", "by",
                            "for", "if", "in", "nor", "of", "on", "or",
                            "the", "to", "up", "vs", "via", "with",
                          ]);
                          const capitalise = (w: string) =>
                            w.length === 0
                              ? w
                              : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
                          const raw = task.title.trim();
                          if (raw.length === 0) return raw;
                          const words = raw.split(/\s+/);
                          return words
                            .map((w, i) => {
                              const lower = w.toLowerCase();
                              const isFirstOrLast =
                                i === 0 || i === words.length - 1;
                              if (!isFirstOrLast && SMALL_WORDS.has(lower)) {
                                return lower;
                              }
                              return capitalise(w);
                            })
                            .join(" ");
                        })()}
                      </h2>
                    ) : (
                      // Legacy rows with no separate title — fall back
                      // to the description as the heading.
                      <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                        {task.description}
                      </p>
                    )}
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

              {/* Task DESCRIPTION as a subheading — sits directly
                  UNDER the blue header (not tinted by it) so the
                  heading/subheading pair still reads together. Only
                  shown when the task actually has a separate title
                  (otherwise the description IS the heading above).
                  Tight top padding so it visually hugs the blue bar
                  instead of floating with a big gap between them. */}
              {task.title && task.title.trim().length > 0 && (
                <div className="px-3 sm:px-5 pt-2 sm:pt-2.5 flex-shrink-0">
                  <p className="text-xs sm:text-sm font-normal text-white/70 leading-relaxed">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Content Area - Compact responsive with hidden scrollbar.
                  CSS strips duplicated chrome so the tool renders naked
                  inside the modal:
                    - `[&>div]:*` neutralises the Card-based tools'
                      outer border/shadow/background.
                    - `[&_[data-slot="card-header"]]:hidden` hides the
                      shadcn CardHeader (CardTitle + CardDescription) —
                      the modal's own blue header now shows the task
                      title + description, so re-rendering them inside
                      the Card was a duplicate. Using the `data-slot`
                      attribute (not `:first-child`) so non-Card tools
                      like ExcalidrawTool / SpreadsheetTool don't have
                      their first div child (the canvas!) hidden by
                      accident.
                    - `[&_[data-slot="card-content"]]:p-0` drops the
                      Card body padding so the inner form flushes with
                      the modal's own padding. */}
              <div
                className='flex-1 overflow-y-auto p-3 sm:p-5 min-h-0 safe-bottom [&>div]:border-0 [&>div]:bg-transparent [&>div]:shadow-none [&_[data-slot="card-header"]]:hidden [&_[data-slot="card-content"]]:p-0'
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

export const TaskSubmissionModal = memo(TaskSubmissionModalInner);
