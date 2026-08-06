"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, Skull, Sword, Flag } from "lucide-react"
import { BOSS_DEFINITIONS } from "@convex/ventureConstants"

interface BossDef {
  id: number
  name: string
  type: string
  corruption: string
  represents: string
  defeatMethod: string
  retreatOutcome: string
  slayOutcome: string
}

interface BossEncounterProps {
  bosses: Array<{
    bossId: number
    status: "active" | "retreated" | "slain"
    corruptionLevel: number
    definition?: BossDef
  }>
}

const bossCorruptionStyles: Record<string, string> = {
  active: "border-red-500/30 bg-red-500/5 dark:border-red-500/20 dark:bg-red-500/5",
  retreated: "border-yellow-500/30 bg-yellow-500/5 dark:border-yellow-500/20 dark:bg-yellow-500/5",
  slain: "border-green-500/30 bg-green-500/5 dark:border-green-500/20 dark:bg-green-500/5",
}

const bossGlowEffects: Record<string, string> = {
  active: "shadow-[0_0_30px_rgba(239,68,68,0.15)]",
  retreated: "shadow-[0_0_30px_rgba(234,179,8,0.15)]",
  slain: "shadow-[0_0_30px_rgba(34,197,94,0.15)]",
}

export function BossEncounter({ bosses }: BossEncounterProps) {
  if (bosses.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Skull className="h-5 w-5" />
          Boss Encounters
        </CardTitle>
        <CardDescription>
          {bosses.filter((b) => b.status === "active").length} boss{bosses.filter((b) => b.status === "active").length !== 1 ? "es" : ""} still threatening your venture
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {bosses.map((boss) => {
            const def = boss.definition || BOSS_DEFINITIONS.find((b) => b.id === boss.bossId)
            if (!def) return null

            return (
              <div
                key={boss.bossId}
                className={`p-4 rounded-lg border transition-all duration-500 ${bossCorruptionStyles[boss.status]} ${bossGlowEffects[boss.status]}`}
              >
                {/* Boss Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5" />
                  <span className="font-semibold">{def.name}</span>
                  <Badge
                    variant={
                      boss.status === "slain"
                        ? "default"
                        : boss.status === "retreated"
                        ? "secondary"
                        : "destructive"
                    }
                    className="ml-auto"
                  >
                    {boss.status === "active" && (
                      <Skull className="h-3 w-3 mr-1" />
                    )}
                    {boss.status === "retreated" && (
                      <Flag className="h-3 w-3 mr-1" />
                    )}
                    {boss.status === "slain" && (
                      <Sword className="h-3 w-3 mr-1" />
                    )}
                    {boss.status}
                  </Badge>
                </div>

                {/* Boss Type */}
                <p className="text-xs text-muted-foreground mb-2 italic">
                  {def.type}
                </p>

                {/* Corruption Description */}
                <p className="text-sm mb-3">{def.corruption}</p>

                {/* What It Represents */}
                <div className="p-2 rounded bg-background/50 mb-3">
                  <p className="text-xs font-medium mb-1">Represents:</p>
                  <p className="text-xs text-muted-foreground">{def.represents}</p>
                </div>

                {/* Corruption Level */}
                <div className="flex items-center gap-2 text-xs mb-3">
                  <span>Corruption:</span>
                  <Progress
                    value={boss.corruptionLevel}
                    className="flex-1 h-1.5"
                  />
                  <span className="font-medium">{boss.corruptionLevel}%</span>
                </div>

                {/* Defeat Method */}
                {boss.status === "active" && (
                  <div className="p-2 rounded bg-background/50">
                    <p className="text-xs font-medium mb-1">How to defeat:</p>
                    <p className="text-xs text-muted-foreground">{def.defeatMethod}</p>
                  </div>
                )}

                {/* Outcome */}
                {boss.status !== "active" && (
                  <div className="p-2 rounded bg-background/50">
                    <p className="text-xs font-medium mb-1">
                      {boss.status === "retreated" ? "Retreat outcome:" : "Slay outcome:"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {boss.status === "retreated" ? def.retreatOutcome : def.slayOutcome}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
