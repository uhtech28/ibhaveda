"use client";

/**
 * @file ContributionComposeDialog.tsx
 * @description Compose dialog for the CONTRIBUTIONS tile in the
 *   Adventurer's Menu.
 *
 *   Post-review polish rev — visible label headings ("Title",
 *   "Description", "Tags (inherited from project)") and the header
 *   project-name chip + Cancel button are all removed. Tags are now
 *   EDITABLE via SkillsMultiSelect + IndustriesMultiSelect, seeded
 *   with the parent project's existing tags so the common case is
 *   still "just post" but users can tweak per contribution.
 *
 *   Title mechanism unchanged — the input renders the parent
 *   project's title as a locked prefix so the posted idea becomes
 *   `${projectName}:${userTypedSuffix}` (visible in the /feed).
 *
 *   Wraps the shadcn `Dialog` primitive so the surrounding scrim +
 *   subtle blur match FlareComposeDialog exactly.
 *
 *   Under the hood this calls the same `api.ideas.createIdea`
 *   mutation the /feed post form uses, with `parentId` set to the
 *   project's idea so contributions show up as child nodes in the
 *   Idea Hierarchy flowchart.
 */

import React, { useEffect, useState } from "react";
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
  keyboardSafeDialogStyle,
} from "@/lib/hooks/useKeyboardInsets";
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";
import { IndustriesMultiSelect } from "@/components/IndustriesMultiSelect";

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
  /** Skills tags on the parent project — used as the initial value
   *  for the editable Skills picker. */
  inheritedSkills: readonly string[];
  /** Industries tags on the parent project — used as the initial
   *  value for the editable Industries picker. */
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
  // Tags start seeded from the parent project (matches the "tags will
  // be already there" behavior from the earlier rev) but are now
  // fully editable via the same MultiSelect components used in
  // profile-setup and IdeaWizard.
  const [skills, setSkills] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  const createIdea = useMutation(api.ideas.createIdea);
  const kb = useKeyboardInsets();

  // Reset every field to the parent's defaults whenever the dialog
  // opens fresh so a previous draft (from a cancelled post) doesn't
  // leak into the next one.
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setVisibility("public");
      setError("");
      setSkills(Array.from(inheritedSkills));
      setIndustries(Array.from(inheritedIndustries));
    }
  }, [open, inheritedSkills, inheritedIndustries]);

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
        category: skills.length > 0 ? JSON.stringify(skills) : "",
        industries:
          industries.length > 0 ? JSON.stringify(industries) : undefined,
        visibility,
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
        className="w-[min(100%-2rem,680px)] max-w-[680px] gap-0 flex flex-col rounded-[20px] border border-white/5 bg-[#0A0E1A] p-0 text-[#F9FAFB] shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden h-auto max-h-[90dvh]"
        style={keyboardSafeDialogStyle(kb, { reserveVh: 0.92 })}
      >
        {/* Header — just the "Post Contribution" title, no project-
            name chip on the right. Product ask: "remove new builder
            wants to push... line". The project name still appears
            in-context as the locked prefix inside the title input
            below, so no information is lost. */}
        <DialogHeader className="border-b border-white/5 px-5 py-3 text-left bg-[#0D1117] shrink-0">
          <DialogTitle className="text-lg font-semibold text-white">
            Post Contribution
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0"
        >
          <div
            className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 sm:px-5 space-y-3 min-h-0"
            style={kb.isKeyboardOpen ? { scrollPaddingBottom: 96 } : undefined}
          >
            {/* Title — no label heading per product ask "remove the
                written headings title description tags". The locked
                project prefix + the placeholder ("progress") make
                the intent obvious. */}
            <div className="flex items-stretch rounded-[10px] border border-white/5 bg-[#0D1117] focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#6366F1]">
              <span className="flex items-center pl-3 pr-1 text-sm font-semibold text-indigo-300 select-none max-w-[55%] truncate">
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

            {/* Description — no label heading either. */}
            <div>
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

            {/* Tags — editable dropdowns, seeded from parent project.
                Product ask: "tags should be shown that are there for
                project but it should be editable so add the drop
                down for selecting tags". Same MultiSelect components
                used in profile-setup + IdeaWizard so vocabulary
                stays consistent across the app. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <IndustriesMultiSelect
                selectedIndustries={industries}
                onChange={setIndustries}
                placeholder="Industries…"
              />
              <SkillsMultiSelect
                selectedSkills={skills}
                onChange={setSkills}
                placeholder="Skills…"
              />
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

          {/* Footer — Post Contribution only. Cancel button removed
              per product ask ("remove cancel button"). The dialog's
              default × close and the shadcn overlay click-out are
              still available for dismissal. */}
          <div className="flex items-center justify-end gap-3 border-t border-white/5 px-5 pt-3 pb-4 bg-[#0D1117] shrink-0">
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
