/** Shown while the world map client bundle downloads (see HAR: HTML ~1s, JS often later). */
export default function WorldMapLoading() {
  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050810] text-white">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">
        Entering the World…
      </p>
      <div className="relative mt-6 h-[3px] w-40 overflow-hidden rounded-full bg-white/5">
        <div
          className="absolute inset-y-0 left-0 w-[55%] rounded-full"
          style={{
            background: "linear-gradient(90deg, #4f46e5, #818cf8)",
            animation: "map-load-bar 0.65s ease-in-out infinite",
          }}
          aria-hidden="true"
        />
      </div>
      <style>{`
        @keyframes map-load-bar {
          0% { transform: translate3d(-120%, 0, 0); }
          100% { transform: translate3d(220%, 0, 0); }
        }
      `}</style>
    </main>
  );
}
