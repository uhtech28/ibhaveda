"use client";

import React, { useMemo, useState } from "react";
import { Bookmark, Lightbulb, MessageCircle, MoreHorizontal, PencilLine, Repeat2, Send, Sparkles, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IdeaVentureBadge } from "@/components/venture/idea-venture-badge";
import {
  cardSurface,
  codeFontClass,
  ComposerDraft,
  displayFontClass,
  feedTabs,
  formatRelativeTime,
  getBannerImage,
  getDisplayName,
  getIdeaStage,
  getInitials,
  getReadTime,
  getRoleBadge,
  IdeaForgeIdea,
  myIdeaTabs,
  parseTags,
  transitionBase,
  ViewMode,
} from "@/components/ideaforge/shared";

function MeshBanner({ title }: { title: string }) {
  return (
    <div
      className="relative aspect-[16/9] overflow-hidden rounded-[18px] border border-white/8"
      style={{
        background:
          "radial-gradient(circle at 18% 18%, rgba(99,102,241,0.42), transparent 34%), radial-gradient(circle at 78% 0%, rgba(139,92,246,0.4), transparent 32%), radial-gradient(circle at 82% 70%, rgba(16,185,129,0.16), transparent 26%), linear-gradient(135deg, #1A2240 0%, #111827 58%, #231434 100%)",
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_45%)]" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/15 bg-white/10 text-4xl font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm">
          {title.charAt(0).toUpperCase() || "I"}
        </div>
      </div>
      <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-white/85 backdrop-blur-sm">
        Idea Preview
      </div>
    </div>
  );
}

export function FeedComposer({
  currentUser,
  onOpenComposer,
}: {
  currentUser?: { displayName?: string; avatar?: string } | null;
  onOpenComposer: () => void;
}) {
  return (
    <section className={cn(cardSurface, "p-4 sm:p-5")}>
      <div className="flex items-center gap-3">
        <Avatar className="h-11 w-11 ring-2 ring-[#6366F1]/35 ring-offset-2 ring-offset-[#111827]">
          <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
          <AvatarFallback className="bg-[#1B2440] text-white">{getInitials(currentUser?.displayName)}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={onOpenComposer}
          className={cn(
            transitionBase,
            "flex h-12 flex-1 items-center rounded-full border border-white/8 bg-[#0A0D12] px-5 text-left text-sm text-[#9CA3AF] hover:border-[#6366F1]/35 hover:text-white"
          )}
        >
          Share an idea...
        </button>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {[
          { label: "Idea", icon: Lightbulb },
          { label: "Poll", icon: Sparkles },
          { label: "Collab Post", icon: Send },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={onOpenComposer}
              className={cn(
                transitionBase,
                "flex items-center justify-center gap-2 rounded-[12px] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-[#D1D5DB] hover:border-[#6366F1]/30 hover:bg-[#6366F1]/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function FilterTabs<T extends string>({
  tabs,
  activeKey,
  onChange,
}: {
  tabs: readonly { key: T; label: string }[];
  activeKey: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="sticky top-[92px] z-20 -mx-1 overflow-x-auto rounded-[18px] border border-white/6 bg-[#0A0D12]/92 px-1 py-2 backdrop-blur-xl">
      <div className="flex min-w-max items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              transitionBase,
              "relative rounded-[12px] px-4 py-2.5 text-sm",
              activeKey === tab.key ? "text-white" : "text-[#9CA3AF] hover:text-white"
            )}
          >
            {tab.label}
            <span
              className={cn(
                transitionBase,
                "absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-[#6366F1]",
                activeKey === tab.key ? "opacity-100" : "opacity-0"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function IdeaCardSkeleton() {
  return (
    <div className={cn(cardSurface, "overflow-hidden p-5")}> 
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/5 animate-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded-full bg-white/5 animate-shimmer" />
          <div className="h-3 w-28 rounded-full bg-white/5 animate-shimmer" />
        </div>
      </div>
      <div className="mt-5 h-6 w-2/3 rounded-full bg-white/5 animate-shimmer" />
      <div className="mt-3 h-20 rounded-[16px] bg-white/5 animate-shimmer" />
      <div className="mt-5 aspect-[16/9] rounded-[18px] bg-white/5 animate-shimmer" />
      <div className="mt-5 flex gap-3 border-t border-white/8 pt-4">
        <div className="h-10 flex-1 rounded-[12px] bg-white/5 animate-shimmer" />
        <div className="h-10 flex-1 rounded-[12px] bg-white/5 animate-shimmer" />
      </div>
    </div>
  );
}

function StoryAction({ icon: Icon, label, count, active = false, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; count?: number; active?: boolean; onClick?: () => void; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        transitionBase,
        "flex flex-1 items-center justify-center gap-2 rounded-[10px] px-3 py-2.5 text-sm",
        active
          ? "bg-[#6366F1]/14 text-[#C7D2FE]"
          : "text-[#9CA3AF] hover:bg-[#6366F1]/10 hover:text-[#C7D2FE]"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {typeof count === "number" && <span className="text-xs">{count}</span>}
    </button>
  );
}

export function IdeaStoryCard({
  idea,
  saved,
  onToggleSave,
  onOpenIdea,
  onSpark,
  onComment,
  onContribute,
  onRepost,
  ownerAction,
}: {
  idea: IdeaForgeIdea;
  saved: boolean;
  onToggleSave: (ideaId: string) => void;
  onOpenIdea: (ideaId: string) => void;
  onSpark: (ideaId: string) => void;
  onComment: (ideaId: string) => void;
  onContribute?: (ideaId: string) => void;
  onRepost?: (draft: Partial<ComposerDraft>) => void;
  ownerAction?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const tags = useMemo(() => parseTags(idea.category).slice(0, 3), [idea.category]);
  const bannerImage = getBannerImage(idea);
  const description = idea.description || "No description yet.";
  const shouldClamp = description.length > 220;

  return (
    <article
      className={cn(
        cardSurface,
        transitionBase,
        "overflow-hidden p-5 hover:border-[#6366F1]/50 hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={idea.author?.avatar} alt={getDisplayName(idea.author)} />
            <AvatarFallback className="bg-[#1B2440] text-white">{getInitials(getDisplayName(idea.author))}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-[#F9FAFB]">{getDisplayName(idea.author)}</p>
              <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] text-[#D1D5DB]">
                {getRoleBadge(idea.author)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#6B7280]">Posted {formatRelativeTime(idea.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {parseTags(idea.category)[0] && (
            <span className="rounded-full bg-[#6366F1]/14 px-3 py-1 text-[11px] text-[#C7D2FE]">{parseTags(idea.category)[0]}</span>
          )}
          {ownerAction}
          <button
            type="button"
            aria-label="More options"
            className={cn(transitionBase, "rounded-full p-2 text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white")}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <button type="button" onClick={() => onOpenIdea(idea._id)} className="text-left">
          <h2 className={cn(displayFontClass, "text-[18px] font-semibold leading-tight text-[#F9FAFB] hover:text-[#C7D2FE]")}>{idea.title}</h2>
        </button>
        <div className="mt-3 text-[15px] leading-7 text-[#D1D5DB]">
          <p className={cn(!expanded && shouldClamp && "line-clamp-3")}>{description}</p>
          {shouldClamp && (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-2 text-sm font-medium text-[#C7D2FE] hover:text-white"
            >
              {expanded ? "See less" : "See more"}
            </button>
          )}
        </div>
      </div>

      <button type="button" onClick={() => onOpenIdea(idea._id)} className="mt-5 block w-full text-left">
        {bannerImage ? (
          <img src={bannerImage} alt={idea.title} className="aspect-[16/9] w-full rounded-[18px] border border-white/8 object-cover" />
        ) : (
          <MeshBanner title={idea.title} />
        )}
      </button>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF]">
        {tags.map((tag) => (
          <span key={tag} className={cn(codeFontClass, "rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[#CBD5E1]")}>{tag}</span>
        ))}
        <span className="h-1 w-1 rounded-full bg-[#4B5563]" />
        <span>{getReadTime(description)}</span>
        <span className="h-1 w-1 rounded-full bg-[#4B5563]" />
        <span>{getIdeaStage(idea)}</span>
        <IdeaVentureBadge ideaId={idea._id} />
      </div>

      {onContribute && (
        <div className="mt-4 flex items-center justify-between rounded-[14px] border border-white/8 bg-white/[0.02] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#F9FAFB]">Open for collaboration</p>
            <p className="text-xs text-[#9CA3AF]">Invite builders to shape this idea into a real project.</p>
          </div>
          <Button type="button" onClick={() => onContribute(idea._id)} className="rounded-[10px] bg-[#6366F1] text-white hover:bg-[#8B5CF6]">
            Collaborate
          </Button>
        </div>
      )}

      <div className="mt-5 border-t border-white/8 pt-3">
        <div className="flex flex-wrap items-center gap-1">
          <StoryAction icon={Sparkles} label="Spark" count={idea.sparkCount || 0} onClick={() => onSpark(idea._id)} />
          <StoryAction icon={MessageCircle} label="Comments" count={idea.commentCount || 0} onClick={() => onComment(idea._id)} />
          <StoryAction icon={Repeat2} label="Repost" onClick={() => onRepost?.({ title: idea.title, description: idea.description, tags, category: tags[0] || "SaaS", stage: getIdeaStage(idea) })} />
          <StoryAction icon={Bookmark} label="Save" active={saved} onClick={() => onToggleSave(idea._id)} />
        </div>
      </div>
    </article>
  );
}

function statusTone(idea: IdeaForgeIdea) {
  if (idea.visibility === "private") {
    return { label: "Draft", className: "border-amber-500/20 bg-amber-500/10 text-amber-300" };
  }
  return { label: "Published", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" };
}

export function CompactIdeaCard({
  idea,
  saved,
  onOpenIdea,
  onDelete,
  onRepost,
  onToggleSave,
}: {
  idea: IdeaForgeIdea;
  saved: boolean;
  onOpenIdea: (ideaId: string) => void;
  onDelete?: (ideaId: string) => void;
  onRepost?: (draft: Partial<ComposerDraft>) => void;
  onToggleSave: (ideaId: string) => void;
}) {
  const tags = parseTags(idea.category).slice(0, 2);
  const bannerImage = getBannerImage(idea);
  const status = statusTone(idea);

  return (
    <article className={cn(cardSurface, transitionBase, "group relative overflow-hidden p-4 hover:border-[#6366F1]/50 hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)]")}>
      <div className="absolute inset-0 z-10 flex items-start justify-end gap-2 bg-[#0A0D12]/72 p-4 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
        <button type="button" onClick={() => onOpenIdea(idea._id)} className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white hover:border-[#6366F1]/35 hover:bg-[#6366F1]/14" aria-label="Edit idea">
          <PencilLine className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onRepost?.({ title: idea.title, description: idea.description, tags, category: tags[0] || "SaaS", stage: getIdeaStage(idea) })} className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white hover:border-[#6366F1]/35 hover:bg-[#6366F1]/14" aria-label="Repost idea">
          <Repeat2 className="h-4 w-4" />
        </button>
        {onDelete && (
          <button type="button" onClick={() => onDelete(idea._id)} className="rounded-full border border-red-500/25 bg-red-500/10 p-2 text-red-200 hover:bg-red-500/16" aria-label="Delete idea">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative z-0">
        {bannerImage ? (
          <img src={bannerImage} alt={idea.title} className="aspect-[16/9] w-full rounded-[16px] border border-white/8 object-cover" />
        ) : (
          <MeshBanner title={idea.title} />
        )}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className={cn("rounded-full border px-3 py-1 text-[11px]", status.className)}>{status.label}</span>
          <button type="button" onClick={() => onToggleSave(idea._id)} className={cn(transitionBase, "rounded-full p-2", saved ? "bg-[#6366F1]/14 text-[#C7D2FE]" : "text-[#9CA3AF] hover:bg-[#6366F1]/10 hover:text-[#C7D2FE]")} aria-label="Save idea">
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
        <button type="button" onClick={() => onOpenIdea(idea._id)} className="mt-4 text-left">
          <h3 className={cn(displayFontClass, "text-lg font-semibold text-[#F9FAFB]")}>{idea.title}</h3>
        </button>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#9CA3AF]">{idea.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF]">
          {tags.map((tag) => (
            <span key={tag} className={cn(codeFontClass, "rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[#CBD5E1]")}>{tag}</span>
          ))}
          <IdeaVentureBadge ideaId={idea._id} />
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-[#9CA3AF]">
          <span>{idea.sparkCount || 0} sparks</span>
          <span>{formatRelativeTime(idea.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className={cn(cardSurface, "flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center")}>
      <div className="relative h-28 w-28">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.28),transparent_65%)]" />
        <svg viewBox="0 0 120 120" className="relative h-full w-full text-[#C7D2FE]">
          <path d="M60 16c-14 0-25 11-25 25 0 7 3 14 8 18 5 4 8 11 8 18v3h18v-3c0-7 3-14 8-18 5-4 8-11 8-18 0-14-11-25-25-25Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="4" />
          <path d="M51 91h18M49 100h22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M45 25 34 14M75 25 86 14M60 10V0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className={cn(displayFontClass, "mt-6 text-2xl font-semibold text-white")}>{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-7 text-[#9CA3AF]">{description}</p>
      <Button type="button" onClick={onAction} className="mt-6 rounded-[10px] bg-[#6366F1] px-5 text-white hover:bg-[#8B5CF6]">
        {actionLabel}
      </Button>
    </div>
  );
}

export { feedTabs, myIdeaTabs };
