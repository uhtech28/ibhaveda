"use client";

/**
 * Single platform tile inside the ShareDialog. Renders an icon + label
 * and handles the platform-specific click action — open URL, invoke
 * native share, or copy to clipboard.
 *
 * The icon for each platform comes from `react-icons` (already in
 * `package.json`). The tile itself is a button so the whole hit area
 * is one accessible target.
 */

import React from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  icon: React.ReactNode | LucideIcon;
  onClick: () => void;
  /** Accent colour for hover; matches the platform's brand. */
  accentClassName?: string;
  /** Optional second-line subtext, e.g. "Copied!" after copy action. */
  subtext?: string;
  disabled?: boolean;
}

export function PlatformTile({
  label,
  icon,
  onClick,
  accentClassName = "hover:border-white/40 hover:text-white",
  subtext,
  disabled,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-4 text-xs text-white/70 transition disabled:cursor-default disabled:opacity-50 ${accentClassName}`}
    >
      <div className="flex h-7 w-7 items-center justify-center">
        {typeof icon === "function"
          ? React.createElement(icon as LucideIcon, { className: "h-5 w-5" })
          : icon}
      </div>
      <span className="font-medium">{label}</span>
      {subtext && (
        <span className="text-[10px] text-emerald-300">{subtext}</span>
      )}
    </button>
  );
}
