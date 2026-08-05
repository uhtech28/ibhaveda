"use client";

/**
 * Single open-flare preview card. Click anywhere on the card to open
 * the detail dialog.
 *
 * Visual language matches the feed's IdeaStoryCard (post card) per
 * product feedback ("make flare UI like post UI"):
 *   - Title dominates the top row (with the OPEN status pill on the
 *     right — status is intentionally kept so users see at-a-glance
 *     whether a flare is still live).
 *   - Author strip sits under the title (avatar + name + relative
 *     time), like the post card's author line.
 *   - Description body has room to breathe.
 *   - Tag chips (NEEDS chip + inline #hashtags parsed from the
 *     description) render as a chip grid at the bottom, styled the
 *     same violet/blue pattern the post card uses for
 *     Industries / Skills.
 *   - Footer carries the response count + time-left metric with the
 *     same border-topped layout the post card uses for its
 *     sparks / comments / contributors row.
 *
 * INTENTIONALLY OMITTED: the venture progress bar (THE VILLAGE 1/8 +
 * boss HP HUD) that milestone post cards render. Flares don't belong
 * to a venture in the same way, and product asked to specifically
 * exclude the "map bar" from this card.
 */

import React from "react";
import { MessageSquare, Clock, Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "@convex/_generated/dataModel";

interface Props {
  flare: {
    _id: Id<"flares">;
    description: string;
    createdAt: number;
    expiresAt?: number;
    expertiseTag?: string;
    status: "open" | "resolved" | "closed" | "expired";
    owner: {
      _id: Id<"users">;
      displayName: string;
      avatar: string | null;
    };
    responseCount: number;
  };
  isOwn?: boolean;
  onClick: () => void;
}

/**
 * Format the days-left countdown for a flare. Returns a short string
 * the card pills can display. Empty string if no expiry data.
 */
function formatDaysLeft(expiresAt?: number): string {
  if (!expiresAt) return "";
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days}d left`;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 1) return `${hours}h left`;
  const mins = Math.max(1, Math.floor(ms / (60 * 1000)));
  return `${mins}m left`;
}

/**
 * Parse #hashtags out of a description string. Returns the tag
 * strings without the # prefix, deduped and trimmed to a max count.
 * Mirrors the "Fintech / Software / …" tag chips on the post card.
 */
function extractHashtags(text: string, max: number = 4): string[] {
  const matches = text.match(/#[\w-]+/g);
  if (!matches) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of matches) {
    const clean = m.replace(/^#/, "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Strip inline #hashtags from a description so they don't render
 * twice (once as body text, once as chips at the bottom). Also
 * collapses the extra whitespace the strip leaves behind.
 */
function stripHashtags(text: string): string {
  return text.replace(/#[\w-]+/g, "").replace(/\s{2,}/g, " ").trim();
}

/**
 * Derive a readable title for the flare card from its description.
 * Uses the first sentence (or first ~70 chars) so the card has a
 * strong headline the way the post card does. Prepends "Help with:"
 * only when the description doesn't already start with it — the
 * FlareComposeDialog pre-fills descriptions with "Help with: {idea
 * title}", so blindly prepending would produce "Help with: Help
 * with:" (visible bug in the screenshot).
 */
function deriveTitle(description: string, maxLen: number = 90): string {
  const clean = stripHashtags(description);
  const firstSentence = clean.split(/[.!?\n]/)[0].trim();
  const base = firstSentence.length > 0 ? firstSentence : clean;
  const trimmed =
    base.length > maxLen ? `${base.slice(0, maxLen).trim()}…` : base;
  // Case-insensitive check for an existing "help with:" prefix so we
  // don't double-stamp it. If the user already framed their flare
  // with the prefix (either via the composer's pre-fill or manually),
  // render their text verbatim; otherwise add the prefix so the card
  // headline keeps its "signal fire" framing.
  if (/^\s*help\s+with\s*:/i.test(trimmed)) return trimmed;
  return `Help with: ${trimmed}`;
}

/**
 * True when the derived title and the description body cover
 * essentially the same content — in which case the body is hidden
 * so the card doesn't render the same line twice.
 *
 * Comparison strategy:
 *   1. Strip the "Help with:" prefix from the title (the body
 *      wouldn't include it if the user's description already had
 *      it — deriveTitle handles that case).
 *   2. Drop the trailing ellipsis if the title was truncated.
 *   3. Normalize whitespace + case.
 *   4. Overlap = body starts with title (or vice versa).
 */
function titleAndBodyOverlap(title: string, body: string): boolean {
  const norm = (s: string) =>
    s
      .replace(/^help\s+with\s*:\s*/i, "")
      .replace(/…$/, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  const t = norm(title);
  const b = norm(body);
  if (!t || !b) return false;
  return b.startsWith(t) || t.startsWith(b);
}

export function FlareCard({ flare, isOwn, onClick }: Props) {
  const hashtags = extractHashtags(flare.description);
  const descriptionBody = stripHashtags(flare.description);
  const title = deriveTitle(flare.description);
  const daysLeft = formatDaysLeft(flare.expiresAt);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open flare: ${title}`}
      className="group relative flex w-full flex-col text-left overflow-hidden rounded-2xl border border-white/8 transition hover:border-amber-500/40 hover:shadow-[0_10px_40px_rgba(245,158,11,0.1)]"
      style={{
        background:
          "linear-gradient(135deg, rgba(20,14,10,0.95) 0%, rgba(10,10,20,0.98) 55%, rgba(28,18,6,0.95) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Top row — Title + OPEN status pill (mirrors the post card's
          "Title + $Valuation" header). */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <h3 className="min-w-0 flex-1 text-base font-bold leading-snug text-white sm:text-lg">
          {title}
        </h3>
        <StatusPill status={flare.status} />
      </div>

      {/* Author strip — compact avatar + name + relative time. Sits
          under the title in the same slot the post card uses for its
          author line + venture progress bar (progress bar omitted
          intentionally per product request). */}
      <div className="mt-2 flex items-center gap-2 px-5">
        <Avatar url={flare.owner.avatar} name={flare.owner.displayName} />
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-sm font-semibold text-white/90">
            {flare.owner.displayName}
          </span>
          {isOwn && (
            <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/60">
              You
            </span>
          )}
          <span className="shrink-0 text-[11px] text-white/40">
            · {formatDistanceToNow(flare.createdAt, { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Description body — hidden when it's substantially the same
          as the derived title. FlareComposeDialog pre-fills the
          description with the flare title, so short flares often
          have title === body; rendering both would duplicate the
          text. Longer descriptions where the user added real detail
          past the pre-fill still show. */}
      {descriptionBody &&
        !titleAndBodyOverlap(title, descriptionBody) && (
          <p className="mt-3 line-clamp-3 px-5 text-sm leading-relaxed text-white/75">
            {descriptionBody}
          </p>
        )}

      {/* Tag chip grid — NEEDS chip + #hashtag chips. Same visual
          rhythm as the post card's Industries / Skills chips row. */}
      {(flare.expertiseTag || hashtags.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 px-5">
          {flare.expertiseTag && (
            <span className="inline-flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
              Needs: {flare.expertiseTag}
            </span>
          )}
          {hashtags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-200"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer — response count + time-left. Border-topped strip
          matches the post card's spark/comment/contributor footer. */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 bg-black/20 px-5 py-3">
        <div className="flex items-center gap-3 text-xs text-white/55">
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            {flare.responseCount === 0
              ? "No responses yet"
              : flare.responseCount === 1
                ? "1 response"
                : `${flare.responseCount} responses`}
          </span>
          {daysLeft && flare.status === "open" && (
            <span className="inline-flex items-center gap-1 font-mono text-white/40">
              <Clock className="h-3 w-3" />
              {daysLeft}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-amber-300/70 opacity-0 transition group-hover:opacity-100">
          View →
        </span>
      </div>
    </button>
  );
}

function StatusPill({
  status,
}: {
  status: "open" | "resolved" | "closed" | "expired";
}) {
  if (status === "open") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
        <Radio className="h-2.5 w-2.5" />
        Open
      </span>
    );
  }
  if (status === "expired") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
        Expired
      </span>
    );
  }
  if (status === "closed") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
      Resolved
    </span>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      // Plain <img> intentional — avatars are tiny and pre-sized; next/image
      // adds overhead with no payoff at this scale.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="h-7 w-7 shrink-0 rounded-full border border-white/10 object-cover"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[11px] font-medium text-white/70">
      {initials || "?"}
    </div>
  );
}
