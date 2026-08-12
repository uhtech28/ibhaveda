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
  PasswordToggle,
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
    if (!canSubmit || !signUp || !setActive) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await signUp.create({ emailAddress: emailTrim, password });
      // Some Clerk instances don't gate sign-up behind email-code verification,
      // so create() returns "complete" straight away. In that case there is no
      // pending sign-up attempt to prepare — calling prepareEmailAddressVerification
      // would throw client_state_invalid ("No sign up attempt was found"). Activate
      // the session and route on instead.
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        onClose();
        router.push("/profile-setup");
        return;
      }
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
      <div className="relative overflow-hidden px-8 pt-8 before:pointer-events-none before:absolute before:inset-0 before:opacity-[0.055] before:[background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] before:[background-size:24px_24px]">
        <AuthHeaderLogo />
        <DialogTitle className="relative text-center font-mono text-2xl font-black text-slate-50">
          Verify your email
        </DialogTitle>
        <DialogDescription className="relative mt-2 text-center text-sm font-semibold text-slate-400">
          Enter the code we sent to {emailTrim}
        </DialogDescription>

        <form onSubmit={handleVerify} className="relative mt-6 pb-2">
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

        <div className="relative pb-6 text-center text-[13px] text-slate-400">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="font-bold text-[#f7d66d] hover:underline"
          >
            Use a different email
          </button>
        </div>
        <SecuredByClerk />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden px-8 pt-8 before:pointer-events-none before:absolute before:inset-0 before:opacity-[0.055] before:[background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] before:[background-size:24px_24px]">
      <AuthHeaderLogo />
      <DialogTitle className="relative text-center font-mono text-2xl font-black text-slate-50">
        Create your account
      </DialogTitle>
      <DialogDescription className="relative mt-2 text-center text-sm font-semibold text-slate-400">
        Welcome! Please fill in the details to get started.
      </DialogDescription>

      <div className="relative mt-6">
        <GoogleButton onClick={handleGoogle} disabled={!isLoaded} />
      </div>

      <OrDivider />

      <form onSubmit={handleSubmit} className="relative pb-2">
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
            <PasswordToggle show={showPassword} onToggle={() => setShowPassword((s) => !s)} />
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

      <div className="relative pb-6 pt-4 text-center text-[13px] text-slate-400">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-bold text-[#f7d66d] hover:underline"
        >
          Sign in
        </button>
      </div>

      <SecuredByClerk />
    </div>
  );
}
