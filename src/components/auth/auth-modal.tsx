"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SignUpForm } from "./SignUpForm";
import { SignInForm } from "./SignInForm";

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
