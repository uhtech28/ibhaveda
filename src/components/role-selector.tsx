"use client";

import { SignUpButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { GraduationCap, TrendingUp, Rocket, Building2, ArrowRight } from "lucide-react";

export const SELECTED_ROLE_KEY = "ii.selectedRole";

const ROLES = [
  {
    key: "student",
    label: "Student",
    eyebrow: "Ideate",
    description: "Validate ideas and find builders who can help bring them to life.",
    icon: GraduationCap,
    color: "#60A5FA",
    glow: "rgba(96,165,250,0.12)",
  },
  {
    key: "investor",
    label: "Investor",
    eyebrow: "Discover",
    description: "Surface high-potential ideas early and connect with founders.",
    icon: TrendingUp,
    color: "#34D399",
    glow: "rgba(52,211,153,0.12)",
  },
  {
    key: "founder",
    label: "Founder",
    eyebrow: "Build",
    description: "Move your venture through stages with proof at every step.",
    icon: Rocket,
    color: "#C084FC",
    glow: "rgba(192,132,252,0.12)",
  },
  {
    key: "incubator",
    label: "Incubator",
    eyebrow: "Scale",
    description: "Connect startups with the right resources at the right stage.",
    icon: Building2,
    color: "#FBBF24",
    glow: "rgba(251,191,36,0.12)",
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
      // localStorage may be unavailable
    }
  };

  return (
    <section className="relative px-4 py-16 md:py-20 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-white/[0.12]" />
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F7D66D]">
          Choose your path
        </p>
        <span className="h-px flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-white/[0.12]" />
      </div>

      <h2 className="text-center text-2xl sm:text-[2rem] font-black text-white mb-2 font-display">
        Who are you on Ibhaveda?
      </h2>
      <p className="text-center text-sm text-slate-400 mb-10">
        Pick what fits — we&apos;ll tailor your feed and connections.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {ROLES.map((role) => {
          const Icon = role.icon;

          const inner = (
            <>
              <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:18px_18px]" />
              <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl"
                style={{ background: role.glow }}
              />
              <div className="relative z-10 flex flex-col items-start gap-4 h-full">
                <div
                  className="grid h-12 w-12 place-items-center rounded-xl border border-white/10"
                  style={{ background: `${role.color}18` }}
                >
                  <Icon className="h-6 w-6" style={{ color: role.color }} />
                </div>
                <div className="flex-1">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1"
                    style={{ color: role.color }}
                  >
                    {role.eyebrow}
                  </p>
                  <p className="text-base sm:text-lg font-black text-white">{role.label}</p>
                  <p className="mt-1.5 text-xs text-slate-400 leading-5">{role.description}</p>
                </div>
                <div
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: role.color }}
                >
                  Enter <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </>
          );

          const cardClass =
            "relative overflow-hidden rounded-[22px] border border-white/10 bg-[#0B111A] min-h-[200px] md:min-h-[240px] p-5 transition-all duration-200 hover:border-white/20 hover:scale-[1.02] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 cursor-pointer text-left flex flex-col";

          if (isSignedIn) {
            return (
              <button
                key={role.key}
                type="button"
                onClick={() => {
                  handleSelect(role.key);
                  router.push("/feed");
                }}
                className={cardClass}
                aria-label={`Continue as ${role.label}`}
              >
                {inner}
              </button>
            );
          }

          return (
            <SignUpButton key={role.key} mode="modal" forceRedirectUrl="/profile-setup">
              <button
                type="button"
                onClick={() => handleSelect(role.key)}
                className={cardClass}
                aria-label={`Sign up as ${role.label}`}
              >
                {inner}
              </button>
            </SignUpButton>
          );
        })}
      </div>
    </section>
  );
}
