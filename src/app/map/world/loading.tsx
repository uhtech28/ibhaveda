/** Shown while the world map client bundle downloads. */
export default function WorldMapLoading() {
  const loadingText = "Entering the World...";

  return (
    <main
      data-tutorial-hide="true"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050810] text-white"
    >
      <p className="map-load-glitch" data-text={loadingText}>
        {loadingText}
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
        .map-load-glitch {
          position: relative;
          color: #6366f1;
          font-family: "Courier New", "Lucida Console", monospace;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.16em;
          line-height: 1;
          text-transform: uppercase;
          text-shadow: 2px 0 0 rgba(129, 140, 248, 0.38);
          image-rendering: pixelated;
          animation: map-text-jitter 1.15s steps(2, end) infinite;
        }
        .map-load-glitch::before,
        .map-load-glitch::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.65;
        }
        .map-load-glitch::before {
          color: #818cf8;
          transform: translate3d(-1px, 0, 0);
          clip-path: inset(0 0 54% 0);
          animation: map-glitch-top 1.35s steps(2, end) infinite;
        }
        .map-load-glitch::after {
          color: #4f46e5;
          transform: translate3d(1px, 0, 0);
          clip-path: inset(48% 0 0 0);
          animation: map-glitch-bottom 1.05s steps(2, end) infinite;
        }
        @keyframes map-text-jitter {
          0%, 76%, 100% { transform: translate3d(0, 0, 0); }
          78% { transform: translate3d(1px, -1px, 0); }
          80% { transform: translate3d(-1px, 1px, 0); }
          82% { transform: translate3d(0, 0, 0); }
        }
        @keyframes map-glitch-top {
          0%, 72%, 100% { transform: translate3d(-1px, 0, 0); }
          74% { transform: translate3d(4px, -1px, 0); }
          77% { transform: translate3d(-3px, 1px, 0); }
        }
        @keyframes map-glitch-bottom {
          0%, 64%, 100% { transform: translate3d(1px, 0, 0); }
          66% { transform: translate3d(-4px, 1px, 0); }
          70% { transform: translate3d(3px, 0, 0); }
        }
        @keyframes map-load-bar {
          0% { transform: translate3d(-120%, 0, 0); }
          100% { transform: translate3d(220%, 0, 0); }
        }
      `}</style>
    </main>
  );
}
