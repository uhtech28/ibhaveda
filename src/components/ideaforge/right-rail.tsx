"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BriefcaseBusiness, Flame, Sparkles, Tag, UserPlus } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  cardSurface,
  CurrentUserProfile,
  displayFontClass,
  industryOptions,
  IdeaForgeIdea,
  isAgentRole,
  parseTags,
  skillOptions,
  transitionBase,
} from "@/components/ideaforge/shared";

const normalizedSkills = new Set(skillOptions.map((entry) => entry.toLowerCase()));
const normalizedIndustries = new Set(industryOptions.map((entry) => entry.toLowerCase()));

function classifyActiveTag(label: string, source: "category" | "industries") {
  const key = label.toLowerCase();
  if (normalizedSkills.has(key)) return "skill" as const;
  if (normalizedIndustries.has(key)) return "industry" as const;
  return source === "industries" ? "industry" as const : "skill" as const;
}

export function IdeaForgeRightRail({
  currentUser,
  publicIdeas,
  ideas,
  onTagSelect,
}: {
  currentUser: CurrentUserProfile | null | undefined;
  publicIdeas: IdeaForgeIdea[];
  ideas: IdeaForgeIdea[];
  onTagSelect: (value: string) => void;
}) {
  const TRENDING_LIMIT = 5;
  const trendingIdeas = useMemo(() => {
    return [...publicIdeas]
      .filter((idea) => !isAgentRole(idea.author?.role))
      .sort(
        (a, b) =>
          (b.sparkCount || 0) - (a.sparkCount || 0) ||
          (b.contributionCount || 0) - (a.contributionCount || 0) ||
          b.createdAt - a.createdAt
      )
      .slice(0, TRENDING_LIMIT);
  }, [publicIdeas]);

  const activeTags = useMemo(() => {
    if (isAgentRole(currentUser?.role)) return [];
    return Array.from(
      ideas
        .flatMap((idea) => [
          ...parseTags(idea.category).map((label) => ({
            label,
            type: classifyActiveTag(label, "category"),
          })),
          ...parseTags(idea.industries).map((label) => ({
            label,
            type: classifyActiveTag(label, "industries"),
          })),
        ])
        .filter((tag) => tag.label)
        .reduce((tags, tag) => {
          const key = tag.label.toLowerCase();
          if (!tags.has(key)) tags.set(key, tag);
          return tags;
        }, new Map<string, { label: string; type: "skill" | "industry" }>())
        .values()
    ).slice(0, 8);
  }, [currentUser?.role, ideas]);

  return (
    <aside className="hidden xl:block xl:w-[280px] xl:flex-shrink-0">
      <div className="sticky top-28 space-y-4">
        <section className={cn(cardSurface, "p-5")}>
          <div className="flex items-center justify-between">
            <h3 className={cn(displayFontClass, "text-base font-semibold text-[#F9FAFB]")}>Trending Ideas This Week</h3>
            <Flame className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <div className="mt-3 space-y-1.5">
            {trendingIdeas.length > 0 ? (
              trendingIdeas.map((idea, index) => (
                <Link
                  key={idea._id}
                  href={`/idea/${idea._id}`}
                  className={cn(
                    transitionBase,
                    "flex items-center gap-2 rounded-[10px] py-1.5 pl-0 pr-1 hover:bg-white/[0.03]"
                  )}
                >
                  <span className="-ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/14 text-[11px] font-semibold text-[#C7D2FE]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-[#F9FAFB]">{idea.title}</p>
                  </div>
                  <div className="grid shrink-0 grid-cols-[48px_48px] items-center gap-1">
                    <span className="inline-flex h-6 w-12 items-center justify-center gap-1 rounded-full bg-[#111827] px-1.5 text-[11px] font-medium tabular-nums text-orange-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      {idea.sparkCount || 0}
                    </span>
                    <span className="inline-flex h-6 w-12 items-center justify-center gap-1 rounded-full bg-[#111827] px-1.5 text-[11px] font-medium tabular-nums text-emerald-300">
                      <UserPlus className="h-3.5 w-3.5" />
                      {idea.contributionCount || 0}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-[#9CA3AF]">Trending ideas will show up here as the feed warms up.</p>
            )}
          </div>
        </section>

        <section className={cn(cardSurface, "p-4")}>
          <div className="flex items-center gap-2 text-sm text-[#F9FAFB]">
            <Tag className="h-4 w-4 text-[#6366F1]" />
            <span className={cn(displayFontClass, "font-semibold")}>Your Active Tags</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeTags.length > 0 ? (
              activeTags.map((tag) => {
                const isSkill = tag.type === "skill";
                return (
                  <button
                    key={`${tag.type}-${tag.label}`}
                    type="button"
                    onClick={() => onTagSelect(tag.label)}
                    className={cn(
                      transitionBase,
                      "inline-flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-[11px] font-medium",
                      isSkill
                        ? "border-sky-500/35 bg-sky-500/10 text-sky-300 hover:bg-sky-500/16"
                        : "border-fuchsia-500/35 bg-fuchsia-500/12 text-fuchsia-300 hover:bg-fuchsia-500/18"
                    )}
                  >
                    {isSkill ? <Sparkles className="h-3 w-3" /> : <BriefcaseBusiness className="h-3 w-3" />}
                    {tag.label}
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-[#9CA3AF]">
                Post a few ideas and your strongest topics will show up here.
              </p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
