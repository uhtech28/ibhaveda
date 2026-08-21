"use client";

/**
 * @file ClientOnlyOverlays.tsx
 * @description Client wrapper that dynamically loads ChatWidget + Toaster
 *   with `ssr: false`. Next 15 disallows `ssr: false` in Server Components
 *   (which the root layout is), so we hoist these two into this Client
 *   Component. The rest of the layout tree stays server-rendered.
 *
 *   Both components render nothing above the fold and — critically — don't
 *   render at all on the marketing landing for signed-out visitors. They
 *   ship in their own chunk which mobile only fetches once the main thread
 *   is idle, keeping landing TBT low on Moto G4-class CPUs.
 */

import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), {
  ssr: false,
  loading: () => null,
});

const Toaster = dynamic(
  () => import("@/components/ui/toaster").then((m) => m.Toaster),
  { ssr: false, loading: () => null },
);

export function ClientOnlyOverlays() {
  return (
    <>
      <ChatWidget />
      <Toaster />
    </>
  );
}
