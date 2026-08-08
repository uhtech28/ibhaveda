"use client";

/**
 * @file ContributionComposeDialog.tsx
 * @description Compose dialog for the CONTRIBUTIONS tile in the
 *   Adventurer's Menu. Product mechanism (verbatim ask):
 *     1) persona creates a project (existing venture creation flow)
 *     2) inside the project, clicking CONTRIBUTIONS opens this
 *        dialog where they fill Title + Description. Tags are
 *        already present (inherited from the parent project) and
 *        can just be posted
 *     3) title is auto-prefixed with the project name — e.g. if the
 *        project is "Project" and the contribution title is
 *        "progress", the posted idea title becomes "Project:progress"
 *
 *   Wraps the shadcn `Dialog` primitive so the surrounding scrim +
 *   subtle blur match FlareComposeDialog exactly. Product ask:
 *   "make contribution background like flare" — Flare uses the same
 *   shadcn wrapper, so switching primitives is the one-line change
 *   that lands us the same look (dim map, top navbar still visible
 *   above the scrim because the shadcn overlay respects z-index).
 *
 *   Under the hood this calls the same `api.ideas.createIdea`
 *   mutation the /feed post form uses, so contribution posts show
 *   up in the feed exactly like a normal idea post.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Loader2, Globe, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useKeyboardInsets,
  keyboardSafeStyle,
} from "@/lib/hooks/useKeyboardInsets";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The parent project — used for the title prefix + inherited tags. */
  projectName: string;
  /** Parent idea id — persisted as the new idea's `parentId` so the
   *  contribution shows up as a CHILD of the project in the Idea
   *  Hierarchy flowchart (convex/hierarchy.ts:getIdeaFullTree walks
   *  the `by_parent` index). Without this the contribution posts as
   *  a root idea and never joins the project's tree. */
  parentIdeaId: Id<"ideas">;
  /** Skills tags (already parsed from the parent idea's `category`). */
  inheritedSkills: readonly string[];
  /** Industries tags (already parsed from the parent idea's `industries`). */
  inheritedIndustries: readonly string[];
  /** Optional callback fired after a successful post. */
  onPosted?: (newIdeaId: Id<"ideas">) => void;
}

export function ContributionComposeDialog({
  open,
  onOpenChange,
  projectName,
  parentIdeaId,
  inheritedSkills,
  inheritedIndustries,
  onPosted,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const createIdea = useMutation(api.ideas.createIdea);
  // Track on-screen keyboard height so the dialog shrinks + the
  // scrollable body reserves bottom padding equal to the keyboard's
  // occlusion. Without this the Post Contribution button lands
  // behind the keyboard on iOS Safari + Android Chrome (see product
  // ask: "while typing the mobile layout mess fix it for android
  // ios and all types of mobiles").
  const kb = useKeyboardInsets();

  // Clear the form whenever the dialog opens fresh so a previous
  // draft (from a cancelled post) doesn't leak into the next one.
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setVisibility("public");
      setError("");
    }
  }, [open]);

  const tags = useMemo(
    () => [
      ...inheritedSkills.map((s) => ({ label: s, kind: "skill" as const })),
      ...inheritedIndustries.map((s) => ({
        label: s,
        kind: "industry" as const,
      })),
    ],
    [inheritedSkills, inheritedIndustries],
  );

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const isValid =
    trimmedTitle.length > 0 &&
    trimmedDescription.length > 0 &&
    trimmedDescription.length <= 1200 &&
    !submitting;

  const composedTitle = trimmedTitle
    ? `${projectName}:${trimmedTitle}`
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await createIdea({
        title: composedTitle,
        description: trimmedDescription,
        category:
          inheritedSkills.length > 0 ? JSON.stringify(inheritedSkills) : "",
        industries:
          inheritedIndustries.length > 0
            ? JSON.stringify(inheritedIndustries)
            : undefined,
        visibility,
        // Link the contribution to the parent project so it appears
        // as a child node in the Idea Hierarchy flowchart. Product
        // ask: "make sure the contribution also comes in hierarchy
        // flow chart". convex/ideas.ts:createIdea validates that the
        // caller is either the parent's author OR has an accepted
        // contribution request — both conditions match the flow that
        // reaches this dialog (author-owner OR accepted contributor).
        parentId: parentIdeaId,
      });
      const newIdeaId = (res as { ideaId: Id<"ideas"> }).ideaId;
      onPosted?.(newIdeaId);
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to post contribution.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Matches FlareComposeDialog.tsx line 199 dims + palette so the
        // two compose surfaces feel like siblings.
        // `style` overrides the max-h with a visualViewport-derived
        // value so the dialog physically shrinks when the mobile
        // keyboard opens (see useKeyboardInsets docstring for the
        // per-browser rationale).
        className="w-[min(100%-2rem,680px)] max-w-[680px] gap-0 flex flex-col rounded-[20px] border border-white/5 bg-[#0A0E1A] p-0 text-[#F9FAFB] shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden h-auto max-h-[90dvh]"
        style={keyboardSafeStyle(kb, { reserveVh: 0.92 })}
      >
        <DialogHeader className="border-b border-white/5 px-5 py-3 text-left bg-[#0D1117] shrink-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
              Post Contribution
              <span className="rounded-md bg-indigo-500/15 border border-indigo-400/25 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                {projectName || "Project"}
              </span>
            </DialogTitle>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0"
        >
          <div
            className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 sm:px-5 space-y-3 min-h-0"
            // Reserve just enough bottom padding so the focused
            // input never lands right on top of the sticky footer
            // when the keyboard scroll-into-view happens. The
            // container itself is already max-height-clamped above.
            style={kb.isKeyboardOpen ? { scrollPaddingBottom: 96 } : undefined}
          >
            {/* Title with locked project prefix */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/60 mb-1">
                Title
              </label>
              <div className="flex items-stretch rounded-[10px] border border-white/5 bg-[#0D1117] focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#6366F1]">
                <span className="flex items-center pl-3 pr-1 text-sm font-semibold text-indigo-300 select-none">
                  {projectName || "Project"}:
                </span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="progress"
                  maxLength={100}
                  autoFocus
                  className="flex-1 bg-transparent border-0 outline-none px-1 py-2.5 text-sm text-white placeholder:text-[#6B7280]"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/60 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you build, ship, learn, or need help with?"
                maxLength={1400}
                rows={5}
                className="w-full resize-none rounded-[10px] border border-white/5 bg-[#0D1117] p-3 text-sm text-white placeholder:text-[#6B7280] outline-none focus:border-transparent focus:ring-2 focus:ring-[#6366F1]"
                onKeyDown={(e) => e.stopPropagation()}
              />
              <div className="mt-1 flex justify-end text-[10px] text-white/40">
                {trimmedDescription.length}/1200
              </div>
            </div>

            {/* Inherited tags — read-only chips (product spec: "tags
                will be already there which are used for the project"). */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/60 mb-1">
                Tags (inherited from project)
              </label>
              {tags.length === 0 ? (
                <p className="text-xs text-white/40 italic">
                  No tags on this project yet — the contribution will post
                  without tags.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={`${t.kind}:${t.label}`}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        t.kind === "skill"
                          ? "border-purple-400/25 bg-purple-500/10 text-purple-200"
                          : "border-teal-400/25 bg-teal-500/10 text-teal-200",
                      )}
                    >
                      #{t.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-[10px] border py-2 text-xs font-semibold transition",
                  visibility === "public"
                    ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-100"
                    : "border-white/5 bg-white/[0.02] text-white/60 hover:bg-white/[0.05]",
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-[10px] border py-2 text-xs font-semibold transition",
                  visibility === "private"
                    ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                    : "border-white/5 bg-white/[0.02] text-white/60 hover:bg-white/[0.05]",
                )}
              >
                <Lock className="h-3.5 w-3.5" />
                Private
              </button>
            </div>

            {error && (
              <p className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/5 px-5 pt-3 pb-4 bg-[#0D1117] shrink-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-[10px] px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/[0.05] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={cn(
                "inline-flex items-center gap-2 rounded-[10px] px-5 py-2 text-sm font-semibold transition",
                isValid
                  ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:from-[#5053df] hover:to-[#7c4ee4]"
                  : "bg-white/[0.05] text-white/40 cursor-not-allowed",
              )}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Post Contribution
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ContributionComposeDialog;
