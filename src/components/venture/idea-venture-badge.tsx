"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Rocket } from "lucide-react"

interface IdeaVentureBadgeProps {
  ideaId: string
}

export function IdeaVentureBadge({ ideaId }: IdeaVentureBadgeProps) {
  const ventures = useQuery(api.ventures.getUserVentures, {})
  const venture = ventures?.find((v) => v.ideaId === ideaId && v.status === "active")

  if (!venture) return null

  const stageNames = ["", "Ideation", "Research", "Validation", "Design", "Development", "Launch", "Iteration", "Scale"]
  const stageName = stageNames[venture.currentStage] || "Unknown"

  return (
    <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
      <Rocket className="h-3 w-3" />
      <span className="text-[10px]">
        Venture: Stage {venture.currentStage} ({stageName})
      </span>
    </Badge>
  )
}
