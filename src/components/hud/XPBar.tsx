"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface XPBarProps {
  currentXP: number;
  maxXP: number;
  compact?: boolean;
  bossHp?: number;
  bossBaseHp?: number;
  bossName?: string;
}

const XPBarComponent = ({
  currentXP,
  maxXP,
  compact = false,
  bossHp,
  bossBaseHp,
  bossName,
}: XPBarProps) => {
  const percentage = Math.min((currentXP / maxXP) * 100, 100);
  const isNearlyFull = percentage >= 90;

  const hasBoss = bossHp !== undefined && bossBaseHp !== undefined && bossHp > 0;
  const bossPercentage = hasBoss ? Math.min((bossHp! / bossBaseHp!) * 100, 100) : 0;

  // ─── COMPACT MODE WITH BOSS ACTIVE (VS COMBAT HUD) ───────────────────────
  if (compact && hasBoss) {
    return (
      <div className="flex items-center gap-3 font-sans w-full max-w-[280px] sm:max-w-[340px] px-1 select-none">
        {/* User XP Side */}
        <div className="flex-1 flex flex-col items-end gap-0.5">
          <span className="text-[7.5px] text-cyan-400 font-black uppercase tracking-wider leading-none">
            🛡️ YOU (XP)
          </span>
          <div className="relative h-2 w-full overflow-hidden rounded-l-md border-y border-l border-cyan-500/25 bg-black/60">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-600 via-cyan-500 to-cyan-400 origin-right rounded-l-sm"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            {/* Moving light effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2 h-full"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <span className="text-[7px] text-cyan-300 font-extrabold font-mono mt-0.5">
            {Math.round(percentage)}%
          </span>
        </div>

        {/* VS Badge */}
        <div className="shrink-0 relative flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10">
          <span className="text-[10px] font-black text-amber-400 italic tracking-tighter">
            VS
          </span>
          {/* Radial aura */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/10 via-transparent to-rose-500/20 blur-[2px]" />
          {/* Ping pulse */}
          <motion.div
            className="absolute inset-0 rounded-full border border-amber-500/40 pointer-events-none"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Boss HP Side */}
        <div className="flex-1 flex flex-col items-start gap-0.5">
          <span className="text-[7.5px] text-rose-500 font-black uppercase tracking-wider leading-none animate-pulse">
            👹 {bossName || "BOSS"}
          </span>
          <div className="relative h-2 w-full overflow-hidden rounded-r-md border-y border-r border-rose-500/25 bg-black/60">
            <motion.div
              className="h-full bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 rounded-r-sm"
              initial={{ width: 0 }}
              animate={{ width: `${bossPercentage}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            {/* Moving slash glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2 h-full"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.0, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <span className="text-[7px] text-rose-400 font-extrabold font-mono mt-0.5">
            {Math.round(bossPercentage)}% HP
          </span>
        </div>
      </div>
    );
  }

  // ─── STANDARD WIDE VS BATTLEROYALE BAR (COMBAT SCREEN) ──────────────────────
  if (!compact && hasBoss) {
    return (
      <div className="flex flex-col gap-3.5 font-sans w-full max-w-[420px] rounded-2xl border border-white/5 bg-zinc-950/80 p-4 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden group select-none">
        {/* Dynamic battlefield background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-rose-500/5 pointer-events-none" />

        {/* Head-to-Head Labels */}
        <div className="flex items-center justify-between text-xs font-black tracking-widest relative z-10">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Zap className="h-4 w-4 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" fill="currentColor" />
            <span>KNOWLEDGE (YOU)</span>
          </div>
          <div className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider">COMBAT STATUS</div>
          <div className="flex items-center gap-1.5 text-rose-500 animate-pulse">
            <span>{bossName || "BOSS"}</span>
            <span>👹</span>
          </div>
        </div>

        {/* Health / XP Bars with VS in the middle */}
        <div className="flex items-center gap-3 relative z-10">
          {/* User Bar */}
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="relative flex h-4 w-full items-center overflow-hidden rounded-l-lg border-y border-l border-cyan-500/30 p-[1px] bg-black/60">
              <motion.div
                className="h-full rounded-l-md relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ width: `${percentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-cyan-500 to-cyan-400" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400 font-mono">
              <span>LVL {Math.round(percentage)}%</span>
              <span className="text-zinc-500 font-normal">{currentXP.toLocaleString()} XP</span>
            </div>
          </div>

          {/* Golden Versus Badge */}
          <div className="shrink-0 relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-amber-500 to-yellow-600 border-2 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] z-10 transition-transform group-hover:scale-110">
            <span className="text-sm font-black text-black italic tracking-tighter drop-shadow-sm select-none">
              VS
            </span>
            <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-45 pointer-events-none" />
          </div>

          {/* Boss HP Bar */}
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="relative flex h-4 w-full items-center overflow-hidden rounded-r-lg border-y border-r border-rose-500/30 p-[1px] bg-black/60">
              <motion.div
                className="h-full rounded-r-md relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${bossPercentage}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ width: `${bossPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-red-500 to-rose-700" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-rose-400 font-mono">
              <span>HP {Math.round(bossPercentage)}%</span>
              <span className="text-zinc-500 font-normal">{bossHp} / {bossBaseHp} HP</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STANDARD COMPACT MODE (NO BOSS) ─────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-2 font-sans group">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/40 shadow-sm backdrop-blur-md">
          <Zap
            className="h-3.5 w-3.5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
            fill="currentColor"
          />
        </div>

        <div className="flex flex-col gap-1">
          {/* XP Bar Section */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black leading-none">
                XP
              </span>
              <span className="text-[7px] text-cyan-400/80 font-bold">
                {Math.round(percentage)}%
              </span>
            </div>

            <div className="relative h-1.5 w-24 overflow-hidden rounded-full border border-white/5 bg-black/40">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-600 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STANDARD EXPANDED MODE (NO BOSS) ────────────────────────────────────
  return (
    <div className="flex items-center gap-2.5 font-sans group">
      <div
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md transition-transform group-hover:scale-105 ${
          isNearlyFull
            ? "border-emerald-400/50 bg-zinc-900/60 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            : "border-white/10 bg-zinc-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        }`}
      >
        <Zap
          className={`h-4 w-4 ${
            isNearlyFull
              ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]"
              : "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
          }`}
          fill="currentColor"
        />
        <div
          className={`absolute inset-0 rounded-xl pointer-events-none ${
            isNearlyFull
              ? "bg-gradient-to-br from-emerald-500/20 to-transparent"
              : "bg-gradient-to-br from-cyan-500/10 to-transparent"
          }`}
        />
        {isNearlyFull && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-emerald-400/40 pointer-events-none"
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        {/* XP Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black leading-none">
              Experience
            </span>
            <span className="text-[10px] text-cyan-400/80 font-bold tabular-nums">
              {Math.round(percentage)}%
            </span>
          </div>

          <div
            className={`relative flex h-3 w-28 items-center overflow-hidden rounded-full border p-[1px] backdrop-blur-sm sm:w-36 lg:w-40 ${
              isNearlyFull
                ? "border-emerald-400/30 bg-black/50 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05),0_0_15px_rgba(16,185,129,0.3)]"
                : "border-white/5 bg-black/40 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)]"
            }`}
          >
            <motion.div
              className="h-full rounded-full relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
              }}
            >
              <div
                className={`absolute inset-0 ${
                  isNearlyFull
                    ? "bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-400"
                    : "bg-gradient-to-r from-cyan-600 via-indigo-500 to-cyan-400"
                }`}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <div className="absolute inset-x-0 top-0 h-[1px] bg-white/20 rounded-full" />
            </motion.div>

            {isNearlyFull && (
              <>
                <motion.div
                  className="absolute inset-0 bg-emerald-400/25 pointer-events-none rounded-full"
                  animate={{
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute -inset-[2px] rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, rgba(16,185,129,0) 40%, rgba(16,185,129,0.4) 100%)",
                    filter: "blur(4px)",
                  }}
                  animate={{
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-1 hidden min-w-[62px] flex-col items-end sm:flex">
        <div className="text-[12px] font-black tracking-tight text-white tabular-nums leading-none">
          {currentXP.toLocaleString()}
        </div>
        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter mt-1">
          / {maxXP.toLocaleString()} XP
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent re-renders when XP values haven't changed
export const XPBar = React.memo(XPBarComponent);
