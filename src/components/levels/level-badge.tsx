"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Target } from "lucide-react"

interface LevelBadgeProps {
  userId: string
}

export function LevelBadge({ userId }: LevelBadgeProps) {
  const progress = useQuery(api.levels.getUserLevelProgress, {
    userId: userId as any,
  })

  if (!progress) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div className="w-20 h-4 bg-muted rounded" />
      </div>
    )
  }

  const phaseColors: Record<string, string> = {
    tutorial: "from-green-500 to-emerald-600",
    early: "from-blue-500 to-cyan-600",
    mid: "from-purple-500 to-violet-600",
    senior: "from-amber-500 to-orange-600",
    mentor: "from-rose-500 to-pink-600",
  }

  const gradient = phaseColors[progress.phase] || "from-gray-500 to-gray-600"

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5" />
          Level {progress.level} — {progress.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
            {progress.level}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">
                {progress.nextLevel ? `Level ${progress.nextLevel}: ${progress.nextLevelTitle}` : "Max Level"}
              </span>
              <span className="font-medium">{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3" />
              <span>{progress.titlePoints} / {progress.nextLevelPoints ?? "∞"} points</span>
            </div>
          </div>
        </div>

        <Badge variant="outline" className="capitalize">
          {progress.phase} phase
        </Badge>

        {progress.requirements.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Target className="h-4 w-4" />
              Requirements
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {progress.requirements.slice(0, 3).map((req: string, i: number) => (
                <li key={i} className="flex items-start gap-1">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                  {req}
                </li>
              ))}
              {progress.requirements.length > 3 && (
                <li className="text-xs italic">+{progress.requirements.length - 3} more...</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
