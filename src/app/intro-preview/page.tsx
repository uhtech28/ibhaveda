import LandingIntroSandbox from "@/components/landing-intro-sandbox";

export const metadata = {
  title: "Intro Preview | Ibhaveda",
  robots: {
    index: false,
    follow: false,
  },
};

export default function IntroPreviewPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <LandingIntroSandbox />
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.32em] text-indigo-200">
          Intro Sandbox
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white">
          Ibhaveda first-visit intro preview
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Edit the sandbox component, refresh this page, and apply changes to
          the live intro only when the preview feels right.
        </p>
      </div>
    </main>
  );
}
