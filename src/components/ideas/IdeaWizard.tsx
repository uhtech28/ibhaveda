"use client";

import React, { useState } from "react";
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

type Step = "outline" | "generating" | "preview";
type Visibility = "public" | "private";

interface IdeaWizardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IdeaWizard({ isOpen, onOpenChange }: IdeaWizardProps) {
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
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const handleGenerate = async () => {
    if (!outline.trim()) return;
    setAiHadError(false);
    setStep("generating");
    try {
      const result = await generateFromOutline({ outline: outline.trim() });
      setTitle(result.title);
      setDescription(result.description);
      setIndustries(result.industries);
      setSkills(result.skills);
      setVisibility(result.visibility);
      setStep("preview");
    } catch (err) {
      console.error("AI generation failed:", err);
      setAiHadError(true);
      setDescription(outline);
      setStep("preview");
    }
  };

  const handleSkipAI = () => {
    // Pre-fill description with whatever the user has typed (may be empty).
    // The Review step's required-field validation catches empties on submit.
    setDescription(outline.trim());
    setStep("preview");
  };

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Step 1 — Outline */}
        {step === "outline" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Describe your idea
              </DialogTitle>
              <DialogDescription>
                Write a few sentences. We&apos;ll draft the full form for you — you can edit everything in the next step.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              <Textarea
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                placeholder="e.g. An app that helps remote teams pick a meet-up city based on flight cost and weather. Built for distributed startup teams that retreat 2-3 times a year."
                className="min-h-[160px] resize-none"
                maxLength={500}
                autoFocus
              />
              <div className="text-xs text-muted-foreground text-right">
                {outline.length}/500
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkipAI}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Skip AI, fill manually →
              </button>
              <div className="flex gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!outline.trim()}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 2 — Generating */}
        {step === "generating" && (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Generating</DialogTitle>
              <DialogDescription className="sr-only">
                AI is drafting your idea form.
              </DialogDescription>
            </DialogHeader>
            <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
              <Spinner size={36} />
              <div>
                <p className="font-medium">Drafting your idea…</p>
                <p className="text-xs text-muted-foreground mt-1">This usually takes 1–2 seconds.</p>
              </div>
            </div>
          </>
        )}

        {/* Step 3 — Preview & post */}
        {step === "preview" && (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Review and post</DialogTitle>
              <DialogDescription>
                {aiHadError
                  ? "AI couldn't fill the form this time — please fill it in below."
                  : "Edit anything you want, then post."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="wiz-title" className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="wiz-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A short, specific title"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wiz-description" className="text-sm font-medium">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="wiz-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's the idea? Who is it for?"
                  className="min-h-[120px]"
                  maxLength={1200}
                  required
                />
                <div className="text-[10px] text-muted-foreground text-right">
                  {description.length}/1200
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Industries</Label>
                  <IndustriesMultiSelect
                    selectedIndustries={industries}
                    onChange={setIndustries}
                    placeholder="Select industries..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Skills needed</Label>
                  <SkillsMultiSelect
                    selectedSkills={skills}
                    onChange={setSkills}
                    placeholder="Select skills..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="sr-only">Visibility</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      visibility === "public"
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/60 bg-muted/20 hover:border-border"
                    )}
                  >
                    <div className={cn("mt-0.5 grid h-8 w-8 place-items-center rounded-lg", visibility === "public" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold">Public</span>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        Anyone can spark, comment, and ask to collaborate.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      visibility === "private"
                        ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30"
                        : "border-border/60 bg-muted/20 hover:border-border"
                    )}
                  >
                    <div className={cn("mt-0.5 grid h-8 w-8 place-items-center rounded-lg", visibility === "private" ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground")}>
                      <Lock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold">Private</span>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        Only you can see it. Use as a draft.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Attachment <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <CardUpload
                  maxFiles={1}
                  maxSize={50 * 1024 * 1024}
                  accept={"application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/jpg,image/png,image/gif,video/mp4,.pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.gif,.mp4"}
                  multiple={false}
                  onChange={(f) => setFiles(f)}
                />
                <p className="text-[10px] text-muted-foreground">
                  PDF, DOCX, PPTX, XLSX, JPG, PNG, GIF, MP4 (≤50MB)
                </p>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{submitError}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-2 border-t border-border/40 mt-2">
              <button
                type="button"
                onClick={() => setStep("outline")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4" /> Back to outline
              </button>
              <div className="flex gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={close} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                >
                  {isSubmitting ? <Spinner size={16} className="mr-2" /> : null}
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