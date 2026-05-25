"use client";

import React from "react";
import { AchievementUnlockModal } from "../badges/AchievementUnlockModal";
import type { BadgeItem } from "../badges/BadgeCard";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeItem["rarity"];
  category?: string;
  shape?: string;
  isProfileStyle?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  tagline?: string;
  awardedAt?: number;
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
              rarity: badge.rarity,
              category:
                badge.category ??
                (badge.isProfileStyle ? "idea_milestones" : "venture"),
              shape: badge.shape,
              primaryColor: badge.primaryColor,
              secondaryColor: badge.secondaryColor,
              tagline: badge.tagline || badge.description,
              requirement: badge.description,
              awardedAt: badge.awardedAt,
            }
          : null
      }
      reason={badge?.tagline || badge?.description}
      xpEarned={20}
      onClose={handleClose}
    />
  );
}
