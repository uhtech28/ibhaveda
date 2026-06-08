"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMutation, useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Globe,
  Lock,
  ChevronRight,
  Rocket,
  Palette,
  FlaskConical,
  Microscope,
  type LucideIcon,
} from "lucide-react";
import { displayFontClass } from "@/components/ideaforge/shared";
import { audioManager } from "@/lib/audio/audioManager";
import { type TemplateId } from "@/config/templates";
import { CrossPostSelector } from "@/components/share/CrossPostSelector";
import { CrossPostSharePanel } from "@/components/share/CrossPostSharePanel";
import type { ShareablePayload, SharePlatform } from "@/lib/share/types";

// ─── Template display metadata ─────────────────────────────────────────────

type TemplateDef = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: string;
  accent: string;
};

const TEMPLATE_DEFS: Record<TemplateId, TemplateDef> = {
  venture: {
    icon: Rocket,
    title: "Business Venture",
    subtitle: "Valuation score",
    color: "#818cf8",
    accent: "rgba(129,140,248,0.12)",
  },
  creative: {
    icon: Palette,
    title: "Creative Project",
    subtitle: "Fan score",
    color: "#fbbf24",
    accent: "rgba(251,191,36,0.12)",
  },
  academic: {
    icon: Microscope,
    title: "Research Project",
    subtitle: "JIF score",
    color: "#d4a853",
    accent: "rgba(212,168,83,0.12)",
  },
  lab: {
    icon: FlaskConical,
    title: "Lab Experiment",
    subtitle: "p-value",
    color: "#34d399",
    accent: "rgba(52,211,153,0.12)",
  },
};

const TEMPLATE_ORDER: TemplateId[] = ["venture", "creative", "academic", "lab"];

// ─── Types ─────────────────────────────────────────────────────────────────

type Step = "template" | "outline" | "generating" | "preview" | "share";
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
  /**
   * When set, the wizard runs in tutorial mode: shows a countdown over
   * the Post button and auto-fires submit when it hits zero. Used by
   * the first-run product tour.
   */
  tutorialMode?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function IdeaWizard({
  isOpen,
  onOpenChange,
  initialDraft,
  tutorialMode = false,
}: IdeaWizardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const generateFromOutline = useAction(api.ai.generateIdeaFromOutline);
  const createIdea = useMutation(api.ideas.createIdea);
  const createVenture = useMutation(api.ventures.createVenture);
  const generateUploadUrl = useMutation(api.ideas.generateUploadUrl);
  const attachFileToIdea = useMutation(api.ideas.attachFileToIdea);

  // ── Step & template state ──
  const [step, setStep] = useState<Step>("template");
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateId>("venture");

  // ── Step 2: outline ──
  const [outline, setOutline] = useState("");

  // ── Step 4: form fields ──
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [files, setFiles] = useState<File[]>([]);
  // All four platforms selected by default. The user can deselect any
  // before posting.
  const [crossPostTargets, setCrossPostTargets] = useState<Set<SharePlatform>>(
    new Set(["twitter", "linkedin", "instagram", "facebook"]),
  );
  // Set after a public post so the share step can render its buttons.
  const [sharePayload, setSharePayload] = useState<{
    payload: ShareablePayload;
    platforms: SharePlatform[];
    ventureId: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [aiHadError, setAiHadError] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  // Tutorial countdown state. The countdown number itself lives in a
  // leaf component (TutorialCountdownBanner) so its 1-Hz tick doesn't
  // re-render the whole 1000-line wizard. We only track the pause flag
  // and the active boolean up here.
  const [tutorialPaused, setTutorialPaused] = useState(false);

  // ── Helpers ──
  const reset = () => {
    setStep("template");
    setSelectedTemplate("venture");
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
    setSharePayload(null);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  // Populate fields from initialDraft (skips template + outline steps)
  useEffect(() => {
    if (isOpen) {
      if (initialDraft && Object.keys(initialDraft).length > 0) {
        setTitle(initialDraft.title || "");
        setDescription(initialDraft.description || "");
        setVisibility(initialDraft.visibility || "public");

        let mappedSkills: string[] = [];
        if (Array.isArray(initialDraft.skills)) {
          mappedSkills = initialDraft.skills.filter(
            (entry): entry is string =>
              typeof entry === "string" && entry.length > 0,
          );
        } else if (Array.isArray(initialDraft.tags)) {
          mappedSkills = initialDraft.tags.filter(
            (entry): entry is string =>
              typeof entry === "string" && entry.length > 0,
          );
        } else if (typeof initialDraft.category === "string") {
          try {
            const parsed = JSON.parse(initialDraft.category);
            mappedSkills = Array.isArray(parsed)
              ? parsed.filter(
                  (entry): entry is string => typeof entry === "string",
                )
              : [initialDraft.category];
          } catch {
            mappedSkills = [initialDraft.category];
          }
        }
        setSkills(mappedSkills);

        let mappedIndustries: string[] = [];
        if (Array.isArray(initialDraft.industries)) {
          // Already a normalised array. Filter any junk (empty strings or
          // accidental nested arrays) so the downstream string validator
          // doesn't reject it.
          mappedIndustries = initialDraft.industries.filter(
            (entry): entry is string =>
              typeof entry === "string" && entry.length > 0,
          );
        } else if (typeof initialDraft.industries === "string") {
          // Legacy JSON-string payload.
          try {
            const parsed = JSON.parse(initialDraft.industries);
            mappedIndustries = Array.isArray(parsed)
              ? parsed.filter(
                  (entry): entry is string => typeof entry === "string",
                )
              : [initialDraft.industries];
          } catch {
            mappedIndustries = [initialDraft.industries];
          }
        }
        setIndustries(mappedIndustries);

        setStep("preview");
      } else {
        reset();
        // Tutorial mode: skip the template chooser and drop the user
        // straight onto the AI-description step so the tour highlight
        // has something to point at.
        if (tutorialMode) {
          setStep("outline");
        }
      }
    }
  }, [isOpen, initialDraft, tutorialMode]);

  // ── AI handlers ──
  const handleGenerate = async () => {
    if (!outline.trim()) return;
    setAiHadError(false);
    setStep("generating");
    try {
      const result = await generateFromOutline({ outline: outline.trim() });
      // Prefer the AI-generated description; fall back to the user's
      // outline only if the action returns nothing usable.
      setDescription(
        result.description?.trim() ? result.description.trim() : outline.trim(),
      );
      if (!result.title?.trim()) {
        setAiHadError(true);
        setTitle("");
        setIndustries(result.industries || []);
        setSkills(result.skills || []);
        setVisibility(result.visibility || "public");
      } else {
        setTitle(result.title);
        setIndustries(result.industries || []);
        setSkills(result.skills || []);
        setVisibility(result.visibility);
      }
      setStep("preview");
    } catch {
      setAiHadError(true);
      setTitle("");
      setDescription(outline.trim());
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

  // Auto-generate tags when AI had an error
  useEffect(() => {
    const generateTags = async () => {
      if (
        step === "preview" &&
        title.trim() &&
        description.trim() &&
        industries.length === 0 &&
        skills.length === 0 &&
        !isGeneratingTags &&
        aiHadError
      ) {
        setIsGeneratingTags(true);
        try {
          const result = await generateFromOutline({
            outline: `${title}\n\n${description}`,
          });
          setIndustries(result.industries);
          setSkills(result.skills);
        } catch {
          // silently ignore
        } finally {
          setIsGeneratingTags(false);
        }
      }
    };
    generateTags();
  }, [
    step,
    title,
    description,
    industries.length,
    skills.length,
    isGeneratingTags,
    aiHadError,
    generateFromOutline,
  ]);

  // Whether the countdown should be live. The leaf banner owns the
  // actual timer; we only feed it derived booleans.
  const countdownActive =
    tutorialMode &&
    step === "preview" &&
    !!title.trim() &&
    !!description.trim();

  // ── Submit ──
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

    const willCrossPost =
      visibility === "public" && crossPostTargets.size > 0;

    setIsSubmitting(true);
    try {
      // 1. Create the idea
      const res = await createIdea({
        title: title.trim(),
        description: description.trim(),
        category: skills.length > 0 ? JSON.stringify(skills) : "",
        industries:
          industries.length > 0 ? JSON.stringify(industries) : undefined,
        visibility,
      });
      const newIdeaId = res.ideaId as Id<"ideas">;

      // 2. Create venture with selected template
      const ventureId = await createVenture({
        ideaId: newIdeaId,
        templateId: selectedTemplate,
        skills,
        industries,
      });

      // 3. Handle attachment upload
      if (files.length > 0) {
        const file = files[0];
        try {
          const { uploadUrl } = await generateUploadUrl({});
          const uploadResp = await fetch(uploadUrl, {
            method: "POST",
            body: file,
          });
          if (uploadResp.ok) {
            const { storageId } = (await uploadResp.json()) as {
              storageId?: string;
            };
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
        } catch {
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
            ? willCrossPost
              ? "Now pick where else to share it."
              : "Loading your world map…"
            : "Only you can see it — toggle to Public any time.",
      });

      // Hand off to the share step. We can't open the platform tabs
      // here because the click gesture is gone after the awaits above;
      // browsers would block everything past the first popup. Each
      // button on the share step opens its own tab from a fresh click.
      if (willCrossPost) {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        setSharePayload({
          payload: {
            title: title.trim(),
            text: description.trim().slice(0, 600),
            url: origin ? `${origin}/idea/${newIdeaId}` : undefined,
          },
          platforms: Array.from(crossPostTargets),
          ventureId,
        });
        setStep("share");
        setIsSubmitting(false);
        return;
      }

      close();
      router.push(`/map/world?ventureId=${ventureId}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to post idea.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived (used in outline + preview badge) ──
  const activeDef = TEMPLATE_DEFS[selectedTemplate];

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Tutorial mode locks the wizard: no Escape, no backdrop click,
        // no X. The user can only progress via the highlighted button.
        if (tutorialMode) return;
        if (!open) close();
      }}
    >
      <DialogContent
        showCloseButton={!tutorialMode}
        className={cn(
          "w-[min(100%-2rem,680px)] max-w-[680px] gap-0 flex flex-col rounded-[20px] border border-white/5 bg-[#0A0E1A] p-0 text-[#F9FAFB] shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden h-auto max-h-[85dvh] sm:max-h-[90vh]",
        )}
        onEscapeKeyDown={(e) => tutorialMode && e.preventDefault()}
        onPointerDownOutside={(e) => tutorialMode && e.preventDefault()}
        onInteractOutside={(e) => tutorialMode && e.preventDefault()}
      >
        {/* ── STEP 0: Template selector ───────────────────────────────────── */}
        {step === "template" && (
          <>
            <DialogHeader className="border-b border-white/5 px-5 pt-5 pb-4 text-left bg-[#0A0E1A] shrink-0">
              <DialogTitle
                className={cn(
                  displayFontClass,
                  "text-base font-semibold text-white",
                )}
              >
                What are you working on?
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6B7280] mt-0.5">
                Pick a path — this shapes your world map.
              </DialogDescription>
            </DialogHeader>

            <div className="px-4 py-3 grid grid-cols-2 gap-2">
              {TEMPLATE_ORDER.map((templateId) => {
                const def = TEMPLATE_DEFS[templateId];
                const isSelected = selectedTemplate === templateId;
                return (
                  <button
                    key={templateId}
                    type="button"
                    onClick={() => {
                      audioManager.playTouch("click");
                      setSelectedTemplate(templateId);
                    }}
                    className={cn(
                      "relative flex flex-col gap-2 rounded-xl border px-3 py-3 text-left transition-all duration-200",
                      isSelected
                        ? "border-white/20 bg-white/[0.06] shadow-[0_0_16px_rgba(0,0,0,0.4)]"
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10",
                    )}
                    style={isSelected ? { boxShadow: `0 0 0 1px ${def.color}33, 0 4px 20px ${def.color}1a` } : {}}
                  >
                    {/* Selected dot */}
                    {isSelected && (
                      <span
                        className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full"
                        style={{ background: def.color, boxShadow: `0 0 6px ${def.color}` }}
                      />
                    )}

                    {/* Outline icon badge */}
                    <span
                      className="inline-flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-200"
                      style={{
                        background: isSelected ? `${def.color}20` : `${def.color}10`,
                        border: `1.5px solid ${def.color}${isSelected ? "55" : "30"}`,
                        boxShadow: isSelected ? `0 0 12px ${def.color}30` : "none",
                      }}
                    >
                      <def.icon
                        strokeWidth={1.5}
                        style={{ color: def.color, width: 18, height: 18 }}
                      />
                    </span>

                    <span className="text-[13px] font-semibold text-white leading-tight">
                      {def.title}
                    </span>

                    {/* <span
                      className="text-[11px] font-medium"
                      style={{ color: def.color }}
                    >
                      {def.subtitle}
                    </span> */}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/5 px-4 pt-3 pb-4 sm:pb-3 bg-[#0A0E1A] shrink-0 pb-safe">
              <button
                type="button"
                onClick={() => {
                  audioManager.playTouch("click");
                  close();
                }}
                className="text-sm text-[#6B7280] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={() => {
                  audioManager.playTouch("confirm");
                  setStep("outline");
                }}
                className="h-8 rounded-lg bg-[#6366F1] hover:bg-[#5254cc] px-4 text-sm font-medium text-white flex items-center gap-1.5"
              >
                Continue
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}

        {/* ── STEP 1: Outline ─────────────────────────────────────────────── */}
        {step === "outline" && (
          <>
            <DialogHeader className="border-b border-white/5 px-5 py-3 text-left bg-[#0D1117] shrink-0">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-[#8B5CF6] animate-pulse" />
                <DialogTitle
                  className={cn(
                    displayFontClass,
                    "text-lg font-semibold text-white",
                  )}
                >
                  Describe your idea
                </DialogTitle>
              </div>
              {/* Template badge */}
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    borderColor: `${activeDef.color}50`,
                    color: activeDef.color,
                    background: `${activeDef.color}15`,
                  }}
                >
                  <activeDef.icon strokeWidth={1.5} style={{ width: 10, height: 10 }} />
                  {activeDef.title}
                </span>
                <button
                  type="button"
                  onClick={() => setStep("template")}
                  className="text-[10px] text-[#6B7280] hover:text-white transition-colors underline underline-offset-2"
                >
                  change
                </button>
              </div>
              <DialogDescription className="text-xs text-[#9CA3AF] mt-1">
                Briefly describe your idea. AI will generate the full form.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col px-5 py-4 min-h-0">
              <div className="relative flex-1">
                {tutorialMode && !outline.trim() && (
                  <>
                    <span className="pointer-events-none absolute -inset-1.5 rounded-[14px] border-2 border-amber-300 shadow-[0_0_45px_rgba(251,191,36,0.55)] z-10" />
                    <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 z-20 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0A0E1A] shadow-[0_8px_24px_rgba(251,191,36,0.5)]">
                      ↓ Describe your idea
                    </span>
                  </>
                )}
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

            <div className="flex items-center justify-between gap-3 border-t border-white/5 px-5 pt-3 pb-4 sm:pb-3 bg-[#0D1117] shrink-0 pb-safe">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    audioManager.playTouch("click");
                    setStep("template");
                  }}
                  className="text-xs text-[#9CA3AF] hover:text-white transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioManager.playTouch("click");
                    handleSkipAI();
                  }}
                  className="text-xs font-medium text-[#C7D2FE] hover:text-white transition-colors"
                >
                  Skip AI, fill manually →
                </button>
              </div>
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    audioManager.playTouch("click");
                    close();
                  }}
                  className="h-9 rounded-[10px] border-white/5 bg-[#0D1117] px-4 text-sm text-[#9CA3AF] hover:bg-white/[0.08] hover:text-white"
                >
                  Cancel
                </Button>
                <div className="relative">
                  {tutorialMode && outline.trim() && (
                    <>
                      <span className="pointer-events-none absolute -inset-1.5 rounded-[12px] border-2 border-amber-300 shadow-[0_0_45px_rgba(251,191,36,0.55)]" />
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0A0E1A] shadow-[0_8px_24px_rgba(251,191,36,0.5)]">
                        ↓ Tap to generate
                      </span>
                    </>
                  )}
                  <Button
                    type="button"
                    onClick={() => {
                      audioManager.playTouch(
                        outline.trim() ? "confirm" : "error",
                      );
                      if (outline.trim()) handleGenerate();
                    }}
                    disabled={!outline.trim()}
                    className="h-9 rounded-[10px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 text-sm font-semibold text-white hover:from-[#5053df] hover:to-[#7c4ee4] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2: Generating ──────────────────────────────────────────── */}
        {step === "generating" && (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Generating</DialogTitle>
              <DialogDescription>
                AI is drafting your idea form.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center bg-[#0D1117] min-h-[260px]">
              <div className="relative">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#6366F1]/20 border-t-[#8B5CF6]" />
                <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-[#C7D2FE] animate-pulse" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">
                  Drafting your idea…
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1.5">
                  This usually takes 1–2 seconds.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: Preview & post ──────────────────────────────────────── */}
        {step === "preview" && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col w-full max-h-[85dvh] sm:max-h-[90vh] overflow-hidden"
          >
            <DialogHeader className="border-b border-white/5 px-5 py-3 text-left bg-[#0D1117] shrink-0">
              <div className="flex items-center gap-2">
                <DialogTitle
                  className={cn(
                    displayFontClass,
                    "text-lg font-semibold text-white",
                  )}
                >
                  Review and post
                </DialogTitle>
                {/* Template badge */}
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    borderColor: `${activeDef.color}50`,
                    color: activeDef.color,
                    background: `${activeDef.color}15`,
                  }}
                >
                  <activeDef.icon strokeWidth={1.5} style={{ width: 10, height: 10 }} />
                  {activeDef.title}
                </span>
              </div>
              <DialogDescription className="text-xs text-[#9CA3AF] mt-1">
                {aiHadError
                  ? "AI couldn't fill the form this time — please fill it in below."
                  : !aiHadError && title && description
                    ? "✨ AI filled the form for you. Review and edit as needed."
                    : "Edit anything you want, then post."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-2.5 sm:px-5 sm:py-3 space-y-2 min-h-0">
              <div className="space-y-1">
                <Label
                  htmlFor="wiz-title"
                  className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider"
                >
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
                  <Label
                    htmlFor="wiz-description"
                    className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider"
                  >
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
                  className="min-h-[56px] max-h-[72px] rounded-[10px] border-white/5 bg-[#0D1117] text-sm text-white placeholder:text-[#6B7280] focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-0 focus-visible:border-transparent p-3"
                  maxLength={1200}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider flex items-center gap-1.5">
                    Industries
                    {isGeneratingTags && (
                      <Sparkles className="h-3 w-3 text-[#8B5CF6] animate-pulse" />
                    )}
                  </Label>
                  <IndustriesMultiSelect
                    selectedIndustries={industries}
                    onChange={setIndustries}
                    placeholder={
                      isGeneratingTags
                        ? "AI is selecting..."
                        : "Select industries..."
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider flex items-center gap-1.5">
                    Skills needed
                    {isGeneratingTags && (
                      <Sparkles className="h-3 w-3 text-[#8B5CF6] animate-pulse" />
                    )}
                  </Label>
                  <SkillsMultiSelect
                    selectedSkills={skills}
                    onChange={setSkills}
                    placeholder={
                      isGeneratingTags
                        ? "AI is selecting..."
                        : "Select skills..."
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Visibility */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider">
                    Visibility <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        audioManager.playTouch("click");
                        setVisibility("public");
                      }}
                      className={cn(
                        "flex items-start gap-2 rounded-xl border p-2 text-left transition-all h-[52px]",
                        visibility === "public"
                          ? "border-[#6366F1]/50 bg-[#6366F1]/10 ring-1 ring-[#6366F1]/30"
                          : "border-white/5 bg-[#0D1117] hover:border-white/10 hover:bg-white/[0.04]",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 grid h-6 w-6 place-items-center rounded-lg transition-colors shrink-0",
                          visibility === "public"
                            ? "bg-[#6366F1]/20 text-[#C7D2FE]"
                            : "bg-white/[0.05] text-[#9CA3AF]",
                        )}
                      >
                        <Globe className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-white block leading-tight">
                          Public
                        </span>
                        <p className="mt-0.5 text-[9px] leading-tight text-[#9CA3AF]">
                          Anyone can spark and collaborate.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        audioManager.playTouch("click");
                        setVisibility("private");
                      }}
                      className={cn(
                        "flex items-start gap-2 rounded-xl border p-2 text-left transition-all h-[52px]",
                        visibility === "private"
                          ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30"
                          : "border-white/5 bg-[#0D1117] hover:border-white/10 hover:bg-white/[0.04]",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 grid h-6 w-6 place-items-center rounded-lg transition-colors shrink-0",
                          visibility === "private"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-white/[0.05] text-[#9CA3AF]",
                        )}
                      >
                        <Lock className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-white block leading-tight">
                          Private
                        </span>
                        <p className="mt-0.5 text-[9px] leading-tight text-[#9CA3AF]">
                          Only you can see it. Use as draft.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Attachment */}
                <div className="space-y-1 flex flex-col justify-between">
                  <div>
                    <Label className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider">
                      Attachment{" "}
                      <span className="text-[11px] text-[#6B7280] font-normal lowercase">
                        (optional)
                      </span>
                    </Label>
                    <div className="mt-1">
                      <CardUpload
                        maxFiles={1}
                        maxSize={50 * 1024 * 1024}
                        accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/jpg,image/png,image/gif,video/mp4,.pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.gif,.mp4"
                        multiple={false}
                        onChange={(f) => setFiles(f)}
                        compact
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-[#6B7280] leading-none mt-1">
                    PDF, DOCX, PPTX, XLSX, JPG, PNG, GIF, MP4 (≤50 MB)
                  </p>
                </div>
              </div>

              {/* Cross-post destinations */}
              <CrossPostSelector
                selected={crossPostTargets}
                onChange={setCrossPostTargets}
              />

              {submitError && (
                <div className="flex items-center gap-2 p-2.5 rounded-[10px] bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-200">{submitError}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/5 px-5 pt-3 pb-4 sm:pb-3 bg-[#0D1117] shrink-0 pb-safe">
              <button
                type="button"
                onClick={() => {
                  audioManager.playTouch("click");
                  setStep("outline");
                }}
                className="text-xs text-[#9CA3AF] hover:text-white transition-colors flex items-center gap-1.5"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to outline
              </button>
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    audioManager.playTouch("click");
                    close();
                  }}
                  disabled={isSubmitting}
                  className="h-9 rounded-[10px] border-white/5 bg-[#0A0E1A] px-4 text-sm text-[#9CA3AF] hover:bg-white/[0.08] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !title.trim() || !description.trim()
                  }
                  className="h-9 rounded-[10px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 text-sm font-semibold text-white hover:from-[#5053df] hover:to-[#7c4ee4] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Spinner size={14} className="mr-2" /> : null}
                  Post Idea
                </Button>
              </div>
              {countdownActive && !isSubmitting && (
                <TutorialCountdownBanner
                  paused={tutorialPaused}
                  onTogglePause={() => setTutorialPaused((p) => !p)}
                  onFire={() => {
                    void handleSubmit(
                      { preventDefault: () => {} } as React.FormEvent,
                    );
                  }}
                />
              )}
            </div>
          </form>
        )}

        {step === "share" && sharePayload && (
          <div className="flex flex-col w-full max-h-[85dvh] sm:max-h-[90vh] overflow-hidden">
            <DialogHeader className="border-b border-white/5 px-5 py-3 text-left bg-[#0D1117] shrink-0">
              <DialogTitle
                className={cn(
                  displayFontClass,
                  "text-lg font-semibold text-white",
                )}
              >
                Share your idea
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto px-5 py-5">
              <CrossPostSharePanel
                payload={sharePayload.payload}
                platforms={sharePayload.platforms}
                tutorialMode={tutorialMode}
                onDone={() => {
                  const vId = sharePayload.ventureId;
                  setSharePayload(null);
                  setStep("template");
                  close();
                  router.push(`/map/world?ventureId=${vId}`);
                }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Self-contained 3-second countdown banner. Lives in its own component
// so the per-second tick only re-renders this banner, not the entire
// 1000-line wizard.
function TutorialCountdownBanner({
  paused,
  onTogglePause,
  onFire,
}: {
  paused: boolean;
  onTogglePause: () => void;
  onFire: () => void;
}) {
  const [seconds, setSeconds] = useState(3);
  const firedRef = useRef(false);

  useEffect(() => {
    if (paused || firedRef.current) return;
    if (seconds === 0) {
      firedRef.current = true;
      onFire();
      return;
    }
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [seconds, paused, onFire]);

  return (
    <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-xs">
      <span className="font-medium text-amber-200">
        {paused
          ? "Auto-post paused. Edit anything you want, then hit Post."
          : `We'll post this for you in ${seconds}s.`}
      </span>
      <button
        type="button"
        onClick={onTogglePause}
        className="rounded-lg bg-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/15"
      >
        {paused ? "Resume" : "Pause"}
      </button>
    </div>
  );
}
