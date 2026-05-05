/**
 * useFeatureFlag Hook
 *
 * Provides client-side feature flag checking for React components.
 * Integrates with Convex backend feature flag system.
 */

"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

/**
 * Feature flag names from backend
 */
export type FeatureFlag =
  | "phaser_world_map"
  | "ai_scoring_basic"
  | "ai_scoring_pro"
  | "ai_valuation"
  | "gold_checkpoints"
  | "legendary_badges"
  | "social_feed_posts"
  | "boss_encounters"
  | "tool_unlock_levels"
  | "phase_unlock_animations";

/**
 * Check if a feature is enabled for the current user
 *
 * @param flag - Feature flag name to check
 * @returns boolean | undefined - true if enabled, false if disabled, undefined while loading
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isEnabled = useFeatureFlag('phaser_world_map');
 *
 *   if (isEnabled === undefined) return <Loading />;
 *   if (!isEnabled) return <FeatureDisabled />;
 *
 *   return <Component />;
 * }
 * ```
 */
export function useFeatureFlag(flag: FeatureFlag): boolean | undefined {
  const result = useQuery(api.aiScoring.isFeatureEnabled, { flag });
  return result;
}

/**
 * Check multiple feature flags at once
 *
 * @param flags - Array of feature flag names
 * @returns Record<FeatureFlag, boolean | undefined>
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const flags = useFeatureFlags(['ai_scoring_basic', 'ai_scoring_pro']);
 *
 *   if (flags.ai_scoring_pro) {
 *     return <ProAIScoring />;
 *   }
 *
 *   if (flags.ai_scoring_basic) {
 *     return <BasicAIScoring />;
 *   }
 *
 *   return <NoAI />;
 * }
 * ```
 */
export function useFeatureFlags(
  flags: FeatureFlag[]
): Record<FeatureFlag, boolean | undefined> {
  const results = flags.reduce((acc, flag) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    acc[flag] = useQuery(api.aiScoring.isFeatureEnabled, { flag });
    return acc;
  }, {} as Record<FeatureFlag, boolean | undefined>);

  return results;
}

/**
 * Higher-order component for feature flag gating
 *
 * @param flag - Feature flag to check
 * @param FallbackComponent - Component to show when feature is disabled (optional)
 *
 * @example
 * ```tsx
 * const GatedMap = withFeatureFlag('phaser_world_map', <MapDisabled />)(WorldMap);
 * ```
 */
export function withFeatureFlag<P extends object>(
  flag: FeatureFlag,
  FallbackComponent?: React.ComponentType | React.ReactElement
) {
  return function (Component: React.ComponentType<P>) {
    return function FeatureFlagGatedComponent(props: P) {
      const isEnabled = useFeatureFlag(flag);

      if (isEnabled === undefined) {
        // Loading state
        return (
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-zinc-500">Loading...</div>
          </div>
        );
      }

      if (!isEnabled) {
        if (FallbackComponent) {
          if (typeof FallbackComponent === "function") {
            return <FallbackComponent />;
          }
          return FallbackComponent;
        }
        return null;
      }

      return <Component {...props} />;
    };
  };
}
