"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import {
  Rocket,
  Skull,
  Shield,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Trophy,
  Flame,
  Map,
} from "lucide-react";
import { VENTURE_STAGES, BOSS_DEFINITIONS } from "@convex/ventureConstants";

export default function MyVenturesPage() {
  const ventures = useQuery(api.ventures.getUserVentureSummaries, {});
  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />

      <main className="flex-1 container mx-auto px-4 py-12 pt-32">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Rocket className="h-7 w-7" />
                My Ventures
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your venture progression across all active ideas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/my-ideas">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Venture
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Rocket className="h-5 w-5" />}
              label="Active"
              value={ventures?.filter((v) => v.status === "active").length || 0}
              color="text-blue-500"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Completed"
              value={
                ventures?.filter((v) => v.status === "completed").length || 0
              }
              color="text-green-500"
            />
            <StatCard
              icon={<Skull className="h-5 w-5" />}
              label="Bosses Fought"
              value={
                ventures?.reduce(
                  (sum, v) => sum + (v.assignedBosses?.length || 0),
                  0,
                ) || 0
              }
              color="text-red-500"
            />
            <StatCard
              icon={<Trophy className="h-5 w-5" />}
              label="Gold Checkpoints"
              value={0}
              color="text-amber-500"
            />
          </div>

          {/* Ventures List */}
          {!ventures ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-muted-foreground">
                Loading ventures...
              </div>
            </div>
          ) : ventures.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-16">
                <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Ventures Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Turn any of your ideas into a guided 8-stage venture with
                  checkpoints, tasks, and boss encounters.
                </p>
                <Link href="/my-ideas">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Venture
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {ventures.map((venture) => (
                <VentureCard key={venture._id} venture={venture} />
              ))}
            </div>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted ${color}`}>{icon}</div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VentureCard({
  venture,
}: {
  venture: {
    _id: string;
    ideaId: string;
    userId: string;
    currentStage: number;
    currentCheckpoint: number;
    status: string;
    assignedBosses: number[];
    createdAt: number;
    updatedAt: number;
  };
}) {
  const stageName =
    VENTURE_STAGES.find((s) => s.id === venture.currentStage)?.name ||
    "Unknown";
  const completionPct = Math.round(
    ((venture.currentStage - 1) * 100 +
      (venture.currentCheckpoint /
        (VENTURE_STAGES.find((s) => s.id === venture.currentStage)
          ?.checkpoints || 1)) *
        100) /
      8,
  );

  const activeBosses = venture.assignedBosses
    .map((id) => BOSS_DEFINITIONS.find((b) => b.id === id))
    .filter(Boolean);

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Venture #{venture._id.slice(-6)}
              </CardTitle>
              <CardDescription>
                Stage {venture.currentStage}: {stageName} · Checkpoint{" "}
                {venture.currentCheckpoint}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                venture.status === "completed"
                  ? "default"
                  : venture.status === "active"
                    ? "secondary"
                    : "outline"
              }
            >
              {venture.status}
            </Badge>
            <Link href={`/map/world?ventureId=${venture._id}`}>
              <Button
                size="sm"
                className="gap-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 hover:text-amber-300"
                variant="ghost"
              >
                <Map className="h-3.5 w-3.5" />
                Play
              </Button>
            </Link>
            <Link href={`/map/world?ventureId=${venture._id}`}>
              <Button variant="ghost" size="icon">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress */}
        <div className="flex items-center gap-4 mb-4">
          <Progress
            value={Math.min(100, completionPct)}
            className="flex-1 h-2"
          />
          <span className="text-sm font-medium">
            {Math.min(100, completionPct)}%
          </span>
        </div>

        {/* Bosses */}
        {activeBosses.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Flame className="h-4 w-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Bosses:</span>
            {activeBosses.map((boss) => (
              <Badge
                key={boss!.id}
                variant="outline"
                className="gap-1 text-xs border-red-500/30 text-red-400"
              >
                <Shield className="h-3 w-3" />
                {boss!.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Stage Progress Dots */}
        <div className="flex items-center gap-1 mt-4">
          {VENTURE_STAGES.map((stage) => (
            <div
              key={stage.id}
              className={`w-6 h-1.5 rounded-full ${
                stage.id < venture.currentStage
                  ? "bg-green-500"
                  : stage.id === venture.currentStage
                    ? "bg-primary"
                    : "bg-muted"
              }`}
              title={`Stage ${stage.id}: ${stage.name}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
