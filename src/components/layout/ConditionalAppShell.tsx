"use client";

/**
 * @file ConditionalAppShell.tsx
 * @description Routes the render tree between two paths at runtime:
 *
 *   - On the marketing landing page (`pathname === "/"`), children render
 *     directly with NO provider stack around them. The AppShell chunk is
 *     never imported, parsed, or executed. Signed-out visitors on 3G
 *     save the entire cost of ConvexClientProvider + AnalyticsProvider +
 *     ClarityScript + TutorialProvider + ChatProvider + MobileBottomNav
 *     + ClientOnlyOverlays. On desktop this also removes the JS parse
 *     + hydration cost that was pushing TBT up between round-1 runs.
 *
 *   - On every other route, we dynamic-import AppShell (ssr:false, no
 *     loading skeleton). The chunk downloads once, then providers mount
 *     and children render inside them. Because ConvexClientProvider is
 *     itself a Client Component, none of this was ever SSR'd — the
 *     initial HTML is identical to what we shipped before, only the
 *     hydration work is deferred until after the shell chunk arrives.
 *
 *   Landing page still gets ClerkProvider + ThemeProvider + AuthModal
 *   from the root layout, which is enough for the hero's sign-in
 *   modal + role-picker interactions.
 */

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// ssr:true (default) is CRITICAL — non-landing pages (feed, community,
// map, etc.) rely on being rendered INSIDE ConvexClientProvider during
// SSR + hydration. If we set ssr:false, AppShell renders as null on the
// server and children mount outside Convex context — every useQuery
// call would throw "No Convex client in tree". Chunk-splitting still
// happens: the AppShell chunk is only added to the initial script list
// when the tree actually renders it (i.e. on non-`/` routes), so the
// landing bundle stays free of it.
const AppShell = dynamic(() => import("./AppShell"), {
  loading: () => null,
});

export function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Marketing landing is the ONLY route that skips the app shell today.
  // Add other public/marketing routes here (e.g. "/about") if any are
  // added in the future and can also render without Convex + tutorial.
  if (pathname === "/") {
    return <>{children}</>;
  }
  return <AppShell>{children}</AppShell>;
}
