"use client";

import { SignUpButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { GraduationCap, TrendingUp, Rocket, Building2 } from "lucide-react";

// Roles offered on the landing page. The selected role is stashed in
// localStorage at this key so post-signup flows can read it.
export const SELECTED_ROLE_KEY = "ii.selectedRole";

const ROLES = [
  {
    key: "student",
    label: "Student",
    icon: GraduationCap,
    gradient: "from-blue-500/15 to-cyan-500/15",
    border: "border-blue-400/30",
  },
  {
    key: "investor",
    label: "Investor",
    icon: TrendingUp,
    gradient: "from-emerald-500/15 to-teal-500/15",
    border: "border-emerald-400/30",
  },
  {
    key: "founder",
    label: "Founder",
    icon: Rocket,
    gradient: "from-purple-500/15 to-pink-500/15",
    border: "border-purple-400/30",
  },
  {
    key: "incubator",
    label: "Incubator",
    icon: Building2,
    gradient: "from-amber-500/15 to-orange-500/15",
    border: "border-amber-400/30",
  },
] as const;

export default function RoleSelector() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handleSelect = (role: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SELECTED_ROLE_KEY, role);
    } catch {
      // localStorage may be unavailable (Safari private mode, etc.)
    }
  };

  // Card classNames extracted so we can reuse for the button & link variants.
  const cardClass = (role: { gradient: string; border: string }) =>
    `group relative flex flex-col items-center justify-center gap-2 md:gap-3 rounded-2xl border ${role.border} bg-gradient-to-br ${role.gradient} p-4 md:p-6 min-h-[110px] md:min-h-[140px] transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 text-center w-full cursor-pointer`;

  return (
    <section className="py-10 md:py-14">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-xl md:text-3xl font-semibold tracking-tight">
          Who are you?
        </h2>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          Pick what fits you best — we&apos;ll tailor the feed and connections.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {ROLES.map((role) => {
          const Icon = role.icon;

          const cardInner = (
            <>
              <Icon className="h-7 w-7 md:h-9 md:w-9 text-foreground/90" />
              <div className="font-semibold text-sm md:text-base text-foreground">
                {role.label}
              </div>
            </>
          );

          // Already signed in? Skip Clerk modal — go straight to feed (or profile setup).
          if (isSignedIn) {
            return (
              <button
                key={role.key}
                type="button"
                onClick={() => {
                  handleSelect(role.key);
                  router.push("/feed");
                }}
                className={cardClass(role)}
                aria-label={`Continue as ${role.label}`}
              >
                {cardInner}
              </button>
            );
          }

          // Not signed in: open Clerk's sign-up modal.
          return (
            <SignUpButton
              key={role.key}
              mode="modal"
              forceRedirectUrl="/profile-setup"
            >
              <button
                type="button"
                onClick={() => handleSelect(role.key)}
                className={cardClass(role)}
                aria-label={`Sign up as ${role.label}`}
              >
                {cardInner}
              </button>
            </SignUpButton>
          );
        })}
      </div>
    </section>
  );
}
