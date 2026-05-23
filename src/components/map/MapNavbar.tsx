"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Home as HomeIcon, Users } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useAtom, useAtomValue } from "jotai";
import { motion, AnimatePresence } from "framer-motion";

import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { PremiumIcon } from "@/components/ui/PremiumIcon";
import { cn } from "@/lib/utils";

import {
  hudVisibleAtom,
  activeVentureAtom,
  userProgressAtom,
  stageInfoAtom,
  checkpointProgressAtom,
  submittingTaskAtom,
  activeTaskAtom,
  templateIdAtom,
  templateMetricAtom,
  corruptionStateAtom,
} from "@/lib/stores/hudStore";
import { getTemplate } from "@/config/templates";
import type { TemplateId } from "@/config/templates";

import {
  StageInfo as StandardStageInfo,
  CheckpointProgress as StandardCheckpointProgress,
  LevelDisplay as StandardLevelDisplay,
  XPBar as StandardXPBar,
  AudioControls as StandardAudioControls,
} from "@/components/hud";

const displayFontClass = "font-sans";
const transitionBase = "transition-all duration-200";

// Template colors matching TemplateHUD.tsx
const TEMPLATE_COLORS: Record<TemplateId, {
  primary: string;
  secondary: string;
  bg: string;
  metricGlow: string;
  progressGradient: string;
}> = {
  venture: {
    primary: "#6366f1",
    secondary: "#818cf8",
    bg: "rgba(15, 15, 26, 0.9)",
    metricGlow: "0 0 20px rgba(99, 102, 241, 0.4)",
    progressGradient: "linear-gradient(90deg, #6366f1, #8b5cf6)",
  },
  academic: {
    primary: "#d4a853",
    secondary: "#8b6914",
    bg: "rgba(26, 20, 8, 0.92)",
    metricGlow: "0 0 20px rgba(212, 168, 83, 0.4)",
    progressGradient: "linear-gradient(90deg, #8b6914, #d4a853, #f0c040)",
  },
  lab: {
    primary: "#06d6a0",
    secondary: "#1a6b8a",
    bg: "rgba(2, 13, 20, 0.92)",
    metricGlow: "0 0 20px rgba(6, 214, 160, 0.4)",
    progressGradient: "linear-gradient(90deg, #1a6b8a, #06d6a0)",
  },
  creative: {
    primary: "#ffd166",
    secondary: "#e8b4d0",
    bg: "rgba(7, 5, 12, 0.9)",
    metricGlow: "0 0 20px rgba(255, 209, 102, 0.4)",
    progressGradient: "linear-gradient(90deg, #e8b4d0, #ffd166, #90e0a0)",
  },
};

// Idea bulb icon matching hero header
const IdeaBulb = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M9 18h6" />
    <path d="M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.9.7 1.5 1.7 1.5 2.8V18h4v-1.3c0-1.1.6-2.1 1.5-2.8A6 6 0 0 0 12 3Z" />
  </svg>
);

const menuItems = [
  { name: 'Feed', href: '/feed', icon: HomeIcon },
  { name: 'My Ideas', href: '/my-ideas', icon: IdeaBulb },
  { name: 'Community', href: '/community', icon: Users },
];

export function MapNavbar() {
  const { signOut } = useClerk();
  const currentUser = useQuery(api.users.getCurrentUser);
  const pathname = usePathname();
  const router = useRouter();

  // Atom state subscriptions
  const [hudVisible] = useAtom(hudVisibleAtom);
  const [activeVenture] = useAtom(activeVentureAtom);
  const [userProgress] = useAtom(userProgressAtom);
  const [stageInfo] = useAtom(stageInfoAtom);
  const [checkpointProgress] = useAtom(checkpointProgressAtom);
  const [, setSubmittingTask] = useAtom(submittingTaskAtom);
  const [activeTask] = useAtom(activeTaskAtom);

  // Template specific state
  const templateId = useAtomValue(templateIdAtom);
  const templateMetric = useAtomValue(templateMetricAtom);
  const corruption = useAtomValue(corruptionStateAtom);

  const isTemplateVenture = (activeVenture as any)?.templateId && (activeVenture as any).templateId !== "venture";
  const template = isTemplateVenture ? getTemplate(templateId) : null;
  const colors = isTemplateVenture ? TEMPLATE_COLORS[templateId] : null;

  const initials = (currentUser?.displayName ?? currentUser?.username ?? "U")
    .toString()
    .split(/\s+/)
    .map((s) => s.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleHUDClick = useCallback(() => {
    if (activeTask) {
      setSubmittingTask(activeTask);
    }
  }, [activeTask, setSubmittingTask]);

  if (!hudVisible) return null;

  return (
    <header className="fixed inset-x-0 top-0 z-[70] h-12 sm:h-14 md:h-16 lg:h-18 border-b border-white/7 bg-[#0A0D12]/92 backdrop-blur-xl overflow-hidden select-none">
      <div className="flex h-full items-center justify-between px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
        
        {/* LEFT: Branding/Logo */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 rounded-full text-white shrink-0 hover:opacity-90 transition-opacity">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 xl:h-11 xl:w-11 items-center justify-center rounded-lg sm:rounded-xl border border-[#6366F1]/30 bg-[#111827] shadow-[0_0_0_1px_rgba(255,255,255,0.03)] overflow-hidden lg:rounded-2xl">
            <Image src="/logo.png" alt="" width={44} height={44} className="h-full w-full object-cover" priority />
          </div>
          <div className="hidden sm:block text-left">
            <div className={`${displayFontClass} text-[10px] sm:text-xs md:text-sm font-semibold tracking-wide text-white`}>InteractiveIdeas</div>
            <div className="text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.18em] text-[#7C86A2]">Builder Network</div>
          </div>
        </Link>

        {/* CENTER: HUD Tools Integrated directly into Navbar */}
        <div className="flex-1 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-2 sm:mx-3 md:mx-4 lg:mx-6 overflow-hidden">
          <div 
            className="no-scrollbar flex w-full items-center justify-start gap-2 sm:gap-3 md:gap-4 overflow-x-auto rounded-lg sm:rounded-xl border border-white/5 bg-white/[0.01] px-2 py-0.5 sm:px-3 sm:py-1 md:justify-center lg:px-4 lg:py-1.5"
          >
            {isTemplateVenture && template && colors ? (
              // ── Template HUD variant ──
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0 font-sans">
                {/* Template badge */}
                <span
                  className="hidden sm:inline-block text-[7px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full border shrink-0"
                  style={{
                    background: `${colors.primary}15`,
                    color: colors.primary,
                    borderColor: `${colors.primary}33`,
                  }}
                >
                  {template.name}
                </span>

                <div className="hidden sm:block h-4 sm:h-5 w-px bg-white/10 shrink-0" />

                {/* Stage Info */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <span className="text-white shrink-0">
                    <PremiumIcon name={stageInfo.stageIcon} className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" strokeWidth={1.5} />
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-[7px] sm:text-[8px] text-white/50 uppercase tracking-widest font-mono leading-none">
                      Stage {stageInfo.stage}
                    </span>
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold text-white leading-tight">
                      {stageInfo.stageName}
                    </span>
                  </div>
                </div>

                <div className="h-4 sm:h-5 w-px bg-white/10 shrink-0" />

                {/* Checkpoint Progress */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <span className="text-[7px] sm:text-[8px] text-white/40 font-mono">
                    CP {stageInfo.currentCheckpoint}/{stageInfo.totalCheckpointsInStage}
                  </span>
                  <div className="relative h-0.5 sm:h-1 w-8 sm:w-10 md:w-12 rounded-full overflow-hidden bg-white/10">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${checkpointProgress.total > 0 ? (checkpointProgress.completed / checkpointProgress.total) * 100 : 0}%`,
                        background: colors.progressGradient 
                      }}
                    />
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold" style={{ color: colors.primary }}>
                    {checkpointProgress.completed}/{checkpointProgress.total}
                  </span>
                </div>

                <div className="h-4 sm:h-5 w-px bg-white/10 shrink-0" />

                {/* Quality Metric */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <span className="text-white shrink-0">
                    <PremiumIcon name={templateMetric.icon} className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" strokeWidth={1.5} />
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-[7px] sm:text-[8px] font-medium uppercase tracking-widest leading-none text-white/50">
                      {templateMetric.label}
                    </span>
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold leading-tight" style={{ color: colors.primary }}>
                      {templateMetric.displayValue}
                    </span>
                  </div>
                </div>

                {/* Corruption Meter if > 0 */}
                {corruption.level > 0 && (
                  <>
                    <div className="h-4 sm:h-5 w-px bg-white/10 shrink-0" />
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className="text-[7px] sm:text-[8px] font-medium uppercase tracking-widest text-red-400/80 leading-none">
                        ☠ Corruption
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-mono text-red-400 font-bold leading-none">
                        {corruption.level}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // ── Standard HUD variant ──
              <>
                <div className="shrink-0">
                  <StandardStageInfo
                    stageName={stageInfo.stageName}
                    stageIcon={stageInfo.stageIcon}
                    biomeName={stageInfo.biomeName}
                    stage={stageInfo.stage}
                    currentCheckpoint={stageInfo.currentCheckpoint}
                    totalCheckpointsInStage={stageInfo.totalCheckpointsInStage}
                    compact={true}
                  />
                </div>

                <div className="hidden h-5 w-px bg-white/10 sm:block shrink-0" />

                <div className="shrink-0">
                  <StandardCheckpointProgress
                    completed={checkpointProgress.completed}
                    total={checkpointProgress.total}
                    goldCount={checkpointProgress.goldCount}
                    compact={true}
                    onClick={handleHUDClick}
                  />
                </div>

                <div className="shrink-0">
                  <StandardLevelDisplay
                    level={userProgress.level}
                    phase={userProgress.phase}
                    compact={true}
                    onClick={handleHUDClick}
                  />
                </div>

                <div className="shrink-0 hidden md:block">
                  <StandardXPBar
                    currentXP={userProgress.xp}
                    maxXP={userProgress.xpToNextLevel}
                    compact={true}
                  />
                </div>

                <div className="shrink-0">
                  <StandardAudioControls />
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Menu Items, Notification Bell & User Dropdown */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 shrink-0">
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  aria-label={item.name} 
                  title={item.name} 
                  className={cn(
                    "relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg transition-colors duration-200", 
                    active ? "text-white bg-white/[0.06]" : "text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-5 lg:w-5" />
                  {active && (
                    <span aria-hidden className="absolute left-2 right-2 -bottom-px h-px bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent shadow-[0_0_10px_rgba(139,92,246,0.7)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="h-4 sm:h-5 w-px bg-white/10 hidden md:block" />

          <SignedOut>
            <div className="flex gap-1 sm:gap-1.5">
              <SignInButton><Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-[10px] sm:text-xs px-1.5 sm:px-2 h-7 sm:h-8">Login</Button></SignInButton>
              <SignUpButton><Button size="sm" className="text-[10px] sm:text-xs px-2 sm:px-2.5 h-7 sm:h-8">Sign Up</Button></SignUpButton>
            </div>
          </SignedOut>
          
          <SignedIn>
            <div className="shrink-0 flex items-center gap-1 sm:gap-1.5 lg:gap-2.5">
              <NotificationBell />
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="rounded-full transition-transform hover:scale-105 active:scale-95 shrink-0" aria-label="Open profile menu">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 ring-2 ring-[#6366F1]/45 ring-offset-1 sm:ring-offset-2 ring-offset-[#0A0D12]">
                      <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                      <AvatarFallback className="bg-[#1B2440] text-[10px] sm:text-xs font-semibold text-white">{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 sm:w-52" align="end" forceMount>
                  <div className="grid gap-2 font-sans text-left">
                    <Link href={`/profile/${currentUser?.username}`} className="font-medium truncate p-2 -mx-2 rounded-md hover:bg-muted transition-colors text-xs sm:text-sm">
                      {currentUser?.displayName}
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground font-normal truncate">@{currentUser?.username}</p>
                    </Link>
                    <Button variant="ghost" size="sm" className="justify-start gap-2 px-2 w-full text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] sm:text-xs h-8 sm:h-9" onClick={() => signOut()}>
                      <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
