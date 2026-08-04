"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  inputClass,
  labelClass,
  PrimaryButton,
  GoogleButton,
  OrDivider,
  AuthHeaderLogo,
  SecuredByClerk,
  FieldMessage,
  clerkErrorMessage,
} from "./auth-ui";

export function SignInForm({
  onClose,
  onSwitchToSignUp,
}: {
  onClose: () => void;
  onSwitchToSignUp: () => void;
}) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    isLoaded && !submitting && identifier.trim().length > 0 && password.length > 0;

  const handleGoogle = () => {
    if (!isLoaded || !signIn) return;
    void signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/feed",
    });
  };

  // Safety net: for any status we don't handle inline (2FA, new-device / Client
  // Trust verification, password reset), hand off to the prebuilt /sign-in page,
  // which handles every Clerk flow. Real users never get stuck in the custom UI.
  const handoffToPrebuilt = () => {
    onClose();
    router.push("/sign-in");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !signIn || !setActive) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await signIn.create({ identifier: identifier.trim(), password });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        onClose();
        router.push("/feed");
      } else {
        // needs_second_factor / needs_new_device_verification / etc.
        handoffToPrebuilt();
      }
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-8 pt-8">
      <AuthHeaderLogo />
      <DialogTitle className="text-center text-xl font-bold text-[#212126]">
        Sign in to Ibhaveda
      </DialogTitle>
      <DialogDescription className="mt-1 text-center text-sm text-[#6b6b76]">
        Welcome back! Please sign in to continue
      </DialogDescription>

      <div className="mt-6">
        <GoogleButton onClick={handleGoogle} disabled={!isLoaded} />
      </div>

      <OrDivider />

      <form onSubmit={handleSubmit} className="pb-2">
        <div className="mb-4">
          <label className={labelClass} htmlFor="signin-identifier">
            Email address or username
          </label>
          <input
            id="signin-identifier"
            type="text"
            autoComplete="username"
            className={inputClass}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter email or username"
          />
        </div>

        <div className="mb-2">
          <label className={labelClass} htmlFor="signin-password">
            Password
          </label>
          <div className="relative">
            <input
              id="signin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={inputClass + " pr-10"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9394a1] hover:text-[#31313a]"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {error && <FieldMessage tone="error">{error}</FieldMessage>}

        <div id="clerk-captcha" className="mt-3 empty:mt-0" />

        <div className="mt-5">
          <PrimaryButton type="submit" loading={submitting} disabled={!canSubmit}>
            Continue
          </PrimaryButton>
        </div>
      </form>

      <div className="pb-6 pt-4 text-center text-[13px] text-[#6b6b76]">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="font-semibold text-[#31313a] hover:underline"
        >
          Sign up
        </button>
      </div>

      <SecuredByClerk />
    </div>
  );
}
