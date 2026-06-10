"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type MobilePopupProps = {
  children: React.ReactNode;
  className?: string;
  onClose: () => void;
};

export function MobilePopup({ children, className, onClose }: MobilePopupProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/55 backdrop-blur-sm"
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed left-1/2 top-[var(--app-vv-center-y,50dvh)] z-[10000] w-[calc(100vw-1.5rem)] max-w-[31rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-[0_24px_80px_rgba(3,7,18,0.65)]",
          className,
        )}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
