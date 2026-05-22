"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";

// ── Stage definitions ──────────────────────────────────────────────────────
const STAGES = [
  {
    id: 1,
    name: "Ideation",
    subtitle: "Stage 1",
    description:
      "The spark of creation. Define the problem, brainstorm solutions, and map out your initial vision.",
    icon: "💡",
    checkpoints: 4,
    glowColor: "#818cf8",
    bgColor: "rgba(99,102,241,0.08)",
    borderColor: "rgba(99,102,241,0.25)",
  },
  {
    id: 2,
    name: "Research",
    subtitle: "Stage 2",
    description:
      "Dive deep into the market. Analyse competitors, interview users, and validate your assumptions.",
    icon: "🔬",
    checkpoints: 5,
    glowColor: "#a78bfa",
    bgColor: "rgba(167,139,250,0.08)",
    borderColor: "rgba(167,139,250,0.25)",
  },
  {
    id: 3,
    name: "Validation",
    subtitle: "Stage 3",
    description:
      "Put your riskiest assumptions to the test. Run experiments, gather evidence, and make a clear pivot-or-proceed decision.",
    icon: "✅",
    checkpoints: 4,
    glowColor: "#f472b6",
    bgColor: "rgba(244,114,182,0.08)",
    borderColor: "rgba(244,114,182,0.25)",
  },
  {
    id: 4,
    name: "Design",
    subtitle: "Stage 4",
    description:
      "Give your idea a face. Map the user journey, build visual identity, and prototype the experience.",
    icon: "🎨",
    checkpoints: 5,
    glowColor: "#34d399",
    bgColor: "rgba(52,211,153,0.08)",
    borderColor: "rgba(52,211,153,0.25)",
  },
  {
    id: 5,
    name: "Development",
    subtitle: "Stage 5",
    description:
      "Write the code, build the stack, and ship a working product through internal and external testing.",
    icon: "⚙️",
    checkpoints: 6,
    glowColor: "#fb923c",
    bgColor: "rgba(251,146,60,0.08)",
    borderColor: "rgba(251,146,60,0.25)",
  },
  {
    id: 6,
    name: "Launch",
    subtitle: "Stage 6",
    description:
      "Prepare assets, go live, and acquire your first real users through targeted channels.",
    icon: "🚀",
    checkpoints: 3,
    glowColor: "#38bdf8",
    bgColor: "rgba(56,189,248,0.08)",
    borderColor: "rgba(56,189,248,0.25)",
  },
  {
    id: 7,
    name: "Iteration",
    subtitle: "Stage 7",
    description:
      "Listen, prioritise, ship improvements. Measure the impact of every change against real metrics.",
    icon: "🔄",
    checkpoints: 4,
    glowColor: "#facc15",
    bgColor: "rgba(250,204,21,0.08)",
    borderColor: "rgba(250,204,21,0.25)",
  },
  {
    id: 8,
    name: "Scale",
    subtitle: "Stage 8",
    description:
      "Identify growth channels, validate the revenue model, and build the operations to support serious volume.",
    icon: "📈",
    checkpoints: 5,
    glowColor: "#c084fc",
    bgColor: "rgba(192,132,252,0.08)",
    borderColor: "rgba(192,132,252,0.25)",
  },
];

// ── Progress bar ───────────────────────────────────────────────────────────
function ProgressBar({
  completed,
  total,
  color,
}: {
  completed: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] tracking-widest uppercase font-bold text-white/40">
          Progress
        </span>
        <span className="text-[11px] font-black" style={{ color }}>
          {completed}/{total} levels
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          style={{
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: pct > 0 ? `0 0 8px ${color}66` : "none",
          }}
        />
      </div>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({
  status,
  color,
}: {
  status: "completed" | "active" | "locked";
  color: string;
}) {
  const label =
    status === "completed"
      ? "✓ Completed"
      : status === "active"
        ? "● In Progress"
        : "🔒 Locked";
  const bg =
    status === "completed"
      ? "rgba(34,197,94,0.12)"
      : status === "active"
        ? `${color}18`
        : "rgba(255,255,255,0.04)";
  const textColor =
    status === "completed"
      ? "#4ade80"
      : status === "active"
        ? color
        : "#475569";
  return (
    <span
      className="text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full"
      style={{ background: bg, color: textColor }}
    >
      {label}
    </span>
  );
}

// ── Stage card ─────────────────────────────────────────────────────────────
function StageCard({
  stage,
  completedCheckpoints,
  isActive,
  isLocked,
  index,
  onClick,
}: {
  stage: (typeof STAGES)[number];
  completedCheckpoints: number;
  isActive: boolean;
  isLocked: boolean;
  index: number;
  onClick: () => void;
}) {
  const status: "completed" | "active" | "locked" =
    completedCheckpoints >= stage.checkpoints
      ? "completed"
      : isActive || completedCheckpoints > 0
        ? "active"
        : isLocked
          ? "locked"
          : "active";

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.12, ease: "easeOut" }}
      whileHover={!isLocked ? { y: -6, scale: 1.015 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      onClick={!isLocked ? onClick : undefined}
      disabled={isLocked}
      className="group relative w-full text-left rounded-3xl overflow-hidden transition-all duration-500 border"
      style={{
        background: stage.bgColor,
        borderColor: isActive
          ? stage.glowColor + "55"
          : stage.borderColor,
        boxShadow: isActive
          ? `0 0 32px ${stage.glowColor}22, 0 8px 32px rgba(0,0,0,0.3)`
          : "0 4px 24px rgba(0,0,0,0.2)",
        cursor: isLocked ? "not-allowed" : "pointer",
        opacity: isLocked ? 0.5 : 1,
      }}
    >
      {/* Hover glow overlay */}
      {!isLocked && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 30% 40%, ${stage.glowColor}12 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Active indicator line at top */}
      {isActive && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: stage.glowColor }}
          layoutId="active-stage-bar"
        />
      )}

      <div className="relative p-7 sm:p-9 flex flex-col gap-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          {/* Icon */}
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0 relative transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
            style={{ background: `${stage.glowColor}15`, border: `1px solid ${stage.glowColor}30` }}
          >
            <span className="relative z-10">{stage.icon}</span>
            <div
              className="absolute inset-0 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity"
              style={{ background: stage.glowColor }}
            />
          </div>

          {/* Right side badges */}
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={status} color={stage.glowColor} />
            <span
              className="text-[10px] sm:text-xs font-black tracking-[0.25em] uppercase px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50"
            >
              {stage.checkpoints} Levels
            </span>
          </div>
        </div>

        {/* Stage text */}
        <div className="flex flex-col gap-2">
          <p
            className="text-[10px] font-black tracking-[0.4em] uppercase"
            style={{ color: stage.glowColor + "aa" }}
          >
            {stage.subtitle}
          </p>
          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight"
            style={{ textShadow: `0 0 24px ${stage.glowColor}40` }}
          >
            {stage.name}
          </h2>
          <p className="text-sm text-white/50 leading-relaxed font-medium">
            {stage.description}
          </p>
        </div>

        {/* Progress bar */}
        <ProgressBar
          completed={completedCheckpoints}
          total={stage.checkpoints}
          color={stage.glowColor}
        />

        {/* CTA row */}
        {!isLocked && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/30 group-hover:text-white/60 transition-colors">
              {status === "completed"
                ? "Review Stage"
                : status === "active"
                  ? "Continue Journey"
                  : "Start Stage"}
            </span>
            <motion.span
              className="text-lg"
              style={{ color: stage.glowColor }}
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function MapStagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [preferredVentureId, setPreferredVentureId] = useState<string | null>(null);
  const ensureVentureStructure = useMutation(api.ventures.ensureVentureStructure);
  const [ensuredVentureId, setEnsuredVentureId] = useState<string | null>(null);

  // ── Real-time Convex queries ─────────────────────────────────────────────
  const ventures = useQuery(api.worldMap.getVenturesByUser);
  const activeVenture =
    ventures?.find((venture) => venture._id === preferredVentureId) ??
    ventures?.[0] ??
    null;

  const worldMapData = useQuery(
    api.worldMap.getWorldMapData,
    activeVenture ? { ventureId: activeVenture._id } : "skip",
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const queryVentureId = searchParams.get("ventureId");
    const storedVentureId = localStorage.getItem("activeVentureId");
    setPreferredVentureId(queryVentureId || storedVentureId);
  }, [searchParams]);

  useEffect(() => {
    if (!activeVenture || typeof window === "undefined") return;
    localStorage.setItem("activeVentureId", activeVenture._id);
  }, [activeVenture]);

  useEffect(() => {
    if (!activeVenture?._id) return;
    if (ensuredVentureId === activeVenture._id) return;

    setEnsuredVentureId(activeVenture._id);
    ensureVentureStructure({ ventureId: activeVenture._id }).catch((error) => {
      console.error("[MapStagesPage] Failed to ensure venture structure:", error);
      setEnsuredVentureId(null);
    });
  }, [activeVenture?._id, ensuredVentureId, ensureVentureStructure]);

  // Derived values from live DB
  const currentStage = activeVenture?.currentStage ?? 1;
  const checkpoints = worldMapData?.checkpoints ?? [];

  // Count completed checkpoints per stage from DB
  const completedByStage = (stageId: number): number => {
    return checkpoints.filter(
      (cp) =>
        cp.stage === stageId &&
        (cp.status === "completed" ||
          (cp.t1Completed && cp.t2Completed && cp.t3Completed)),
    ).length;
  };

  const handleSelectStage = (stageId: number) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedStage", stageId.toString());
    }
    const ventureId = activeVenture?._id;
    router.push(
      ventureId ? `/map/world?ventureId=${ventureId}` : "/map/world",
    );
  };

  const handleBack = () => {
    router.push("/map");
  };

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-[#050810] flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs tracking-[0.3em] uppercase font-black text-indigo-400"
        >
          Loading…
        </motion.div>
      </div>
    );
  }

  const isLoading = ventures === undefined;

  return (
    <div className="fixed inset-0 bg-[#050810] overflow-y-auto">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050810] via-[#0a0f25] to-[#050810]" />
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-indigo-500/8 blur-[140px] rounded-full animate-pulse" />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-violet-500/8 blur-[140px] rounded-full animate-pulse"
          style={{ animationDelay: "2.5s" }}
        />
        {/* Stars */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-px bg-white rounded-full"
            style={{
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
            }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{
              duration: 2.5 + (i % 4),
              repeat: Infinity,
              delay: (i * 0.17) % 3,
            }}
          />
        ))}
        {/* Orbit rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-white/[0.04] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] border border-white/[0.02] rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14 flex flex-col min-h-full">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={handleBack}
          className="group self-start flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.25em] text-white/30 hover:text-white/70 transition-all mb-10 sm:mb-14"
        >
          <span className="w-6 h-[1px] bg-white/20 group-hover:bg-indigo-400 group-hover:w-10 transition-all duration-300" />
          Back
        </motion.button>

        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-[10px] tracking-[0.4em] uppercase font-black text-indigo-400/60 mb-4"
          >
            {activeVenture
              ? worldMapData?.ideaTitle ?? "Your Venture"
              : "Select your path"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter uppercase italic mb-4"
            style={{ textShadow: "0 0 50px rgba(99,102,241,0.35)" }}
          >
            Select Venture Stage
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-white/40 font-medium max-w-lg mx-auto leading-relaxed"
          >
            Choose your current phase. Each stage contains critical checkpoints
            to validate your startup ideas.
          </motion.p>

          {/* Live venture stats */}
          <AnimatePresence>
            {activeVenture && worldMapData && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-6 inline-flex items-center gap-4 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-white/50">
                    Live Sync
                  </span>
                </div>
                <div className="w-[1px] h-3 bg-white/10" />
                <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-indigo-300/70">
                  Stage {currentStage} Active
                </span>
                <div className="w-[1px] h-3 bg-white/10" />
                <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-white/40">
                  {checkpoints.filter(
                    (c) =>
                      c.status === "completed" ||
                      (c.t1Completed && c.t2Completed && c.t3Completed),
                  ).length}
                  /8 done
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-72 rounded-3xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              />
            ))}
          </div>
        )}

        {/* Stage cards */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full">
            {STAGES.map((stage, index) => {
              const completed = completedByStage(stage.id);
              const isActive = stage.id === currentStage;
              return (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  completedCheckpoints={completed}
                  isActive={isActive}
                  isLocked={false /* allow navigation to any stage */}
                  index={index}
                  onClick={() => handleSelectStage(stage.id)}
                />
              );
            })}
          </div>
        )}

        {/* No venture CTA */}
        {!isLoading && !activeVenture && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 text-center"
          >
            <p className="text-sm text-white/40 mb-4">
              No active venture found. Create one to start your journey.
            </p>
            <button
              onClick={() => router.push("/venture/create")}
              className="px-7 py-3 rounded-xl text-xs font-black tracking-[0.2em] uppercase transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.1))",
                border: "1px solid rgba(99,102,241,0.4)",
                color: "#818cf8",
              }}
            >
              Create Venture →
            </button>
          </motion.div>
        )}

        {/* Bottom separator */}
        <div className="mt-auto pt-14 flex items-center justify-center gap-4 opacity-30">
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-indigo-500/50" />
          <span className="text-[9px] tracking-[0.3em] uppercase font-black text-white/40">
            8 Stages · 36 Checkpoints
          </span>
          <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-indigo-500/50" />
        </div>
      </div>
    </div>
  );
}
