"use client";

/**
 * @file AppShell.tsx
 * @description The "signed-in / interactive-app" provider stack. Contains
 *   every provider that the marketing landing page does NOT need — Convex
 *   socket, analytics, Clarity, tutorial machinery, chat, mobile bottom
 *   nav, and the client-only overlays (ChatWidget + Toaster).
 *
 *   This file is dynamically imported (ssr: false) from
 *   `ConditionalAppShell`, which decides at runtime whether to mount it
 *   based on the current pathname. On the marketing landing (`/`), NONE
 *   of this JS is downloaded, parsed, or executed. On every other route
 *   the chunk streams in on demand.
 *
 *   Why not a proper `(app)` route group with its own layout? Because
 *   that would require physically moving ~30 route directories into
 *   `src/app/(app)/` — a mechanical move that risks breaking tests /
 *   imports / build-time analysis on Windows. This lazy-mount pattern
 *   achieves the same JS-shipping win without touching any route file.
 */

import { ConvexClientProvider } from "@/lib/convex/providers";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { ClarityScript } from "@/components/analytics/ClarityScript";
import { TutorialProvider } from "@/components/tutorial/v2/TutorialProvider";
import { ChatProvider } from "@/components/chat/ChatContext";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ClientOnlyOverlays } from "@/components/layout/ClientOnlyOverlays";
import { useMobileVisualViewport } from "@/lib/hooks/use-mobile-visual-viewport";

export default function AppShell({ children }: { children: React.ReactNode }) {
  // Publish the visual-viewport CSS variables for EVERY signed-in route.
  //
  // These drive the mobile dialog rules in globals.css -- --app-vv-center-x/y,
  // --app-vv-width/height and the per-dialog height caps. They were being set
  // by three individual pages (/feed, /idea/[id], /my-feed), so on every other
  // route the variables were simply absent and the CSS fell back to 50vw /
  // 50dvh / 100vw: the LAYOUT viewport.
  //
  // The flare composer opens on /map/world, which was not one of those three.
  // So on iOS, once Safari shifts the visible window to clear the keyboard,
  // the dialog was positioned against a centre the user could not see and
  // rendered half off the left edge -- the reported bug. Same for the map's
  // other dialogs.
  //
  // AppShell wraps every route except the marketing landing (which has no
  // dialogs), so this is the correct level: one subscription, always present,
  // instead of a list of pages that has to be remembered.
  useMobileVisualViewport();

  return (
    <ConvexClientProvider>
      <AnalyticsProvider>
        <ClarityScript />
        <TutorialProvider>
          <ChatProvider>
            {children}
            <MobileBottomNav />
            <ClientOnlyOverlays />
          </ChatProvider>
        </TutorialProvider>
      </AnalyticsProvider>
    </ConvexClientProvider>
  );
}
