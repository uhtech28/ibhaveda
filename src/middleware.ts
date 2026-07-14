// NUCLEAR PASS-THROUGH MIDDLEWARE
// Something in the Clerk/Convex-guarded version was still crashing at
// request time on Vercel Edge despite our try/catch guards. For the
// client demo we need the site to LOAD -- auth-gated features become
// no-ops, but every page renders.
//
// Restore Clerk + Convex logic later once the deploy pipeline is stable.

import { NextResponse } from "next/server";

export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ico|ttf|woff2?|csv|docx?|xlsx?|zip|webmanifest|vcf)).*)",
    "/(api|trpc)(.*)",
  ],
};
