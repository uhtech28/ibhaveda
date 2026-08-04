"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";

/**
 * Shared visual pieces for the custom auth modal. These deliberately mimic
 * Clerk's default (light) modal look so the custom sign-in / sign-up forms are
 * visually identical to the prebuilt components they replace.
 */

// Field + button styling tuned to match Clerk's default modal chrome.
export const inputClass =
  "w-full rounded-md border border-[#d9d9de] bg-white px-3 py-2 text-sm text-[#1a1a1e] outline-none transition placeholder:text-[#9394a1] focus:border-[#a8a8b3] focus:ring-2 focus:ring-black/5";

export const labelClass = "mb-1.5 block text-[13px] font-medium text-[#31313a]";

export const primaryButtonClass =
  "flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-b from-[#3a3a3f] to-[#232327] py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

export function PrimaryButton({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button className={primaryButtonClass} {...props}>
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        <>
          {children}
          <ChevronRight className="h-3.5 w-3.5" />
        </>
      )}
    </button>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function GoogleButton({
  onClick,
  disabled,
  lastUsed,
}: {
  onClick: () => void;
  disabled?: boolean;
  lastUsed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative flex w-full items-center justify-center gap-2 rounded-lg border border-[#e3e3e8] bg-white py-2.5 text-sm font-medium text-[#31313a] transition hover:bg-[#f7f7f8] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GoogleIcon />
      Continue with Google
      {lastUsed && (
        <span className="absolute -top-2 right-3 rounded-full border border-[#e3e3e8] bg-white px-1.5 py-0.5 text-[10px] font-normal text-[#9394a1]">
          Last used
        </span>
      )}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-[#ededf0]" />
      <span className="text-xs text-[#9394a1]">or</span>
      <span className="h-px flex-1 bg-[#ededf0]" />
    </div>
  );
}

export function AuthHeaderLogo() {
  return (
    <div className="mb-4 flex justify-center">
      <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-[#111]">
        <Image src="/logo.png" alt="Ibhaveda" width={44} height={44} className="h-11 w-11 object-contain" />
      </span>
    </div>
  );
}

export function SecuredByClerk() {
  return (
    <div className="flex items-center justify-center gap-1.5 border-t border-[#ededf0] bg-[#fafafb] py-3.5 text-[11px] font-medium text-[#9394a1]">
      Secured by
      <span className="font-semibold text-[#6b6b76]">clerk</span>
    </div>
  );
}

/** Inline error / hint / success line under a field. */
export function FieldMessage({
  tone,
  children,
}: {
  tone: "hint" | "error" | "success";
  children: React.ReactNode;
}) {
  const color =
    tone === "error"
      ? "text-[#e02e2e]"
      : tone === "success"
        ? "text-[#1f9d55]"
        : "text-[#6b6b76]";
  return (
    <p className={`mt-1.5 flex items-start gap-1 text-[13px] leading-snug ${color}`}>
      {tone === "success" && <span aria-hidden>✓</span>}
      {tone === "error" && <span aria-hidden>⚠</span>}
      <span>{children}</span>
    </p>
  );
}

/** Extracts a human-readable message from a Clerk error object. */
export function clerkErrorMessage(err: unknown): string {
  const e = err as { errors?: Array<{ longMessage?: string; message?: string }> };
  if (e?.errors?.length) {
    return e.errors[0].longMessage || e.errors[0].message || "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
