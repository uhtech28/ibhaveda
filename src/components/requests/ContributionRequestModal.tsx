"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id, Doc } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// NOTE: This component is embedded inside plain overlay containers
// (e.g. the map's contributors panel) rather than a Radix <Dialog>
// root. That means <DialogTitle> and friends throw "must be used
// within `Dialog`" — so we render bare div/h2 elements that keep the
// original shadcn styling (flex/gap/font-semibold) without needing
// the Dialog context.
import { CheckCircle2, Clock, XCircle, UserPlus, Sparkles } from "lucide-react";
import { notifyRequestSent } from "@/components/requests/notification-toast";
import Link from "next/link";
// Skill-tag picker — matches the same component used in profile setup
// and idea creation, so the vocabulary of tags stays consistent across
// the app. Caps selection at 5 so authors' incoming-request lists
// don't get spammed with a laundry list of every skill.
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";
import {
  useKeyboardInsets,
  keyboardSafeStyle,
} from "@/lib/hooks/useKeyboardInsets";

interface ContributionRequestModalProps {
  ideaId: Id<"ideas">;
  ideaTitle: string;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  onClose: () => void;
  /**
   * Render the skill-tag picker + header subtitle above the message
   * textarea. Product split:
   *   - /feed "Contribute" button (from IdeaCards)  → false (simple
   *     message-only form, matches the pre-tags UX)
   *   - Map's Adventurer's Menu CONTRIBUTIONS tile → true (full
   *     gamified form with SkillsMultiSelect)
   *
   * Default = false so the feed stays untouched. Callers on the map
   * pass `showSkillTags` explicitly.
   */
  showSkillTags?: boolean;
}

export const ContributionRequestModal: React.FC<ContributionRequestModalProps> = ({
  ideaId,
  ideaTitle,
  authorName,
  authorUsername,
  authorAvatar,
  onClose,
  showSkillTags = false,
}) => {
  const createRequestMutation = useMutation(api.contributionRequests.createContributionRequest);
  const userRequests = useQuery(api.contributionRequests.getMyRequests);

  // Keyboard-aware sizing — this component is rendered inside
  // multiple wrappers (map dialog, feed dialog, tutorial dialog),
  // most of which don't set a keyboard-safe max-height on their
  // DialogContent. By clamping the FORM itself we cover every
  // call-site without touching each host. Fires the shared
  // useKeyboardInsets hook (visualViewport-based).
  const kb = useKeyboardInsets();

  const [message, setMessage] = useState("");
  // Skill tags the contributor is offering — capped at 5 by the
  // SkillsMultiSelect component itself. Server also dedupes + caps
  // so the mutation is safe against hand-crafted calls.
  const [skills, setSkills] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [existingRequest, setExistingRequest] = useState<Doc<"contributionRequests"> | null>(null);
  const isOverMessageLimit = message.length > 1200;
  const displayAuthorName = authorName || "the author";
  const initials = (authorName || authorUsername || "U")
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const profileHref = authorUsername ? `/profile/${authorUsername}` : undefined;
  const ideaHref = `/idea/${ideaId}`;

  useEffect(() => {
    if (userRequests) {
      const request = userRequests.find(req => req.ideaId === ideaId);
      setExistingRequest(request || null);
    }
  }, [userRequests, ideaId]);

  // Pull the human-readable line out of a Convex server error string.
  // Convex format: "[CONVEX M(...)] [Request ID: ...] Server Error Uncaught Error: <real message> at handler ..."
  const friendlyError = (raw: string): string => {
    const match = raw.match(/Uncaught Error:\s*(.+?)\s*at handler/i);
    if (match && match[1]) return match[1];
    return raw.replace(/^\[CONVEX[^\]]*\]\s*\[[^\]]*\]\s*Server Error\s*/i, "").split("\n")[0];
  };

  const projectProfileHeader = (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
      <Link
        href={ideaHref}
        className="min-w-0 truncate text-sm font-semibold text-white transition-colors hover:text-[#C7D2FE]"
        title={ideaTitle}
      >
        {ideaTitle}
      </Link>
      {profileHref ? (
        <Link
          href={profileHref}
          className="shrink-0 rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/50"
          aria-label={`Open ${displayAuthorName}'s profile`}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={authorAvatar} alt={displayAuthorName} />
            <AvatarFallback className="bg-[#1B2440] text-xs text-white">{initials || "U"}</AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={authorAvatar} alt={displayAuthorName} />
          <AvatarFallback className="bg-[#1B2440] text-xs text-white">{initials || "U"}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting || isOverMessageLimit) return;

    setIsSubmitting(true);
    setError("");

    try {
      await createRequestMutation({
        ideaId,
        message: message.trim(),
        // Only send when the user picked at least one — keeps the
        // server payload tidy and matches the schema's optional
        // shape for legacy rows.
        skills: skills.length > 0 ? skills : undefined,
      });

      setMessage("");
      setSkills([]);
      notifyRequestSent();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to send contribution request:", err);
      const raw = err instanceof Error ? err.message : "Failed to send contribution request.";
      setError(friendlyError(raw));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingRequest) {
    const status = existingRequest.status;
    const statusConfig = {
      pending: {
        color: "border-amber-400/30 bg-amber-400/10 text-amber-200",
        icon: Clock,
        message: "Waiting for author's response.",
      },
      accepted: {
        color: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
        icon: CheckCircle2,
        message: "You are now a contributor!",
      },
      rejected: {
        color: "border-rose-400/30 bg-rose-400/10 text-rose-200",
        icon: XCircle,
        message: "Your request was declined.",
      },
    }[status as "pending" | "accepted" | "rejected"] || {
      color: "border-white/10 bg-white/[0.03] text-white",
      icon: Clock,
      message: "",
    };

    const StatusIcon = statusConfig.icon;

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 text-left">
          <h2 className="text-lg leading-none font-semibold">
            Contribution Status
          </h2>
        </div>

        <div className="flex flex-col gap-4">
            {projectProfileHeader}

            <div className={`rounded-xl border px-3 py-2 ${statusConfig.color} flex items-center gap-2.5`}>
                <StatusIcon className="h-4 w-4 shrink-0" />
                <p className="min-w-0 text-xs leading-5">
                  <span className="font-semibold capitalize">{status}</span>
                  {statusConfig.message && (
                    <span className="ml-2 opacity-85">{statusConfig.message}</span>
                  )}
                </p>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Your Message</p>
                <p className="text-sm italic text-foreground/80">"{existingRequest.message}"</p>
            </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {status === "rejected" ? (
                <div className="flex w-full justify-end gap-2">
                     <Button variant="outline" onClick={onClose}>Close</Button>
                     {/* Allow resubmitting if rejected? Logic for that would need to be handled, maybe delete old request? For now just close. */}
                </div>
            ) : (
                <Button onClick={onClose} className="w-full sm:w-auto">Close</Button>
            )}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="contribution-request-form w-full min-w-0 space-y-6 overflow-y-auto"
      // Clamp to the visible viewport when the on-screen keyboard is
      // open (visualViewport-derived). Prevents the textarea + Send
      // Request button from disappearing behind the keyboard on iOS
      // Safari + Android Chrome per screenshot report.
      style={
        kb.isKeyboardOpen
          ? { ...keyboardSafeStyle(kb, { reserveVh: 0.82 }), scrollPaddingBottom: 96 }
          : undefined
      }
    >
      <div className="contribution-request-header flex flex-col gap-1.5 text-left">
        <h2 className="text-lg leading-none font-semibold">
          Request to Contribute
        </h2>
        {/* Subtitle only makes sense when the tag picker is present —
            without tags there's nothing to explain beyond the
            textarea. Product ask: "for the feed keep contribution
            that was earlier there [simple form], keep this for
            gamification". */}
        {showSkillTags && (
          <p className="text-xs text-white/60 leading-relaxed">
            Tell the author what you can help with. Add skill tags so
            they know exactly where you fit.
          </p>
        )}
      </div>

      <div className="contribution-request-body space-y-4">
        {projectProfileHeader}

        {/* ── SKILL TAGS ────────────────────────────────────────────
            Only rendered on the gamification path (map's Adventurer's
            Menu → CONTRIBUTIONS tile). The /feed "Contribute" button
            deliberately hides this so its dialog stays as short and
            frictionless as it was before the tag picker shipped. */}
        {showSkillTags && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/70">
                <Sparkles className="h-3 w-3 text-[#C7D2FE]" />
                Skills you're offering
              </label>
              <span className="text-[10px] text-white/40">
                {skills.length}/5
              </span>
            </div>
            <SkillsMultiSelect
              selectedSkills={skills}
              onChange={setSkills}
              placeholder="Add skills you'd bring…"
              maxSelection={5}
            />
          </div>
        )}

        {/* ── MESSAGE ─────────────────────────────────────────────── */}
        <div className="space-y-2">
          {/* Label only shown alongside the skill picker so the
              feed's compact form doesn't get an extra header line
              above a textarea that used to be label-less. */}
          {showSkillTags && (
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
              Message
            </label>
          )}
          <div
            className={`relative rounded-[22px] border bg-[#0A0D12] transition-colors focus-within:bg-[#111827] ${
              isOverMessageLimit
                ? "border-rose-500/80 focus-within:border-rose-400"
                : "border-white/10 focus-within:border-[#6366F1]/45"
            }`}
          >
            <textarea
              id="message"
              placeholder={`Tell ${displayAuthorName} how you can help!`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              // Stop keydown from bubbling to any parent handler that may
              // preventDefault on Space / Enter (StoryAction inner span,
              // Radix Dialog focus trap edge cases, tutorial scrim wraps).
              // Ensures the native textarea receives every keystroke.
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
              onKeyPress={(e) => e.stopPropagation()}
              className="contribution-request-textarea block min-h-[120px] w-full resize-none rounded-[22px] bg-transparent p-4 text-base leading-6 text-white placeholder:text-[#6B7280] outline-none focus:ring-0 lg:text-sm lg:leading-5"
              required
            />
          </div>
          {/* Char-count row is a gamification-flow addition — the
              feed's original dialog never had one, so we only render
              it when showSkillTags is on. The over-limit warning
              still shows in either mode because it's a real error
              the user needs to see. */}
          {showSkillTags ? (
            <div className="flex items-center justify-between px-1">
              {isOverMessageLimit ? (
                <p className="text-[11px] font-medium text-rose-400">
                  Max character count reached
                </p>
              ) : (
                <span />
              )}
              <span
                className={`text-[10px] tabular-nums ${
                  message.length > 1000 ? "text-amber-400" : "text-white/40"
                }`}
              >
                {message.length}/1200
              </span>
            </div>
          ) : (
            isOverMessageLimit && (
              <p className="mt-1.5 pl-3 text-[11px] font-medium text-rose-400">
                Max character count reached
              </p>
            )
          )}
          {error && <p className="mt-2 pl-3 text-[11px] text-rose-400">{error}</p>}
        </div>
      </div>

      <div className="contribution-request-footer flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="submit" disabled={!message.trim() || isSubmitting || isOverMessageLimit} className="gap-2">
          {isSubmitting ? <Spinner size={16} /> : <UserPlus className="w-4 h-4" />}
          Send Request
        </Button>
      </div>
    </form>
  );
};
