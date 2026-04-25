"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Sparkles, Wand2, RefreshCw } from "lucide-react";

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
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({
    title: "",
    description: "",
    tags: [] as string[],
  });
  const [draft, setDraft] = useState<ComposerDraft>({
    title: initialDraft?.title || "",
    description: initialDraft?.description || "",
    tags: initialDraft?.tags || [],
    category: initialDraft?.category || "Venture",
    stage: initialDraft?.stage || stageOptions[0],
  });

  useEffect(() => {
    if (open) {
      setDraft({
        title: initialDraft?.title || "",
        description: initialDraft?.description || "",
        tags: initialDraft?.tags || [],
        category: initialDraft?.category || "Venture",
        stage: initialDraft?.stage || stageOptions[0],
      });
      setTagInput("");
      setAiSuggestions({ title: "", description: "", tags: [] });
    }
  }, [initialDraft, open]);

  // AI suggestion generator (simulated)
  const generateAiSuggestions = async () => {
    if (!draft.title && !draft.description) return;
    
    setIsGenerating(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate suggestions based on input
    const titleWords = draft.title.toLowerCase().split(" ");
    const descWords = draft.description.toLowerCase().split(" ");
    
    // Smart title enhancement
    let suggestedTitle = draft.title;
    if (draft.title && draft.title.length < 50) {
      if (!draft.title.includes("AI") && (titleWords.includes("automation") || titleWords.includes("smart"))) {
        suggestedTitle = draft.title + " - AI-Powered Solution";
      } else if (titleWords.includes("platform") || titleWords.includes("app")) {
        suggestedTitle = draft.title + " for Modern Businesses";
      }
    }
    
    // Smart description enhancement
    let suggestedDescription = draft.description;
    if (draft.description && draft.description.length < 200) {
      if (draft.category === "Venture") {
        suggestedDescription += "\n\nThis venture addresses a critical market gap by providing innovative solutions that scale efficiently. Our approach combines cutting-edge technology with user-centric design to deliver measurable value.";
      }
    }
    
    // Smart tag suggestions
    const suggestedTags: string[] = [];
    const allWords = [...titleWords, ...descWords];
    
    if (allWords.some(w => ["ai", "artificial", "intelligence", "ml", "machine"].includes(w))) {
      suggestedTags.push("AI", "Machine Learning");
    }
    if (allWords.some(w => ["saas", "software", "platform", "app"].includes(w))) {
      suggestedTags.push("SaaS", "Software");
    }
    if (allWords.some(w => ["business", "startup", "venture", "company"].includes(w))) {
      suggestedTags.push("Startup", "Business");
    }
    if (allWords.some(w => ["automation", "automate", "automated"].includes(w))) {
      suggestedTags.push("Automation");
    }
    if (allWords.some(w => ["data", "analytics", "insights"].includes(w))) {
      suggestedTags.push("Data Analytics");
    }
    if (allWords.some(w => ["mobile", "ios", "android"].includes(w))) {
      suggestedTags.push("Mobile");
    }
    if (allWords.some(w => ["web", "website", "online"].includes(w))) {
      suggestedTags.push("Web");
    }
    if (allWords.some(w => ["blockchain", "crypto", "web3"].includes(w))) {
      suggestedTags.push("Blockchain", "Web3");
    }
    
    setAiSuggestions({
      title: suggestedTitle !== draft.title ? suggestedTitle : "",
      description: suggestedDescription !== draft.description ? suggestedDescription : "",
      tags: suggestedTags.filter(tag => !draft.tags.includes(tag)).slice(0, 5),
    });
    
    setIsGenerating(false);
  };

  // Auto-trigger AI suggestions when user types
  useEffect(() => {
    if (!aiEnabled || !open) return;
    
    const timer = setTimeout(() => {
      if (draft.title || draft.description) {
        generateAiSuggestions();
      }
    }, 2000); // Wait 2 seconds after user stops typing
    
    return () => clearTimeout(timer);
  }, [draft.title, draft.description, aiEnabled, open]);

  const applyAiSuggestion = (field: "title" | "description" | "tags") => {
    if (field === "title" && aiSuggestions.title) {
      setDraft(current => ({ ...current, title: aiSuggestions.title }));
      setAiSuggestions(current => ({ ...current, title: "" }));
    } else if (field === "description" && aiSuggestions.description) {
      setDraft(current => ({ ...current, description: aiSuggestions.description }));
      setAiSuggestions(current => ({ ...current, description: "" }));
    } else if (field === "tags" && aiSuggestions.tags.length > 0) {
      setDraft(current => ({ ...current, tags: [...current.tags, ...aiSuggestions.tags] }));
      setAiSuggestions(current => ({ ...current, tags: [] }));
    }
    
    toast({
      title: "AI Suggestion Applied",
      description: "The suggestion has been added to your idea.",
    });
  };

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
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className={cn(displayFontClass, "text-[1.4rem] font-semibold")}>
                Post a Venture Idea
              </DialogTitle>
              <DialogDescription className="text-sm text-[#9CA3AF]">
                Start with a crisp concept here, then hand off to the full InteractiveIdeas
                publishing flow when you are ready.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => setAiEnabled(!aiEnabled)}
              className={cn(
                transitionBase,
                "flex items-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-medium",
                aiEnabled
                  ? "border-[#6366F1]/30 bg-[#6366F1]/12 text-[#C7D2FE]"
                  : "border-white/10 bg-white/[0.03] text-[#9CA3AF] hover:text-white"
              )}
            >
              <Sparkles className={cn("h-4 w-4", aiEnabled && "animate-pulse")} />
              AI {aiEnabled ? "On" : "Off"}
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          {aiEnabled && isGenerating && (
            <div className="flex items-center gap-3 rounded-[14px] border border-[#6366F1]/20 bg-[#6366F1]/8 px-4 py-3">
              <RefreshCw className="h-4 w-4 animate-spin text-[#6366F1]" />
              <span className="text-sm text-[#C7D2FE]">AI is analyzing your idea and generating suggestions...</span>
            </div>
          )}

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
            {aiEnabled && aiSuggestions.title && (
              <div className="mt-2 rounded-[12px] border border-[#8B5CF6]/20 bg-[#8B5CF6]/8 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#C7D2FE]">
                      <Wand2 className="h-3 w-3" />
                      AI Suggestion
                    </div>
                    <p className="mt-1 text-sm text-white">{aiSuggestions.title}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => applyAiSuggestion("title")}
                    className="h-8 rounded-[8px] bg-[#6366F1] px-3 text-xs text-white hover:bg-[#8B5CF6]"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
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
            {aiEnabled && aiSuggestions.description && (
              <div className="mt-2 rounded-[12px] border border-[#8B5CF6]/20 bg-[#8B5CF6]/8 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#C7D2FE]">
                      <Wand2 className="h-3 w-3" />
                      AI Enhanced Description
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-white">{aiSuggestions.description}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => applyAiSuggestion("description")}
                    className="h-8 rounded-[8px] bg-[#6366F1] px-3 text-xs text-white hover:bg-[#8B5CF6]"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
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
                {aiEnabled && aiSuggestions.tags.length > 0 && (
                  <div className="mb-3 rounded-[10px] border border-[#8B5CF6]/20 bg-[#8B5CF6]/8 p-2">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#C7D2FE]">
                        <Sparkles className="h-3 w-3" />
                        AI Suggested Tags
                      </div>
                      <button
                        type="button"
                        onClick={() => applyAiSuggestion("tags")}
                        className="text-xs text-[#6366F1] hover:text-[#8B5CF6]"
                      >
                        Add All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {aiSuggestions.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setDraft(current => ({ ...current, tags: [...current.tags, tag] }));
                            setAiSuggestions(current => ({ 
                              ...current, 
                              tags: current.tags.filter(t => t !== tag) 
                            }));
                          }}
                          className={cn(
                            codeFontClass,
                            transitionBase,
                            "rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/12 px-2.5 py-1 text-[10px] text-[#DDD6FE] hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/20"
                          )}
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                <div className="relative">
                  <select
                    value={draft.category}
                    disabled
                    className="h-11 w-full rounded-[14px] border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none ring-0 cursor-not-allowed opacity-75"
                  >
                    <option value={draft.category} className="bg-[#111827] text-white">
                      {draft.category}
                    </option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 px-2 py-0.5">
                    <span className="text-[10px] font-medium text-emerald-300">Selected</span>
                  </div>
                </div>
                <p className="text-xs text-[#6B7280]">Category is pre-selected from your venture path</p>
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
