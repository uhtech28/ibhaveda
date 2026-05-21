import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#080B12] text-white">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(99,102,241,0.24),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.88),rgba(8,11,18,1))]" />
        <div className="absolute h-56 w-56 rounded-full border border-white/10" />
        <div className="absolute h-80 w-80 rounded-full border border-indigo-400/10" />
        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute inset-[-18px] rounded-full bg-indigo-500/15 blur-2xl" />
            <Spinner size={58} className="text-indigo-200" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-indigo-200">
            Interactive Ideas
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            Preparing your venture map
          </h1>
          <div className="mt-6 grid w-56 grid-cols-3 gap-2" aria-hidden="true">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-1.5 rounded-full bg-white/15 overflow-hidden"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400 motion-safe:animate-pulse"
                  style={{ animationDelay: `${item * 140}ms` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
