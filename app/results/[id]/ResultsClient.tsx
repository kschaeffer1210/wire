"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageSquare, Zap, Brain, Code2, Clock, Calendar,
  DollarSign, TrendingDown, ArrowLeft, ExternalLink,
  AlertTriangle, CheckCircle2, ChevronRight, Wrench,
  BarChart2, Play, CheckSquare, Loader2, ListChecks, Hammer,
  ShieldCheck, Lightbulb, XCircle, TrendingUp,
} from "lucide-react";
import type {
  WorkflowRecord, SolutionType, Effort, Impact,
  BuildGuide, AIReadinessAudit, ReadinessDimension,
} from "@/lib/types";
import WorkflowDiagram from "@/components/WorkflowDiagram";

/* ─── Config maps ─────────────────────────────────────────── */

const SOLUTION_CONFIG: Record<SolutionType, {
  color: string; bg: string; border: string; dot: string; icon: React.ReactNode;
}> = {
  Chatbot:    { color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   dot: "bg-blue-500",   icon: <MessageSquare className="h-3.5 w-3.5" /> },
  Automation: { color: "text-emerald-700",bg: "bg-emerald-50",border: "border-emerald-200",dot: "bg-emerald-500",icon: <Zap className="h-3.5 w-3.5" /> },
  Agent:      { color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500", icon: <Brain className="h-3.5 w-3.5" /> },
  "Vibe-code":{ color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-500",  icon: <Code2 className="h-3.5 w-3.5" /> },
};

const EFFORT_CONFIG: Record<Effort, { label: string; color: string }> = {
  low:    { label: "Low effort",  color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Med effort",  color: "bg-yellow-100  text-yellow-700"  },
  high:   { label: "High effort", color: "bg-red-100     text-red-700"     },
};

const IMPACT_CONFIG: Record<Impact, { label: string; color: string }> = {
  high:   { label: "High impact", color: "bg-purple-100 text-purple-700" },
  medium: { label: "Med impact",  color: "bg-blue-100   text-blue-700"   },
  low:    { label: "Low impact",  color: "bg-gray-100   text-gray-600"   },
};

const PHASE_COLORS = [
  { ring: "ring-[#c48a94]",   dot: "bg-[#9a6570]",   line: "from-[#e8c0c5]"  },
  { ring: "ring-purple-500",  dot: "bg-purple-600",  line: "from-purple-200" },
  { ring: "ring-pink-500",    dot: "bg-pink-600",    line: "from-pink-200"   },
];

/* ─── Readiness level config ──────────────────────────────── */

const LEVEL_CONFIG: Record<string, {
  color: string; bg: string; border: string; textColor: string; barColor: string;
}> = {
  "Ad Hoc":     { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", textColor: "text-red-700",     barColor: "#dc2626" },
  "Developing": { color: "#d97706", bg: "#fffbeb", border: "#fde68a", textColor: "text-amber-700",   barColor: "#d97706" },
  "Established":{ color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", textColor: "text-sky-700",     barColor: "#0284c7" },
  "Advanced":   { color: "#059669", bg: "#f0fdf4", border: "#a7f3d0", textColor: "text-emerald-700", barColor: "#059669" },
  "Leading":    { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", textColor: "text-violet-700",  barColor: "#7c3aed" },
};

function getLevelConfig(level: string) {
  return LEVEL_CONFIG[level] ?? LEVEL_CONFIG["Developing"];
}

/* ─── Animated counter hook ──────────────────────────────── */

function useCountUp(target: number, duration = 1400, delay = 0) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      function tick(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) raf.current = requestAnimationFrame(tick);
      }
      raf.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, delay]);

  return value;
}

/* ─── Staggered reveal hook ──────────────────────────────── */

function useReveal(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
}

/* ─── Metric card ────────────────────────────────────────── */

function MetricCard({
  icon, label, value, suffix, prefix, color, delay,
}: {
  icon: React.ReactNode; label: string; value: number; suffix?: string;
  prefix?: string; color: string; delay: number;
}) {
  const animated = useCountUp(value, 1200, delay + 200);
  const visible = useReveal(delay);

  return (
    <div
      className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-3">
        {icon}
        {label}
      </div>
      <div className={`text-3xl font-bold tracking-tight ${color}`}>
        {prefix}{animated.toLocaleString()}{suffix}
      </div>
    </div>
  );
}

/* ─── Format currency ────────────────────────────────────── */

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(n);
}

/* ─── SVG Radar Chart ────────────────────────────────────── */

function RadarChart({ dimensions }: { dimensions: ReadinessDimension[] }) {
  const N = dimensions.length;
  const cx = 220, cy = 200, r = 138;

  const angleRad = (i: number) => -Math.PI / 2 + (2 * Math.PI / N) * i;

  const pt = (i: number, score: number) => ({
    x: cx + (score / 5) * r * Math.cos(angleRad(i)),
    y: cy + (score / 5) * r * Math.sin(angleRad(i)),
  });

  const polyPoints = (scores: number[]) =>
    scores.map((s, i) => `${pt(i, s).x.toFixed(1)},${pt(i, s).y.toFixed(1)}`).join(" ");

  const scorePolygon = polyPoints(dimensions.map((d) => d.score));
  const benchPolygon = polyPoints(dimensions.map(() => 3.0));

  const dotColor = (score: number) => {
    if (score >= 4.5) return "#7c3aed";
    if (score >= 3.5) return "#059669";
    if (score >= 2.5) return "#0284c7";
    if (score >= 1.5) return "#d97706";
    return "#dc2626";
  };

  return (
    <svg viewBox="-55 -25 550 460" className="w-full" style={{ maxHeight: 390 }}>
      {/* Grid rings */}
      {[1, 2, 3, 4, 5].map((g) => (
        <polygon
          key={g}
          points={polyPoints(dimensions.map(() => g))}
          fill="none"
          stroke={g === 3 ? "#94a3b8" : "#e5e7eb"}
          strokeWidth={g === 5 ? 1.5 : 1}
          strokeDasharray={g === 3 ? "4,3" : undefined}
        />
      ))}

      {/* Axis lines */}
      {dimensions.map((_, i) => {
        const outer = pt(i, 5);
        return (
          <line key={i} x1={cx} y1={cy}
            x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
            stroke="#e5e7eb" strokeWidth={1}
          />
        );
      })}

      {/* Benchmark polygon (industry avg ~3.0) */}
      <polygon
        points={benchPolygon}
        fill="rgba(148,163,184,0.08)"
        stroke="#94a3b8"
        strokeWidth={1.5}
        strokeDasharray="5,4"
      />

      {/* Score polygon */}
      <polygon
        points={scorePolygon}
        fill="rgba(30,30,30,0.09)"
        stroke="#1e1e1e"
        strokeWidth={2.5}
      />

      {/* Score dots */}
      {dimensions.map((d, i) => {
        const p = pt(i, d.score);
        return (
          <circle
            key={i}
            cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
            r={5.5} fill={dotColor(d.score)} stroke="white" strokeWidth={1.5}
          />
        );
      })}

      {/* Axis labels */}
      {dimensions.map((d, i) => {
        const labelR = r * 1.32;
        const lx = cx + labelR * Math.cos(angleRad(i));
        const ly = cy + labelR * Math.sin(angleRad(i));
        const anchor = lx < cx - 12 ? "end" : lx > cx + 12 ? "start" : "middle";
        return (
          <text
            key={i}
            x={lx.toFixed(1)} y={ly.toFixed(1)}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={11.5}
            fill="#374151"
            fontWeight={600}
          >
            {d.dimension}
          </text>
        );
      })}

      {/* Grid level numbers on top axis */}
      {[1, 2, 3, 4, 5].map((g) => {
        const p = pt(0, g);
        return (
          <text key={g} x={p.x + 5} y={p.y}
            fontSize={8.5} fill="#9ca3af" textAnchor="start" dominantBaseline="middle"
          >
            {g}
          </text>
        );
      })}

      {/* Legend */}
      <g transform="translate(0, 425)">
        <line x1={20} y1={0} x2={48} y2={0} stroke="#1e1e1e" strokeWidth={2.5} />
        <circle cx={34} cy={0} r={4} fill="#1e1e1e" />
        <text x={54} y={0} fontSize={10.5} fill="#6b7280" dominantBaseline="middle">This workflow</text>
        <line x1={160} y1={0} x2={188} y2={0} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,4" />
        <text x={194} y={0} fontSize={10.5} fill="#6b7280" dominantBaseline="middle">Industry average (3.0)</text>
      </g>
    </svg>
  );
}

/* ─── Dimension Score Card ───────────────────────────────── */

function DimensionCard({ dim }: { dim: ReadinessDimension }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = getLevelConfig(dim.level);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-semibold text-sm text-gray-900">{dim.dimension}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}
              >
                {dim.level}
              </span>
              <span className="text-lg font-bold tabular-nums" style={{ color: cfg.color }}>
                {dim.score}<span className="text-xs text-gray-400 font-normal">/5</span>
              </span>
            </div>
          </div>
          {/* Score bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(dim.score / 5) * 100}%`, backgroundColor: cfg.barColor }}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-500 leading-relaxed">{dim.summary}</p>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 text-left text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-t border-gray-50 flex items-center gap-1 transition-colors"
      >
        <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
        {expanded ? "Hide" : "View"} findings &amp; recommendation
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-50 bg-gray-50/40">
          {/* Findings */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Findings</p>
            <ul className="space-y-1.5">
              {dim.findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: cfg.barColor }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          {/* Recommendation */}
          <div
            className="rounded-lg px-3 py-2.5"
            style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: cfg.color }}>Recommendation</p>
            <p className="text-xs leading-relaxed" style={{ color: cfg.color }}>{dim.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Automation Fit Gauge ───────────────────────────────── */

function AutomationFitGauge({ score, rationale }: { score: number; rationale: string }) {
  const pct = ((score - 1) / 9) * 100;
  const color = score >= 8 ? "#059669" : score >= 6 ? "#0284c7" : score >= 4 ? "#d97706" : "#dc2626";
  const label = score >= 8 ? "Excellent Fit" : score >= 6 ? "Strong Fit" : score >= 4 ? "Moderate Fit" : "Weak Fit";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <TrendingUp className="h-4 w-4" style={{ color: "#b07880" }} />
        <h2 className="font-semibold text-gray-900">Automation Fit Score</h2>
        <span className="ml-auto text-xs text-gray-400">Specific to this workflow</span>
      </div>

      <div className="flex items-end gap-4 mb-4">
        <div className="text-6xl font-black tabular-nums tracking-tight" style={{ color }}>
          {score}
        </div>
        <div className="pb-1.5">
          <p className="text-xs text-gray-400">out of 10</p>
          <p className="text-sm font-bold" style={{ color }}>{label}</p>
        </div>
      </div>

      {/* Gauge bar */}
      <div className="relative mb-4">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(to right, #dc2626, #d97706, #0284c7, #059669)`,
            }}
          />
        </div>
        {/* Tick marks */}
        <div className="flex justify-between mt-1">
          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
            <span key={n} className="text-[9px] text-gray-300 tabular-nums">{n}</span>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 leading-relaxed">{rationale}</p>
    </div>
  );
}

/* ─── Build Guide view ───────────────────────────────────── */

type PanelState = "idle" | "loading" | "done" | "error";

function BuildGuidePanel({ record }: { record: WorkflowRecord }) {
  const [state, setState] = useState<PanelState>("idle");
  const [guide, setGuide] = useState<BuildGuide | null>(null);
  const [error, setError] = useState("");

  async function generateGuide() {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/build-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: record.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to generate guide");
      setGuide(data.guide);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }

  if (state === "idle") {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-8 py-12 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "#fdf0f2" }}>
            <Hammer className="h-8 w-8" style={{ color: "#b07880" }} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Ready to build this {record.solutionType}?
          </h3>
          <p className="text-sm text-gray-500 mb-1 max-w-sm mx-auto leading-relaxed">
            Get a visual workflow diagram and step-by-step build instructions tailored to
            your {record.context === "NextEra Energy" ? "Microsoft enterprise" : "tool"} stack.
          </p>
          {record.buildSpec?.estimated_build_time && (
            <p className="text-xs font-medium mb-6" style={{ color: "#b07880" }}>
              Estimated build time: {record.buildSpec.estimated_build_time}
            </p>
          )}
          <button
            onClick={generateGuide}
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow"
            style={{ backgroundColor: "#1e1e1e" }}
          >
            <Play className="h-4 w-4" />
            Generate Build Instructions
          </button>
        </div>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: "#b07880" }} />
        <p className="text-sm font-medium text-gray-700">Generating your build guide...</p>
        <p className="text-xs text-gray-400 mt-1">Claude is mapping the workflow and writing step-by-step instructions</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-red-800 mb-1">Failed to generate build guide</p>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button
          onClick={generateGuide}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!guide) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-white rounded-2xl px-6 py-4" style={{ backgroundColor: "#1e1e1e" }}>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#e8c0c5" }}>Build Guide</p>
          <p className="font-bold">{record.name}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs mb-0.5" style={{ color: "#e8c0c5" }}>Total build time</p>
          <p className="font-bold text-lg">{guide.total_build_time}</p>
        </div>
      </div>

      <WorkflowDiagram guide={guide} />

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5">
          <Wrench className="h-4 w-4" style={{ color: "#b07880" }} />
          <h2 className="font-semibold text-gray-900">Step-by-Step Build Instructions</h2>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {guide.build_steps.length} steps
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {guide.build_steps.map((step) => (
            <div key={step.step} className="px-6 py-5">
              <div className="flex gap-4">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center"
                  style={{ backgroundColor: "#1e1e1e" }}
                >
                  {step.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 mb-3">
                    <span className="font-semibold text-gray-900">{step.title}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "#fdf0f2", color: "#9a6570", border: "1px solid #e8c0c5" }}
                    >
                      {step.tool}
                    </span>
                    <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {step.time_estimate}
                    </span>
                  </div>
                  <ol className="space-y-2 mb-3">
                    {step.instructions.map((inst, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <span className="flex-shrink-0 w-5 h-5 rounded bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center mt-0.5">
                          {j + 1}
                        </span>
                        <span className="leading-relaxed">{inst}</span>
                      </li>
                    ))}
                  </ol>
                  {step.tip && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <span className="text-amber-500 text-xs font-bold flex-shrink-0 mt-0.5">TIP</span>
                      <span className="text-xs text-amber-700 leading-relaxed">{step.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {guide.test_plan.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5">
            <ListChecks className="h-4 w-4" style={{ color: "#b07880" }} />
            <h2 className="font-semibold text-gray-900">Test Plan</h2>
          </div>
          <div className="px-6 py-4">
            <ul className="space-y-2.5">
              {guide.test_plan.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <CheckSquare className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {guide.go_live_checklist.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-100 flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h2 className="font-semibold text-emerald-900">Go-Live Checklist</h2>
          </div>
          <div className="px-6 py-4">
            <ul className="space-y-2.5">
              {guide.go_live_checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-emerald-800">
                  <ChevronRight className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {record.context === "NextEra Energy" && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center mt-0.5">
            <Zap className="h-3.5 w-3.5 text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sky-800 mb-0.5">NextEra Enterprise Stack</p>
            <p className="text-xs text-sky-600 leading-relaxed">
              All tools constrained to Microsoft 365 / Azure ecosystem per enterprise policy.
              Microsoft Copilot Studio and Power Automate are the standard platforms for agents and automation.
              Data must remain within your Microsoft cloud tenancy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── AI Readiness Audit Panel ───────────────────────────── */

function AIReadinessPanel({ record }: { record: WorkflowRecord }) {
  const [state, setState] = useState<PanelState>("idle");
  const [audit, setAudit] = useState<AIReadinessAudit | null>(null);
  const [error, setError] = useState("");

  async function generateAudit() {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/ai-readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: record.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to generate audit");
      setAudit(data.audit);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }

  /* ── Idle CTA ── */
  if (state === "idle") {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-8 py-14 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: "#f0f9ff" }}
          >
            <ShieldCheck className="h-8 w-8 text-sky-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">AI Readiness Audit</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
            Get a rigorous, workflow-specific readiness assessment across 7 dimensions —
            scored, benchmarked against industry averages, and paired with a prioritized action roadmap.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8 text-xs text-gray-400">
            {["Process Maturity","Data Readiness","Tech Fit","Talent & Change","Governance","Strategic Fit","Automation Fit"].map((d) => (
              <span key={d} className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full font-medium">{d}</span>
            ))}
          </div>
          <button
            onClick={generateAudit}
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
            style={{ backgroundColor: "#1e1e1e" }}
          >
            <ShieldCheck className="h-4 w-4" />
            Run AI Readiness Audit
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (state === "loading") {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-14 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: "#0284c7" }} />
        <p className="text-sm font-medium text-gray-700">Running your AI Readiness Audit...</p>
        <p className="text-xs text-gray-400 mt-1">Claude is assessing 7 dimensions and building your action roadmap</p>
      </div>
    );
  }

  /* ── Error ── */
  if (state === "error") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-red-800 mb-1">Audit failed</p>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button
          onClick={generateAudit}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!audit) return null;

  const overallCfg = getLevelConfig(audit.overall_level);
  const overallLevelNum = ["Ad Hoc","Developing","Established","Advanced","Leading"].indexOf(audit.overall_level) + 1;

  return (
    <div className="space-y-6">

      {/* ── Overall score banner ── */}
      <div
        className="rounded-2xl p-6 border"
        style={{ backgroundColor: overallCfg.bg, borderColor: overallCfg.border }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span
                className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
                style={{ color: overallCfg.color, backgroundColor: "white", borderColor: overallCfg.border }}
              >
                Level {overallLevelNum} of 5 — {audit.overall_level}
              </span>
            </div>
            <p className="text-sm leading-relaxed mt-3" style={{ color: overallCfg.color }}>
              {audit.overall_summary}
            </p>
          </div>
          <div className="text-center flex-shrink-0 sm:pl-6 sm:border-l" style={{ borderColor: overallCfg.border }}>
            <div className="text-6xl font-black tabular-nums leading-none" style={{ color: overallCfg.color }}>
              {audit.overall_score.toFixed(1)}
            </div>
            <div className="text-xs mt-1 font-medium" style={{ color: overallCfg.color, opacity: 0.7 }}>
              out of 5.0
            </div>
          </div>
        </div>
        {audit.benchmark_context && (
          <div
            className="mt-4 pt-4 border-t text-xs leading-relaxed"
            style={{ borderColor: overallCfg.border, color: overallCfg.color, opacity: 0.8 }}
          >
            {audit.benchmark_context}
          </div>
        )}
      </div>

      {/* ── Radar chart ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <BarChart2 className="h-4 w-4" style={{ color: "#b07880" }} />
          <h2 className="font-semibold text-gray-900">Readiness Profile</h2>
          <span className="ml-auto text-xs text-gray-400">7-dimension assessment</span>
        </div>
        <RadarChart dimensions={audit.dimensions} />
      </div>

      {/* ── Dimension score cards ── */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" style={{ color: "#b07880" }} />
          Dimension Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {audit.dimensions.map((dim) => (
            <DimensionCard key={dim.dimension} dim={dim} />
          ))}
        </div>
      </div>

      {/* ── Top blockers + Quick wins ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Blockers */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Top Blockers</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {audit.top_blockers.map((b, i) => (
              <li key={i} className="px-5 py-3.5 flex items-start gap-3">
                <span
                  className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick wins */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Quick Wins</h2>
            <span className="ml-auto text-xs text-gray-400">Next 30 days</span>
          </div>
          <ul className="divide-y divide-gray-50">
            {audit.quick_wins.map((w, i) => (
              <li key={i} className="px-5 py-3.5 flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 leading-relaxed">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Automation Fit Gauge ── */}
      <AutomationFitGauge
        score={audit.automation_fit_score}
        rationale={audit.automation_fit_rationale}
      />

      {/* ── Phased roadmap ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5">
          <Calendar className="h-4 w-4" style={{ color: "#b07880" }} />
          <h2 className="font-semibold text-gray-900">Readiness Roadmap</h2>
        </div>
        <div className="p-6 space-y-0">
          {audit.phased_roadmap.map((phase, i) => {
            const colors = PHASE_COLORS[i] ?? PHASE_COLORS[0];
            return (
              <div key={i} className="flex gap-5">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full ${colors.dot} text-white text-sm font-bold flex items-center justify-center ring-4 ring-white flex-shrink-0`}
                  >
                    {phase.phase}
                  </div>
                  {i < audit.phased_roadmap.length - 1 && (
                    <div className={`w-0.5 flex-1 my-1 bg-gradient-to-b ${colors.line} to-gray-100 min-h-[1.5rem]`} />
                  )}
                </div>
                <div className="flex-1 pb-7">
                  <div className="flex flex-wrap items-baseline gap-2 mb-2">
                    <span className="font-bold text-gray-900 text-sm">{phase.title}</span>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {phase.timeline}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {phase.actions.map((action, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */

type Tab = "analysis" | "build" | "readiness";

export default function ResultsClient({ record }: { record: WorkflowRecord }) {
  const solution = SOLUTION_CONFIG[record.solutionType] ?? SOLUTION_CONFIG.Automation;
  const techStack = record.recommendedStack
    ? record.recommendedStack.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const [activeTab, setActiveTab] = useState<Tab>("analysis");

  const headerVisible   = useReveal(0);
  const section1Visible = useReveal(200);
  const section2Visible = useReveal(400);
  const section3Visible = useReveal(550);
  const section4Visible = useReveal(700);
  const actionsVisible  = useReveal(850);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "analysis",  label: "Analysis",         icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { id: "build",     label: "Build Guide",       icon: <Hammer className="h-3.5 w-3.5" />, badge: "AI" },
    { id: "readiness", label: "Readiness Audit",   icon: <ShieldCheck className="h-3.5 w-3.5" />, badge: "AI" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

      {/* ── Header ── */}
      <div
        className={`transition-all duration-500 ${
          headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${solution.bg} ${solution.color} ${solution.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${solution.dot}`} />
                {solution.icon}
                {record.solutionType}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                {record.context}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: "#fdf0f2", color: "#9a6570" }}>
                {record.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-snug">
              {record.name}
            </h1>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">{record.summary}</p>
          </div>
        </div>
      </div>

      {/* ── ROI metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard delay={100} icon={<Clock className="h-3.5 w-3.5" />} label="Hours saved / week"
          value={record.hoursSavedPerWeek} suffix=" hrs" color="text-gray-900" />
        <MetricCard delay={200} icon={<Calendar className="h-3.5 w-3.5" />} label="Hours saved / year"
          value={record.hoursSavedPerYear} suffix=" hrs" color="text-gray-900" />
        <MetricCard delay={300} icon={<DollarSign className="h-3.5 w-3.5" />} label="Annual value"
          value={record.annualValue} prefix="$" color="text-emerald-600" />
        <MetricCard delay={400} icon={<TrendingDown className="h-3.5 w-3.5" />} label="Time reduction"
          value={record.timeReductionPct} suffix="%" color="text-[#9a6570]" />
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex items-center gap-0 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === tab.id
                ? "border-[#1e1e1e] text-[#1e1e1e]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className="ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#fdf0f2", color: "#9a6570" }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════ ANALYSIS TAB ════════════════ */}
      {activeTab === "analysis" && (
        <>
          {record.opportunities.length > 0 && (
            <div
              className={`bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all duration-500 ${
                section1Visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5" style={{ color: "#b07880" }} />
                <h2 className="font-semibold text-gray-900">AI Opportunities</h2>
                <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {record.opportunities.length} identified
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {record.opportunities.map((opp, i) => (
                  <div key={i} className="px-6 py-4 flex gap-4 hover:bg-gray-50/50 transition-colors">
                    <div
                      className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                      style={{ backgroundColor: "#1e1e1e" }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-medium text-sm text-gray-900">{opp.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EFFORT_CONFIG[opp.effort]?.color ?? "bg-gray-100 text-gray-600"}`}>
                          {EFFORT_CONFIG[opp.effort]?.label ?? opp.effort}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${IMPACT_CONFIG[opp.impact]?.color ?? "bg-gray-100 text-gray-600"}`}>
                          {IMPACT_CONFIG[opp.impact]?.label ?? opp.impact}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{opp.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {techStack.length > 0 && (
            <div
              className={`bg-white border border-gray-100 rounded-2xl shadow-sm p-6 transition-all duration-500 ${
                section2Visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <Code2 className="h-4 w-4" style={{ color: "#b07880" }} />
                <h2 className="font-semibold text-gray-900">Recommended Stack</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tool, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg font-medium transition-colors cursor-default"
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fdf0f2"; e.currentTarget.style.borderColor = "#e8c0c5"; e.currentTarget.style.color = "#7d4d57"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {record.roadmap.length > 0 && (
            <div
              className={`bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all duration-500 ${
                section3Visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5">
                <Calendar className="h-4 w-4" style={{ color: "#b07880" }} />
                <h2 className="font-semibold text-gray-900">Implementation Roadmap</h2>
              </div>
              <div className="p-6 space-y-0">
                {record.roadmap.map((phase, i) => {
                  const colors = PHASE_COLORS[i] ?? PHASE_COLORS[0];
                  return (
                    <div key={i} className="flex gap-5">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full ${colors.dot} text-white text-sm font-bold flex items-center justify-center ring-4 ring-white flex-shrink-0`}
                        >
                          {phase.phase}
                        </div>
                        {i < record.roadmap.length - 1 && (
                          <div className={`w-0.5 flex-1 my-1 bg-gradient-to-b ${colors.line} to-gray-100 min-h-[1.5rem]`} />
                        )}
                      </div>
                      <div className="flex-1 pb-7">
                        <div className="flex flex-wrap items-baseline gap-2 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{phase.label}</span>
                          <span className="font-semibold text-gray-900 text-sm">{phase.title}</span>
                          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {phase.timeline}
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {phase.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                              <ChevronRight className="h-3.5 w-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className={`border border-amber-200 bg-amber-50 rounded-2xl p-5 transition-all duration-500 ${
              section4Visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-amber-900 text-sm">Risks &amp; Considerations</h3>
            </div>
            <p className="text-sm text-amber-700 leading-relaxed">
              Review implementation details and edge cases in the full Notion record before building.
              Factor in change management, data quality, and integration complexity.
            </p>
          </div>

          {record.annualValue > 0 && (
            <div className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 text-center">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">
                Total annual value unlocked
              </p>
              <p className="text-4xl font-bold text-emerald-700 tracking-tight">
                {formatCurrency(record.annualValue)}
              </p>
              <p className="text-xs text-emerald-500 mt-1">
                at ${record.hourlyRate}/hr &middot; {record.timeReductionPct}% time reduction
              </p>
            </div>
          )}
        </>
      )}

      {/* ════════════════ BUILD GUIDE TAB ════════════════ */}
      {activeTab === "build" && <BuildGuidePanel record={record} />}

      {/* ════════════════ READINESS AUDIT TAB ════════════════ */}
      {activeTab === "readiness" && <AIReadinessPanel record={record} />}

      {/* ── Actions (always visible) ── */}
      <div
        className={`flex flex-col sm:flex-row gap-2.5 transition-all duration-500 pt-2 ${
          actionsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 rounded-lg font-medium text-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          New analysis
        </Link>
        <a
          href={record.notionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-all"
        >
          <ExternalLink className="h-4 w-4" />
          Open in Notion
        </a>
        <Link
          href="/projects"
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg font-medium text-sm transition-all ml-auto"
          style={{ backgroundColor: "#1e1e1e" }}
        >
          View all projects
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
