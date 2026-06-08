"use client";

// Chips for choosing which external platforms to cross-post to. The
// share panel renders one button per selected platform after the user
// hits Post.

import React from "react";
import { Check, Instagram, Linkedin, Facebook } from "lucide-react";
import type { SharePlatform } from "@/lib/share/types";

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.91l-5.42-7.09L4.27 22H1l8.02-9.17L1.5 2h7.09l4.9 6.49L18.24 2Zm-1.21 18h1.91L7.06 4H5.07l11.96 16Z" />
    </svg>
  );
}

const PLATFORMS: ReadonlyArray<{
  id: SharePlatform;
  label: string;
  icon: React.ReactNode;
  accent: string;
}> = [
  {
    id: "twitter",
    label: "X",
    icon: <XLogo className="h-3.5 w-3.5" />,
    accent: "text-white",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: <Linkedin className="h-3.5 w-3.5" fill="currentColor" />,
    accent: "text-sky-300",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: <Instagram className="h-3.5 w-3.5" />,
    accent: "text-pink-300",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: <Facebook className="h-3.5 w-3.5" fill="currentColor" />,
    accent: "text-blue-300",
  },
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
                className={`grid h-5 w-5 place-items-center rounded-md ${
                  isSelected
                    ? "bg-[#6366F1]/30 text-white"
                    : `bg-white/[0.04] ${p.accent}`
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
        After you post, you'll see one button per platform — tap each to open
        its composer. Instagram has no web composer, so we copy the caption to
        your clipboard for you to paste into a new post.
      </p>
    </div>
  );
}
