"use client";

import { motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { activeVentureAtom } from "@/lib/stores/hudStore";

interface CheckpointProgressProps {
  completed: number;
  total: number;
  goldCount: number;
  compact?: boolean;
  onClick?: () => void;
}

export function CheckpointProgress({
  completed,
  total,
  goldCount,
  compact = false,
  onClick,
}: CheckpointProgressProps) {
  const percentage = Math.min((completed / total) * 100, 100);
  const activeVenture = useAtomValue(activeVentureAtom);
  const ideaName = activeVenture?.name || "Progress";

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 font-sans group transition-all active:scale-95 ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
        onClick={onClick}
      >
        <div className="flex flex-col">
          <span
            className="text-[10px] text-white uppercase tracking-widest font-black leading-none truncate max-w-[120px]"
            title={ideaName}
          >
            {ideaName}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2.5 font-sans group transition-all active:scale-95 ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
      onClick={onClick}
    >
      <div className="flex flex-col">
        <span
          className="text-[12px] font-black uppercase leading-none tracking-[0.15em] text-white truncate max-w-[150px]"
          title={ideaName}
        >
          {ideaName}
        </span>
      </div>
    </div>
  );
}
