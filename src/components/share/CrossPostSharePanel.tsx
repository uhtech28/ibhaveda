"use client";

// Renders one big button per cross-post platform after the user posts an
// idea. Each click runs in its own user gesture, so browsers don't block
// the 2nd/3rd tab the way they do when window.open is called in a loop.

import React, { useState } from "react";
import {
  Check,
  ExternalLink,
  PartyPopper,
  Copy,
  Instagram,
  Linkedin,
  Facebook,
  Mail,
} from "lucide-react";
import { buildShareUrl, composeText } from "@/lib/share/builders";
import type { SharePlatform, ShareablePayload } from "@/lib/share/types";

interface Props {
  payload: ShareablePayload;
  platforms: SharePlatform[];
  onDone: () => void;
}

// Inline X logo. lucide-react doesn't ship a post-rebrand X mark.
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

const PLATFORM_META: Record<
  SharePlatform,
  {
    label: string;
    icon: React.ReactNode;
    bg: string;
    ring: string;
    hint?: string;
  }
> = {
  twitter: {
    label: "Post on X",
    icon: <XLogo className="h-5 w-5" />,
    bg: "bg-black",
    ring: "ring-white/20",
  },
  linkedin: {
    label: "Post on LinkedIn",
    icon: <Linkedin className="h-5 w-5" fill="currentColor" />,
    bg: "bg-[#0A66C2]",
    ring: "ring-[#0A66C2]/40",
  },
  instagram: {
    label: "Open Instagram",
    icon: <Instagram className="h-5 w-5" />,
    bg: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    ring: "ring-pink-400/40",
    hint: "Caption copied. Paste it into a new post.",
  },
  facebook: {
    label: "Post on Facebook",
    icon: <Facebook className="h-5 w-5" fill="currentColor" />,
    bg: "bg-[#1877F2]",
    ring: "ring-[#1877F2]/40",
  },
  whatsapp: {
    label: "Send on WhatsApp",
    icon: <span className="text-base">💬</span>,
    bg: "bg-emerald-500",
    ring: "ring-emerald-500/40",
  },
  email: {
    label: "Send via email",
    icon: <Mail className="h-5 w-5" />,
    bg: "bg-slate-500",
    ring: "ring-slate-500/40",
  },
  copy: {
    label: "Copy link",
    icon: <Copy className="h-5 w-5" />,
    bg: "bg-white/10",
    ring: "ring-white/10",
  },
  native: {
    label: "Share",
    icon: <ExternalLink className="h-5 w-5" />,
    bg: "bg-white/10",
    ring: "ring-white/10",
  },
};

export function CrossPostSharePanel({ payload, platforms, onDone }: Props) {
  const [opened, setOpened] = useState<Set<SharePlatform>>(new Set());
  const [linkCopied, setLinkCopied] = useState(false);

  const markOpened = (p: SharePlatform) => {
    setOpened((prev) => {
      const next = new Set(prev);
      next.add(p);
      return next;
    });
  };

  const handleClick = (platform: SharePlatform) => {
    if (platform === "instagram") {
      // Instagram has no web composer; copy the caption so the user can
      // paste it after the tab opens.
      const caption = composeText(payload, "instagram", { includeUrl: true });
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(caption).catch(() => {});
      }
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      markOpened(platform);
      return;
    }

    const url = buildShareUrl(platform, payload);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    markOpened(platform);
  };

  const copyLink = () => {
    if (!payload.url || !navigator.clipboard?.writeText) return;
    void navigator.clipboard.writeText(payload.url).catch(() => {});
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-[0_10px_30px_rgba(52,211,153,0.3)]">
          <PartyPopper className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white">Your idea is live</h3>
        <p className="mt-1 text-xs text-white/60">
          Tap each platform to open its composer in a new tab.
        </p>
      </div>

      <div className="space-y-2">
        {platforms.map((p) => {
          const meta = PLATFORM_META[p];
          const isOpened = opened.has(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => handleClick(p)}
              className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 transition ${
                isOpened
                  ? "bg-white/[0.04] ring-emerald-400/40"
                  : `${meta.bg} text-white ${meta.ring} hover:brightness-110`
              }`}
            >
              <span
                className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg text-base font-bold text-white ${
                  isOpened ? "bg-emerald-500/15 text-emerald-300" : "bg-black/20"
                }`}
              >
                {isOpened ? <Check className="h-5 w-5" /> : meta.icon}
              </span>
              <span className="flex-1">
                <span
                  className={`block text-sm font-semibold ${
                    isOpened ? "text-emerald-300" : "text-white"
                  }`}
                >
                  {isOpened ? `Opened: ${meta.label}` : meta.label}
                </span>
                {meta.hint && !isOpened && (
                  <span className="mt-0.5 block text-[11px] text-white/80">
                    {meta.hint}
                  </span>
                )}
                {isOpened && (
                  <span className="mt-0.5 block text-[11px] text-emerald-200/80">
                    Tap again to reopen.
                  </span>
                )}
              </span>
              <ExternalLink
                className={`h-4 w-4 flex-shrink-0 ${
                  isOpened ? "text-emerald-300" : "text-white/70"
                }`}
              />
            </button>
          );
        })}
      </div>

      {payload.url && (
        <button
          type="button"
          onClick={copyLink}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/70 transition hover:text-white"
        >
          {linkCopied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-300" />
              Link copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy link
            </>
          )}
        </button>
      )}

      <button
        type="button"
        onClick={onDone}
        className="mt-1 h-11 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-bold uppercase tracking-wide text-[#0A0E1A] transition hover:brightness-110"
      >
        Go to my world map
      </button>
    </div>
  );
}
