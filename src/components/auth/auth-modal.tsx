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
          className="w-[calc(100%-2rem)] max-w-[400px] overflow-hidden rounded-2xl border-0 bg-white p-0 text-[#212126] shadow-2xl sm:max-w-[400px]"
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
