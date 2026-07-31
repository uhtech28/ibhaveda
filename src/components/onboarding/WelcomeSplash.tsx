"use client";

/**
 * WelcomeSplash — full-screen "Congratulations!" overlay shown for a
 * few seconds right after signup, then auto-fades to the profile
 * setup form. Faithful port of the standalone HTML mock:
 *   - radial gradient background (violet/rose/amber wash)
 *   - IBHAVEDA wordmark with gradient text
 *   - animated conic-gradient ring around a checkmark
 *   - subtle confetti canvas
 *   - staggered rise-in animations
 *
 * Only depends on inline styles and a small style-jsx block for
 * keyframes — no CSS module or global stylesheet updates.
 */

import { useEffect, useRef } from "react";

interface Props {
  /** ms to keep the splash visible before firing onDone. Default 2500. */
  durationMs?: number;
  onDone: () => void;
}

export function WelcomeSplash({ durationMs = 2500, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Confetti animation — matches the HTML mock's ambient + burst mix.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#f6c977", "#e2739a", "#8f5ce8", "#5aa9e6", "#e8c46a", "#c084fc"];

    interface Piece {
      x: number;
      y: number;
      size: number;
      color: string;
      speedY: number;
      speedX: number;
      rot: number;
      rotSpeed: number;
      opacity: number;
      shape: "square" | "rect";
      life?: number;
    }

    const make = (burst: boolean): Piece => ({
      x: Math.random() * W,
      y: burst ? H * 0.35 + (Math.random() - 0.5) * 60 : -20 - Math.random() * H,
      size: 3 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: 0.6 + Math.random() * 1.6,
      speedX: (Math.random() - 0.5) * 0.9,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 4,
      opacity: 0.35 + Math.random() * 0.55,
      shape: Math.random() > 0.5 ? "square" : "rect",
    });

    const pieces: Piece[] = [];
    const ambient = window.innerWidth < 600 ? 26 : 46;
    for (let i = 0; i < ambient; i++) pieces.push(make(false));
    for (let i = 0; i < 60; i++) {
      const p = make(true);
      p.speedY = 1.5 + Math.random() * 3;
      p.speedX = (Math.random() - 0.5) * 3.5;
      p.life = 160;
      pieces.push(p);
    }

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        if (p.shape === "square") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
        p.y += p.speedY;
        p.x += p.speedX;
        p.rot += p.rotSpeed;
        if (p.life !== undefined) {
          p.life--;
          if (p.life <= 0) pieces[i] = make(false);
        } else if (p.y > H + 20) {
          Object.assign(p, make(false), { y: -20 });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Auto-dismiss.
  useEffect(() => {
    const t = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs, onDone]);

  return (
    <div className="welcome-splash">
      <canvas ref={canvasRef} className="welcome-confetti" />
      <div className="welcome-wrap">
        <div className="welcome-logo-block">
          <div className="welcome-wordmark">IBHAVEDA</div>
        </div>

        <div className="welcome-check-block">
          <div className="welcome-check-ring">
            <div className="welcome-ring-glow" />
            <div className="welcome-ring-outer" />
            <svg viewBox="0 0 50 50" fill="none">
              <defs>
                <linearGradient
                  id="welcomeCheckGradient"
                  x1="0"
                  y1="0"
                  x2="50"
                  y2="50"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#f6c977" />
                  <stop offset="55%" stopColor="#e2739a" />
                  <stop offset="100%" stopColor="#8f5ce8" />
                </linearGradient>
              </defs>
              <path d="M12 26L21 35L39 15" />
            </svg>
          </div>
        </div>

        <h1 className="welcome-h1">Congratulations!</h1>
        <p className="welcome-subtext">
          Your account has been created successfully.
          <br />
          You&apos;re all set to start your journey with <b>IBHAVEDA</b>.
        </p>
      </div>

      <style jsx>{`
        .welcome-splash {
          position: fixed;
          inset: 0;
          z-index: 100000;
          color: #f6f4fa;
          font-family: "Inter", system-ui, sans-serif;
          overflow: hidden;
          background:
            radial-gradient(ellipse 900px 600px at 50% -5%, rgba(143, 92, 232, 0.2), transparent 60%),
            radial-gradient(ellipse 700px 500px at 85% 15%, rgba(226, 115, 154, 0.1), transparent 60%),
            radial-gradient(ellipse 700px 500px at 10% 30%, rgba(246, 178, 94, 0.08), transparent 60%),
            linear-gradient(180deg, #07050c 0%, #0d0a17 45%, #140f22 100%);
          animation: welcomeFadeIn 0.4s ease-out;
        }
        .welcome-confetti {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }
        .welcome-wrap {
          position: relative;
          z-index: 2;
          max-width: 640px;
          margin: 0 auto;
          padding: 74px 28px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .welcome-logo-block {
          opacity: 0;
          transform: translateY(14px) scale(0.94);
          animation: welcomeRiseIn 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s forwards;
        }
        .welcome-wordmark {
          font-family: "Space Grotesk", "Inter", sans-serif;
          font-weight: 700;
          font-size: clamp(40px, 11vw, 78px);
          letter-spacing: clamp(3px, 1.4vw, 10px);
          text-transform: uppercase;
          line-height: 1;
          margin-bottom: 42px;
          background: linear-gradient(120deg, #f6b25e 0%, #e2739a 50%, #8f5ce8 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          filter: drop-shadow(0 8px 30px rgba(226, 115, 154, 0.28));
        }
        .welcome-check-block {
          opacity: 0;
          transform: translateY(14px) scale(0.94);
          animation: welcomeRiseIn 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.35s forwards;
          margin-bottom: 32px;
        }
        .welcome-check-ring {
          width: 118px;
          height: 118px;
          border-radius: 50%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .welcome-check-ring .welcome-ring-outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(from 200deg, #f6b25e, #e2739a, #8f5ce8, #5c3bb8, #f6b25e);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.4px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.4px));
          animation: welcomeSpin 6s linear infinite;
        }
        .welcome-check-ring .welcome-ring-glow {
          position: absolute;
          inset: -26px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(226, 115, 154, 0.28), rgba(143, 92, 232, 0.16) 55%, transparent 75%);
          filter: blur(10px);
          animation: welcomeGlowPulse 3.2s ease-in-out infinite 0.4s;
        }
        .welcome-check-ring :global(svg) {
          width: 50px;
          height: 50px;
          position: relative;
          z-index: 1;
        }
        .welcome-check-ring :global(path) {
          fill: none;
          stroke: url(#welcomeCheckGradient);
          stroke-width: 7;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: welcomeDrawCheck 0.6s ease-out 0.9s forwards;
        }
        .welcome-h1 {
          font-family: "Space Grotesk", "Inter", sans-serif;
          font-weight: 700;
          font-size: clamp(38px, 8vw, 58px);
          line-height: 1.05;
          letter-spacing: -0.5px;
          color: #f6f4fa;
          opacity: 0;
          transform: translateY(16px);
          animation: welcomeRiseIn 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s forwards;
          margin-bottom: 18px;
        }
        .welcome-subtext {
          opacity: 0;
          transform: translateY(14px);
          animation: welcomeRiseIn 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.62s forwards;
          color: #a49bc0;
          font-size: 16px;
          line-height: 1.65;
          max-width: 420px;
        }
        .welcome-subtext :global(b) {
          color: #e8c46a;
          font-weight: 600;
        }
        @keyframes welcomeFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes welcomeRiseIn {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes welcomeSpin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes welcomeGlowPulse {
          0%,
          100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }
        @keyframes welcomeDrawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
