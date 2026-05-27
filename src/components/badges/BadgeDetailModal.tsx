"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Lock, CheckCircle2, ShieldCheck, Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getNormalizedRarity, getVentureBadgeEmoji, BadgeItem } from "./BadgeCard";
import { cn } from "@/lib/utils";
import { PremiumIcon } from "@/components/ui/PremiumIcon";

interface BadgeDetailModalProps {
  badge: BadgeItem | null;
  isOpen: boolean;
  onClose: () => void;
  isOwner?: boolean;
  isEquipped?: boolean;
  canEquipMore?: boolean;
  onEquipToggle?: () => void;
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  badge,
  isOpen,
  onClose,
  isOwner = false,
  isEquipped = false,
  canEquipMore = true,
  onEquipToggle
}) => {
  if (!badge) return null;

  const isLocked = !badge.awardedAt;
  const norm = getNormalizedRarity(badge.rarity);
  const emoji = badge.icon || getVentureBadgeEmoji(badge.id, badge.name);
  const accentColor = badge.secondaryColor || norm.accentColor;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-950/95 border-white/10 backdrop-blur-xl text-white rounded-3xl overflow-hidden p-0 shadow-2xl">
        <DialogTitle className="sr-only">{badge.name} Details</DialogTitle>
        
        {/* Detail Header with Close Button */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Backdrop Glow */}
        <div className="absolute top-0 inset-x-0 h-48 overflow-hidden pointer-events-none z-0">
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[60px] opacity-25"
            style={{
              background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`
            }}
          />
          {/* Subtle grid lines background overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,_transparent_1px)] [background-size:16px_16px] opacity-40" />
        </div>

        {/* Content Container */}
        <div className="relative p-6 pt-10 flex flex-col items-center text-center z-10">
          
          {/* Badge Icon Display */}
          <div className="relative w-32 h-32 flex items-center justify-center mb-6">
            {/* Outer decorative spinning ring */}
            {!isLocked && (norm.key === "legendary" || norm.key === "mythic") && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                className="absolute inset-0 rounded-[28px] border border-dashed opacity-25"
                style={{ borderColor: accentColor }}
              />
            )}

            {/* Glowing outline badge container */}
            <div
              className={cn(
                "relative w-24 h-24 rounded-2xl border flex items-center justify-center p-4 bg-slate-950/80 shadow-lg",
                isLocked ? "border-slate-800/80 grayscale opacity-40" : "border-white/10",
                !isLocked && norm.glowClass
              )}
              style={{
                borderColor: !isLocked ? `${accentColor}40` : undefined
              }}
            >
              <span className={cn("text-5xl select-none filter drop-shadow-md flex items-center justify-center text-white", isLocked && "opacity-30")}>
                {isLocked ? "❓" : <PremiumIcon name={emoji} className="w-12 h-12" strokeWidth={1.5} />}
              </span>
            </div>
            
            {/* Locked Lock Badge Overlay */}
            {isLocked && (
              <div className="absolute bottom-2 right-2 bg-slate-900 border border-slate-700/60 p-2 rounded-full shadow-md">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
            )}

            {/* Equipped Icon Check */}
            {!isLocked && isEquipped && (
              <div className="absolute bottom-2 right-2 bg-yellow-500 text-slate-950 p-1.5 rounded-full shadow-md ring-2 ring-slate-950">
                <Star className="w-3.5 h-3.5 fill-slate-950 stroke-[3]" />
              </div>
            )}
          </div>

          {/* Rarity Tag */}
          <span
            className={cn(
              "text-[10px] font-extrabold tracking-widest uppercase rounded-full px-3.5 py-0.5 border mb-3 shadow-inner",
              isLocked
                ? "text-slate-500 bg-slate-900/40 border-slate-800"
                : norm.pillClass
            )}
          >
            {isLocked ? "Locked Achievement" : norm.label}
          </span>

          {/* Badge Name */}
          <h3 className="text-2xl font-black tracking-tight mb-2 leading-tight">
            {badge.name}
          </h3>

          {/* Tagline / Lore */}
          <p className="text-slate-300 text-sm max-w-sm italic mb-4 px-2">
            "{badge.tagline || badge.description}"
          </p>

          {/* Details / Unlock Requirements List */}
          <div className="w-full bg-slate-900/65 border border-white/5 rounded-2xl p-4 text-left space-y-3 mb-6">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Category
                </span>
                <span className="text-xs font-semibold text-slate-200 capitalize block">
                  {badge.category.replace("_", " ")}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Progression Reward
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400">
                  <Award className="w-3.5 h-3.5" />
                  +{norm.prestigeBonus} Score
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                Requirement to Unlock
              </span>
              <p className="text-xs font-medium text-slate-300 leading-relaxed">
                {badge.requirement || "Achieve specific milestones to unlock this badge."}
              </p>
            </div>

            {/* Unlocked Date / Earned Stats */}
            {!isLocked && badge.awardedAt && (
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Unlocked On
                </span>
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(badge.awardedAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isOwner && !isLocked && onEquipToggle ? (
            <div className="w-full pt-1 flex flex-col gap-2">
              <Button
                onClick={() => {
                  if (!isEquipped && !canEquipMore) return; // Prevent equip if max reached
                  onEquipToggle();
                  onClose();
                }}
                disabled={!isEquipped && !canEquipMore}
                className={cn(
                  "w-full py-5 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-sm",
                  isEquipped
                    ? "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white"
                    : "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] disabled:opacity-40 disabled:hover:shadow-none disabled:-translate-y-0"
                )}
              >
                {isEquipped ? "Unequip from Showcase" : "Equip on Profile Showcase"}
              </Button>
              {!isEquipped && !canEquipMore && (
                <p className="text-[10.5px] text-yellow-500/80 font-medium">
                  Showcase full. Unequip a badge first to equip this one (Max 3).
                </p>
              )}
            </div>
          ) : isLocked ? (
            <div className="text-slate-500 text-xs font-semibold flex items-center gap-1.5 py-2">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              Locked. Complete the requirement to unlock!
            </div>
          ) : (
            <div className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 py-2 bg-emerald-500/5 px-4 rounded-full border border-emerald-500/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Unlocked!
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
