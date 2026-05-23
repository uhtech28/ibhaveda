"use client";

import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X, AlertCircle, Sparkles, Globe, Lock } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { IndustriesMultiSelect } from "@/components/IndustriesMultiSelect";
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

const EXAMPLE_SEEDS: Array<{
  title: string;
  description: string;
  industries: string[];
  skills: string[];
}> = [
  {
    title: "Voice-first reading companion for kids",
    description: "Most reading apps for kids are passive. What if a voice-led reading buddy listened, gently corrected pronunciation, and turned each chapter into a 60-second adventure recap?",
    industries: ["Education and Academia", "Software Services, Apps, and Equipment"],
    skills: ["Computer and Software Engineering", "Designer", "Academia and Education"],
  },
  {
    title: "Local-first community fridge map",
    description: "Community fridges fight food waste, but finding nearby ones is hit-or-miss. A hyperlocal map where neighbors check fridges in/out and post photos of available items.",
    industries: ["Social Services and Environmentalism", "Food, Beverages, Tobacco, and Other Consumables"],
    skills: ["Computer and Software Engineering", "Sociology", "Designer"],
  },
  {
    title: "Idea-to-investor matchmaker",
    description: "A two-sided platform where founders write the smallest possible pitch (one paragraph + one diagram) and investors filter by industry / stage / capital.",
    industries: ["Finance", "Software Services, Apps, and Equipment"],
    skills: ["Finance and Insurance", "Computer and Software Engineering", "General Management"],
  },
  {
    title: "Carbon-aware home energy coach",
    description: "Most people want to lower their carbon footprint but don't know which appliance to swap first. A coach that reads your smart-meter data and recommends one high-impact change per month.",
    industries: ["Energy", "Public Utilities"],
    skills: ["Electrical Engineering", "Computer and Software Engineering", "Geoscience"],
  },
  {
    title: "Peer-led microlearning for trade skills",
    description: "Vocational training is bottlenecked by formal certification. A platform where verified tradespeople record 5-minute drills (welding, plumbing, electrical) and learners earn skill badges by uploading proof-of-practice videos.",
    industries: ["Education and Academia", "Construction and Materials"],
    skills: ["Training Services", "Film", "Designer"],
  },
];

type Visibility = "public" | "private";

export default function CreateIdeaPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const createIdea = useMutation(api.ideas.createIdea);
  const createVenture = useMutation(api.ventures.createVenture);
  const generateUploadUrl = useMutation(api.ideas.generateUploadUrl);
  const attachFileToIdea = useMutation(api.ideas.attachFileToIdea);

  // Load drafts from storage (User Change)
  useEffect(() => {
    try {
      const rawDraft = window.sessionStorage.getItem("ideaforge-composer-publish") || window.localStorage.getItem("ideaforge-composer-draft");
      if (!rawDraft) return;

      const parsed = JSON.parse(rawDraft);
      setTitle(parsed.title || "");
      setDescription(parsed.description || "");
      setSkills(Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : []);

      window.sessionStorage.removeItem("ideaforge-composer-publish");
    } catch {
      // Ignore invalid local draft payloads.
    }
  }, []);

  useEffect(() => {
    if (isLoaded && !userId) router.push("/");
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
        <FooterSection />
      </div>
    );
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageError("");
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Unsupported file type. Use JPG, PNG, GIF, or WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`Image too large. Max ${MAX_IMAGE_SIZE / (1024 * 1024)} MB.`);
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    if (!title.trim()) { setSubmitError("Title is required."); return; }
    if (!description.trim()) { setSubmitError("Description is required."); return; }
    if (title.length > 100) { setSubmitError("Title must be 100 characters or less."); return; }
    if (description.length > 1200) { setSubmitError("Description must be 1200 characters or less."); return; }
    if (skills.length === 0) { setSubmitError("Please select at least one skill."); return; }
    if (industries.length === 0) { setSubmitError("Please select at least one industry."); return; }

    setIsSubmitting(true);
    try {
      // 1. Create the Idea
      const res = await createIdea({
        title: title.trim(),
        description: description.trim(),
        category: skills.length > 0 ? JSON.stringify(skills) : "",
        industries: industries.length > 0 ? JSON.stringify(industries) : undefined,
        visibility,
      });
      const newIdeaId = res.ideaId;

      // 2. Automated Venture Creation (User Logic)
      const ventureId = await createVenture({
        ideaId: newIdeaId as any,
        skills,
        industries,
      });

      // 3. Handle Image Upload if present
      if (imageFile) {
        try {
          const { uploadUrl } = await generateUploadUrl({});
          const uploadResp = await fetch(uploadUrl, { method: "POST", body: imageFile });
          if (!uploadResp.ok) throw new Error("Upload failed");
          const { storageId } = await uploadResp.json();
          if (storageId) {
            await attachFileToIdea({
              ideaId: newIdeaId,
              storageId,
              name: imageFile.name,
              type: imageFile.type,
              size: imageFile.size,
              uploadedAt: Date.now(),
            });
          }
        } catch (err) {
          console.error("Image upload failed:", err);
          toast({
            title: "Idea posted, image upload failed",
            description: "You can edit the idea to attach an image later.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: visibility === "public" ? "Idea published!" : "Idea saved as private",
        description: visibility === "public"
          ? "Taking you to your world map."
          : "Only you can see this idea — toggle to Public any time.",
      });

      // Redirect to world map (User Logic)
      router.push(`/map/world?ventureId=${ventureId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to post idea.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleCount = title.length;
  const descCount = description.length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />

      <main className="flex-1 container mx-auto px-4 py-8 pt-28 max-w-2xl">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Post an Idea</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Title, description, industries, skills, visibility, and an optional image.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const seed = EXAMPLE_SEEDS[Math.floor(Math.random() * EXAMPLE_SEEDS.length)];
              setTitle(seed.title.slice(0, 100));
              setDescription(seed.description.slice(0, 1200));
              setIndustries(seed.industries);
              setSkills(seed.skills);
            }}
            title="Fill the form with an example you can edit or clear"
            className="shrink-0 gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Inspire me
          </Button>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div className="space-y-1">
                <Label htmlFor="title" className="sr-only">Title (required)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                  placeholder="Title * — what are you building?"
                  className="h-11"
                  autoFocus
                />
                <div className="text-right text-xs text-muted-foreground">{titleCount}/100</div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="description" className="sr-only">Description (required)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1200))}
                  placeholder="Description * — describe the problem, the spark, and why now."
                  rows={6}
                  className="resize-y"
                />
                <div className="text-right text-xs text-muted-foreground">{descCount}/1200</div>
              </div>

              {/* Industries */}
              <div>
                <Label className="sr-only">Industries (optional)</Label>
                <IndustriesMultiSelect
                  selectedIndustries={industries}
                  onChange={setIndustries}
                  placeholder="Industries (optional)"
                  maxSelection={5}
                />
              </div>

              {/* Skills */}
              <div>
                <Label className="sr-only">Skills (optional)</Label>
                <SkillsMultiSelect
                  selectedSkills={skills}
                  onChange={setSkills}
                  placeholder="Skills (optional)"
                  maxSelection={6}
                />
              </div>

              {/* Visibility */}
              <div className="space-y-1.5">
                <Label className="sr-only">Visibility</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                      visibility === "public"
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/60 bg-muted/20 hover:border-border"
                    }`}
                  >
                    <div className={`mt-0.5 grid h-8 w-8 place-items-center rounded-lg ${
                      visibility === "public" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Public</span>
                        {visibility === "public" && (
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">Selected</span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        Visible in the feed. Anyone can spark, comment, and request to collaborate.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                      visibility === "private"
                        ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30"
                        : "border-border/60 bg-muted/20 hover:border-border"
                    }`}
                  >
                    <div className={`mt-0.5 grid h-8 w-8 place-items-center rounded-lg ${
                      visibility === "private" ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"
                    }`}>
                      <Lock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Private</span>
                        {visibility === "private" && (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-500">Selected</span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        Only you can see it. Use as a draft, then publish later.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Image upload */}
              <div className="space-y-1.5">
                <Label className="sr-only">Image (optional)</Label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleImageChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Idea preview" className="w-full max-h-72 object-cover" />
                    <button type="button" onClick={clearImage} aria-label="Remove image" className="absolute top-2 right-2 rounded-full bg-black/60 hover:bg-black/80 text-white p-1.5 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={openFilePicker} className="absolute bottom-2 right-2 rounded-md bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 transition-colors">
                      Replace
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={openFilePicker} className="flex flex-col items-center justify-center w-full h-36 rounded-xl border border-dashed border-border/70 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-colors text-center cursor-pointer">
                    <ImagePlus className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">Add an image</span>
                    <span className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF or WebP &middot; up to 10 MB</span>
                  </button>
                )}

                {imageError && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /> {imageError}
                  </p>
                )}
              </div>

              {submitError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/feed")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !title.trim() || !description.trim()}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    visibility === "public" ? "Publish Idea" : "Save Privately"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <FooterSection />
    </div>
  );
}
