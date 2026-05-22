"use client";

import React from "react";
import { Briefcase, GraduationCap, Palette, FlaskConical, Lock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { displayFontClass, transitionBase } from "@/components/ideaforge/shared";

const categories = [
  {
    id: "venture",
    label: "Venture",
    icon: Briefcase,
    description: "Business ideas and startups",
    color: "from-blue-500 to-indigo-600",
    accent: "text-blue-400 border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50",
    unlocked: true,
    unlockRequirement: null,
  },
  {
    id: "academic",
    label: "Academic",
    icon: GraduationCap,
    description: "Research and educational projects",
    color: "from-purple-500 to-pink-600",
    accent: "text-purple-400 border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/50",
    unlocked: false,
    unlockRequirement: "Complete 5 Venture ideas",
  },
  {
    id: "creative",
    label: "Creative",
    icon: Palette,
    description: "Art, design, and creative works",
    color: "from-orange-500 to-red-600",
    accent: "text-orange-400 border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/50",
    unlocked: false,
    unlockRequirement: "Complete 10 Venture ideas",
  },
  {
    id: "lab",
    label: "Lab",
    icon: FlaskConical,
    description: "Experiments and prototypes",
    color: "from-green-500 to-teal-600",
    accent: "text-green-400 border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50",
    unlocked: false,
    unlockRequirement: "Complete 15 Venture ideas",
  },
];

export function CategorySelectorModal({
  open,
  onOpenChange,
  onSelectCategory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCategory: (category: string) => void;
}) {
  const handleCategoryClick = (category: typeof categories[0]) => {
    if (!category.unlocked) {
      return;
    }
    onSelectCategory(category.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100%-1.5rem,540px)] max-w-[540px] gap-0 overflow-hidden rounded-[16px] border border-white/10 bg-[#0F1726] p-0 text-[#F9FAFB] shadow-[0_16px_48px_rgba(3,7,18,0.65)]">
        <DialogHeader className="border-b border-white/8 px-5 py-4 text-center">
          <DialogTitle className={cn(displayFontClass, "text-[1.3rem] font-bold tracking-tight")}>
            Choose Your Venture Path
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-xs text-[#9CA3AF]">
            Start with Venture and unlock new categories as you progress
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 p-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const isLocked = !category.unlocked;
            
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryClick(category)}
                disabled={isLocked}
                className={cn(
                  transitionBase,
                  "group relative flex flex-col items-center justify-center gap-2.5 rounded-[14px] border p-5 text-center",
                  isLocked
                    ? "cursor-not-allowed border-white/5 bg-white/[0.01] opacity-60"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                )}
              >
                {isLocked && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#1F2937] border border-white/10">
                    <Lock className="h-3 w-3 text-[#6B7280]" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-lg border backdrop-blur-sm transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.2)]",
                    isLocked
                      ? "border-white/5 bg-white/5 text-gray-500"
                      : cn("group-hover:scale-105", category.accent)
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                
                <div>
                  <h3 className={cn(displayFontClass, "text-base font-bold text-white")}>
                    {category.label}
                  </h3>
                  <p className="mt-1 text-[10px] leading-relaxed text-[#9CA3AF]">
                    {category.description}
                  </p>
                  
                  {isLocked && category.unlockRequirement && (
                    <div className="mt-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1">
                      <p className="text-[9px] font-medium text-amber-300">
                        🔒 {category.unlockRequirement}
                      </p>
                    </div>
                  )}
                  
                  {!isLocked && (
                    <div className="mt-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">
                      <p className="text-[9px] font-medium text-emerald-300">
                        ✓ Available
                      </p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="border-t border-white/8 bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
            <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#6366F1]/20">
              <Briefcase className="h-3 w-3 text-[#6366F1]" />
            </div>
            <p>
              <span className="font-semibold text-white">Pro Tip:</span> Complete Venture ideas to unlock other categories
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
