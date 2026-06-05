"use client";

/**
 * Share-to-platform dialog. Pops up a grid of platform tiles, plus a
 * copy-link affordance, and (on mobile) prefers the native Web Share
 * API when available.
 *
 * The dialog is content-agnostic — pass any `ShareablePayload` and
 * the right tiles light up. URLs are encoded server-friendly via the
 * builders in `lib/share`.
 */

import React, { useCallback, useState } from "react";
import { Copy, Mail, Link2 } from "lucide-react";
import { FaXTwitter, FaLinkedinIn, FaWhatsapp, FaFacebookF } from "react-icons/fa6";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildShareUrl, canUseWebShare } from "@/lib/share/builders";
import type { ShareablePayload, SharePlatform } from "@/lib/share/types";
import { PlatformTile } from "./PlatformTile";

interface Props {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  payload: ShareablePayload;
}

export function ShareDialog({ open, onOpenChange, payload }: Props) {
  const [copyConfirmedAt, setCopyConfirmedAt] = useState<number | null>(null);

  const handleOpen = useCallback((platform: SharePlatform) => {
    if (platform === "copy") {
      void doCopyLink(payload, () => setCopyConfirmedAt(Date.now()));
      return;
    }
    if (platform === "native") {
      void doNativeShare(payload);
      onOpenChange(false);
      return;
    }
    const url = buildShareUrl(platform, payload);
    if (!url) return;
    if (platform === "email") {
      window.location.href = url; // mailto: must be same-tab
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [payload, onOpenChange]);

  const hasNativeShare = canUseWebShare();
  const copyJustFired =
    copyConfirmedAt !== null && Date.now() - copyConfirmedAt < 1800;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>
            {payload.title
              ? `Cross-post "${payload.title}" anywhere — no login required.`
              : "Cross-post anywhere — no login required."}
          </DialogDescription>
        </DialogHeader>

        {hasNativeShare && (
          <div className="mb-1">
            <PlatformTile
              label="Share via device"
              icon={<Link2 className="h-5 w-5" />}
              onClick={() => handleOpen("native")}
              accentClassName="hover:border-indigo-400 hover:text-white"
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <PlatformTile
            label="X"
            icon={<FaXTwitter className="h-5 w-5" />}
            onClick={() => handleOpen("twitter")}
            accentClassName="hover:border-white/60 hover:text-white"
          />
          <PlatformTile
            label="LinkedIn"
            icon={<FaLinkedinIn className="h-5 w-5" />}
            onClick={() => handleOpen("linkedin")}
            accentClassName="hover:border-[#0a66c2] hover:text-[#79b8ff]"
          />
          <PlatformTile
            label="WhatsApp"
            icon={<FaWhatsapp className="h-5 w-5" />}
            onClick={() => handleOpen("whatsapp")}
            accentClassName="hover:border-[#25d366] hover:text-[#7eecaa]"
          />
          <PlatformTile
            label="Facebook"
            icon={<FaFacebookF className="h-5 w-5" />}
            onClick={() => handleOpen("facebook")}
            accentClassName="hover:border-[#1877f2] hover:text-[#7eb5ff]"
          />
          <PlatformTile
            label="Email"
            icon={<Mail className="h-5 w-5" />}
            onClick={() => handleOpen("email")}
            accentClassName="hover:border-white/40 hover:text-white"
          />
          <PlatformTile
            label="Copy link"
            icon={<Copy className="h-5 w-5" />}
            onClick={() => handleOpen("copy")}
            subtext={copyJustFired ? "Copied!" : undefined}
            accentClassName="hover:border-emerald-400 hover:text-emerald-300"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Copy + Native share
// ─────────────────────────────────────────────────────────────────────

async function doCopyLink(
  payload: ShareablePayload,
  onConfirmed: () => void,
): Promise<void> {
  const text = payload.url ?? payload.text ?? payload.title ?? "";
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      onConfirmed();
      return;
    }
    // Fallback for browsers without async clipboard — execCommand is
    // deprecated but still works as a final resort.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    onConfirmed();
  } catch (err) {
    console.warn("[share] copy failed:", err);
  }
}

async function doNativeShare(payload: ShareablePayload): Promise<void> {
  if (!canUseWebShare()) return;
  try {
    await navigator.share({
      title: payload.title,
      text: payload.text,
      url: payload.url,
    });
  } catch (err) {
    // User cancelled — silent.
    if ((err as { name?: string }).name !== "AbortError") {
      console.warn("[share] native share failed:", err);
    }
  }
}
