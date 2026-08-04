"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/**
 * Landing route for Google OAuth redirects started from the custom auth modal
 * (signIn/signUp.authenticateWithRedirect -> redirectUrl: "/sso-callback").
 * Clerk finalizes the OAuth handshake here and forwards to the completion URL,
 * transparently handling the sign-in vs sign-up transfer for new/returning users.
 */
export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <AuthenticateWithRedirectCallback
        signUpForceRedirectUrl="/profile-setup"
        signInForceRedirectUrl="/feed"
      />
    </div>
  );
}
