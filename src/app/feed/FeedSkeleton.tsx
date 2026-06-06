export function FeedSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0D12] pb-28 text-[#F9FAFB]">
      {/* Navbar placeholder */}
      <div className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/5 bg-[#0A0D12]/90 backdrop-blur" />

      <main className="mx-auto max-w-[1280px] px-4 pb-12 pt-24 sm:px-6 xl:px-8">
        <div className="flex items-start justify-center gap-6">
          {/* Left rail skeleton */}
          <div className="hidden w-[260px] shrink-0 space-y-4 lg:block">
            <div className="h-[140px] animate-pulse rounded-2xl bg-white/5" />
            <div className="h-[180px] animate-pulse rounded-2xl bg-white/5" />
          </div>

          {/* Feed skeleton */}
          <div className="w-full max-w-[720px] space-y-4">
            {/* Filter tabs */}
            <div className="flex gap-4 border-b border-white/5 pb-3">
              {["For You", "Latest", "Hot This Week", "Following"].map((t) => (
                <div key={t} className="h-5 w-16 animate-pulse rounded bg-white/5" />
              ))}
            </div>

            {/* Cards */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.03] p-5"
              >
                {/* Author row */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
                {/* Title */}
                <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
                {/* Progress bar */}
                <div className="h-8 animate-pulse rounded-lg bg-white/5" />
                {/* Body */}
                <div className="space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-white/5" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-white/5" />
                </div>
                {/* Actions */}
                <div className="flex gap-8 pt-1">
                  <div className="h-4 w-10 animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-10 animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-10 animate-pulse rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>

          {/* Right rail skeleton */}
          <div className="hidden w-[280px] shrink-0 space-y-4 xl:block">
            <div className="h-[220px] animate-pulse rounded-2xl bg-white/5" />
            <div className="h-[160px] animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>
      </main>
    </div>
  );
}
