"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  codeFontClass,
  composerCategories,
  ComposerDraft,
  displayFontClass,
  stageOptions,
  transitionBase,
} from "@/components/ideaforge/shared";

export function ComposerModal({
  open,
  onOpenChange,
  initialDraft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDraft?: Partial<ComposerDraft>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [draft, setDraft] = useState<ComposerDraft>({
    title: initialDraft?.title || "",
    description: initialDraft?.description || "",
    tags: initialDraft?.tags || [],
    category: initialDraft?.category || composerCategories[0],
    stage: initialDraft?.stage || stageOptions[0],
  });

  useEffect(() => {
    if (open) {
      setDraft({
        title: initialDraft?.title || "",
        description: initialDraft?.description || "",
        tags: initialDraft?.tags || [],
        category: initialDraft?.category || composerCategories[0],
        stage: initialDraft?.stage || stageOptions[0],
      });
      setTagInput("");
    }
  }, [initialDraft, open]);

  const commitDraft = (storageKey: string, message: string) => {
    const payload = JSON.stringify(draft);
    window.sessionStorage.setItem(storageKey, payload);
    if (storageKey === "ideaforge-composer-draft") {
      window.localStorage.setItem(storageKey, payload);
    }
    toast({
      title: message,
      description:
        storageKey === "ideaforge-composer-publish"
          ? "We moved your draft into the full editor so you can finish publishing without losing work."
          : "Your draft is saved locally in this browser.",
    });
  };

  const addTag = () => {
    const normalized = tagInput.trim();
    if (!normalized || draft.tags.includes(normalized)) return;
    setDraft((current) => ({ ...current, tags: [...current.tags, normalized] }));
    setTagInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100%-1.5rem,760px)] max-w-[760px] gap-0 overflow-hidden rounded-[24px] border border-white/10 bg-[#0F1726] p-0 text-[#F9FAFB] shadow-[0_24px_80px_rgba(3,7,18,0.65)]">
        <DialogHeader className="border-b border-white/8 px-6 py-5 text-left">
          <DialogTitle className={cn(displayFontClass, "text-[1.4rem] font-semibold")}>
            Post an Idea
          </DialogTitle>
          <DialogDescription className="text-sm text-[#9CA3AF]">
            Start with a crisp concept here, then hand off to the full InteractiveIdeas
            publishing flow when you are ready.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#F9FAFB]">Title</label>
            <Input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="What are you building?"
              className={cn(
                displayFontClass,
                "h-12 rounded-[14px] border-white/10 bg-white/[0.03] text-lg text-white placeholder:text-[#6B7280] focus-visible:ring-2 focus-visible:ring-[#6366F1]"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#F9FAFB]">Description</label>
            <Textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Describe the problem, the spark, and why now."
              className="min-h-[140px] rounded-[16px] border-white/10 bg-white/[0.03] text-base text-white placeholder:text-[#6B7280] focus-visible:ring-2 focus-visible:ring-[#6366F1]"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F9FAFB]">Tag Selector</label>
              <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-3 flex flex-wrap gap-2">
                  {draft.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          tags: current.tags.filter((entry) => entry !== tag),
                        }))
                      }
                      className={cn(
                        codeFontClass,
                        transitionBase,
                        "rounded-full border border-[#6366F1]/30 bg-[#6366F1]/12 px-3 py-1 text-[11px] text-[#C7D2FE] hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/16"
                      )}
                    >
                      {tag} x
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="h-10 rounded-[12px] border-white/10 bg-[#0A0D12] text-white placeholder:text-[#6B7280]"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    className="rounded-[12px] bg-[#6366F1] px-4 text-white hover:bg-[#8B5CF6]"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F9FAFB]">Category</label>
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, category: event.target.value }))
                  }
                  className="h-11 w-full rounded-[14px] border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none ring-0 transition-all duration-200 focus:border-[#6366F1]"
                >
                  {composerCategories.map((category) => (
                    <option key={category} value={category} className="bg-[#111827] text-white">
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F9FAFB]">Stage</label>
                <select
                  value={draft.stage}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, stage: event.target.value }))
                  }
                  className="h-11 w-full rounded-[14px] border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none ring-0 transition-all duration-200 focus:border-[#6366F1]"
                >
                  {stageOptions.map((stage) => (
                    <option key={stage} value={stage} className="bg-[#111827] text-white">
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={cn(
              transitionBase,
              "group flex w-full items-center justify-between rounded-[18px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-5 text-left hover:border-[#6366F1]/50 hover:bg-[#6366F1]/6"
            )}
          >
            <div>
              <div className={cn(displayFontClass, "text-base font-semibold text-white")}>
                Image Upload Area
              </div>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                Drag and drop a concept banner or upload a screenshot for visual
                context.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-3 text-[#C7D2FE] group-hover:border-[#6366F1]/50">
              <ImagePlus className="h-5 w-5" />
            </div>
          </button>
        </div>

        <DialogFooter className="border-t border-white/8 px-6 py-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-[10px] text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => commitDraft("ideaforge-composer-draft", "Draft saved")}
            className="rounded-[10px] border-white/10 bg-white/[0.03] text-white hover:border-[#6366F1]/40 hover:bg-[#6366F1]/10"
          >
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={() => {
              commitDraft("ideaforge-composer-publish", "Draft moved to publisher");
              onOpenChange(false);
              router.push("/create-idea");
            }}
            className="rounded-[10px] bg-[#6366F1] px-5 text-white hover:bg-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-[#6366F1]"
          >
            Publish Idea -&gt;
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
