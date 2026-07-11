import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Sora } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';
import { ThemeProvider } from '@/components/theme-provider';
import { ConvexClientProvider } from '@/lib/convex/providers';
import { Toaster } from '@/components/ui/toaster';
import ChatWidget from "@/components/chat/ChatWidget";
import { ChatProvider } from "@/components/chat/ChatContext";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { TutorialProvider } from "@/components/tutorial/v2";
import "./globals.css";

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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

// Only wrap in <ClerkProvider> if the publishable key is present.
// Without it, ClerkProvider throws during hydration and the whole
// React tree crashes with "Application error: a client-side
// exception has occurred". When missing (e.g. Preview deployment
// without full env), fall back to a plain wrapper -- auth features
// silently no-op but the app LOADS.
const CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const CLERK_READY = Boolean(CLERK_PUBLISHABLE_KEY);

function AuthWrapper({ children }: { children: React.ReactNode }) {
  if (!CLERK_READY) return <>{children}</>;
  return <ClerkProvider>{children}</ClerkProvider>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthWrapper>
      <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} dark`} suppressHydrationWarning>
        <body
          className="font-sans antialiased"
        >
          <ConvexClientProvider>
            <ThemeProvider>
              <ChatProvider>
                <TutorialProvider>
                  {children}
                  <MobileBottomNav />
                  <Toaster />
                  <ChatWidget />
                </TutorialProvider>
              </ChatProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </AuthWrapper>
  );
}
