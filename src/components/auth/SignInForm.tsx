"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  inputClass,
  PrimaryButton,
  GoogleButton,
  OrDivider,
  AuthHeaderLogo,
  SecuredByClerk,
  FieldMessage,
  PasswordToggle,
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
    <div className="relative overflow-hidden px-8 pt-8 font-[family-name:var(--font-code)] before:pointer-events-none before:absolute before:inset-0 before:opacity-[0.055] before:[background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] before:[background-size:24px_24px]">
      <AuthHeaderLogo />
      <DialogTitle className="relative text-center font-[family-name:var(--font-code)] text-2xl font-black text-slate-50">
        Sign in to Ibhaveda
      </DialogTitle>
      <DialogDescription className="relative mt-2 text-center text-sm font-semibold text-[#9fb6df]">
        Welcome back! Please sign in to continue
      </DialogDescription>

      <div className="relative mt-6">
        <GoogleButton onClick={handleGoogle} disabled={!isLoaded} />
      </div>

      <OrDivider />

      <form onSubmit={handleSubmit} className="relative pb-2">
        <div className="mb-4">
          <label className="sr-only" htmlFor="signin-identifier">
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
          <label className="sr-only" htmlFor="signin-password">
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
            <PasswordToggle show={showPassword} onToggle={() => setShowPassword((s) => !s)} />
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

      <div className="relative pb-6 pt-4 text-center text-[13px] text-[#9fb6df]">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="font-bold text-[#93c5fd] hover:underline"
        >
          Sign up
        </button>
      </div>

      <SecuredByClerk />
    </div>
  );
}
