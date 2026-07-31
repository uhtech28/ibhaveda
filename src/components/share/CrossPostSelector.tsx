"use client";

/**
 * @file CrossPostSelector.tsx
 * @description Compact single-checkbox toggle for cross-posting (a.k.a.
 *  "Double Posting"). Renders one small pill in the idea composer.
 *
 * Historical note: prior versions rendered 4 large per-platform cards
 * (X / LinkedIn / Instagram / Facebook) inside the composer. That was
 * pushed into Settings — the composer only decides whether to cross-post
 * this idea at all; which platforms get it comes from stored preferences.
 *
 * Backwards-compat: the `selected` + `onChange` props are kept so the
 * caller (IdeaWizard) doesn't need to change its state model. When the
 * checkbox is checked, we emit ALL platforms the user has enabled in
 * Settings; when unchecked, we emit an empty set.
 */

import React, { useEffect } from "react";
import { Check, Settings2 } from "lucide-react";
import type { SharePlatform } from "@/lib/share/types";
import { useCrossPostPreferences } from "@/lib/share/useCrossPostPreferences";

interface Props {
  selected: Set<SharePlatform>;
  onChange: (next: Set<SharePlatform>) => void;
  /** Optional callback to open the Settings dialog. */
  onOpenSettings?: () => void;
}

export function CrossPostSelector({
  selected,
  onChange,
  onOpenSettings,
}: Props) {
  const { prefs, hydrated, setEnabled, activePlatforms } =
    useCrossPostPreferences();

  // Whenever settings-driven active platforms change (or the toggle
  // flips), reflect that in the composer's `selected` state so the
  // downstream post pipeline sees the correct target list.
  useEffect(() => {
    if (!hydrated) return;
    const target = new Set<SharePlatform>(activePlatforms);
    // Bail out if unchanged to avoid a render loop.
    if (
      selected.size === target.size &&
      Array.from(selected).every((p) => target.has(p))
    ) {
      return;
    }
    onChange(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, prefs.enabled, prefs.platforms.twitter, prefs.platforms.linkedin, prefs.platforms.instagram, prefs.platforms.facebook]);

  const activeCount = activePlatforms.size;
  const checkboxOn = prefs.enabled;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0D1117] px-3 py-2">
      <label className="flex cursor-pointer items-center gap-2 select-none">
        <input
          type="checkbox"
          checked={checkboxOn}
          onChange={(e) => setEnabled(e.target.checked)}
          className="peer sr-only"
        />
        {/* Custom checkbox visual */}
        <span
          className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition-all ${
            checkboxOn
              ? "border-[#6366F1] bg-[#6366F1]/80"
              : "border-white/25 bg-transparent hover:border-white/40"
          }`}
          aria-hidden="true"
        >
          {checkboxOn && (
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          )}
        </span>
        <span className="text-xs font-medium text-[#F9FAFB]">
          Also post to social platforms
        </span>
        {checkboxOn && activeCount > 0 && (
          <span className="text-[10px] font-normal text-[#6B7280]">
            ({activeCount} enabled)
          </span>
        )}
      </label>
      {onOpenSettings && (
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] transition hover:text-white"
          title="Change which platforms to post to"
        >
          <Settings2 className="h-3 w-3" />
          Settings
        </button>
      )}
    </div>
  );
}
