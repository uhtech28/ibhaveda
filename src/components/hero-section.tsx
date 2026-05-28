"use client";

import React, { useMemo } from "react";
import { SignedOut, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { GraduationCap, TrendingUp, Rocket, Building2, ArrowRight } from "lucide-react";

const SELECTED_ROLE_KEY = "ii.selectedRole";

const ROLES = [
  {
    key: "student",
    label: "Student",
    eyebrow: "Ideate",
    description: "Validate ideas and find builders",
    icon: GraduationCap,
    color: "#60A5FA",
    glow: "rgba(96,165,250,0.12)",
  },
  {
    key: "investor",
    label: "Investor",
    eyebrow: "Discover",
    description: "Surface high-potential ideas early",
    icon: TrendingUp,
    color: "#34D399",
    glow: "rgba(52,211,153,0.12)",
  },
  {
    key: "founder",
    label: "Founder",
    eyebrow: "Build",
    description: "Move your venture through stages",
    icon: Rocket,
    color: "#C084FC",
    glow: "rgba(192,132,252,0.12)",
  },
  {
    key: "incubator",
    label: "Incubator",
    eyebrow: "Scale",
    description: "Connect startups with resources",
    icon: Building2,
    color: "#FBBF24",
    glow: "rgba(251,191,36,0.12)",
  },
] as const;

function PixelField() {
  const pixels = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => ({
        id: index,
        left: 6 + ((index * 27) % 88),
        top: 5 + ((index * 33) % 82),
        delay: (index % 11) * 220,
        size: 4 + (index % 4) * 3,
        x: `${(index % 2 === 0 ? 1 : -1) * (18 + (index % 5) * 8)}px`,
        y: `${-18 - (index % 6) * 9}px`,
        color: ["#F7D66D", "#E48AA6", "#7C3AED", "#45D5FF"][index % 4],
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pixels.map((pixel) => (
        <span
          key={pixel.id}
          className="absolute block"
          style={{
            left: `${pixel.left}%`,
            top: `${pixel.top}%`,
            width: pixel.size,
            height: pixel.size,
            background: pixel.color,
            opacity: 0,
            animation: `lp-drift ${4200 + pixel.delay}ms ${pixel.delay}ms ease-in-out infinite`,
            "--px": pixel.x,
            "--py": pixel.y,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default function HeroSection() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handleSelect = (role: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SELECTED_ROLE_KEY, role);
    } catch {
      // storage may be unavailable
    }
  };

  return (
    <>
      <style>{`
        @keyframes lp-drift {
          from { transform: translate3d(0,0,0) scale(1); opacity: 0.28; }
          50% { opacity: 0.72; }
          to { transform: translate3d(var(--px),var(--py),0) scale(0.8); opacity: 0; }
        }
        @keyframes lp-logo-pulse {
          0%,100% { box-shadow: 0 0 0 rgba(247,214,109,0), 0 0 60px rgba(124,58,237,0.12); }
          50% { box-shadow: 0 0 36px rgba(247,214,109,0.12), 0 0 100px rgba(124,58,237,0.20); }
        }
        @keyframes lp-reveal {
          from { opacity: 0; transform: translateY(14px); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes lp-card-in {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <section className="relative flex flex-col items-center justify-center min-h-dvh px-4 py-10 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(247,214,109,0.08),transparent_26%),radial-gradient(circle_at_76%_74%,rgba(124,58,237,0.12),transparent_30%),radial-gradient(circle_at_24%_60%,rgba(228,138,166,0.06),transparent_26%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:42px_42px]" />
        <PixelField />

        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">

          {/* ── Hero copy ── */}
          <div
            className="flex flex-col items-center text-center mb-7 sm:mb-8"
            style={{ animation: "lp-reveal 700ms ease both" }}
          >
            <div
              className="relative grid h-16 w-16 sm:h-20 sm:w-20 place-items-center overflow-hidden rounded-[18px] border border-white/10 bg-black shadow-2xl mb-4"
              style={{ animation: "lp-logo-pulse 2400ms ease-in-out infinite" }}
            >
              <img src="/ibhaveda-logo.jpg" alt="Ibhaveda" className="h-full w-full object-cover" />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.44em] text-[#F7D66D] mb-3">
              Ibhaveda
            </p>

            <h1 className="text-[1.85rem] sm:text-5xl lg:text-[3.25rem] font-black text-white leading-[1.07] tracking-tight max-w-2xl font-display">
              Post an idea. Find people willing to build with you.
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-md leading-6">
              Turn your idea into a contribution request — we surface people likely to help for free.
            </p>

            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/feed" fallbackRedirectUrl="/feed">
                <button
                  type="button"
                  className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  Already a member?{" "}
                  <span className="text-[#F7D66D] font-semibold hover:underline">Log in</span>
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          {/* ── Role selector ── */}
          <div className="w-full">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-white/[0.10]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-[#F7D66D]">
                Choose your path
              </p>
              <span className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-white/[0.10]" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {ROLES.map((role, index) => {
                const Icon = role.icon;

                const inner = (
                  <>
                    <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:18px_18px]" />
                    <div
                      className="absolute -right-5 -top-5 h-20 w-20 rounded-full blur-2xl"
                      style={{ background: role.glow }}
                    />
                    <div className="relative z-10 flex flex-col items-start gap-3 h-full">
                      <div
                        className="grid h-10 w-10 place-items-center rounded-xl border border-white/10"
                        style={{ background: `${role.color}18` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: role.color }} />
                      </div>
                      <div className="flex-1">
                        <p
                          className="text-[9px] font-bold uppercase tracking-[0.26em] mb-0.5"
                          style={{ color: role.color }}
                        >
                          {role.eyebrow}
                        </p>
                        <p className="text-sm sm:text-base font-black text-white">{role.label}</p>
                        <p className="mt-1 text-[11px] text-slate-400 leading-4 hidden sm:block">
                          {role.description}
                        </p>
                      </div>
                      <div
                        className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"
                        style={{ color: role.color }}
                      >
                        Enter <ArrowRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </>
                );

                const cardClass =
                  "relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0B111A] min-h-[150px] sm:min-h-[170px] p-4 transition-all duration-200 hover:border-white/20 hover:scale-[1.025] hover:shadow-[0_8px_32px_rgba(0,0,0,0.55)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 cursor-pointer text-left flex flex-col";

                const style = {
                  animation: `lp-card-in 450ms ${index * 80}ms ease both`,
                };

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
                      style={style}
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
                      style={style}
                      aria-label={`Sign up as ${role.label}`}
                    >
                      {inner}
                    </button>
                  </SignUpButton>
                );
              })}
            </div>
          </div>
        </div>

        {/* Corner sprite decorations */}
        <img src="/assets/fan-tasy/House_Hay_1.png" alt="" aria-hidden className="absolute left-[2%] bottom-[4%] h-16 w-16 sm:h-24 sm:w-24 object-contain [image-rendering:pixelated] opacity-25 hidden sm:block pointer-events-none" />
        <img src="/assets/fan-tasy/House_Hay_4_Purple.png" alt="" aria-hidden className="absolute right-[2%] bottom-[5%] h-16 w-16 sm:h-24 sm:w-24 object-contain [image-rendering:pixelated] opacity-25 hidden sm:block pointer-events-none" />
      </section>
    </>
  );
}
