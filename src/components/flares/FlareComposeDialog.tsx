"use client";

/**
 * Compose dialog for firing a new flare.
 *
 * Layout mirrors the IdeaWizard preview step (title + description +
 * industries + skills). Difference from the wizard:
 *   - Heading is "Fire a Flare", not "Your Idea"
 *   - Title is pre-filled from the linked idea and can be edited
 *   - Industries + Skills are pre-filled from the linked idea's tags
 *     but editable
 *   - Description is empty for the user to describe their problem
 *   - No file upload, no "post to social platforms" toggle
 *
 * The backend still stores everything in the flare's `description`
 * field; the extra structure here is a UX/UI improvement on top of
 * the existing single-text flare model.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
// Pixel-art campfire icon — matches the Flare tile in the
// Adventurer's Menu so the compose dialog reads as the same feature.
import { PixelIcon } from "@/components/ui/PixelIcon";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IndustriesMultiSelect } from "@/components/IndustriesMultiSelect";
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";
import { cn } from "@/lib/utils";
import { displayFontClass } from "@/components/ideaforge/shared";
import {
  useKeyboardInsets,
  keyboardSafeStyle,
} from "@/lib/hooks/useKeyboardInsets";

const MIN_DESCRIPTION_CHARS = 20;
const MAX_DESCRIPTION_CHARS = 600;
const MAX_TITLE_CHARS = 100;

interface Props {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  ventureId?: Id<"ventures">;
  checkpointId?: Id<"ventureCheckpoints">;
}

function parseTagArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim());
  }
  if (typeof raw !== "string" || raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim());
    }
  } catch {
    /* not JSON — treat as CSV / plain string */
  }
  return [raw.trim()];
}

export function FlareComposeDialog({
  open,
  onOpenChange,
  ventureId,
  checkpointId,
}: Props) {
  // Mobile keyboard-aware sizing — collapses the dialog max-height
  // to the visible visualViewport so the Fire Flare button stays on
  // screen when the keyboard opens. Fixes the screenshot report:
  // "while typing the mobile layout mess". Cross-browser rationale
  // in useKeyboardInsets.ts docstring.
  const kb = useKeyboardInsets();
  // ── Fetch venture -> idea so we can pre-fill title + tags ────────────────
  const venture = useQuery(
    api.ventures.getVenture,
    ventureId ? { ventureId } : "skip",
  );
  const idea = useQuery(
    api.ideas.getIdeaById,
    venture?.ideaId ? { ideaId: venture.ideaId } : "skip",
  );

  // Pre-fill sources derived from the idea. Wrapped in useMemo so the
  // effect below doesn't re-fire on every render.
  const prefill = useMemo(() => {
    const title = idea?.title ? `Help with: ${idea.title}` : "";
    const industries = parseTagArray(
      (idea as { industries?: unknown } | null | undefined)?.industries,
    );
    const skills = parseTagArray(
      (idea as { category?: unknown } | null | undefined)?.category,
    );
    return { title, industries, skills };
  }, [idea]);

  // ── Local form state ─────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track whether the user has manually edited each pre-fillable field
  // so we don't overwrite their edits when Convex resolves late.
  const [touched, setTouched] = useState({
    title: false,
    industries: false,
    skills: false,
  });

  const fireFlare = useMutation(api.flares.fireFlare);

  // Reset when the dialog reopens.
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setIndustries([]);
      setSkills([]);
      setError(null);
      setTouched({ title: false, industries: false, skills: false });
    }
  }, [open]);

  // Apply pre-fill values once the idea query resolves, unless the user
  // has already started typing/selecting.
  useEffect(() => {
    if (!open) return;
    if (!touched.title && prefill.title) setTitle(prefill.title);
    if (!touched.industries && prefill.industries.length > 0)
      setIndustries(prefill.industries);
    if (!touched.skills && prefill.skills.length > 0) setSkills(prefill.skills);
  }, [open, prefill, touched]);

  const trimmedDescriptionLength = description.trim().length;
  const tooShort =
    trimmedDescriptionLength > 0 &&
    trimmedDescriptionLength < MIN_DESCRIPTION_CHARS;
  const canSubmit =
    trimmedDescriptionLength >= MIN_DESCRIPTION_CHARS &&
    title.trim().length > 0 &&
    !submitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      // Serialise the structured form into the single description field
      // the backend expects. The first line is the pre-filled/edited
      // title; the next lines are the actual problem statement. Industries
      // + skills are appended so responders can filter by relevance.
      const tags = [
        ...industries.map((i) => `#${i.replace(/\s+/g, "-").toLowerCase()}`),
        ...skills.map((s) => `#${s.replace(/\s+/g, "-").toLowerCase()}`),
      ];
      const composed = `${title.trim()}\n\n${description.trim()}${
        tags.length > 0 ? `\n\n${tags.join(" ")}` : ""
      }`;
      // Use the first skill as the expertiseTag hint if the user set one.
      const primarySkill = skills[0]?.trim();
      await fireFlare({
        description: composed,
        expertiseTag: primarySkill || undefined,
        ventureId,
        checkpointId,
      });
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't fire your flare. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit,
    title,
    description,
    industries,
    skills,
    fireFlare,
    ventureId,
    checkpointId,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(100%-2rem,680px)] max-w-[680px] gap-0 flex flex-col rounded-[20px] border border-white/5 bg-[#0A0E1A] p-0 text-[#F9FAFB] shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden h-auto max-h-[90dvh]"
        style={keyboardSafeStyle(kb, { reserveVh: 0.92 })}
        data-tutorial="flare-compose"
      >
        <DialogHeader className="border-b border-white/5 px-5 py-3 text-left bg-[#0D1117] shrink-0">
          <div className="flex items-center gap-2">
            <PixelIcon name="menu-flare-v2" size={22} alt="Flare" />
            <DialogTitle
              className={cn(
                displayFontClass,
                "text-lg font-semibold text-white",
              )}
            >
              Flare
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#9CA3AF] mt-0.5">
            Ask the community for help. Be specific about your problem so
            people can respond usefully.
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 sm:px-5 space-y-3 min-h-0"
          style={kb.isKeyboardOpen ? { scrollPaddingBottom: 96 } : undefined}
        >
          {/* Title — pre-filled from the linked idea */}
          <div>
            <Input
              id="flare-title"
              value={title}
              onChange={(e) => {
                setTouched((t) => ({ ...t, title: true }));
                setTitle(e.target.value.slice(0, MAX_TITLE_CHARS));
              }}
              placeholder="A short, specific title"
              maxLength={MAX_TITLE_CHARS}
              className="h-11 rounded-[10px] border-white/5 bg-[#0D1117] px-3 text-base text-white placeholder:text-[#6B7280] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-0 lg:text-sm"
              required
              autoFocus
              disabled={submitting}
            />
          </div>

          {/* Description — user describes their problem */}
          <div>
            <Textarea
              id="flare-description"
              placeholder="What's the problem? What have you tried?"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value.slice(0, MAX_DESCRIPTION_CHARS))
              }
              className="min-h-[140px] rounded-[10px] border-white/5 bg-[#0D1117] p-3 text-sm text-white placeholder:text-[#6B7280] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-amber-400"
              disabled={submitting}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              // Stop keydown bubbling so tutorial scrim / Phaser / any
              // parent key handler can't swallow space or letters.
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
              autoComplete="off"
              autoCorrect="off"
            />
            <div className="mt-1 flex items-center justify-between text-[10px]">
              {/*
                Helper text simplified — the "Specific beats vague…"
                hint was removed per product request; when the user
                has typed enough characters the row now shows nothing
                on the left instead of a permanent nag. The
                min-characters coaching still surfaces (only when
                the current draft is below MIN_DESCRIPTION_CHARS).
              */}
              <span className={tooShort ? "text-amber-300" : "text-transparent"}>
                {tooShort
                  ? `A bit more context helps — ${
                      MIN_DESCRIPTION_CHARS - trimmedDescriptionLength
                    } more characters`
                  : ""}
              </span>
              <span className="font-mono text-white/40 tabular-nums">
                {trimmedDescriptionLength} / {MAX_DESCRIPTION_CHARS}
              </span>
            </div>
          </div>

          {/* Industries + Skills — pre-filled but editable. Headings
              are now the placeholder text INSIDE the dropdown buttons
              (per product ask: "write industry impact and the other
              tag heading inside the box remove the heading from
              outside"), so the outer <label> elements are dropped and
              the trigger reads the field label until the user has
              picked something. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <IndustriesMultiSelect
              selectedIndustries={industries}
              onChange={(next) => {
                setTouched((t) => ({ ...t, industries: true }));
                setIndustries(next);
              }}
              placeholder="Industries impacted"
            />
            <SkillsMultiSelect
              selectedSkills={skills}
              onChange={(next) => {
                setTouched((t) => ({ ...t, skills: true }));
                setSkills(next);
              }}
              placeholder="Skills needed"
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">
              {error}
            </p>
          )}
        </div>

        {/* Footer — Fire Flare CTA only. Back-arrow button removed
            per product request; the header × already dismisses the
            dialog so an inline cancel was redundant. `justify-end`
            keeps the Fire Flare button flush-right. */}
        <div className="flex items-center justify-end gap-3 border-t border-white/5 px-5 pt-3 pb-4 bg-[#0D1117] shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_32px_rgba(245,158,11,0.25)] transition hover:from-amber-400 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Firing…
              </>
            ) : (
              // Send / paper-plane glyph removed per product ask —
              // the CTA now reads as text only. Loader spinner during
              // submit stays because it's a live status affordance,
              // not decoration.
              "Fire Flare"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
