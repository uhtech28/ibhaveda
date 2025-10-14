"use client";

import { SignIn } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      <SignIn
        routing="path"
        path="/sign-in"
        afterSignInUrl="/onboarding"
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
