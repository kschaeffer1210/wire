"use client";

import Link from "next/link";
import { Settings, ShieldCheck } from "lucide-react";

function WMark({ size = 16, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 26 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export default function NavBar() {
  return (
    <nav className="border-b sticky top-0 z-50" style={{ backgroundColor: "#0d0b0c", borderColor: "#1f1c1e" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="rounded-md p-1.5 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #c48a94, #9a6570)" }}
            >
              <WMark size={16} color="white" />
            </div>
            <span className="text-white font-bold tracking-tight text-lg">WIRE</span>
            <span className="text-xs hidden sm:block mt-0.5" style={{ color: "#7a7580" }}>
              Workflow Intelligence &amp; ROI Engine
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/" className="wire-nav-link px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
              New Analysis
            </Link>
            <Link href="/projects" className="wire-nav-link px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
              Project Hub
            </Link>
            <Link href="/audit" className="wire-nav-link px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              AI Readiness Audit
            </Link>
            <Link href="/setup" className="wire-nav-icon p-1.5 rounded-md transition-colors" title="Setup & connection status">
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
