"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Award, Lock, Star } from "lucide-react"

interface BadgeGridProps {
  userId: string
}

const rarityColors: Record<string, string> = {
  common: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  uncommon: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  rare: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  epic: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  legendary: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  hidden: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export function BadgeGrid({ userId }: BadgeGridProps) {
  const badgeProgress = useQuery(api.badges.getVentureBadgeProgress, {
    userId: userId as any,
  })

  if (!badgeProgress) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  const earnedBadges = badgeProgress.filter((b) => b.earned)
  const unearnedBadges = badgeProgress.filter((b) => !b.earned && b.rarity !== "hidden")
  const hiddenBadges = badgeProgress.filter((b) => !b.earned && b.rarity === "hidden")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges
          </CardTitle>
          <Badge variant="outline">
            {earnedBadges.length} / {badgeProgress.length - hiddenBadges.length} earned
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {badgeProgress
              .filter((b) => b.rarity !== "hidden" || b.earned)
              .map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    badge.earned
                      ? "bg-card hover:bg-accent cursor-pointer"
                      : "bg-muted/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: badge.earned
                          ? badge.secondaryColor
                          : "hsl(var(--muted))",
                        color: badge.earned ? "#fff" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {badge.earned ? (
                        <Star className="h-4 w-4 fill-current" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {badge.earned ? badge.name : "???"}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          rarityColors[badge.rarity] || ""
                        }`}
                      >
                        {badge.rarity}
                      </Badge>
                    </div>
                  </div>
                  {badge.earned && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {badge.tagline}
                    </p>
                  )}
                </div>
              ))}
          </div>

          {hiddenBadges.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Hidden ({hiddenBadges.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {hiddenBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-3 rounded-lg border bg-muted/30 opacity-40"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">???</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
