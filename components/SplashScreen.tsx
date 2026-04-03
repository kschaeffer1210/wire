"use client";

import { useEffect, useState } from "react";

function WMark({ size = 40, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={Math.round(size * 0.62)} viewBox="0 0 26 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 8H5.5L8 2L11 14L14 4.5L16.5 8H25"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SplashScreen() {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("in");

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("hold"), 700);
    const outTimer  = setTimeout(() => setPhase("out"),  2800);
    const doneTimer = setTimeout(() => setPhase("done"), 3600);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out ${
        phase === "out" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #111014 60%, #0d0b0c 100%)" }}
    >
      {/* Subtle blush radial bloom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 52%, rgba(196,138,148,0.10) 0%, rgba(196,138,148,0.03) 50%, transparent 70%)",
        }}
      />

      {/* Main content */}
      <div
        className={`relative flex flex-col items-center gap-7 transition-all duration-700 ease-out ${
          phase === "in" ? "opacity-0 translate-y-5" : "opacity-100 translate-y-0"
        }`}
      >
        {/* Logo mark */}
        <div className="relative">
          <div
            className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #c48a94 0%, #9a6570 100%)",
              boxShadow: "0 8px 32px rgba(196,138,148,0.25), 0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            <WMark size={36} color="white" />
          </div>
          {/* Soft glow behind logo */}
          <div
            className="absolute inset-0 -z-10 rounded-2xl blur-2xl scale-150 opacity-30"
            style={{ background: "rgba(196,138,148,0.4)" }}
          />
        </div>

        {/* Wordmark */}
        <div className="text-center">
          <h1
            className="font-black tracking-[0.12em] text-white mb-2.5"
            style={{ fontSize: "52px", lineHeight: 1, letterSpacing: "0.1em" }}
          >
            WIRE
          </h1>
          <p
            className="text-xs tracking-[0.28em] uppercase font-medium"
            style={{ color: "#7a7580", letterSpacing: "0.26em" }}
          >
            Workflow Intelligence &amp; ROI Engine
          </p>
        </div>

        {/* Rule */}
        <div className="flex items-center gap-3 w-48">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, #2a2a2a)" }} />
          <div className="w-1 h-1 rounded-full" style={{ background: "#c48a94", opacity: 0.6 }} />
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, #2a2a2a)" }} />
        </div>

        {/* Tagline */}
        <p className="text-center text-sm leading-relaxed" style={{ color: "#4a464e", maxWidth: "220px" }}>
          Analyze any workflow.<br />
          Calculate ROI. Build with AI.
        </p>

        {/* Progress bar */}
        <div className="w-32 h-[1.5px] rounded-full overflow-hidden" style={{ background: "#1e1c20" }}>
          <div
            className={`h-full rounded-full transition-all ease-out ${
              phase === "hold" || phase === "out" ? "w-full duration-[1900ms]" : "w-0 duration-500"
            }`}
            style={{ background: "linear-gradient(to right, #9a6570, #c48a94)" }}
          />
        </div>
      </div>

      {/* Skip */}
      <button
        onClick={() => setPhase("out")}
        className="absolute bottom-8 text-[10px] tracking-[0.2em] uppercase transition-colors duration-200 wire-skip-btn"
      >
        Skip
      </button>
    </div>
  );
}
