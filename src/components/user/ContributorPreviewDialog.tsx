"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, User, Calendar, ExternalLink, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContributorPreviewDialogProps {
  contributor: {
    requestId: string;
    userId: string;
    displayName: string;
    username: string;
    avatar: string;
    personaGender: "male" | "female";
    role: string;
    level: number;
    xp: number;
    isOnline: boolean;
  } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContributorPreviewDialog({
  contributor,
  isOpen,
  onOpenChange,
}: ContributorPreviewDialogProps) {
  const router = useRouter();

  // Query this contributor's badges dynamically
  const badges = useQuery(
    api.badges.getUserBadges,
    contributor ? { userId: contributor.userId as Id<"users"> } : "skip"
  );

  if (!contributor) return null;

  // Compute colors based on role
  const roleColors: Record<string, { border: string; glow: string; text: string; bg: string }> = {
    owner: {
      border: "border-amber-500/50 hover:border-amber-400",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.25)]",
      text: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    admin: {
      border: "border-purple-500/50 hover:border-purple-400",
      glow: "shadow-[0_0_15px_rgba(167,139,250,0.25)]",
      text: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    moderator: {
      border: "border-sky-500/50 hover:border-sky-400",
      glow: "shadow-[0_0_15px_rgba(56,189,248,0.25)]",
      text: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    contributor: {
      border: "border-teal-500/50 hover:border-teal-400",
      glow: "shadow-[0_0_15px_rgba(45,212,191,0.25)]",
      text: "text-teal-400",
      bg: "bg-teal-500/10",
    },
  };

  const roleStyle = roleColors[contributor.role.toLowerCase()] || roleColors.contributor;

  // Standard RPG style Level Progression maths: level 1 = 100xp, level 2 = 200xp, etc.
  const xpNeeded = contributor.level * 100;
  const xpPercentage = Math.min(100, Math.max(0, (contributor.xp / xpNeeded) * 100));

  const handleProfileRedirect = () => {
    onOpenChange(false);
    router.push(`/profile/${contributor.username}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-slate-950/90 border border-slate-800/80 backdrop-blur-xl rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Top Header/Banner Area */}
        <div className={`h-24 w-full bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800/40 relative flex items-center justify-between px-6`}>
          <div className="flex items-center gap-2">
            <Shield className={`w-5 h-5 ${roleStyle.text} animate-pulse`} />
            <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
              Venture Companion
            </span>
          </div>
          <DialogClose className="rounded-full p-1.5 bg-slate-900/60 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all">
            <X className="w-4 h-4" />
          </DialogClose>
        </div>

        {/* Profile Details Body */}
        <div className="px-6 pb-6 pt-0 relative">
          
          {/* Circular Floating Avatar Badge with role colored border */}
          <div className="absolute -top-12 left-6">
            <div className={`w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 p-1 border-2 ${roleStyle.border} ${roleStyle.glow} transition-all duration-300 group`}>
              <img
                src={contributor.avatar}
                alt={contributor.displayName}
                className="w-full h-full object-cover rounded-xl bg-slate-900/80 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            {/* Status dot indicator */}
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${contributor.isOnline ? "bg-emerald-400" : "bg-slate-500"} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-slate-950 ${contributor.isOnline ? "bg-emerald-500" : "bg-slate-600"}`}></span>
            </div>
          </div>

          {/* Right aligned action controls */}
          <div className="h-12 flex justify-end items-center gap-2 mt-2">
            <Badge variant="secondary" className={`${roleStyle.bg} ${roleStyle.text} border-none font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-md`}>
              {contributor.role}
            </Badge>
            <Badge variant="outline" className={`${contributor.isOnline ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-slate-800 text-slate-400"} font-medium text-[10px]`}>
              {contributor.isOnline ? "ONLINE" : "OFFLINE"}
            </Badge>
          </div>

          {/* Name & Handle */}
          <div className="mt-4">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-1.5">
              {contributor.displayName}
              {contributor.role.toLowerCase() === "owner" && (
                <span className="text-sm">👑</span>
              )}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              @{contributor.username}
            </p>
          </div>

          {/* RPG Combat Style Progression System (Circular indicator styled linearly) */}
          <div className="mt-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                LV {contributor.level}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {contributor.xp} / {xpNeeded} XP ({Math.round(xpPercentage)}%)
              </span>
            </div>
            <Progress value={xpPercentage} className="h-1.5 bg-slate-950 border border-slate-800/20" />
          </div>

          {/* Earned Badges Showcase Container */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              🏆 Earned Badges
            </h3>
            
            {!badges ? (
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="w-12 h-12 rounded-lg bg-slate-900/50 animate-pulse border border-slate-800/40" />
                ))}
              </div>
            ) : badges.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-3 rounded-lg border border-dashed border-slate-800/60 text-center">
                No badges unlocked yet
              </div>
            ) : (
              <TooltipProvider>
                <div className="flex flex-wrap gap-3">
                  {badges.slice(0, 5).map((badge: any) => {
                    const rarityColors = {
                      common: "border-slate-700/60 shadow-slate-950",
                      uncommon: "border-green-500/30 shadow-green-950/20",
                      rare: "border-blue-500/30 shadow-blue-950/20",
                      epic: "border-purple-500/30 shadow-purple-950/20",
                      legendary: "border-amber-500/40 shadow-amber-950/30",
                    };
                    const rarityBorder = rarityColors[badge.rarity as keyof typeof rarityColors] || rarityColors.common;

                    return (
                      <Tooltip key={badge._id}>
                        <TooltipTrigger asChild>
                          <div className={`w-12 h-12 rounded-xl bg-slate-900 border ${rarityBorder} p-1.5 flex items-center justify-center cursor-help hover:scale-105 hover:bg-slate-850 shadow-md transition-all`}>
                            <span className="text-2xl select-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                              {badge.icon || "🎖️"}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-950 border border-slate-800 text-slate-200 p-2.5 max-w-xs shadow-2xl rounded-xl">
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span>{badge.name}</span>
                            <Badge variant="outline" className="capitalize text-[8px] px-1 py-0 border-none font-bold bg-slate-900">
                              {badge.rarity}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {badge.description}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            )}
          </div>

          {/* Action Footer Buttons */}
          <div className="mt-8 flex gap-2">
            <Button
              onClick={handleProfileRedirect}
              className={`flex-1 bg-gradient-to-r from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-slate-200 border border-slate-800 hover:border-slate-700/60 font-semibold text-xs tracking-wider gap-1.5 h-10 transition-all rounded-xl`}
            >
              <User className="w-3.5 h-3.5" />
              VIEW PROFILE
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-4 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-slate-100 font-medium text-xs h-10 transition-all rounded-xl"
            >
              DISMISS
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
