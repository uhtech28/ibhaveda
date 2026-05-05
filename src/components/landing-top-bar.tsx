"use client";

import React from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

/**
 * Centered top bar for the public landing page (desktop only).
 *
 * Renders inline at the very top of the page (normal flow) so it scrolls
 * away with the rest of the content. Wording adapts to auth state:
 *   - Signed out: opens Clerk's sign-in modal, redirects to /feed.
 *   - Signed in:  navigates straight to /feed.
 */
export function LandingTopBar() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const linkClass =
    "text-primary font-semibold hover:underline underline-offset-4 transition-colors cursor-pointer";

  return (
    <div className="hidden lg:flex items-center justify-center gap-3 text-lg pt-6 pb-2 w-full">
      <span className="text-muted-foreground">Already have an account?</span>
      {isSignedIn ? (
        <button type="button" onClick={() => router.push("/feed")} className={linkClass}>
          Log in
        </button>
      ) : (
        <SignInButton
          mode="modal"
          forceRedirectUrl="/feed"
          fallbackRedirectUrl="/feed"
        >
          <button type="button" className={linkClass}>
            Log in
          </button>
        </SignInButton>
      )}
    </div>
  );
}

export default LandingTopBar;
