"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");

  const openSignIn = useCallback(() => {
    setMode("signin");
    setOpen(true);
  }, []);
  const openSignUp = useCallback(() => {
    setMode("signup");
    setOpen(true);
  }, []);
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
          className="w-[calc(100%-2rem)] max-w-[430px] overflow-hidden rounded-[22px] border border-white/15 bg-[#070a0f] p-0 text-slate-50 shadow-[0_28px_100px_rgba(0,0,0,0.72),0_0_80px_rgba(124,58,237,0.22)] sm:max-w-[430px] [&_[data-slot=dialog-close]]:text-slate-300 [&_[data-slot=dialog-close]]:hover:text-[#f7d66d]"
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
