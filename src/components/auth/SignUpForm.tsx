"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
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

export function SignUpForm({
  onClose,
  onSwitchToSignIn,
}: {
  onClose: () => void;
  onSwitchToSignIn: () => void;
}) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const emailTrim = email.trim();
  // The whole point of the custom form: catch password == email on the client,
  // before submit, instead of relying on Clerk's built-in rejection (which
  // renders a broken empty "Your password must contain ." message).
  const isSameAsEmail =
    password.length >= 8 &&
    emailTrim.length > 0 &&
    password.trim().toLowerCase() === emailTrim.toLowerCase();
  const isValidPassword = password.length >= 8 && !isSameAsEmail;
  const showPwMsg = pwFocused || password.length > 0;

  const canSubmit = isLoaded && !submitting && emailTrim.length > 0 && isValidPassword;

  const handleGoogle = () => {
    if (!isLoaded || !signUp) return;
    void signUp.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/profile-setup",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !signUp) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await signUp.create({ emailAddress: emailTrim, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err) {
      setFormError(clerkErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp || !setActive || submitting) return;
    setVerifyError(null);
    setSubmitting(true);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        onClose();
        router.push("/profile-setup");
      } else {
        setVerifyError("Verification could not be completed. Please try again.");
      }
    } catch (err) {
      setVerifyError(clerkErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="px-8 pt-8">
        <AuthHeaderLogo />
        <DialogTitle className="text-center text-xl font-bold text-[#212126]">
          Verify your email
        </DialogTitle>
        <DialogDescription className="mt-1 text-center text-sm text-[#6b6b76]">
          Enter the code we sent to {emailTrim}
        </DialogDescription>

        <form onSubmit={handleVerify} className="mt-6 pb-2">
          <label className={labelClass} htmlFor="signup-code">
            Verification code
          </label>
          <input
            id="signup-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            className={inputClass}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter the 6-digit code"
            autoFocus
          />
          {verifyError && <FieldMessage tone="error">{verifyError}</FieldMessage>}

          <div className="mt-5">
            <PrimaryButton type="submit" loading={submitting} disabled={!code || submitting}>
              Continue
            </PrimaryButton>
          </div>
        </form>

        <div className="pb-6 text-center text-[13px] text-[#6b6b76]">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="font-medium text-[#31313a] hover:underline"
          >
            Use a different email
          </button>
        </div>
        <SecuredByClerk />
      </div>
    );
  }

  return (
    <div className="px-8 pt-8">
      <AuthHeaderLogo />
      <DialogTitle className="text-center text-xl font-bold text-[#212126]">
        Create your account
      </DialogTitle>
      <DialogDescription className="mt-1 text-center text-sm text-[#6b6b76]">
        Welcome! Please fill in the details to get started.
      </DialogDescription>

      <div className="mt-6">
        <GoogleButton onClick={handleGoogle} disabled={!isLoaded} />
      </div>

      <OrDivider />

      <form onSubmit={handleSubmit} className="pb-2">
        <div className="mb-4">
          <label className={labelClass} htmlFor="signup-email">
            Email address
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
          />
        </div>

        <div className="mb-2">
          <label className={labelClass} htmlFor="signup-password">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={inputClass + " pr-10"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPwFocused(true)}
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
          {showPwMsg &&
            (password.length < 8 ? (
              <FieldMessage tone={password.length === 0 ? "hint" : "error"}>
                Your password must be at least 8 characters
              </FieldMessage>
            ) : isSameAsEmail ? (
              <FieldMessage tone="error">
                Your password can&apos;t be the same as your email address
              </FieldMessage>
            ) : (
              <FieldMessage tone="success">
                Your password meets all the necessary requirements.
              </FieldMessage>
            ))}
        </div>

        {formError && <FieldMessage tone="error">{formError}</FieldMessage>}

        {/* Clerk Smart CAPTCHA / bot-protection mount point. */}
        <div id="clerk-captcha" className="mt-3 empty:mt-0" />

        <div className="mt-5">
          <PrimaryButton type="submit" loading={submitting} disabled={!canSubmit}>
            Continue
          </PrimaryButton>
        </div>
      </form>

      <div className="pb-6 pt-4 text-center text-[13px] text-[#6b6b76]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-semibold text-[#31313a] hover:underline"
        >
          Sign in
        </button>
      </div>

      <SecuredByClerk />
    </div>
  );
}
