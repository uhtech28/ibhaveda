"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// MOBILE PERF: SignInForm + SignUpForm each pull in Clerk's client SDK for
// their form controls, react-hook-form, zod validators, and a fair amount of
// styling. None of that JS is needed for a signed-out landing-page visitor who
// hasn't clicked "Log in" or a role card yet. Loading them via next/dynamic
// pushes ~30–50 KB gz out of the initial landing bundle, which is a direct
// TBT win on Moto G4-class devices. ssr:false skips the hydration pass.
const SignUpForm = dynamic(
  () => import("./SignUpForm").then((m) => m.SignUpForm),
  { ssr: false, loading: () => null },
);
const SignInForm = dynamic(
  () => import("./SignInForm").then((m) => m.SignInForm),
  { ssr: false, loading: () => null },
);

type Mode = "signin" | "signup";

type AuthModalContextValue = {
  openSignIn: () => void;
  openSignUp: () => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within <AuthModalProvider>");
  }
  return ctx;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");

  const openSignIn = useCallback(() => {
    if (isSignedIn) {
      setOpen(false);
      router.push("/feed");
      return;
    }
    setMode("signin");
    setOpen(true);
  }, [isSignedIn, router]);
  const openSignUp = useCallback(() => {
    if (isSignedIn) {
      setOpen(false);
      router.push("/feed");
      return;
    }
    setMode("signup");
    setOpen(true);
  }, [isSignedIn, router]);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openSignIn, openSignUp, close }),
    [openSignIn, openSignUp, close],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="w-[calc(100%-2rem)] max-w-[430px] overflow-hidden rounded-[22px] border border-[#6366f1]/45 bg-[#070a0f] p-0 text-slate-50 shadow-[0_28px_100px_rgba(0,0,0,0.72),0_0_90px_rgba(99,102,241,0.24)] sm:max-w-[430px] [&_[data-slot=dialog-close]]:text-[#9fb6df] [&_[data-slot=dialog-close]]:hover:text-[#93c5fd]"
        >
          {mode === "signup" ? (
            <SignUpForm onClose={close} onSwitchToSignIn={() => setMode("signin")} />
          ) : (
            <SignInForm onClose={close} onSwitchToSignUp={() => setMode("signup")} />
          )}
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}
