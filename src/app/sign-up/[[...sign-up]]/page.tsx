"use client";

import { SignUp } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function SignUpPage() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Warm the post-signup intro video from HERE ──────────────────────
  // The clip is 1.5-2.5 MB and is the very first thing shown after the
  // username step. Starting the fetch on /profile-setup only buys the
  // few hundred ms that Clerk and Convex take to resolve; starting it
  // here buys the whole time the user spends filling in this form, which
  // is usually tens of seconds. That is the difference between the video
  // opening instantly and opening on black.
  //
  // rel="prefetch" is deliberately LOW priority: it fetches during idle
  // time and will not compete with this page's own resources or with
  // Clerk's bundle. Skipped entirely on a metered or slow connection, so
  // a user on 2G who may not even finish signing up never pays for it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /^(slow-)?2g$/.test(conn.effectiveType)) return;

    const portrait =
      window.innerWidth <= 768 || window.innerHeight > window.innerWidth;
    const probe = document.createElement("video");
    const preferWebm = probe.canPlayType('video/webm; codecs="vp9"') !== "";
    const href = portrait
      ? preferWebm
        ? "/assets/videos/welcome-intro-mobile.webm"
        : "/assets/videos/welcome-intro-mobile.mp4"
      : preferWebm
        ? "/assets/videos/welcome-intro-desktop.webm"
        : "/assets/videos/welcome-intro-desktop.mp4";

    const el = document.createElement("link");
    el.rel = "prefetch";
    el.as = "video";
    el.href = href;
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        // Post-signup landing: /profile-setup handles first-time
        // profile creation, then hard-navigates to /feed once the
        // persona is picked. Without this, the default Clerk config
        // sends fresh signups to `/` which lets the persona-picker
        // race (picker → feed → picker) reappear.
        afterSignUpUrl="/profile-setup"
        forceRedirectUrl="/profile-setup"
        fallbackRedirectUrl="/profile-setup"
        appearance={{
          variables: {
            colorBackground: isDark ? '#0f0f0f' : '#ffffff',
            colorInputBackground: isDark ? '#1f1f1f' : '#ffffff',
            colorInputText: isDark ? '#ffffff' : '#000000',
            colorPrimary: isDark ? '#3b82f6' : '#2563eb',
            colorText: isDark ? '#ffffff' : '#000000',
            colorTextSecondary: isDark ? '#a1a1aa' : '#71717a',
            colorNeutral: isDark ? '#52525b' : '#a1a1aa',
          },
          elements: {
            formButtonPrimary: `bg-primary hover:bg-primary/90 text-primary-foreground font-medium ${isDark ? 'shadow-lg' : ''}`,
            formButtonReset: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
            card: `bg-card border ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-lg`,
            headerTitle: `text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`,
            headerSubtitle: `text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`,
            socialButtonsBlockButton: `bg-card hover:bg-muted border ${isDark ? 'border-gray-700' : 'border-gray-300'}`,
            socialButtonsBlockButtonText: `font-medium ${isDark ? 'text-white' : 'text-gray-900'}`,
            formFieldLabel: `font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`,
            formFieldInput: `bg-input border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${isDark ? 'border-gray-600' : 'border-gray-300'}`,
            dividerLine: isDark ? 'bg-gray-700' : 'bg-gray-200',
            dividerText: `bg-card ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
            footerActionLink: `text-primary hover:text-primary/90 font-medium`,
            identityPreviewText: isDark ? 'text-gray-300' : 'text-gray-600',
            identityPreviewEditButton: 'text-primary hover:text-primary/90',
            formFieldErrorText: 'text-red-500',
            alert: `bg-red-50 border border-red-200 text-red-800 ${isDark ? 'bg-red-900/20 border-red-800 text-red-400' : ''}`,
            alertText: `text-red-800 ${isDark ? 'text-red-400' : ''}`,
          },
        }}
      />
    </div>
  );
}
