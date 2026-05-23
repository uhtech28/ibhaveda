"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";
import { IndustriesMultiSelect } from "@/components/IndustriesMultiSelect";
import CardUpload from "@/components/card-upload";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowLeft, AlertCircle, Globe, Lock } from "lucide-react";
import { displayFontClass, transitionBase } from "@/components/ideaforge/shared";

type Step = "outline" | "generating" | "preview";
type Visibility = "public" | "private";

interface IdeaWizardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialDraft?: {
    title?: string;
    description?: string;
    skills?: string[];
    tags?: string[];
    category?: string;
    industries?: string[];
    visibility?: "public" | "private";
  };
}

export function IdeaWizard({ isOpen, onOpenChange, initialDraft }: IdeaWizardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const generateFromOutline = useAction(api.ai.generateIdeaFromOutline);
  const createIdea = useMutation(api.ideas.createIdea);
  const generateUploadUrl = useMutation(api.ideas.generateUploadUrl);
  const attachFileToIdea = useMutation(api.ideas.attachFileToIdea);

  const [step, setStep] = useState<Step>("outline");

  // Step 1
  const [outline, setOutline] = useState("");

  // Step 3 — form fields, pre-filled in step 2
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [files, setFiles] = useState<File[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [aiHadError, setAiHadError] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  const reset = () => {
    setStep("outline");
    setOutline("");
    setTitle("");
    setDescription("");
    setIndustries([]);
    setSkills([]);
    setVisibility("public");
    setFiles([]);
    setIsSubmitting(false);
    setSubmitError("");
    setAiHadError(false);
    setIsGeneratingTags(false);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  // Populate/reset fields based on isOpen and initialDraft
  useEffect(() => {
    if (isOpen) {
      if (initialDraft && Object.keys(initialDraft).length > 0) {
        setTitle(initialDraft.title || "");
        setDescription(initialDraft.description || "");
        setVisibility(initialDraft.visibility || "public");

        // Map skills/tags
        let mappedSkills: string[] = [];
        if (initialDraft.skills && initialDraft.skills.length > 0) {
          mappedSkills = initialDraft.skills;
        } else if (initialDraft.tags && initialDraft.tags.length > 0) {
          mappedSkills = initialDraft.tags;
        } else if (initialDraft.category) {
          try {
            const parsed = JSON.parse(initialDraft.category);
            mappedSkills = Array.isArray(parsed) ? parsed : [initialDraft.category];
          } catch {
            mappedSkills = [initialDraft.category];
          }
        }
        setSkills(mappedSkills);

        // Map industries
        let mappedIndustries: string[] = [];
        if (initialDraft.industries && initialDraft.industries.length > 0) {
          mappedIndustries = initialDraft.industries;
        } else if (initialDraft.industries) {
          // If it's a stringified JSON array
          try {
            const parsed = JSON.parse(initialDraft.industries as any);
            mappedIndustries = Array.isArray(parsed) ? parsed : [initialDraft.industries as any];
          } catch {
            mappedIndustries = [initialDraft.industries as any];
          }
        }
        setIndustries(mappedIndustries);

        setStep("preview");
      } else {
        reset();
      }
    }
  }, [isOpen, initialDraft]);

  const handleGenerate = async () => {
    if (!outline.trim()) return;
    setAiHadError(false);
    setStep("generating");
    try {
      const result = await generateFromOutline({ outline: outline.trim() });
      
      // Log what AI returned for debugging
      console.log("AI generated result:", result);
      
      // Ensure we have at least a title and description
      if (!result.title || !result.title.trim()) {
        console.warn("AI returned empty title, using fallback");
        setAiHadError(true);
        setTitle("");
        setDescription(result.description || outline);
        setIndustries(result.industries || []);
        setSkills(result.skills || []);
        setVisibility(result.visibility || "public");
      } else {
        setTitle(result.title);
        setDescription(result.description);
        setIndustries(result.industries || []);
        setSkills(result.skills || []);
        setVisibility(result.visibility);
      }
      
      setStep("preview");
    } catch (err) {
      console.error("AI generation failed:", err);
      setAiHadError(true);
      setTitle("");
      setDescription(outline);
      setIndustries([]);
      setSkills([]);
      setVisibility("public");
      setStep("preview");
    }
  };

  const handleSkipAI = () => {
    setDescription(outline.trim());
    setStep("preview");
  };

  // Auto-generate tags when title and description are filled (only if user skipped AI)
  useEffect(() => {
    const generateTags = async () => {
      if (step === "preview" && title.trim() && description.trim() && industries.length === 0 && skills.length === 0 && !isGeneratingTags && aiHadError) {
        setIsGeneratingTags(true);
        try {
          const result = await generateFromOutline({ outline: `${title}\n\n${description}` });
          setIndustries(result.industries);
          setSkills(result.skills);
        } catch (err) {
          console.error("Tag generation failed:", err);
        } finally {
          setIsGeneratingTags(false);
        }
      }
    };
    generateTags();
  }, [step, title, description, industries.length, skills.length, isGeneratingTags, aiHadError, generateFromOutline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!title.trim()) {
      setSubmitError("Title is required.");
      return;
    }
    if (!description.trim()) {
      setSubmitError("Description is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createIdea({
        title: title.trim(),
        description: description.trim(),
        category: skills.length > 0 ? JSON.stringify(skills) : "",
        industries: industries.length > 0 ? JSON.stringify(industries) : undefined,
        visibility,
      });
      const newIdeaId = res.ideaId as Id<"ideas">;

      if (files.length > 0) {
        const file = files[0];
        try {
          const { uploadUrl } = await generateUploadUrl({});
          const uploadResp = await fetch(uploadUrl, { method: "POST", body: file });
          if (uploadResp.ok) {
            const { storageId } = (await uploadResp.json()) as { storageId?: string };
            if (storageId) {
              await attachFileToIdea({
                ideaId: newIdeaId,
                storageId,
                name: file.name,
                type: file.type,
                size: file.size,
                uploadedAt: Date.now(),
              });
            }
          }
        } catch (uploadErr) {
          console.error("File upload failed:", uploadErr);
          toast({
            title: "Idea posted, attachment upload failed",
            description: "You can edit the idea to attach a file later.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: visibility === "public" ? "Idea posted!" : "Saved as private",
        description:
          visibility === "public"
            ? "Taking you to your idea..."
            : "Only you can see it — toggle to Public any time.",
      });
      close();
      router.push(`/idea/${newIdeaId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to post idea.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="w-[min(100%-2rem,600px)] max-w-[600px] h-auto max-h-[85vh] gap-0 flex flex-col rounded-[16px] border border-white/5 bg-[#0A0E1A] p-0 text-[#F9FAFB] shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
        {/* Step 1 — Outline */}
        {step === "outline" && (
          <>
            <DialogHeader className="border-b border-white/5 px-5 py-3 text-left bg-[#0D1117] shrink-0">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-[#8B5CF6] animate-pulse" />
                <DialogTitle className={cn(displayFontClass, "text-lg font-semibold text-white")}>
                  Describe your idea
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-[#9CA3AF] mt-1">
                Briefly describe your idea. AI will generate the full form.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col px-5 py-4 min-h-0">
              <div className="relative flex-1">
                <Textarea
                  value={outline}
                  onChange={(e) => setOutline(e.target.value)}
                  placeholder="e.g. An app that helps remote teams pick a meet-up city based on flight cost and weather. Built for distributed startup teams that retreat 2-3 times a year."
                  className="h-full resize-none rounded-[12px] border-white/5 bg-[#0D1117] text-sm text-white placeholder:text-[#6B7280] focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-0 focus-visible:border-transparent p-4"
                  maxLength={500}
                  autoFocus
                />
                <div className="absolute bottom-3 right-4 text-xs text-[#6B7280]">
                  {outline.length}/500
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/5 px-5 py-3 bg-[#0D1117] shrink-0">
              <button
                type="button"
                onClick={handleSkipAI}
                className="text-xs font-medium text-[#C7D2FE] hover:text-white transition-colors"
              >
                Skip AI, fill manually →
              </button>
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={close}
                  className="h-9 rounded-[10px] border-white/5 bg-[#0D1117] px-4 text-sm text-[#9CA3AF] hover:bg-white/[0.08] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!outline.trim()}
                  className="h-9 rounded-[10px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 text-sm font-semibold text-white hover:from-[#5053df] hover:to-[#7c4ee4] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 2 — Generating */}
        {step === "generating" && (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Generating</DialogTitle>
              <DialogDescription>AI is drafting your idea form.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center bg-[#0D1117]">
              <div className="relative">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#6366F1]/20 border-t-[#8B5CF6]" />
                <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-[#C7D2FE] animate-pulse" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">Drafting your idea…</p>
                <p className="text-xs text-[#9CA3AF] mt-1.5">This usually takes 1–2 seconds.</p>
              </div>
            </div>
          </>
        )}

        {/* Step 3 — Preview & post */}
        {step === "preview" && (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <DialogHeader className="border-b border-white/5 px-5 py-3 text-left bg-[#0D1117] shrink-0">
              <DialogTitle className={cn(displayFontClass, "text-lg font-semibold text-white")}>
                Review and post
              </DialogTitle>
              <DialogDescription className="text-xs text-[#9CA3AF] mt-1">
                {aiHadError
                  ? "AI couldn't fill the form this time — please fill it in below."
                  : !aiHadError && title && description
                  ? "✨ AI filled the form for you. Review and edit as needed."
                  : "Edit anything you want, then post."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 min-h-0">
              <div className="space-y-1">
                <Label htmlFor="wiz-title" className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="wiz-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A short, specific title"
                  maxLength={100}
                  className="h-9 rounded-[10px] border-white/5 bg-[#0D1117] text-sm text-white placeholder:text-[#6B7280] focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-0 focus-visible:border-transparent px-3"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="wiz-description" className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[10px] text-[#6B7280]">
                    {description.length}/1200
                  </span>
                </div>
                <Textarea
                  id="wiz-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's the idea? Who is it for?"
                  className="min-h-[70px] max-h-[100px] rounded-[10px] border-white/5 bg-[#0D1117] text-sm text-white placeholder:text-[#6B7280] focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-0 focus-visible:border-transparent p-3"
                  maxLength={1200}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider flex items-center gap-1.5">
                    Industries
                    {isGeneratingTags && <Sparkles className="h-3 w-3 text-[#8B5CF6] animate-pulse" />}
                  </Label>
                  <IndustriesMultiSelect
                    selectedIndustries={industries}
                    onChange={setIndustries}
                    placeholder={isGeneratingTags ? "AI is selecting..." : "Select industries..."}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider flex items-center gap-1.5">
                    Skills needed
                    {isGeneratingTags && <Sparkles className="h-3 w-3 text-[#8B5CF6] animate-pulse" />}
                  </Label>
                  <SkillsMultiSelect
                    selectedSkills={skills}
                    onChange={setSkills}
                    placeholder={isGeneratingTags ? "AI is selecting..." : "Select skills..."}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider">Visibility <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={cn(
                      "flex items-start gap-2 rounded-xl border p-2 text-left transition-all",
                      visibility === "public"
                        ? "border-[#6366F1]/50 bg-[#6366F1]/10 ring-1 ring-[#6366F1]/30"
                        : "border-white/5 bg-[#0D1117] hover:border-white/10 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className={cn("mt-0.5 grid h-6 w-6 place-items-center rounded-lg transition-colors shrink-0", visibility === "public" ? "bg-[#6366F1]/20 text-[#C7D2FE]" : "bg-white/[0.05] text-[#9CA3AF]")}>
                      <Globe className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-white">Public</span>
                      <p className="mt-0.5 text-[10px] leading-tight text-[#9CA3AF]">
                        Anyone can spark, comment, and ask to collaborate.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={cn(
                      "flex items-start gap-2 rounded-xl border p-2 text-left transition-all",
                      visibility === "private"
                        ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30"
                        : "border-white/5 bg-[#0D1117] hover:border-white/10 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className={cn("mt-0.5 grid h-6 w-6 place-items-center rounded-lg transition-colors shrink-0", visibility === "private" ? "bg-amber-500/20 text-amber-400" : "bg-white/[0.05] text-[#9CA3AF]")}>
                      <Lock className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-white">Private</span>
                      <p className="mt-0.5 text-[10px] leading-tight text-[#9CA3AF]">
                        Only you can see it. Use as a draft.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider">
                  Attachment <span className="text-[11px] text-[#6B7280] font-normal lowercase">(optional)</span>
                </Label>
                <CardUpload
                  maxFiles={1}
                  maxSize={50 * 1024 * 1024}
                  accept={"application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/jpg,image/png,image/gif,video/mp4,.pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.gif,.mp4"}
                  multiple={false}
                  onChange={(f) => setFiles(f)}
                />
                <p className="text-[10px] text-[#6B7280]">
                  PDF, DOCX, PPTX, XLSX, JPG, PNG, GIF, MP4 (≤50MB)
                </p>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 p-2.5 rounded-[10px] bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-200">{submitError}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/5 px-5 py-3 bg-[#0D1117] shrink-0">
              <button
                type="button"
                onClick={() => setStep("outline")}
                className="text-xs text-[#9CA3AF] hover:text-white transition-colors flex items-center gap-1.5"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to outline
              </button>
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={close}
                  disabled={isSubmitting}
                  className="h-9 rounded-[10px] border-white/5 bg-[#0A0E1A] px-4 text-sm text-[#9CA3AF] hover:bg-white/[0.08] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className="h-9 rounded-[10px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 text-sm font-semibold text-white hover:from-[#5053df] hover:to-[#7c4ee4] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Spinner size={14} className="mr-2" /> : null}
                  Post Idea
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}