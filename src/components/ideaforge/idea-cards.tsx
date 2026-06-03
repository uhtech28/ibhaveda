"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Lightbulb, MessageCircle, PencilLine, Send, Sparkles, Trash2, UserPlus, Repeat2, Bookmark, Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
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
    <div className="sticky top-[56px] z-20 -mx-1 overflow-x-auto rounded-[18px] border border-white/6 bg-[#0A0D12]/92 px-1 py-2 backdrop-blur-xl lg:top-[92px]">
      <div className="flex min-w-max items-center gap-0.5 lg:gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              transitionBase,
              "relative shrink-0 rounded-[12px] px-2.5 py-2 text-xs whitespace-nowrap lg:px-4 lg:py-2.5 lg:text-sm",
              activeKey === tab.key ? "text-white" : "text-[#9CA3AF] hover:text-white"
            )}
          >
            {tab.label}
            <span
              className={cn(
                transitionBase,
                "absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-[#6366F1] lg:inset-x-3",
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

function StoryAction({ icon: Icon, label, count, active = false, onClick, animateOnClick = false, iconOnly = false }: { icon: React.ComponentType<{ className?: string }>; label: string; count?: number; active?: boolean; onClick?: () => void; animateOnClick?: boolean; iconOnly?: boolean }) {
  const [pulse, setPulse] = useState(false);
  const tone = label === "Spark"
    ? {
        base: "text-orange-300 hover:bg-[#111827] hover:text-orange-300",
        active: "bg-[#111827] text-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.12)]",
        icon: "text-orange-300",
      }
    : label === "Comment"
      ? {
          base: "text-blue-300 hover:bg-[#111827] hover:text-blue-300",
          active: "bg-[#111827] text-blue-300",
          icon: "text-blue-300",
        }
      : {
          base: "text-emerald-300 hover:bg-[#111827] hover:text-emerald-300",
          active: "bg-[#111827] text-emerald-300",
          icon: "text-emerald-300",
        };
  const handleClick = () => {
    if (animateOnClick) {
      setPulse(true);
      window.setTimeout(() => setPulse(false), 500);
    }
    onClick?.();
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={cn(
        transitionBase,
        "flex flex-1 min-w-0 items-center justify-center gap-1.5 rounded-[10px] px-2 py-2 text-xs sm:text-sm",
        active ? tone.active : tone.base
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", tone.icon, active && label === "Spark" && "fill-current", pulse && "animate-[ping_0.45s_ease-out]")} />
      {!iconOnly && <span className="truncate">{label}</span>}
      {typeof count === "number" && <span className="text-xs tabular-nums">{count}</span>}
    </button>
  );
}

/**
 * Live contributor count action — pulls accepted contributors for an idea
 * and renders a StoryAction with the number. Click opens the idea detail page
 * so the user can request to contribute or browse the team.
 */
function ContributorsAction({
  ideaId,
  onClick,
}: {
  ideaId: string;
  onClick?: () => void;
}) {
  const contributors = useQuery(api.contributionRequests.getAcceptedContributors, {
    ideaId: ideaId as Id<"ideas">,
  });
  const count = (contributors?.length ?? 0) + 1;

  return (
    <StoryAction
      icon={UserPlus}
      label="Contribute"
      count={count}
      onClick={onClick}
      iconOnly
    />
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
  onSelectTag,
  ownerAction,
  hideAuthor,
  showFullContent = false,
  showAllTags = false,
  disableCardOpen = false,
}: {
  idea: IdeaForgeIdea;
  saved: boolean;
  onToggleSave: (ideaId: string) => void;
  onOpenIdea: (ideaId: string) => void;
  onSpark: (ideaId: string) => void;
  onComment: (ideaId: string) => void;
  onContribute?: (ideaId: string) => void;
  onRepost?: (draft: Partial<ComposerDraft>) => void;
  onSelectTag?: (tag: string) => void;
  ownerAction?: React.ReactNode;
  /** When true, hide the author profile header on mobile (still visible on lg+). */
  hideAuthor?: boolean;
  showFullContent?: boolean;
  showAllTags?: boolean;
  disableCardOpen?: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [industriesExpanded, setIndustriesExpanded] = useState(false);
  const [skillsExpanded, setSkillsExpanded] = useState(false);
  const skillTags = useMemo(() => parseTags(idea.category), [idea.category]);
  const industryTags = useMemo(() => parseTags(idea.industries || ""), [idea.industries]);
  const industriesAreExpanded = showAllTags || industriesExpanded;
  const skillsAreExpanded = showAllTags || skillsExpanded;
  const visibleIndustries = industriesAreExpanded ? industryTags : industryTags.slice(0, 2);
  const visibleSkills = skillsAreExpanded ? skillTags : skillTags.slice(0, 2);
  const hiddenIndustries = Math.max(0, industryTags.length - visibleIndustries.length);
  const hiddenSkills = Math.max(0, skillTags.length - visibleSkills.length);
  const bannerImage = getBannerImage(idea);
  const description = idea.description || "No description yet.";
  const shouldClamp = description.length > 220;

  // Whole-card click-to-open. Skip when the click originated from any inner
  // interactive element (button, link, input, etc.) so Spark / Save /
  // Collaborate / tag chips keep working normally.
  const handleCardClick = (event: React.MouseEvent<HTMLElement>) => {
    if (disableCardOpen) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return;
    onOpenIdea(idea._id);
  };

  return (
    <article
      onClick={handleCardClick}
      className={cn(
        cardSurface,
        transitionBase,
        "cursor-pointer overflow-hidden p-5 hover:border-[#6366F1]/50 hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)]"
      )}
    >
      <div className={cn("flex items-start justify-between gap-3", hideAuthor && "lg:flex")}>
        <Link
          href={idea.author?.username ? `/profile/${idea.author.username}` : `/profile/${idea.authorId}`}
          onClick={(event) => event.stopPropagation()}
          aria-label={`View profile of ${getDisplayName(idea.author)}`}
          className={cn(
            "group flex min-w-0 items-start gap-3 rounded-lg -m-1 p-1 transition-colors hover:bg-white/[0.03]",
            hideAuthor && "hidden lg:flex"
          )}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={idea.author?.avatar} alt={getDisplayName(idea.author)} />
            <AvatarFallback className="bg-[#1B2440] text-white">{getInitials(getDisplayName(idea.author))}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#F9FAFB] group-hover:text-[#C7D2FE]">{getDisplayName(idea.author)}</p>
            {idea.author?.username && (
              <p className="mt-0.5 text-xs text-[#6B7280] truncate">@{idea.author.username}</p>
            )}
          </div>
        </Link>
        {ownerAction && (
          <div className="flex items-center gap-2">
            {ownerAction}
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => !disableCardOpen && onOpenIdea(idea._id)} className="text-left">
            <h2 className={cn(displayFontClass, "text-[18px] font-semibold leading-tight text-[#F9FAFB] hover:text-[#C7D2FE]")}>{idea.title}</h2>
          </button>
          {ownerAction && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/map?ideaId=${idea._id}`);
              }}
              aria-label="View Map"
              title="View Map"
              className="inline-flex items-center justify-center p-2 rounded-xl border border-[#6366F1]/30 bg-[#6366F1]/10 text-[#C7D2FE] hover:bg-[#6366F1]/20 hover:text-white hover:border-[#6366F1]/50 transition-all duration-200 shrink-0 group/mapbtn"
            >
              <Swords className="h-5 w-5 transition-transform duration-200 group-hover/mapbtn:scale-110" />
            </button>
          )}
        </div>
        <div className="mt-3 text-[15px] leading-7 text-[#D1D5DB]">
          <p className={cn(!showFullContent && !expanded && shouldClamp && "line-clamp-3")}>{description}</p>
          {!showFullContent && shouldClamp && (
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

      {bannerImage && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setLightboxOpen(true);
          }}
          className="mt-5 block w-full text-left transition-transform hover:scale-[1.005]"
          aria-label="View full-size image"
        >
          <img src={bannerImage} alt={idea.title} className="aspect-[16/9] w-full rounded-[18px] border border-white/8 object-cover cursor-zoom-in" />
        </button>
      )}

      <div className="mt-5 flex flex-col gap-2 text-xs text-[#9CA3AF]">
        {/* Industries — own row */}
        {industryTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {visibleIndustries.map((tag) => (
              <button
                key={`ind-${tag}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  onSelectTag?.(tag);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                disabled={!onSelectTag}
                aria-label={`Filter by industry ${tag}`}
                className={cn(
                  codeFontClass,
                  transitionBase,
                  "cursor-pointer rounded-[8px] px-2.5 py-1 border whitespace-nowrap max-w-full truncate text-[11px] font-medium",
                  "border-fuchsia-500/35 bg-fuchsia-500/12 text-fuchsia-300",
                  onSelectTag && "hover:bg-purple-500/30 hover:border-purple-400/60 active:scale-95",
                  !onSelectTag && "cursor-default opacity-90"
                )}
                title={`Industry: ${tag} — click to filter`}
              >
                {tag}
              </button>
            ))}
            {hiddenIndustries > 0 && !industriesAreExpanded && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIndustriesExpanded(true);
                }}
                className={cn(
                  transitionBase,
                  "rounded-[8px] border border-fuchsia-500/35 bg-fuchsia-500/12 px-2.5 py-1 text-[11px] font-medium text-fuchsia-300 hover:bg-fuchsia-500/18 hover:border-fuchsia-400/55"
                )}
              >
                +{hiddenIndustries} more
              </button>
            )}
            {!showAllTags && industriesExpanded && industryTags.length > 2 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIndustriesExpanded(false);
                }}
                className={cn(transitionBase, "rounded-[8px] border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-[#D1D5DB] hover:bg-white/[0.08] hover:text-white")}
              >
                Show less
              </button>
            )}
          </div>
        )}

        {/* Skills — own row */}
        {skillTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {visibleSkills.map((tag) => (
              <button
                key={`skl-${tag}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  onSelectTag?.(tag);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                disabled={!onSelectTag}
                aria-label={`Filter by skill ${tag}`}
                className={cn(
                  codeFontClass,
                  transitionBase,
                  "cursor-pointer rounded-[8px] px-2.5 py-1 border whitespace-nowrap max-w-full truncate text-[11px] font-medium",
                  "border-sky-500/35 bg-sky-500/10 text-sky-300",
                  onSelectTag && "hover:bg-blue-500/30 hover:border-blue-400/60 active:scale-95",
                  !onSelectTag && "cursor-default opacity-90"
                )}
                title={`Skill: ${tag} — click to filter`}
              >
                {tag}
              </button>
            ))}
            {hiddenSkills > 0 && !skillsAreExpanded && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSkillsExpanded(true);
                }}
                className={cn(
                  transitionBase,
                  "rounded-[8px] border border-sky-500/35 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-300 hover:bg-sky-500/16 hover:border-sky-400/55"
                )}
              >
                +{hiddenSkills} more
              </button>
            )}
            {!showAllTags && skillsExpanded && skillTags.length > 2 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSkillsExpanded(false);
                }}
                className={cn(transitionBase, "rounded-[8px] border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-[#D1D5DB] hover:bg-white/[0.08] hover:text-white")}
              >
                Show less
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-white/8 pt-3">
        <div className="flex flex-nowrap items-center gap-1">
          <StoryAction icon={Sparkles} label="Spark" count={idea.sparkCount || 0} active={!!idea.hasSparked} onClick={() => onSpark(idea._id)} animateOnClick iconOnly />
          <StoryAction icon={MessageCircle} label="Comment" count={idea.commentCount || 0} onClick={() => onComment(idea._id)} iconOnly />
          <ContributorsAction
            ideaId={idea._id}
            onClick={() => {
              if (onContribute) onContribute(idea._id);
              else onOpenIdea(idea._id);
            }}
          />
        </div>
      </div>

      {bannerImage && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent
            className="max-w-[min(96vw,1200px)] w-auto h-auto p-0 overflow-hidden bg-transparent border-0 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <DialogTitle className="sr-only">{idea.title}</DialogTitle>
            <img
              src={bannerImage}
              alt={idea.title}
              className="block w-full h-auto max-h-[90dvh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
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
  const skillTags = parseTags(idea.category).slice(0, 2);
  const industryTags = parseTags(idea.industries || "").slice(0, 2);
  const bannerImage = getBannerImage(idea);
  const status = statusTone(idea);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Whole-card tap to open. Skip when click came from any inner button/link
  // so Edit / Repost / Delete / Save still work normally.
  const handleCardClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return;
    onOpenIdea(idea._id);
  };

  return (
    <article
      onClick={handleCardClick}
      className={cn(cardSurface, transitionBase, "group relative cursor-pointer overflow-hidden p-4 hover:border-[#6366F1]/50 hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)]")}
    >
      <div className="absolute inset-0 z-10 hidden items-start justify-end gap-2 bg-[#0A0D12]/72 p-4 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 lg:flex">
        <button type="button" onClick={() => onOpenIdea(idea._id)} className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white hover:border-[#6366F1]/35 hover:bg-[#6366F1]/14" aria-label="Edit idea">
          <PencilLine className="h-4 w-4" />
        </button>
        <button 
          type="button" 
          onClick={(e) => { 
            e.stopPropagation(); 
            const tags = parseTags(idea.category);
            onRepost?.({ title: idea.title, description: idea.description, tags, category: tags[0] || "SaaS", stage: getIdeaStage(idea) }); 
          }} 
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white hover:border-[#6366F1]/35 hover:bg-[#6366F1]/14" 
          aria-label="Repost idea"
        >
          <Repeat2 className="h-4 w-4" />
        </button>
        {onDelete && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(idea._id); }} className="rounded-full border border-red-500/25 bg-red-500/10 p-2 text-red-200 hover:bg-red-500/16" aria-label="Delete idea">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative z-0">
        <button type="button" onClick={() => onOpenIdea(idea._id)} className="block w-full text-left">
          {bannerImage ? (
            <img src={bannerImage} alt={idea.title} className="aspect-[16/9] w-full rounded-[16px] border border-white/8 object-cover" />
          ) : (
            <MeshBanner title={idea.title} />
          )}
        </button>
        <div className={cn("hidden items-center justify-between gap-3 lg:flex", (bannerImage || true) && "mt-4")}>
          <span className={cn("rounded-full border px-3 py-1 text-[11px]", status.className)}>{status.label}</span>
          <button type="button" onClick={() => onToggleSave(idea._id)} className={cn(transitionBase, "rounded-full p-2", saved ? "bg-[#6366F1]/14 text-[#C7D2FE]" : "text-[#9CA3AF] hover:bg-[#6366F1]/10 hover:text-[#C7D2FE]")} aria-label="Save idea">
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
        <button type="button" onClick={() => onOpenIdea(idea._id)} className={cn("text-left", (bannerImage || true) ? "mt-4" : "mt-1")}>
          <h3 className={cn(displayFontClass, "text-lg font-semibold text-[#F9FAFB]")}>{idea.title}</h3>
        </button>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#9CA3AF]">{idea.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF]">
          {industryTags.map((tag) => (
            <span
              key={`ind-${tag}`}
              className={cn(codeFontClass, "rounded-[8px] border border-fuchsia-500/35 bg-fuchsia-500/12 px-2.5 py-1 text-[11px] font-medium text-fuchsia-300")}
              title={`Industry: ${tag}`}
            >
              {tag}
            </span>
          ))}
          {skillTags.map((tag) => (
            <span
              key={`skl-${tag}`}
              className={cn(codeFontClass, "rounded-[8px] border border-sky-500/35 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-300")}
              title={`Skill: ${tag}`}
            >
              {tag}
            </span>
          ))}
          <IdeaVentureBadge ideaId={idea._id} />
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-[#9CA3AF]">
          <div className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-orange-400" />
              <span className="tabular-nums">{idea.sparkCount || 0}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <UserPlus className="h-3 w-3 text-fuchsia-300" />
              <span className="tabular-nums">{idea.contributionCount || 0}</span>
            </span>
          </div>
          <span>{formatRelativeTime(idea.createdAt)}</span>
        </div>
      </div>

      {bannerImage && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent
            className="max-w-[min(96vw,1200px)] w-auto h-auto p-0 overflow-hidden bg-transparent border-0 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <DialogTitle className="sr-only">{idea.title}</DialogTitle>
            <img
              src={bannerImage}
              alt={idea.title}
              className="block w-full h-auto max-h-[90dvh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
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
