"use client";

// Cross-post destination selector (PRD §7). The parent fires
// `fireCrossPosts(selected, payload)` on submit.

import React from "react";
import { Check } from "lucide-react";
import type { SharePlatform } from "@/lib/share/types";

const PLATFORMS: ReadonlyArray<{
  id: SharePlatform;
  label: string;
  icon: string;
  accent: string;
}> = [
  { id: "twitter",   label: "X",         icon: "𝕏",  accent: "text-white" },
  { id: "linkedin",  label: "LinkedIn",  icon: "in", accent: "text-sky-300" },
  { id: "instagram", label: "Instagram", icon: "📷", accent: "text-pink-300" },
];

interface Props {
  selected: Set<SharePlatform>;
  onChange: (next: Set<SharePlatform>) => void;
}

export function CrossPostSelector({ selected, onChange }: Props) {
  const toggle = (id: SharePlatform) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] font-semibold text-[#F9FAFB] uppercase tracking-wider">
          Also post to
        </span>
        <span className="text-[10px] font-normal lowercase text-[#6B7280]">
          (deselect any you don't want)
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => {
          const isSelected = selected.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              aria-pressed={isSelected}
              className={`group inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? "border-[#6366F1]/60 bg-[#6366F1]/15 text-white"
                  : "border-white/10 bg-[#0D1117] text-[#9CA3AF] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-md font-mono text-[11px] ${
                  isSelected ? "bg-[#6366F1]/30 text-white" : `bg-white/[0.04] ${p.accent}`
                }`}
              >
                {p.icon}
              </span>
              <span>{p.label}</span>
              {isSelected && <Check className="h-3 w-3 text-emerald-300" />}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-[#6B7280] leading-snug">
        You'll be sent to each platform's composer to confirm before posting —
        nothing goes out automatically. Instagram has no web composer, so we
        copy the caption to your clipboard for you to paste into a new post.
      </p>
    </div>
  );
}
