"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Sparkles, Wand2, RefreshCw, Eye, Edit } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

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
  industryOptions,
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
  const createIdea = useMutation(api.ideas.createIdea);
  const [isPublishing, setIsPublishing] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
    industries: initialDraft?.industries || [],
    visibility: initialDraft?.visibility || "public",
  });

  useEffect(() => {
    if (open) {
      setDraft({
        title: initialDraft?.title || "",
        description: initialDraft?.description || "",
        tags: initialDraft?.tags || [],
        category: initialDraft?.category || "Venture",
        stage: initialDraft?.stage || stageOptions[0],
        industries: initialDraft?.industries || [],
        visibility: initialDraft?.visibility || "public",
      });
      setTagInput("");
      setAiSuggestions({ title: "", description: "", tags: [] });
      setShowPreview(false);
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
    const allWords = [...titleWords, ...descWords];
    
    // Smart title enhancement
    let suggestedTitle = "";
    if (draft.title && draft.title.length < 50 && draft.title.length > 5) {
      if (!draft.title.includes("AI") && (titleWords.includes("automation") || titleWords.includes("smart"))) {
        suggestedTitle = draft.title + " - AI-Powered Solution";
      } else if (titleWords.includes("platform") || titleWords.includes("app")) {
        suggestedTitle = draft.title + " for Modern Businesses";
      }
    }
    
    // Smart description generation - based on title if description is empty
    let suggestedDescription = "";
    
    if (!draft.description && draft.title && draft.title.length > 5) {
      // Generate description from title
      const title = draft.title.toLowerCase();
      
      if (title.includes("ai") || title.includes("automation") || title.includes("machine learning")) {
        suggestedDescription = `An innovative AI-powered solution that automates complex workflows and enhances decision-making. ${draft.title} leverages machine learning algorithms to deliver intelligent insights and improve operational efficiency.`;
      } else if (title.includes("platform") || title.includes("marketplace")) {
        suggestedDescription = `A comprehensive platform connecting users and service providers in a seamless ecosystem. ${draft.title} creates value through network effects, intuitive design, and scalable infrastructure.`;
      } else if (title.includes("mobile") || title.includes("app")) {
        suggestedDescription = `A mobile-first application designed to solve real user problems on the go. ${draft.title} delivers a native-quality experience with offline capabilities and real-time synchronization.`;
      } else if (title.includes("saas") || title.includes("software")) {
        suggestedDescription = `A cloud-based SaaS solution that streamlines operations and drives productivity. ${draft.title} offers flexible pricing, continuous updates, and enterprise-grade security.`;
      } else if (title.includes("social") || title.includes("community")) {
        suggestedDescription = `A community-driven platform that fosters authentic connections and meaningful interactions. ${draft.title} empowers users to share, collaborate, and grow together.`;
      } else if (title.includes("analytics") || title.includes("data")) {
        suggestedDescription = `A powerful analytics tool that transforms raw data into actionable insights. ${draft.title} provides intuitive dashboards, custom reports, and predictive analytics for informed decision-making.`;
      } else if (title.includes("ecommerce") || title.includes("shop") || title.includes("store")) {
        suggestedDescription = `An e-commerce solution optimized for conversion and customer satisfaction. ${draft.title} features streamlined checkout, personalized recommendations, and multi-channel selling capabilities.`;
      } else if (title.includes("education") || title.includes("learning")) {
        suggestedDescription = `An educational platform that makes learning engaging and accessible. ${draft.title} combines interactive content, progress tracking, and personalized learning paths.`;
      } else if (title.includes("health") || title.includes("fitness") || title.includes("wellness")) {
        suggestedDescription = `A health and wellness solution that empowers users to achieve their goals. ${draft.title} provides personalized recommendations, progress tracking, and expert guidance.`;
      } else if (title.includes("finance") || title.includes("payment") || title.includes("banking")) {
        suggestedDescription = `A fintech solution that simplifies financial management and transactions. ${draft.title} offers secure payments, real-time tracking, and intelligent financial insights.`;
      } else {
        // Generic but contextual fallback
        suggestedDescription = `An innovative solution addressing key market needs. ${draft.title} combines cutting-edge technology with user-centric design to deliver measurable value and sustainable growth.`;
      }
    } else if (draft.description && draft.description.length > 20 && draft.description.length < 300) {
      // Enhance existing description
      const desc = draft.description.toLowerCase();
      
      if (desc.includes("problem") || desc.includes("issue") || desc.includes("challenge")) {
        suggestedDescription = draft.description + "\n\nOur solution tackles this challenge through a systematic approach that combines market research, user feedback, and iterative development to ensure product-market fit.";
      } else if (desc.includes("platform") || desc.includes("marketplace")) {
        suggestedDescription = draft.description + "\n\nThe platform leverages network effects to create value for all stakeholders, with a focus on seamless user experience and scalable infrastructure.";
      } else if (desc.includes("ai") || desc.includes("automation") || desc.includes("machine learning")) {
        suggestedDescription = draft.description + "\n\nBy leveraging advanced AI algorithms and automation, we reduce manual effort while improving accuracy and efficiency, creating measurable ROI for users.";
      } else if (desc.includes("mobile") || desc.includes("app")) {
        suggestedDescription = draft.description + "\n\nDesigned with mobile-first principles, the app delivers a native-quality experience with offline capabilities and real-time synchronization.";
      } else if (desc.includes("saas") || desc.includes("subscription")) {
        suggestedDescription = draft.description + "\n\nOur SaaS model ensures predictable revenue while providing customers with continuous updates, dedicated support, and flexible pricing tiers.";
      } else if (desc.includes("social") || desc.includes("community")) {
        suggestedDescription = draft.description + "\n\nWe foster authentic community engagement through thoughtful features that encourage meaningful interactions and user-generated content.";
      } else if (desc.includes("data") || desc.includes("analytics")) {
        suggestedDescription = draft.description + "\n\nOur data-driven approach provides actionable insights through intuitive dashboards and customizable reports, empowering informed decision-making.";
      } else if (desc.includes("ecommerce") || desc.includes("e-commerce") || desc.includes("shop")) {
        suggestedDescription = draft.description + "\n\nThe commerce experience is optimized for conversion with streamlined checkout, multiple payment options, and personalized product recommendations.";
      } else if (draft.category === "Venture") {
        suggestedDescription = draft.description + "\n\nThis venture is positioned to capture market opportunity through strategic execution, focusing on customer acquisition, retention, and sustainable growth.";
      }
    }
    
    // Smart tag suggestions
    const suggestedTags: string[] = [];
    
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
    if (allWords.some(w => ["ecommerce", "e-commerce", "shop", "store", "marketplace"].includes(w))) {
      suggestedTags.push("E-commerce", "Marketplace");
    }
    if (allWords.some(w => ["social", "community", "network"].includes(w))) {
      suggestedTags.push("Social", "Community");
    }
    if (allWords.some(w => ["education", "learning", "course", "training"].includes(w))) {
      suggestedTags.push("Education", "EdTech");
    }
    if (allWords.some(w => ["health", "fitness", "wellness", "medical"].includes(w))) {
      suggestedTags.push("Healthcare", "Wellness");
    }
    if (allWords.some(w => ["finance", "fintech", "payment", "banking"].includes(w))) {
      suggestedTags.push("Fintech", "Finance");
    }
    if (allWords.some(w => ["design", "ui", "ux", "creative"].includes(w))) {
      suggestedTags.push("Design", "UX");
    }
    if (allWords.some(w => ["cloud", "infrastructure", "devops"].includes(w))) {
      suggestedTags.push("Cloud", "Infrastructure");
    }
    
    setAiSuggestions({
      title: suggestedTitle !== draft.title ? suggestedTitle : "",
      description: suggestedDescription && suggestedDescription !== draft.description ? suggestedDescription : "",
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

  const handlePublishIdea = async () => {
    if (!draft.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your idea.",
        variant: "destructive",
      });
      return;
    }

    if (!draft.description.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a description for your idea.",
        variant: "destructive",
      });
      return;
    }

    if (draft.industries.length === 0) {
      toast({
        title: "Industries Required",
        description: "Please select at least one industry.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);

    try {
      await createIdea({
        title: draft.title,
        description: draft.description,
        category: draft.category,
        industries: JSON.stringify(draft.industries),
        visibility: draft.visibility,
      });

      toast({
        title: "Idea Published!",
        description: "Your venture idea has been successfully published.",
      });

      // Close modal and reset
      onOpenChange(false);
      
      // Optionally refresh the page or navigate
      router.refresh();
    } catch (error) {
      console.error("Error publishing idea:", error);
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "Failed to publish your idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100%-1rem,520px)] max-w-[520px] gap-0 overflow-hidden rounded-[14px] border border-white/10 bg-[#0F1726] p-0 text-[#F9FAFB] shadow-[0_12px_40px_rgba(3,7,18,0.65)]">
        <DialogHeader className="border-b border-white/8 px-4 py-3 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <DialogTitle className={cn(displayFontClass, "text-base font-semibold")}>
                {showPreview ? "Preview Your Idea" : "Post a Venture Idea"}
              </DialogTitle>
              <DialogDescription className="text-[10px] text-[#9CA3AF] line-clamp-1">
                {showPreview 
                  ? "Review your idea before publishing"
                  : "Start with a crisp concept here"
                }
              </DialogDescription>
            </div>
            {!showPreview && (
              <button
                type="button"
                onClick={() => setAiEnabled(!aiEnabled)}
                className={cn(
                transitionBase,
                "flex shrink-0 items-center gap-1 rounded-[8px] border px-2.5 py-1 text-[10px] font-medium",
                aiEnabled
                  ? "border-[#6366F1]/30 bg-[#6366F1]/12 text-[#C7D2FE]"
                  : "border-white/10 bg-white/[0.03] text-[#9CA3AF] hover:text-white"
              )}
            >
              <Sparkles className={cn("h-3 w-3", aiEnabled && "animate-pulse")} />
              AI
            </button>
            )}
          </div>
        </DialogHeader>

        {showPreview ? (
          // Preview View
          <div className="space-y-3 px-4 py-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[#6B7280]">Title</label>
              <h3 className={cn(displayFontClass, "text-base font-semibold text-white")}>
                {draft.title || "Untitled Idea"}
              </h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[#6B7280]">Description</label>
              <p className="text-xs leading-relaxed text-[#D1D5DB] whitespace-pre-wrap">
                {draft.description || "No description provided"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#6B7280]">Category</label>
                <div className="rounded-[8px] border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
                  <span className="text-xs text-white">{draft.category}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#6B7280]">Stage</label>
                <div className="rounded-[8px] border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
                  <span className="text-xs text-white">{draft.stage}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[#6B7280]">Visibility</label>
              <div className="rounded-[8px] border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
                <span className="text-xs text-white capitalize">{draft.visibility}</span>
                <span className="ml-2 text-[10px] text-[#9CA3AF]">
                  {draft.visibility === "public" ? "• Visible to all" : "• Connections only"}
                </span>
              </div>
            </div>

            {draft.tags.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#6B7280]">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {draft.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        codeFontClass,
                        "rounded-full border border-[#6366F1]/30 bg-[#6366F1]/12 px-2 py-0.5 text-[9px] text-[#C7D2FE]"
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {draft.industries.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#6B7280]">Industries</label>
                <div className="flex flex-wrap gap-1">
                  {draft.industries.map((industry) => (
                    <span
                      key={industry}
                      className="rounded-full border border-emerald-500/30 bg-emerald-500/12 px-2 py-0.5 text-[9px] text-emerald-300"
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Form View
          <div className="space-y-3 px-4 py-3">
          {aiEnabled && isGenerating && (
            <div className="flex items-center gap-2 rounded-[10px] border border-[#6366F1]/20 bg-[#6366F1]/8 px-3 py-2">
              <RefreshCw className="h-3 w-3 animate-spin text-[#6366F1]" />
              <span className="text-[10px] text-[#C7D2FE]">AI analyzing...</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[#F9FAFB]">Title</label>
            <Input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="What are you building?"
              className={cn(
                displayFontClass,
                "h-9 rounded-[10px] border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-[#6B7280] focus-visible:ring-2 focus-visible:ring-[#6366F1]"
              )}
            />
            {aiEnabled && aiSuggestions.title && (
              <div className="mt-1 rounded-[8px] border border-[#8B5CF6]/20 bg-[#8B5CF6]/8 p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-[9px] font-medium text-[#C7D2FE]">
                      <Wand2 className="h-2.5 w-2.5" />
                      AI Suggestion
                    </div>
                    <p className="mt-0.5 text-[10px] text-white truncate">{aiSuggestions.title}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => applyAiSuggestion("title")}
                    className="h-6 shrink-0 rounded-[6px] bg-[#6366F1] px-2 text-[9px] text-white hover:bg-[#8B5CF6]"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[#F9FAFB]">Description</label>
            <Textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Describe the problem, the spark, and why now."
              className="min-h-[80px] rounded-[10px] border-white/10 bg-white/[0.03] text-xs text-white placeholder:text-[#6B7280] focus-visible:ring-2 focus-visible:ring-[#6366F1]"
            />
            {aiEnabled && aiSuggestions.description && (
              <div className="mt-1 rounded-[8px] border border-[#8B5CF6]/20 bg-[#8B5CF6]/8 p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-[9px] font-medium text-[#C7D2FE]">
                      <Wand2 className="h-2.5 w-2.5" />
                      AI Enhanced
                    </div>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-white line-clamp-3">{aiSuggestions.description}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => applyAiSuggestion("description")}
                    className="h-6 shrink-0 rounded-[6px] bg-[#6366F1] px-2 text-[9px] text-white hover:bg-[#8B5CF6]"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#F9FAFB]">Tag Selector</label>
              <div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-2.5">
                <div className="mb-2 flex flex-wrap gap-1.5">
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
                        "rounded-full border border-[#6366F1]/30 bg-[#6366F1]/12 px-2.5 py-0.5 text-[10px] text-[#C7D2FE] hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/16"
                      )}
                    >
                      {tag} x
                    </button>
                  ))}
                </div>
                {aiEnabled && aiSuggestions.tags.length > 0 && (
                  <div className="mb-2 rounded-[8px] border border-[#8B5CF6]/20 bg-[#8B5CF6]/8 p-2">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-[#C7D2FE]">
                        <Sparkles className="h-3 w-3" />
                        AI Suggested Tags
                      </div>
                      <button
                        type="button"
                        onClick={() => applyAiSuggestion("tags")}
                        className="text-[10px] text-[#6366F1] hover:text-[#8B5CF6]"
                      >
                        Add All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
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
                            "rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/12 px-2 py-0.5 text-[9px] text-[#DDD6FE] hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/20"
                          )}
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-1.5">
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
                    className="h-8 rounded-[10px] border-white/10 bg-[#0A0D12] text-xs text-white placeholder:text-[#6B7280]"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    className="h-8 rounded-[10px] bg-[#6366F1] px-3 text-xs text-white hover:bg-[#8B5CF6]"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#F9FAFB]">Category</label>
                <div className="relative">
                  <select
                    value={draft.category}
                    disabled
                    className="h-9 w-full rounded-[12px] border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none ring-0 cursor-not-allowed opacity-75"
                  >
                    <option value={draft.category} className="bg-[#111827] text-white">
                      {draft.category}
                    </option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 px-1.5 py-0.5">
                    <span className="text-[9px] font-medium text-emerald-300">Selected</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#6B7280]">Category is pre-selected from your venture path</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#F9FAFB]">Stage</label>
                <select
                  value={draft.stage}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, stage: event.target.value }))
                  }
                  className="h-9 w-full rounded-[12px] border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none ring-0 transition-all duration-200 focus:border-[#6366F1]"
                >
                  {stageOptions.map((stage) => (
                    <option key={stage} value={stage} className="bg-[#111827] text-white">
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#F9FAFB]">
                  Industries <span className="text-red-400">*</span>
                </label>
                <div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-2.5">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {draft.industries.map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            industries: current.industries.filter((i) => i !== industry),
                          }))
                        }
                        className={cn(
                          transitionBase,
                          "rounded-full border border-emerald-500/30 bg-emerald-500/12 px-2.5 py-0.5 text-[10px] text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-500/16"
                        )}
                      >
                        {industry} ×
                      </button>
                    ))}
                  </div>
                  <select
                    value=""
                    onChange={(event) => {
                      const industry = event.target.value;
                      if (industry && !draft.industries.includes(industry)) {
                        setDraft((current) => ({
                          ...current,
                          industries: [...current.industries, industry],
                        }));
                      }
                    }}
                    className="h-8 w-full rounded-[10px] border-white/10 bg-[#0A0D12] px-3 text-xs text-white outline-none ring-0"
                  >
                    <option value="" className="bg-[#111827] text-[#6B7280]">
                      Select industries...
                    </option>
                    {industryOptions
                      .filter((industry) => !draft.industries.includes(industry))
                      .map((industry) => (
                        <option key={industry} value={industry} className="bg-[#111827] text-white">
                          {industry}
                        </option>
                      ))}
                  </select>
                </div>
                <p className="text-[10px] text-[#6B7280]">Select target industries</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#F9FAFB]">
              Visibility <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, visibility: "public" }))}
                className={cn(
                  transitionBase,
                  "flex items-center gap-2 rounded-[10px] border p-3 text-left",
                  draft.visibility === "public"
                    ? "border-[#6366F1]/50 bg-[#6366F1]/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                )}
              >
                <div className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  draft.visibility === "public"
                    ? "border-[#6366F1] bg-[#6366F1]"
                    : "border-white/30"
                )}>
                  {draft.visibility === "public" && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(displayFontClass, "text-xs font-semibold text-white")}>
                    Public
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] truncate">Visible to all</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, visibility: "private" }))}
                className={cn(
                  transitionBase,
                  "flex items-center gap-2 rounded-[10px] border p-3 text-left",
                  draft.visibility === "private"
                    ? "border-[#6366F1]/50 bg-[#6366F1]/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                )}
              >
                <div className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  draft.visibility === "private"
                    ? "border-[#6366F1] bg-[#6366F1]"
                    : "border-white/30"
                )}>
                  {draft.visibility === "private" && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(displayFontClass, "text-xs font-semibold text-white")}>
                    Private
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] truncate">Connections only</p>
                </div>
              </button>
            </div>
          </div>

          <button
            type="button"
            className={cn(
              transitionBase,
              "group flex w-full items-center justify-between rounded-[14px] border border-dashed border-white/12 bg-white/[0.02] px-4 py-3 text-left hover:border-[#6366F1]/50 hover:bg-[#6366F1]/6"
            )}
          >
            <div>
              <div className={cn(displayFontClass, "text-sm font-semibold text-white")}>
                Image Upload Area
              </div>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                Drag and drop a concept banner or upload a screenshot
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#111827] p-2 text-[#C7D2FE] group-hover:border-[#6366F1]/50">
              <ImagePlus className="h-4 w-4" />
            </div>
          </button>
          </div>
        )}

        <DialogFooter className="border-t border-white/8 px-4 py-2.5">
          {showPreview ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(false)}
                className="h-7 rounded-[7px] border-white/10 bg-white/[0.03] text-[10px] text-white hover:border-[#6366F1]/40 hover:bg-[#6366F1]/10 flex items-center gap-1"
              >
                <Edit className="h-2.5 w-2.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => commitDraft("ideaforge-composer-draft", "Draft saved")}
                className="h-7 rounded-[7px] border-white/10 bg-white/[0.03] text-[10px] text-white hover:border-[#6366F1]/40 hover:bg-[#6366F1]/10"
              >
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={handlePublishIdea}
                disabled={isPublishing}
                className="h-7 rounded-[7px] bg-[#6366F1] px-3 text-[10px] text-white hover:bg-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-[#6366F1] disabled:opacity-50"
              >
                {isPublishing ? "Publishing..." : "Publish Idea →"}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-7 rounded-[7px] text-[10px] text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => commitDraft("ideaforge-composer-draft", "Draft saved")}
                className="h-7 rounded-[7px] border-white/10 bg-white/[0.03] text-[10px] text-white hover:border-[#6366F1]/40 hover:bg-[#6366F1]/10"
              >
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!draft.title.trim()) {
                    toast({
                      title: "Title Required",
                      description: "Please enter a title for your idea.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setShowPreview(true);
                }}
                className="h-7 rounded-[7px] bg-[#6366F1] px-3 text-[10px] text-white hover:bg-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-[#6366F1] flex items-center gap-1"
              >
                <Eye className="h-2.5 w-2.5" />
                Preview
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
