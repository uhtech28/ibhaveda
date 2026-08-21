import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Sora } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import dynamic from "next/dynamic";

// PERF: `export const dynamic = 'force-dynamic'` used to live here. It forced
// EVERY route (including the marketing landing page) to be rendered per-request
// with no caching, defeating Next 15's default static/ISR behavior and adding
// full server RTT to every navigation. Removed 2026-08-21. Individual routes
// that genuinely need per-request rendering must opt in themselves.
import { ThemeProvider } from '@/components/theme-provider';
import { ConvexClientProvider } from '@/lib/convex/providers';
import { ChatProvider } from "@/components/chat/ChatContext";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { AuthModalProvider } from "@/components/auth/auth-modal";
import { TutorialProvider } from "@/components/tutorial/v2/TutorialProvider";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { ClarityScript } from "@/components/analytics/ClarityScript";
import "./globals.css";

// MOBILE PERF: These components never render above the fold and — critically —
// they never render at all on the landing page for signed-out visitors.
// Ship them via next/dynamic so their JS lands in a separate chunk that mobile
// only downloads after the main thread is idle (or once auth resolves and the
// widget/toast actually mounts). Keeps landing TBT down on Moto G4-class CPUs.
// `ssr: false` avoids paying the hydration cost on first paint.
const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), {
  ssr: false,
  loading: () => null,
});
const Toaster = dynamic(
  () => import("@/components/ui/toaster").then((m) => m.Toaster),
  { ssr: false, loading: () => null },
);

// PERF: `display: 'swap'` swaps in the web font as soon as it downloads instead
// of blocking text rendering (default is 'auto' == 'block' for ~3s). Prevents
// FOIT (Flash of Invisible Text) and improves LCP by up to a full second on
// slow connections. `preload: false` on the mono font stops us shipping a
// preload <link> for a font used only in code blocks on a couple of pages.
const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

// metadataBase makes openGraph/twitter image URLs absolute, which Insta /
// LinkedIn / X / Slack require to actually render the preview image.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ibhaveda.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: "Ibhaveda - Share & Cultivate Brilliant Ideas",

  description:
    "Connect with like-minded creators, share your brilliant ideas, get valuable feedback, and collaborate on groundbreaking projects in our innovative community.",

  keywords:
    "ideas, innovation, collaboration, creativity, community, startup, prototyping",

icons: {
  icon: [
    { url: "/favicon.ico" },
    { url: "/icon.png", type: "image/png", sizes: "32x32" },
    { url: "/icon.png", type: "image/png", sizes: "192x192" },
    { url: "/icon.png", type: "image/png", sizes: "512x512" },
  ],
  shortcut: "/favicon.ico",
  apple: [
    {
      url: "/apple-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
  ],
  other: [{ rel: "mask-icon", url: "/icon.png", color: "#6366F1" }],
},

  openGraph: {
    title: "Ibhaveda - Where Brilliant Ideas Come to Life",

    description:
      "Join thousands of creators sharing ideas, finding collaborators, and building the future together.",

    type: "website",

    url: siteUrl,

    siteName: "Ibhaveda",

    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Ibhaveda",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Ibhaveda - Where Brilliant Ideas Come to Life",

    description:
      "Join thousands of creators sharing ideas, finding collaborators, and building the future together.",

    images: ["/twitter-image.png"],
  },

  other: {
    "msapplication-TileColor": "#6366F1",
    "msapplication-TileImage": "/icon.png",
    "theme-color": "#0A0D12",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 0.5,
  userScalable: true,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={{
        unstable__errors: {
          // Clerk has a built-in (non-configurable) rule that rejects a password
          // identical/too similar to the account's email. When that fires, Clerk
          // renders its "character requirements" sentence with an EMPTY list, so
          // users saw a broken "Your password must contain ." message.
          // Rewriting the prefix into a complete standalone sentence makes the
          // empty-list case read clearly. (All character-class rules are off in
          // the Clerk dashboard, so this prefix effectively only shows here.)
          passwordComplexity: {
            // NOTE: the built-in password==email rejection renders through this
            // SAME sentence with an EMPTY requirement list, and it fires on
            // submit regardless of the zxcvbn strength setting. So the prefix
            // MUST be a complete, self-contained sentence — if it merely leads
            // into the (here empty) list, the email error breaks to
            // "Your password must be ." A length-only hint that also keeps the
            // email error readable is impossible here; that split needs a
            // custom form. Keeping one clear self-contained sentence for both.
            sentencePrefix:
              "Your password must be at least 8 characters and can't be the same as your email address",
            minimumLength: "",
          },
        },
      }}
    >
      <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} dark`} suppressHydrationWarning>
        <head>
          {/*
            MOBILE PERF: warm the TLS + DNS connection to the auth + realtime
            backends BEFORE React hydrates and fires its first fetch. On a
            slow-3G handshake this saves ~200–400ms off the first Convex
            round-trip, and the same off Clerk's session probe. Origins are
            hard-coded from env so we don't ship an env parse to the browser.
          */}
          {process.env.NEXT_PUBLIC_CONVEX_URL ? (
            <link
              rel="preconnect"
              href={process.env.NEXT_PUBLIC_CONVEX_URL}
              crossOrigin="anonymous"
            />
          ) : null}
          {process.env.NEXT_PUBLIC_CLERK_FRONTEND_API ? (
            <link
              rel="preconnect"
              href={`https://${process.env.NEXT_PUBLIC_CLERK_FRONTEND_API}`}
              crossOrigin="anonymous"
            />
          ) : (
            <link
              rel="preconnect"
              href="https://clerk.ibhaveda.com"
              crossOrigin="anonymous"
            />
          )}
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://www.clarity.ms" />
          {/*
            MOBILE PERF NOTE: we intentionally do NOT hand-roll a
            <link rel="preload"> for /ibhaveda-logo.jpg. The raw file is
            ~296 KB (JPEG) even though it's only rendered at 48x48. next/image
            with priority already emits a preload link, and — critically —
            that preload points at the /_next/image AVIF/WebP variant which
            drops the transfer to ~5-10 KB. Preloading the raw JPG would fire
            a duplicate request AND cost 30x more bytes on 3G. Fix upstream
            by shrinking the source PNG to a 128x128 icon set.
          */}
        </head>
        <body
          className="font-sans antialiased"
        >
          <ConvexClientProvider>
            <AnalyticsProvider>
              <ClarityScript />
              <ThemeProvider>
                <AuthModalProvider>
                  <TutorialProvider><ChatProvider>
                    {children}
                    <MobileBottomNav />
                    <Toaster />
                    <ChatWidget />
                  </ChatProvider></TutorialProvider>
                </AuthModalProvider>
              </ThemeProvider>
            </AnalyticsProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
