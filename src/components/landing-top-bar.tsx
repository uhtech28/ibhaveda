"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { useAuthModal } from "@/components/auth/auth-modal";
import Link from "next/link";

export function LandingTopBar() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useAuthModal();
  const router = useRouter();

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-4 px-5 py-3 border-b border-white/[0.07] bg-[#070A0F]/80 backdrop-blur-md">
      <Link href="/" aria-label="Ibhaveda home">
        <Logo />
      </Link>

      <div className="flex items-center gap-3">
        {isSignedIn ? (
          <button
            type="button"
            onClick={() => router.push("/feed")}
            className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-xs font-semibold text-slate-200 backdrop-blur transition hover:border-white/20 hover:text-white"
          >
            Go to Feed
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openSignIn()}
            className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-xs font-semibold text-slate-200 backdrop-blur transition hover:border-white/20 hover:text-white"
          >
            Log in
          </button>
        )}
      </div>
    </header>
  );
}

export default LandingTopBar;
