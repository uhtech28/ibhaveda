"use client";

import Image from "next/image";
import { ChevronRight, Eye, EyeOff } from "lucide-react";

export const inputClass =
  "w-full rounded-xl border border-white/15 bg-[#0b111a]/90 px-4 py-3 text-sm font-semibold text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-[#f7d66d]/70 focus:ring-2 focus:ring-[#f7d66d]/15";

export const labelClass =
  "mb-1.5 block text-[12px] font-black uppercase tracking-[0.18em] text-[#f7d66d]";

export const primaryButtonClass =
  "flex w-full items-center justify-center gap-1 rounded-xl border border-[#f7d66d]/35 bg-gradient-to-b from-[#f7d66d] to-[#a87924] py-3 text-sm font-black uppercase tracking-[0.12em] text-[#070a0f] shadow-[0_0_28px_rgba(247,214,109,0.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45";

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

/** Show/hide password toggle using Clerk's standard outline eye icon. */
export function PasswordToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#f7d66d]"
      aria-label={show ? "Hide password" : "Show password"}
      tabIndex={-1}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
      className="relative flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#0b111a]/90 py-3 text-sm font-bold text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-[#60a5fa]/45 hover:bg-[#101827] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GoogleIcon />
      Continue with Google
      {lastUsed && (
        <span className="absolute -top-2 right-3 rounded-full border border-white/15 bg-[#070a0f] px-1.5 py-0.5 text-[10px] font-normal text-slate-400">
          Last used
        </span>
      )}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">or</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

export function AuthHeaderLogo() {
  return (
    <div className="mb-4 flex justify-center">
      <span className="grid h-[58px] w-[58px] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_42px_rgba(247,214,109,0.16)]">
        <Image src="/ibhaveda-logo.jpg" alt="Ibhaveda" width={58} height={58} className="h-full w-full object-cover" />
      </span>
    </div>
  );
}

export function SecuredByClerk() {
  return (
    <div className="flex items-center justify-center gap-1.5 border-t border-white/10 bg-black/20 py-3.5 text-[11px] font-medium text-slate-500">
      Secured by
      <span className="font-semibold text-slate-300">clerk</span>
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
      ? "text-[#fb7185]"
      : tone === "success"
        ? "text-[#34d399]"
        : "text-slate-400";
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
