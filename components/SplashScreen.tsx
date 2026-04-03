"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, BarChart2, FolderOpen, ArrowRight } from "lucide-react";

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

const NAV_OPTIONS = [
  {
    href: "/audit",
    icon: <ShieldCheck className="h-5 w-5" />,
    label: "AI Readiness Audit",
    sub: "Assess & score a client",
  },
  {
    href: "/",
    icon: <BarChart2 className="h-5 w-5" />,
    label: "New Analysis",
    sub: "Analyze a workflow",
  },
  {
    href: "/projects",
    icon: <FolderOpen className="h-5 w-5" />,
    label: "Project Hub",
    sub: "View all workflows",
  },
];

export default function SplashScreen() {
  const [phase, setPhase] = useState<"in" | "hold" | "nav" | "out" | "done">("in");
  const router = useRouter();

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("hold"), 700);
    const navTimer  = setTimeout(() => setPhase("nav"),  2000);
    // No auto-dismiss — user must pick a destination or skip

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(navTimer);
    };
  }, []);

  function navigate(href: string) {
    setPhase("out");
    setTimeout(() => {
      setPhase("done");
      router.push(href);
    }, 600);
  }

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out ${
        phase === "out" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #111014 60%, #0d0b0c 100%)" }}
    >
      {/* Blush radial bloom */}
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
        {/* Logo */}
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

        {/* Nav options — appear after hold */}
        <div
          className={`transition-all duration-500 ${
            phase === "nav" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          <p className="text-center text-[10px] uppercase tracking-[0.22em] font-medium mb-4" style={{ color: "#3a373c" }}>
            Where would you like to go?
          </p>
          <div className="flex flex-col gap-2.5 w-72">
            {NAV_OPTIONS.map((opt) => (
              <button
                key={opt.href}
                onClick={() => navigate(opt.href)}
                className="flex items-center gap-4 px-4 py-3 rounded-xl border text-left transition-all group"
                style={{ borderColor: "#1f1c1e", backgroundColor: "#111014" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3a373c";
                  e.currentTarget.style.backgroundColor = "#1a181b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1f1c1e";
                  e.currentTarget.style.backgroundColor = "#111014";
                }}
              >
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#1a181b", color: "#c48a94" }}
                >
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{opt.label}</p>
                  <p className="text-xs" style={{ color: "#4a464e" }}>{opt.sub}</p>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#7a7580" }} />
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar (visible before nav appears) */}
        {phase !== "nav" && (
          <div className="w-32 h-[1.5px] rounded-full overflow-hidden" style={{ background: "#1e1c20" }}>
            <div
              className={`h-full rounded-full transition-all ease-out ${
                phase === "hold" ? "w-full duration-[1200ms]" : "w-0 duration-500"
              }`}
              style={{ background: "linear-gradient(to right, #9a6570, #c48a94)" }}
            />
          </div>
        )}
      </div>

      {/* Skip */}
      <button
        onClick={() => navigate("/")}
        className="absolute bottom-8 text-[10px] tracking-[0.2em] uppercase transition-colors duration-200 wire-skip-btn"
      >
        Skip
      </button>
    </div>
  );
}
