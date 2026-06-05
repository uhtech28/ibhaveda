"use client";

/**
 * ResponsivePopup — one popup primitive that renders as a centered modal
 * on `sm:` and up, and as a bottom sheet on mobile. Built on Radix so
 * focus-trap + ESC-to-close + click-outside-to-close work out of the box.
 *
 * Mobile (< 640px): full-width sheet anchored to the bottom edge,
 * rounded top corners, slides up from below.
 * Desktop (≥ 640px): centered card, fades in.
 *
 * Used by SparkersDialog and ContributorsDialog (PRD §8 AC5).
 */

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}

export function ResponsivePopup({
  open,
  onOpenChange,
  title,
  description,
  children,
  contentClassName,
}: Props) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            // base — always
            "fixed z-[10000] border border-white/10 bg-[#111827] shadow-2xl",
            "focus:outline-none",
            // mobile: bottom-sheet
            "inset-x-0 bottom-0 left-0 right-0 max-h-[85vh] w-full",
            "rounded-t-2xl rounded-b-none p-4 pt-3",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
            // desktop (sm+): centered modal
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:right-auto sm:bottom-auto",
            "sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:rounded-2xl sm:p-6",
            "sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0",
            "sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95",
            contentClassName,
          )}
        >
          {/* Mobile drag handle (cosmetic — not functional) */}
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-base font-semibold text-white sm:text-lg">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-1 text-xs text-white/55 sm:text-sm">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className="shrink-0 rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <XIcon className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="mt-3">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
