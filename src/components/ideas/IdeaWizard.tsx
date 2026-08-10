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
// Non-tutorial post-publish suggested contributors dialog — shows the
// same "These are people we think can help you" screen the tutorial
// used to show, minus the "at least 1 required" gate. Product ask:
// keep the tutorial's auto-send flow as-is, but expose this fuller
// UI (title + subtitle + per-user write-message + Continue) for
// regular posts and let Continue fire any time.
import { PostPublishContributorsDialog } from "./PostPublishContributorsDialog";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  useKeyboardInsets,
  keyboardSafeStyle,
} from "@/lib/hooks/useKeyboardInsets";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  FileText,
  Globe,
  Lock,
  ChevronRight,
  Rocket,
  Palette,
  FlaskConical,
  // BookOpen replaces the Microscope icon for the academic template
  // per product request ("Academic Paper instead of Research Project
  // and you can use an open Book for the icon"). Microscope no longer
  // referenced anywhere in this file — dropping the import too.
  BookOpen,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { displayFontClass } from "@/components/ideaforge/shared";
import { audioManager } from "@/lib/audio/audioManager";
import { type TemplateId } from "@/config/templates";
import { CrossPostSelector } from "@/components/share/CrossPostSelector";
import { CrossPostSettingsDialog } from "@/components/share/CrossPostSettingsDialog";
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
    // Icon + label updated per product request — the academic
    // template surfaces as "Academic Paper" with an open-book icon
    // (BookOpen from lucide) so the mental model reads clearer than
    // the previous "Research Project + microscope".
    icon: BookOpen,
    title: "Academic Paper",
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateFromOutline = useAction(api.ai.generateIdeaFromOutline);
  const createIdea = useMutation(api.ideas.createIdea);
  const createVenture = useMutation(api.ventures.createVenture);
  const generateUploadUrl = useMutation(api.ideas.generateUploadUrl);
  const attachFileToIdea = useMutation(api.ideas.attachFileToIdea);

  // Mobile keyboard-aware sizing — the wizard has two long forms
  // ("Describe Your Idea" outline step + "Your Idea" preview step)
  // that both suffered from keyboard overlap on iOS + Android per
  // screenshot report. Applying to the DialogContent style shrinks
  // the whole modal to the visible visualViewport so the Create /
  // Post Idea CTA stays reachable.
  const kb = useKeyboardInsets();

  // ── Post-publish suggested-contributors modal (non-tutorial only) ──
  // Populated with { ideaId, ventureId } right after a successful
  // non-tutorial createIdea + createVenture. The dialog renders on top
  // of everything else; its Continue button (always enabled) fires the
  // map navigation and clears this state.
  const [postPublishTarget, setPostPublishTarget] = useState<{
    ideaId: Id<"ideas">;
    ventureId: Id<"ventures">;
  } | null>(null);

  // ── Step & template state ──
  const [step, setStep] = useState<Step>("template");
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateId>("venture");
  const [templateAutoAdvanceReady, setTemplateAutoAdvanceReady] =
    useState(false);

  // ── Step 2: outline ──
  const [outline, setOutline] = useState("");

  // ── Step 4: form fields ──
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [files, setFiles] = useState<File[]>([]);
  // Cross-post share targets — controlled by the CrossPostSelector +
  // Settings dialog. Starts empty; the selector's useEffect populates it
  // from useCrossPostPreferences (localStorage-backed) on first render.
  const [crossPostTargets, setCrossPostTargets] = useState<Set<SharePlatform>>(
    new Set(),
  );
  // Settings dialog open state — CrossPostSelector's gear icon opens it.
  const [crossPostSettingsOpen, setCrossPostSettingsOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState<{
    payload: ShareablePayload;
    platforms: SharePlatform[];
    ventureId: string;
  } | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [fileUploadError, setFileUploadError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [aiHadError, setAiHadError] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  // Tutorial countdown state. The countdown number itself lives in a
  // leaf component (TutorialCountdownBanner) so its 1-Hz tick doesn't
  // re-render the whole 1000-line wizard. We only track the pause flag
  // and the active boolean up here.
  const [tutorialPaused, setTutorialPaused] = useState(false);

  // TUTORIAL: skip the "Your idea" preview screen entirely — as soon as
  // Generate finishes populating title+description, auto-submit and go
  // straight to the map. Product wants: no 3-5s preview flash. This
  // flag is set in handleGenerate's success path and drained by the
  // effect that fires handleSubmit once state commits.
  const [tutorialAutoSubmitPending, setTutorialAutoSubmitPending] = useState(false);

  // ── Helpers ──
  const reset = () => {
    setStep("template");
    setSelectedTemplate("venture");
    setTemplateAutoAdvanceReady(false);
    setOutline("");
    setTitle("");
    setDescription("");
    setIndustries([]);
    setSkills([]);
    setVisibility("public");
    setFiles([]);
    setFilePreviewUrl("");
    setFileUploadError("");
    setIsSubmitting(false);
    setSubmitError("");
    setAiHadError(false);
    setIsGeneratingTags(false);
    setSharePayload(null);
    setTutorialAutoSubmitPending(false);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  useEffect(() => {
    if (!isOpen || step !== "template") {
      setTemplateAutoAdvanceReady(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setTemplateAutoAdvanceReady(true);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [isOpen, step]);

  const handleTemplateSelect = (templateId: TemplateId) => {
    audioManager.playTouch(templateAutoAdvanceReady ? "confirm" : "click");
    setSelectedTemplate(templateId);

    if (templateAutoAdvanceReady) {
      setStep("outline");
    }
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
        // Tutorial mode PREVIOUSLY skipped the template chooser and
        // dropped the user straight on the AI-description step. Per
        // product request the template step is now VISIBLE in the
        // tutorial too — the flow becomes "click + → pick template →
        // describe idea", matching what the client expects. The
        // tutorial state machine (Step2TemplatePick) handles the
        // template → outline transition automatically.
      }
    }
  }, [isOpen, initialDraft, tutorialMode]);

  // ── AI handlers ──
  const handleGenerate = async () => {
    if (!outline.trim() || outline.length > 500) return;
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
        // Tutorial: no preview screen — as soon as state commits,
        // fire submit. Effect below picks this up.
        if (tutorialMode) setTutorialAutoSubmitPending(true);
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

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setFiles([]);
      setFilePreviewUrl("");
      setFileUploadError("Please restrict file uploads to less than 50MB");
      event.target.value = "";
      return;
    }

    setFiles([file]);
    setFileUploadError("");
    event.target.value = "";
  };

  useEffect(() => {
    const file = files[0];
    if (!file) {
      setFilePreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [files]);

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
    if (description.length > 1200) {
      setSubmitError("Description must be 1200 characters or less.");
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
        visibility: "public",
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

      // Success toast skipped during the first-run tutorial — Sparky
      // is already narrating the "posted → world map" beat, so an
      // extra floating notification was noise. Non-tutorial posts
      // still get the confirmation toast.
      if (!tutorialMode) {
        toast({
          title: visibility === "public" ? "Idea posted!" : "Saved as private",
          description:
            visibility === "public"
              ? willCrossPost
                ? "Now pick where else to share it."
                : "Loading your world map…"
              : "Only you can see it — toggle to Public any time.",
        });
      }

      // Hand off to the share step. We can't open the platform tabs
      // here because the click gesture is gone after the awaits above;
      // browsers would block everything past the first popup. Each
      // button on the share step opens its own tab from a fresh click.
      //
      // TUTORIAL: skip the share dialog entirely — the tutorial is
      // meant to whisk the user from "post idea" straight to the map.
      // The "Post on X / LinkedIn / Facebook / Go to my world map"
      // screen is noise during onboarding.
      if (willCrossPost && !tutorialMode) {
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
      // In tutorial mode, DO NOT jump straight to /map/world.
      // Step 5 of the tutorial (SuggestedContributorsDialog — the
      // "invite people for contribution" beat) lives on /feed and
      // only mounts when the compose wizard has closed AND the user
      // is still on /feed. If we router.push here, Step2TemplatePick
      // unmounts before it can flip `dialogue` from "posting" →
      // "contributors" and the invite step is skipped entirely.
      // The `to_map` step's own Continue button (Step2TemplatePick
      // line ~541) handles the map nav once the user finishes
      // inviting collaborators.
      //
      // Non-tutorial callers: instead of the direct nav that used to
      // live here, open PostPublishContributorsDialog. Its Continue
      // button (always enabled — the "at least 1 required" gate was
      // removed per product spec) fires the map navigation. This is
      // the "we need this screen after normal post" flow.
      if (!tutorialMode) {
        setPostPublishTarget({
          ideaId: newIdeaId as Id<"ideas">,
          ventureId: ventureId as Id<"ventures">,
        });
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to post idea.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // TUTORIAL: fire handleSubmit the moment title+description commit
  // during a tutorialMode Generate. We can't call handleSubmit inline
  // in handleGenerate — closure would see the pre-setState values. This
  // effect runs after React commits the AI results, so title/description
  // are populated. User perceives ~1 frame of the preview form before
  // the spinner takes over — the render guard below hides the preview
  // form entirely for tutorialMode so nothing visible flashes.
  useEffect(() => {
    if (!tutorialMode) return;
    if (!tutorialAutoSubmitPending) return;
    if (step !== "preview") return;
    if (!title.trim() || !description.trim()) return;
    if (isSubmitting) return;
    setTutorialAutoSubmitPending(false);
    void handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  }, [
    tutorialMode,
    tutorialAutoSubmitPending,
    step,
    title,
    description,
    isSubmitting,
  ]);

  // ── Derived (used in outline + preview badge) ──
  const activeDef = TEMPLATE_DEFS[selectedTemplate];
  const isOverOutlineLimit = outline.length > 500;
  const isOverDescriptionLimit = description.length > 1200;
  const selectedFile = files[0];
  const selectedFileType = selectedFile?.type.toLowerCase() || "";

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Non-tutorial post-publish contributors modal. Renders on top
          of the closed wizard (isOpen flipped to false in the submit
          handler). Continue is always active — the user can send
          invites or skip. Both paths land them on the map. */}
      {postPublishTarget && (
        <PostPublishContributorsDialog
          ideaId={postPublishTarget.ideaId}
          onContinue={() => {
            const vid = postPublishTarget.ventureId;
            setPostPublishTarget(null);
            router.push(`/map/world?ventureId=${vid}`);
          }}
        />
      )}
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
        // data-tutorial marker lets Step2TemplatePick target THIS specific
        // dialog with its highlight selector, instead of matching any
        // element with role="dialog" — which caused a stray yellow box to
        // linger around whatever transient dialog (share panel, notification
        // panel, contributors modal frame, etc.) happened to be in the DOM
        // during the /feed → /map/world route commit.
        data-tutorial="compose-wizard"
        className={cn(
          "w-[min(100%-2rem,680px)] max-w-[680px] gap-0 flex flex-col rounded-[20px] border border-white/5 bg-[#0A0E1A] p-0 text-[#F9FAFB] shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden h-auto max-h-[85dvh] sm:max-h-[90vh]",
        )}
        style={keyboardSafeStyle(kb, { reserveVh: 0.9 })}
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
                Pick a Path to begin shaping your World.
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
                    onClick={() => handleTemplateSelect(templateId)}
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

            <div className="flex items-center justify-end gap-3 border-t border-white/5 px-4 pt-3 pb-4 sm:pb-3 bg-[#0A0E1A] shrink-0 pb-safe">
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
                <DialogTitle
                  className={cn(
                    displayFontClass,
                    "text-lg font-semibold text-white",
                  )}
                >
                  Describe Your Idea
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setStep("template")}
                  className="shrink-0 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
                  aria-label="Change path"
                  title={`Change ${activeDef.title}`}
                >
                  <activeDef.icon
                    strokeWidth={1.8}
                    style={{ width: 22, height: 22, color: activeDef.color }}
                  />
                </button>
              </div>
              <DialogDescription className="text-xs text-[#9CA3AF] mt-1">
                Briefly describe your idea. We&apos;ll do the rest!
              </DialogDescription>
            </DialogHeader>

            <div
              className="flex-1 flex flex-col px-5 py-4 min-h-0 overflow-y-auto"
              style={kb.isKeyboardOpen ? { scrollPaddingBottom: 120 } : undefined}
            >
              <div className="relative flex-1">
                {/* Amber "Describe your idea" tutorial callout REMOVED
                    per product request. Same treatment as the amber
                    "Tap to generate" ring on the Generate button. */}
                <Textarea
                  value={outline}
                  onChange={(e) => setOutline(e.target.value)}
                  placeholder="e.g. An app that helps remote teams pick a meet-up city based on flight cost and weather. Built for distributed startup teams that retreat 2-3 times a year."
                  className={cn(
                    "min-h-[136px] resize-none rounded-[12px] border-white/5 bg-[#0D1117] p-4 pr-4 text-base leading-6 text-white placeholder:text-[#6B7280] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-0 lg:text-sm",
                    isOverOutlineLimit && "border-rose-500/80 focus-visible:ring-rose-400",
                  )}
                  // Stop keydown from bubbling to any parent listener
                  // (tutorial scrim, Radix focus trap, Phaser keyboard
                  // manager on other routes, etc.) that may preventDefault
                  // on WASD / arrow / Space keys. Ensures every keystroke
                  // reaches the native textarea intact.
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  onKeyPress={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
              {isOverOutlineLimit && (
                <p className="mt-1.5 pl-3 text-[11px] font-medium text-rose-400">
                  Max character count reached
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/5 px-5 pt-3 pb-4 sm:pb-3 bg-[#0D1117] shrink-0 pb-safe">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    audioManager.playTouch("click");
                    setStep("template");
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-white/[0.06] hover:text-white"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioManager.playTouch("click");
                    handleSkipAI();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C7D2FE] transition-colors hover:text-white"
                >
                  Fill Manually <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Cancel button removed per product request — the
                  header's × close button already dismisses the wizard,
                  so an inline Cancel was redundant and cluttered the
                  primary CTA row. */}
              <div className="flex gap-2.5">
                <div className="relative">
                  {/* Amber "Tap to generate" tutorial callout REMOVED per
                      product request — button stands on its own. */}
                  <Button
                    type="button"
                    onClick={() => {
                      audioManager.playTouch(
                        outline.trim() && !isOverOutlineLimit ? "confirm" : "error",
                      );
                      if (outline.trim() && !isOverOutlineLimit) handleGenerate();
                    }}
                    disabled={!outline.trim() || isOverOutlineLimit}
                    className="h-9 rounded-[10px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 text-sm font-semibold text-white hover:from-[#5053df] hover:to-[#7c4ee4] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2: Generating ──────────────────────────────────────────── */}
        {/* In tutorial mode we also stay on the spinner during the
            preview step + submit — user should never see the "Your Idea"
            form flash on screen (product decision). */}
        {(step === "generating" ||
          (tutorialMode &&
            step === "preview" &&
            (tutorialAutoSubmitPending || isSubmitting))) && (
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
        {/* Hidden in tutorialMode while auto-submit is pending or in
            flight — the spinner branch above owns the visual during
            that window. Non-tutorial users still see the full preview. */}
        {step === "preview" &&
          !(
            tutorialMode &&
            (tutorialAutoSubmitPending || isSubmitting)
          ) && (
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
                  Your Idea
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setStep("template")}
                  className="inline-flex items-center justify-center rounded-full p-1 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/50"
                  aria-label="Change path"
                  title={`Change ${activeDef.title}`}
                >
                  <activeDef.icon strokeWidth={1.7} style={{ width: 17, height: 17, color: activeDef.color }} />
                </button>
              </div>
              <DialogDescription className="text-xs text-[#9CA3AF] mt-0.5">
                {aiHadError
                  ? "AI couldn't suggest a title this time — please fill it in below."
                  : !aiHadError && title && description
                    ? "✨ AI suggested a title and tags. Your description is exactly as you wrote it."
                    : "Edit anything you want, then post."}
              </DialogDescription>
            </DialogHeader>

            <div
              className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 sm:px-5 space-y-3 min-h-0"
              style={kb.isKeyboardOpen ? { scrollPaddingBottom: 120 } : undefined}
            >
              <div>
                <Input
                  id="wiz-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A short, specific title"
                  maxLength={100}
                  className="h-11 rounded-[10px] border-white/5 bg-[#0D1117] px-3 text-base text-white placeholder:text-[#6B7280] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-0 lg:text-sm"
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  onKeyPress={(e) => e.stopPropagation()}
                  required
                  autoFocus
                />
              </div>

              <div>
                <div
                  className={cn(
                    "relative overflow-hidden rounded-[10px] border border-white/5 bg-[#0D1117] transition-shadow focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#6366F1]",
                    selectedFile ? "h-[272px]" : "h-[136px]",
                    isOverDescriptionLimit && "border-rose-500/80 focus-within:ring-rose-400",
                  )}
                >
                  <textarea
                    id="wiz-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's the idea? Who is it for?"
                    className={cn(
                      "w-full resize-none border-0 bg-transparent p-4 pb-12 pr-14 text-base leading-6 text-white outline-none placeholder:text-[#6B7280] focus:ring-0 lg:text-sm [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent",
                      selectedFile ? "h-[136px]" : "h-full overflow-y-auto",
                    )}
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                    onKeyPress={(e) => e.stopPropagation()}
                    required
                  />
                  {selectedFile && (
                    <div className="absolute inset-x-0 bottom-0 h-[136px] overflow-hidden px-4 pb-4 pr-14">
                      {selectedFileType.startsWith("image/") && filePreviewUrl ? (
                        <div
                          aria-label={selectedFile.name}
                          className="h-full w-full bg-contain bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${filePreviewUrl})` }}
                        />
                      ) : selectedFileType.startsWith("video/") && filePreviewUrl ? (
                        <video
                          src={filePreviewUrl}
                          className="h-full w-full object-contain"
                          muted
                          playsInline
                          controls
                        />
                      ) : selectedFileType.includes("pdf") && filePreviewUrl ? (
                        <iframe
                          src={filePreviewUrl}
                          title={selectedFile.name}
                          className="h-full w-full border-0 bg-transparent"
                        />
                      ) : (
                        <div className="flex h-full items-center gap-3 text-[#9CA3AF]">
                          <FileText className="h-8 w-8 shrink-0 text-[#818CF8]" strokeWidth={1.6} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[#D1D5DB]">
                              {selectedFile.name}
                            </p>
                            <p className="mt-1 text-[10px] text-[#6B7280]">
                              Preview will be available after posting
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/jpg,image/png,image/gif,video/mp4,.pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.gif,.mp4"
                    className="sr-only"
                    onChange={handleFileSelection}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-[#9CA3AF] transition-colors hover:bg-white/[0.1] hover:text-white",
                      files.length > 0 && "bg-[#6366F1]/20 text-[#C7D2FE]",
                    )}
                    aria-label="Upload attachment"
                    title={files[0]?.name || "Upload attachment"}
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                </div>
                {selectedFile && (
                  <div className="mt-1.5 flex justify-end pr-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="max-w-[220px] truncate text-right text-[10px] leading-none text-[#6B7280] underline underline-offset-2 transition-colors hover:text-[#9CA3AF]"
                      title={`Change ${selectedFile.name}`}
                    >
                      {selectedFile.name}
                    </button>
                  </div>
                )}
                {isOverDescriptionLimit && (
                  <p className="mt-1.5 pl-3 text-[11px] font-medium text-rose-400">
                    Max character count reached
                  </p>
                )}
                {fileUploadError && (
                  <p className="mt-1.5 pl-3 text-[11px] font-medium text-rose-400">
                    {fileUploadError}
                  </p>
                )}
                <p className="mt-1.5 pl-3 text-[9px] leading-none text-[#6B7280]">
                  PDF, DOCX, PPTX, XLSX, JPG, PNG, GIF, MP4 (&lt;50 MB)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <IndustriesMultiSelect
                    selectedIndustries={industries}
                    onChange={setIndustries}
                    placeholder={
                      isGeneratingTags
                        ? "AI is selecting..."
                        : "Industries Impacted..."
                    }
                  />
                </div>
                <div>
                  <SkillsMultiSelect
                    selectedSkills={skills}
                    onChange={setSkills}
                    placeholder={
                      isGeneratingTags
                        ? "AI is selecting..."
                        : "Skills Needed..."
                    }
                  />
                </div>
              </div>

              <div className="hidden">
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

              {/*
                Cross-post checkbox REMOVED from the post form per
                product request — the master switch + per-platform
                connect/disconnect + auto-post toggles all live in
                Settings (edit-profile pencil). Keeping a second copy
                inline here was just clutter, and it made the wizard
                look like the setting had to be re-configured every
                time someone posted. The wizard still respects the
                user's saved preferences at submit time via
                `crossPostTargets` (populated from
                `useCrossPostPreferences` on first render).

                Public / private visibility toggle takes its slot.
                Radio-style pair so the current mode is always visible
                at a glance without a click. Default remains "public";
                private posts don't cross-post regardless of prefs.
              */}
              <div className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-[#0D1117] p-1">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${
                    visibility === "public"
                      ? "bg-[#6366F1]/20 text-[#C7D2FE] ring-1 ring-[#6366F1]/40"
                      : "text-white/60 hover:bg-white/5 hover:text-white/80"
                  }`}
                  aria-pressed={visibility === "public"}
                >
                  <svg
                    width={13}
                    height={13}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${
                    visibility === "private"
                      ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40"
                      : "text-white/60 hover:bg-white/5 hover:text-white/80"
                  }`}
                  aria-pressed={visibility === "private"}
                >
                  <svg
                    width={13}
                    height={13}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Private
                </button>
              </div>

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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-white/[0.06] hover:text-white"
                disabled={isSubmitting}
                aria-label="Back to outline"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-2.5">
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !title.trim() || !description.trim() || isOverDescriptionLimit
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
                  // In tutorialMode, DON'T navigate — the tutorial's
                  // Step2 owns the transition to the SuggestedContributors
                  // dialog and then to /map/world via its own Continue
                  // button. Auto-pushing here made the tutorial race past
                  // the contributors step entirely on desktop (poll
                  // interval couldn't catch the closed-wizard state before
                  // pathname changed and the whole tutorial unmounted).
                  // Product report: "add this step in pc view too".
                  if (!tutorialMode) {
                    router.push(`/map/world?ventureId=${vId}`);
                  }
                }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
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
