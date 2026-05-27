"use client";

import { useEffect, useState } from "react";

export default function ContactPage() {
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (opened) {
      const timer = setTimeout(() => {
        window.location.href = website;
      }, 2200);
  
      return () => clearTimeout(timer);
    }
  }, [opened]);
  
  const website = "https://ibhaveda.com/";
  const linkedin = "https://www.linkedin.com/in/aryan-v-awasthi/";
  const instagram = "https://www.instagram.com/ibhaveda/";
  const x = "https://x.com/ibhaveda";

  return (
    <main className="min-h-screen bg-[#070A0F] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-10 flex items-center gap-3">
          <img
                src="/logo.png"
                alt="Ibhaveda"
                className="h-12 w-12 rounded-2xl object-cover"
            />
          <div>
            <p className="text-lg font-bold leading-none">Ibhaveda</p>
            <p className="mt-1 text-xs uppercase tracking-[0.35em] text-slate-400">
              Builder Network
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-[#111827] shadow-2xl">
            <div className="h-20 rounded-t-3xl bg-gradient-to-r from-indigo-700/50 to-slate-900" />

            <div className="px-6 pb-6">
              <img
                src="/aryan-profile.jpg"
                alt="Aryan Awasthi"
                className="-mt-10 h-20 w-20 rounded-full border-4 border-[#111827] object-cover sm:h-24 sm:w-24"
              />

              <h1 className="mt-4 text-2xl font-bold">Aryan Awasthi</h1>
              <p className="mt-1 text-sm uppercase tracking-widest text-slate-400">
                Founder
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm leading-6 text-slate-300">
                  Building a network for founders, builders and early ideas.
                </p>
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <p>aryanvawasthi@gmail.com</p>
                <p>+91 9810036751</p>
              </div>
            </div>
          </aside>

          <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-4 py-2 text-sm text-indigo-200">
                Builder
              </span>
              <span className="rounded-full border border-blue-400/30 bg-blue-500/15 px-4 py-2 text-sm text-blue-200">
                Startups
              </span>
              <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-4 py-2 text-sm text-purple-200">
                Ideas
              </span>
            </div>

            <h2 className="text-center text-2xl font-bold sm:text-3xl">Tap below to save directly to your phone.</h2>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <a href={linkedin} className="rounded-2xl bg-white/10 px-4 py-4 text-center text-sm hover:bg-white/15">
                LinkedIn
              </a>
              <a href={instagram} className="rounded-2xl bg-white/10 px-4 py-4 text-center text-sm hover:bg-white/15">
                Instagram
              </a>
              <a href={x} className="rounded-2xl bg-white/10 px-4 py-4 text-center text-sm hover:bg-white/15">
                X
              </a>
            </div>

            <div className="mt-10 border-t border-white/10 pt-8">
              {!opened ? (
                <a
                href="/aryan-awasthi.vcf"
                onClick={() => {
                  setOpened(true);
                }}
                  className="block w-full rounded-2xl bg-indigo-500 py-4 text-center font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
                >
                  Save Contact
                </a>
              ) : (
                <>
                <p className="mb-4 text-center text-slate-400">
                  Opening contact card...
                </p>
              
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
              
                <a
                  href={website}
                  className="mt-6 block w-full rounded-2xl bg-indigo-500 py-4 text-center font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
                >
                  Continue to Website
                </a>
              </>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
