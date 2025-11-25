import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';
import { ThemeProvider } from '@/components/theme-provider';
import { ConvexClientProvider } from '@/lib/convex/providers';
import { Toaster } from '@/components/ui/toaster';
import ChatWidget from "@/components/chat/ChatWidget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interactive Ideas - Share & Cultivate Brilliant Ideas",
  description: "Connect with like-minded creators, share your brilliant ideas, get valuable feedback, and collaborate on groundbreaking projects in our innovative community.",
  keywords: "ideas, innovation, collaboration, creativity, community, startup, prototyping",
  openGraph: {
    title: "Interactive Ideas - Where Brilliant Ideas Come to Life",
    description: "Join thousands of creators sharing ideas, finding collaborators, and building the future together.",
    type: "website",
    url: "/",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <ThemeProvider>
              {children}
              <Toaster />
              <ChatWidget />
            </ThemeProvider>
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
