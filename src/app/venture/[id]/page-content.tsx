"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Trophy,
  Skull,
  Shield,
  Map,
  Play,
} from "lucide-react";
import { VENTURE_STAGES } from "@convex/ventureConstants";
import type { Id } from "@convex/_generated/dataModel";

export default function VenturePageContent() {
  const params = useParams();
  const router = useRouter();
  const ventureId = params.id as string;

  const venture = useQuery(api.ventures.getVenture, {
    ventureId: ventureId as Id<"ventures">,
  });

  const progress = useQuery(api.ventures.getVentureProgress, {
    ventureId: ventureId as Id<"ventures">,
  });

  if (!venture || !progress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">
          Loading venture...
        </div>
      </div>
    );
  }

  if (!venture) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Skull className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Venture Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This venture may have been deleted.
          </p>
          <Button onClick={() => router.push("/my-ventures")}>
            Back to My Ventures
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              Venture: {venture.ideaId ? "Loading..." : "Venture"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={venture.status === "active" ? "default" : "secondary"}
              >
                {venture.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Stage {venture.currentStage} of 8
              </span>
            </div>
          </div>
          {/* Open World Map CTA */}
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Link href="/map">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-400 hover:from-amber-500/30 hover:to-yellow-500/20 hover:text-amber-300 font-semibold tracking-wide shadow-lg shadow-amber-900/20"
                variant="ghost"
              >
                <Play className="h-4 w-4 fill-current" />
                Play World Map
                <Map className="h-4 w-4 ml-1 opacity-70" />
              </Button>
            </Link>
          </div>
        </div>

        {/* World Map Banner */}
        <div
          className="mb-6 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-transparent p-4 flex items-center justify-between gap-4"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl">
              🗺️
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-300">
                Stage {venture.currentStage} —{" "}
                {VENTURE_STAGES.find((s) => s.id === venture.currentStage)
                  ?.name ?? "Unknown"}
              </p>
              <p className="text-xs text-amber-500/70">
                Checkpoint {venture.currentCheckpoint} · Open the world map to
                continue your journey
              </p>
            </div>
          </div>
          <Link href="/map">
            <Button
              size="sm"
              className="gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs tracking-widest uppercase"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Enter Map
            </Button>
          </Link>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Completion</span>
                <span className="font-medium">
                  {progress.completionPercentage}%
                </span>
              </div>
              <Progress value={progress.completionPercentage} className="h-2" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">
                    {progress.completedCheckpoints}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {progress.goldCheckpoints}
                  </div>
                  <div className="text-xs text-muted-foreground">Gold</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {progress.totalCheckpoints}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Boss Encounters */}
        {venture.bosses.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skull className="h-5 w-5" />
                Boss Encounters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {venture.bosses.map(
                  (boss: {
                    bossId: number;
                    status: string;
                    corruptionLevel: number;
                    definition?: { name: string; represents: string };
                  }) => {
                    const def = boss.definition;
                    if (!def) return null;
                    return (
                      <div
                        key={boss.bossId}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4" />
                          <span className="font-semibold">{def.name}</span>
                          <Badge
                            variant={
                              boss.status === "slain"
                                ? "default"
                                : boss.status === "retreated"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {boss.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {def.represents}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span>Corruption:</span>
                          <Progress
                            value={boss.corruptionLevel}
                            className="flex-1 h-1.5"
                          />
                          <span>{boss.corruptionLevel}%</span>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progress.stageProgress.map(
                (stage: {
                  stage: number;
                  name: string;
                  completed: number;
                  total: number;
                  isComplete: boolean;
                }) => (
                  <div
                    key={stage.stage}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                  >
                    <div className="flex items-center gap-2 sm:min-w-[120px]">
                      {stage.isComplete ? (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                      ) : stage.completed > 0 ? (
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-xs sm:text-sm font-medium truncate">
                        {stage.stage}: {stage.name}
                      </span>
                    </div>
                    <Progress
                      value={
                        stage.total > 0
                          ? (stage.completed / stage.total) * 100
                          : 0
                      }
                      className="flex-1 h-2"
                    />
                    <span className="text-xs text-muted-foreground sm:min-w-[60px] text-right self-end sm:self-auto">
                      {stage.completed}/{stage.total}
                    </span>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigate to current checkpoint */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() =>
              router.push(
                `/venture/${ventureId}/stage/${venture.currentStage}/checkpoint/${venture.currentCheckpoint}`,
              )
            }
          >
            Continue to Stage {venture.currentStage}, Checkpoint{" "}
            {venture.currentCheckpoint}
          </Button>
        </div>
      </div>
    </div>
  );
}
