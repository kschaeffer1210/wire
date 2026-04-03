"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageSquare, Zap, Brain, Code2, Clock, Calendar,
  DollarSign, TrendingDown, ArrowLeft, ExternalLink,
  AlertTriangle, CheckCircle2, ChevronRight, Wrench,
  Database, Cpu, Globe, Layout, BarChart2, Plug,
  Play, CheckSquare, Loader2, ListChecks, Hammer,
} from "lucide-react";
import type { WorkflowRecord, SolutionType, Effort, Impact, BuildGuide } from "@/lib/types";
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

/* ─── Category icon map ──────────────────────────────────── */

const _CATEGORY_ICONS: Record<string, React.ReactNode> = { // eslint-disable-line @typescript-eslint/no-unused-vars
  "AI Model":    <Cpu className="h-3.5 w-3.5" />,
  Automation:    <Zap className="h-3.5 w-3.5" />,
  Integration:   <Plug className="h-3.5 w-3.5" />,
  Frontend:      <Layout className="h-3.5 w-3.5" />,
  Data:          <Database className="h-3.5 w-3.5" />,
  Analytics:     <BarChart2 className="h-3.5 w-3.5" />,
  Platform:      <Globe className="h-3.5 w-3.5" />,
};

/* ─── Build Guide view ───────────────────────────────────── */

type BuildState = "idle" | "loading" | "done" | "error";

function BuildGuidePanel({ record }: { record: WorkflowRecord }) {
  const [state, setState] = useState<BuildState>("idle");
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

  /* CTA prompt */
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
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow" style={{ backgroundColor: "#1e1e1e" }}
          >
            <Play className="h-4 w-4" />
            Generate Build Instructions
          </button>
        </div>
      </div>
    );
  }

  /* Loading state */
  if (state === "loading") {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: "#b07880" }} />
        <p className="text-sm font-medium text-gray-700">Generating your build guide...</p>
        <p className="text-xs text-gray-400 mt-1">Claude is mapping the workflow and writing step-by-step instructions</p>
      </div>
    );
  }

  /* Error state */
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

  /* Guide is ready */
  if (!guide) return null;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
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

      {/* Workflow Diagram */}
      <WorkflowDiagram guide={guide} />

      {/* Step-by-step build instructions */}
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
                {/* Step number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center" style={{ backgroundColor: "#1e1e1e" }}>
                  {step.step}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Step header */}
                  <div className="flex flex-wrap items-baseline gap-2 mb-3">
                    <span className="font-semibold text-gray-900">{step.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#fdf0f2", color: "#9a6570", border: "1px solid #e8c0c5" }}>
                      {step.tool}
                    </span>
                    <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {step.time_estimate}
                    </span>
                  </div>
                  {/* Instructions */}
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
                  {/* Pro tip */}
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

      {/* Test Plan */}
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

      {/* Go-Live Checklist */}
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

      {/* NextEra context note */}
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

/* ─── Main component ─────────────────────────────────────── */

export default function ResultsClient({ record }: { record: WorkflowRecord }) {
  const solution = SOLUTION_CONFIG[record.solutionType] ?? SOLUTION_CONFIG.Automation;
  const techStack = record.recommendedStack
    ? record.recommendedStack.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const [activeTab, setActiveTab] = useState<"analysis" | "build">("analysis");

  const headerVisible   = useReveal(0);
  const section1Visible = useReveal(200);
  const section2Visible = useReveal(400);
  const section3Visible = useReveal(550);
  const section4Visible = useReveal(700);
  const actionsVisible  = useReveal(850);

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
        {[
          { id: "analysis" as const, label: "Analysis", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
          { id: "build" as const, label: "Build Guide", icon: <Hammer className="h-3.5 w-3.5" /> },
        ].map((tab) => (
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
            {tab.id === "build" && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#fdf0f2", color: "#9a6570" }}>
                AI
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════ ANALYSIS TAB ════════════════ */}
      {activeTab === "analysis" && <>

      {/* ── Opportunities ── */}
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
                <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: "#1e1e1e" }}>
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

      {/* ── Recommended stack ── */}
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
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg font-medium transition-colors cursor-default hover:border-[#e8c0c5] hover:text-[#7d4d57]" style={{}} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fdf0f2"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Roadmap ── */}
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

      {/* ── Risks ── */}
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

      {/* ── Annual value callout ── */}
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

      </>}

      {/* ════════════════ BUILD GUIDE TAB ════════════════ */}
      {activeTab === "build" && (
        <BuildGuidePanel record={record} />
      )}

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
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg font-medium text-sm transition-all ml-auto" style={{ backgroundColor: "#1e1e1e" }}
        >
          View all projects
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
