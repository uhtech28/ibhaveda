"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, EyeOff, Lock, Star, Sparkles } from "lucide-react";

interface BadgeShowcaseProps {
  userId: string;
}

const rarityChipClasses: Record<string, string> = {
  common: "bg-gray-500/10 text-gray-300 border-gray-500/30",
  uncommon: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  rare: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  epic: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  legendary: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  hidden: "bg-rose-500/10 text-rose-300 border-rose-500/30",
};

type BadgeProgressItem = {
  id: number;
  name: string;
  rarity: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
  requirement: string;
  earned: boolean;
};

export function BadgeShowcase({ userId }: BadgeShowcaseProps) {
  const badgeProgress = useQuery(api.badges.getVentureBadgeProgress, {
    userId: userId as Id<"users">,
  }) as BadgeProgressItem[] | undefined;

  if (!badgeProgress) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const achieved = badgeProgress.filter((b) => b.earned);
  const locked = badgeProgress.filter((b) => !b.earned && b.rarity !== "hidden");
  // "Secret" includes hidden-rarity unearned badges. If a hidden badge is earned, it joins Achieved.
  const secret = badgeProgress.filter((b) => !b.earned && b.rarity === "hidden");

  const totalUnlockable = badgeProgress.length - secret.length;

  return (
    <div className="space-y-10">
      {/* Header summary */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-foreground">
          <Award className="w-5 h-5 text-primary" />
          <span className="font-semibold text-lg">Badges</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {achieved.length} / {totalUnlockable} earned
        </Badge>
        {secret.length > 0 && (
          <Badge variant="outline" className="text-xs gap-1 border-rose-500/30 text-rose-300">
            <EyeOff className="w-3 h-3" />
            {secret.length} secret
          </Badge>
        )}
      </div>

      {/* Achieved */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Achieved
            <span className="text-xs font-normal text-muted-foreground">({achieved.length})</span>
          </h2>
        </div>
        {achieved.length === 0 ? (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No badges earned yet. Start sparking, posting, and collaborating to unlock your first.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achieved.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} variant="earned" />
            ))}
          </div>
        )}
      </section>

      {/* Locked */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Lock className="w-4 h-4 text-muted-foreground" />
          Locked
          <span className="text-xs font-normal text-muted-foreground">({locked.length})</span>
        </h2>
        {locked.length === 0 ? (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              You&apos;ve unlocked every visible badge. Look for hidden ones below.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locked.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} variant="locked" />
            ))}
          </div>
        )}
      </section>

      {/* Secret */}
      {secret.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <EyeOff className="w-4 h-4 text-rose-400" />
            Secret
            <span className="text-xs font-normal text-muted-foreground">({secret.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {secret.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} variant="secret" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BadgeCard({
  badge,
  variant,
}: {
  badge: BadgeProgressItem;
  variant: "earned" | "locked" | "secret";
}) {
  const earned = variant === "earned";
  const secret = variant === "secret";

  return (
    <div
      className={`p-4 rounded-xl border transition-colors ${
        earned
          ? "bg-card hover:border-primary/30 hover:bg-accent/40"
          : secret
            ? "bg-rose-500/5 border-rose-500/20 opacity-90"
            : "bg-muted/20 border-border/40 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            backgroundColor: earned ? badge.secondaryColor : "hsl(var(--muted))",
            color: earned ? "#fff" : "hsl(var(--muted-foreground))",
          }}
        >
          {earned ? (
            <Star className="h-4 w-4 fill-current" />
          ) : secret ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {secret ? "???" : badge.name}
          </p>
          <Badge
            variant="outline"
            className={`mt-1 text-[10px] px-1.5 py-0 ${rarityChipClasses[badge.rarity] || ""}`}
          >
            {secret ? "secret" : badge.rarity}
          </Badge>
          {earned && badge.tagline && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {badge.tagline}
            </p>
          )}
          {!earned && !secret && badge.requirement && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {badge.requirement}
            </p>
          )}
          {secret && (
            <p className="mt-2 text-xs text-muted-foreground italic">
              Hidden badge — discover the requirement to unlock.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
