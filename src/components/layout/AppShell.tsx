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

export default function AppShell({ children }: { children: React.ReactNode }) {
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
