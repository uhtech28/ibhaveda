"use client";

import React from "react";
import { AchievementUnlockModal } from "../badges/AchievementUnlockModal";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "hidden";
  shape?: string;
  isProfileStyle?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  tagline?: string;
}

interface BadgeAwardSequenceProps {
  isVisible: boolean;
  badge: Badge | null;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function BadgeAwardSequence({
  isVisible,
  badge,
  onComplete,
  onSkip,
}: BadgeAwardSequenceProps) {
  const handleClose = () => {
    if (onComplete) {
      onComplete();
    } else if (onSkip) {
      onSkip();
    }
  };

  return (
    <AchievementUnlockModal
      isOpen={isVisible}
      badge={
        badge
          ? {
              id: badge.id,
              name: badge.name,
              description: badge.description,
              icon: badge.icon,
              rarity: badge.rarity as any,
              category: "venture",
              tagline: badge.tagline || badge.description,
              requirement: badge.description,
            }
          : null
      }
      reason={badge?.tagline || badge?.description}
      xpEarned={500}
      onClose={handleClose}
    />
  );
}
