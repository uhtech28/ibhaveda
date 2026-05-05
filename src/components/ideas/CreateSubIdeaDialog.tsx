import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";
import { IndustriesMultiSelect } from "@/components/IndustriesMultiSelect";
import { Spinner } from "@/components/ui/spinner";
import CardUpload from "@/components/card-upload";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { AlertCircle, Globe, Lock } from "lucide-react";
import { Id } from "@convex/_generated/dataModel";

interface CreateSubIdeaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: Id<"ideas">;
  addSubIdeaMutation: (args: {
    parentId: Id<"ideas">;
    title: string;
    description: string;
    category: string;
    industries?: string;
    visibility: string;
  }) => Promise<{ subIdeaId: Id<"ideas">; message: string }>;
}

export function CreateSubIdeaDialog({
  isOpen,
  onOpenChange,
  parentId,
  addSubIdeaMutation,
}: CreateSubIdeaDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");

  const generateUploadUrl = useMutation(api.ideas.generateUploadUrl);
  const attachFileToIdea = useMutation(api.ideas.attachFileToIdea);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || skills.length === 0 || industries.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setUploadError("");

    try {
      const fileCount = selectedFiles.length;
      if (fileCount > 1) {
        setError("Maximum 1 file allowed");
        setIsSubmitting(false);
        return;
      }
      if (fileCount === 1) {
        const f = selectedFiles[0];
        const type = (f.type || "").toLowerCase();
        const allowed = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "video/mp4",
        ];
        if (!allowed.includes(type)) {
          setError("Unsupported file type");
          setIsSubmitting(false);
          return;
        }
        if (f.size > 50 * 1024 * 1024) {
          setError("Total size limit exceeded (50MB)");
          setIsSubmitting(false);
          return;
        }
        if (type === "video/mp4" && f.size > 25 * 1024 * 1024) {
          setError("MP4 files must be 25MB or less");
          setIsSubmitting(false);
          return;
        }
      }

      const res = await addSubIdeaMutation({
        parentId,
        title: title.trim(),
        description: description.trim(),
        category: JSON.stringify(skills),
        industries: industries.length > 0 ? JSON.stringify(industries) : undefined,
        visibility,
      });
      const createdId = res.subIdeaId;

      if (selectedFiles.length === 1) {
        const file = selectedFiles[0];
        const withRetry = async <T,>(fn: () => Promise<T>, retries = 2, delayMs = 600): Promise<T> => {
          try {
            return await fn();
          } catch (err) {
            if (retries <= 0) throw err;
            await new Promise((r) => setTimeout(r, delayMs));
            return withRetry(fn, retries - 1, delayMs * 1.5);
          }
        };

        try {
          const { uploadUrl } = await withRetry(() => generateUploadUrl({}));
          const uploadResp = await withRetry(() => fetch(uploadUrl, { method: "POST", body: file }));
          if (!uploadResp.ok) {
            throw new Error("Network upload failed");
          }
          const json = await uploadResp.json().catch(() => ({ storageId: undefined }));
          const storageId = json?.storageId as string | undefined;
          if (!storageId) {
            throw new Error("Upload did not return storageId");
          }

          await withRetry(() => attachFileToIdea({
            ideaId: createdId,
            storageId,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: Date.now(),
          }));
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          setUploadError(msg);
        }
      }

      // Reset form and close modal
      setTitle("");
      setDescription("");
      setSkills([]);
      setIndustries([]);
      setVisibility("public");
      setSelectedFiles([]);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create sub-idea");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Sub-Idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Frontend Architecture"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the sub-idea..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Required Skills</Label>
              <SkillsMultiSelect
                selectedSkills={skills}
                onChange={setSkills}
                placeholder="Select skills..."
              />
            </div>
            <div className="space-y-2">
              <Label>Relevant Industries</Label>
              <IndustriesMultiSelect
                selectedIndustries={industries}
                onChange={setIndustries}
                placeholder="Select industries..."
              />
            </div>
          </div>

          {/* Visibility — same Public/Private card style as the main
           * /create-idea form, so the contribute flow feels identical. */}
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

          <div className="space-y-2">
            <Label>Attachment</Label>
            <CardUpload
              maxFiles={1}
              maxSize={50 * 1024 * 1024}
              accept={"application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/jpg,image/png,image/gif,video/mp4,.pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.gif,.mp4"}
              multiple={false}
              onChange={(files) => setSelectedFiles(files)}
            />
            {uploadError && (
              <div className="flex items-center space-x-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-3 h-3 text-destructive" />
                <p className="text-xs text-destructive">{uploadError}</p>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">Supported: PDF, DOCX, PPTX, XLSX, JPG, PNG, GIF, MP4 (≤25MB)</p>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title || !description || skills.length === 0 || industries.length === 0}>
              {isSubmitting ? <Spinner size={16} className="mr-2" /> : null}
              Create Sub-Idea
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
