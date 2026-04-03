"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, ShieldCheck, Loader2, CheckCircle2,
  AlertTriangle, ChevronRight, Lightbulb, XCircle,
  TrendingUp, Calendar, Printer, RotateCcw, BarChart2, Bot,
} from "lucide-react";
import type {
  ClientProfile, AuditDimension, AuditQuestion,
  AuditReport, AuditDimensionResult,
} from "@/lib/types";

/* ─── Types ──────────────────────────────────────────────── */

type AuditType = "readiness" | "agent";
type Phase = "type-select" | "client-info" | "generating" | "answering" | "scoring" | "report";

/* ─── Constants ──────────────────────────────────────────── */

const INDUSTRIES = [
  "Healthcare", "Financial Services", "Professional Services",
  "Manufacturing", "Retail & E-commerce", "Real Estate",
  "Education", "Non-profit", "Construction", "Legal",
  "Insurance", "Technology", "Hospitality", "Other",
];

const ORG_SIZES = [
  "1–10 employees", "11–50 employees", "51–200 employees",
  "201–500 employees", "501–1,000 employees", "1,000+ employees",
];

/* ─── Level config ───────────────────────────────────────── */

const LEVEL_CONFIG: Record<string, { color: string; bg: string; border: string; bar: string }> = {
  Aware:         { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", bar: "#dc2626" },
  Exploring:     { color: "#d97706", bg: "#fffbeb", border: "#fde68a", bar: "#d97706" },
  Implementing:  { color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", bar: "#0284c7" },
  Scaling:       { color: "#059669", bg: "#f0fdf4", border: "#a7f3d0", bar: "#059669" },
  Transforming:  { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", bar: "#7c3aed" },
};

function getLvl(level: string) {
  return LEVEL_CONFIG[level] ?? LEVEL_CONFIG["Exploring"];
}

/* ─── Radar Chart ────────────────────────────────────────── */

function RadarChart({ dimensions }: { dimensions: AuditDimensionResult[] }) {
  const N = dimensions.length;
  const cx = 220, cy = 200, r = 138;

  const angleRad = (i: number) => -Math.PI / 2 + (2 * Math.PI / N) * i;
  const pt = (i: number, score: number) => ({
    x: cx + (score / 100) * r * Math.cos(angleRad(i)),
    y: cy + (score / 100) * r * Math.sin(angleRad(i)),
  });
  const poly = (scores: number[]) =>
    scores.map((s, i) => `${pt(i, s).x.toFixed(1)},${pt(i, s).y.toFixed(1)}`).join(" ");

  const scorePoly = poly(dimensions.map((d) => d.score));
  const benchPoly = poly(dimensions.map(() => 55)); // industry avg ~55/100

  const dotColor = (score: number) => {
    if (score >= 80) return "#7c3aed";
    if (score >= 65) return "#059669";
    if (score >= 50) return "#0284c7";
    if (score >= 35) return "#d97706";
    return "#dc2626";
  };

  return (
    <svg viewBox="-55 -25 550 460" className="w-full" style={{ maxHeight: 380 }}>
      {[20, 40, 60, 80, 100].map((g) => (
        <polygon key={g}
          points={poly(dimensions.map(() => g))}
          fill="none"
          stroke={g === 55 ? "#94a3b8" : "#e5e7eb"}
          strokeWidth={g === 100 ? 1.5 : 1}
          strokeDasharray={g === 55 ? "4,3" : undefined}
        />
      ))}
      {dimensions.map((_, i) => {
        const o = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={o.x.toFixed(1)} y2={o.y.toFixed(1)} stroke="#e5e7eb" strokeWidth={1} />;
      })}
      <polygon points={benchPoly} fill="rgba(148,163,184,0.08)" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,4" />
      <polygon points={scorePoly} fill="rgba(30,30,30,0.09)" stroke="#1e1e1e" strokeWidth={2.5} />
      {dimensions.map((d, i) => {
        const p = pt(i, d.score);
        return <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={5.5} fill={dotColor(d.score)} stroke="white" strokeWidth={1.5} />;
      })}
      {dimensions.map((d, i) => {
        const lx = cx + r * 1.32 * Math.cos(angleRad(i));
        const ly = cy + r * 1.32 * Math.sin(angleRad(i));
        const anchor = lx < cx - 12 ? "end" : lx > cx + 12 ? "start" : "middle";
        return (
          <text key={i} x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor={anchor}
            dominantBaseline="middle" fontSize={11.5} fill="#374151" fontWeight={600}>
            {d.dimension}
          </text>
        );
      })}
      {[20, 40, 60, 80, 100].map((g) => {
        const p = pt(0, g);
        return <text key={g} x={p.x + 5} y={p.y} fontSize={8} fill="#9ca3af" textAnchor="start" dominantBaseline="middle">{g}</text>;
      })}
      <g transform="translate(0, 425)">
        <line x1={20} y1={0} x2={48} y2={0} stroke="#1e1e1e" strokeWidth={2.5} />
        <circle cx={34} cy={0} r={4} fill="#1e1e1e" />
        <text x={54} y={0} fontSize={10} fill="#6b7280" dominantBaseline="middle">{"{client}"} score</text>
        <line x1={160} y1={0} x2={188} y2={0} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,4" />
        <text x={194} y={0} fontSize={10} fill="#6b7280" dominantBaseline="middle">Industry avg (~55)</text>
      </g>
    </svg>
  );
}

/* ─── Score gauge ────────────────────────────────────────── */

function ScoreGauge({ score, level }: { score: number; level: string }) {
  const cfg = getLvl(level);
  const levels = ["Aware", "Exploring", "Implementing", "Scaling", "Transforming"];
  const levelIdx = levels.indexOf(level);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      {/* Score circle */}
      <div className="flex-shrink-0 text-center">
        <div
          className="w-36 h-36 rounded-full flex flex-col items-center justify-center border-4"
          style={{ borderColor: cfg.color, backgroundColor: cfg.bg }}
        >
          <span className="text-5xl font-black tabular-nums" style={{ color: cfg.color }}>{score}</span>
          <span className="text-xs font-semibold text-gray-400 mt-0.5">out of 100</span>
        </div>
        <p className="text-sm font-bold mt-2" style={{ color: cfg.color }}>{level}</p>
      </div>

      {/* Maturity ladder */}
      <div className="flex-1 w-full">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Maturity Level</p>
        <div className="space-y-2">
          {levels.map((l, i) => {
            const lc = getLvl(l);
            const active = i === levelIdx;
            const below = i < levelIdx;
            return (
              <div key={l} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: active || below ? lc.color : "#e5e7eb" }}
                />
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: active || below ? lc.bar + "22" : "#f3f4f6" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: active ? "100%" : below ? "100%" : "0%",
                      backgroundColor: lc.bar,
                    }}
                  />
                </div>
                <span className={`text-xs font-semibold w-24 ${active ? "" : "text-gray-400"}`} style={{ color: active ? lc.color : undefined }}>
                  {l} {active ? "✓" : ""}
                </span>
                <span className="text-[10px] text-gray-300 tabular-nums w-14 text-right">
                  {l === "Aware" ? "0–34" : l === "Exploring" ? "35–49" : l === "Implementing" ? "50–64" : l === "Scaling" ? "65–79" : "80–100"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Question component ─────────────────────────────────── */

function QuestionInput({
  question, value, onChange,
}: {
  question: AuditQuestion;
  value: string | number | undefined;
  onChange: (v: string | number) => void;
}) {
  if (question.type === "scale") {
    const labels = question.scale_labels;
    return (
      <div>
        <div className="flex gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all"
              style={{
                backgroundColor: value === n ? "#1e1e1e" : "white",
                color: value === n ? "white" : "#6b7280",
                borderColor: value === n ? "#1e1e1e" : "#e5e7eb",
              }}
            >
              {n}
            </button>
          ))}
        </div>
        {labels && (
          <div className="flex justify-between text-[10px] text-gray-400 px-0.5">
            <span>{labels.low}</span>
            <span>{labels.high}</span>
          </div>
        )}
      </div>
    );
  }

  if (question.type === "yes_no") {
    return (
      <div className="flex gap-3">
        {["Yes", "No"].map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt.toLowerCase())}
            className="flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all"
            style={{
              backgroundColor: value === opt.toLowerCase() ? "#1e1e1e" : "white",
              color: value === opt.toLowerCase() ? "white" : "#6b7280",
              borderColor: value === opt.toLowerCase() ? "#1e1e1e" : "#e5e7eb",
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "multiple_choice" && question.options) {
    return (
      <div className="space-y-2">
        {question.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onChange(opt.label)}
            className="w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all"
            style={{
              backgroundColor: value === opt.label ? "#1e1e1e" : "white",
              color: value === opt.label ? "white" : "#374151",
              borderColor: value === opt.label ? "#1e1e1e" : "#e5e7eb",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <textarea
      className="wire-input resize-none"
      rows={3}
      placeholder="Enter your response..."
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/* ─── Printable Report ───────────────────────────────────── */

function PrintableReport({ report, auditType }: { report: AuditReport; auditType: AuditType }) {
  const cfg = getLvl(report.overall_level);
  const levels = ["Aware", "Exploring", "Implementing", "Scaling", "Transforming"];
  const levelNum = levels.indexOf(report.overall_level) + 1;

  return (
    <div id="printable-report">
      {/* Report header */}
      <div className="print:block" style={{ pageBreakInside: "avoid" }}>
        <div
          className="rounded-2xl p-8 mb-6 border-2"
          style={{ backgroundColor: "#0d0b0c", borderColor: "#1f1c1e" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="rounded-lg p-2 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #c48a94, #9a6570)" }}
                >
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg tracking-tight">WIRE</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#1a181b", color: "#7a7580" }}>
                  Workflow Intelligence &amp; ROI Engine
                </span>
              </div>
              <h1 className="text-2xl font-black text-white mb-1">
                {auditType === "agent" ? "AI Agent Readiness Audit Report" : "AI Readiness Audit Report"}
              </h1>
              <p className="text-sm" style={{ color: "#7a7580" }}>
                Prepared for: <span className="text-white font-semibold">{report.client_name}</span>
                &nbsp;&nbsp;·&nbsp;&nbsp;{report.client_industry}
                &nbsp;&nbsp;·&nbsp;&nbsp;{report.audit_date}
              </p>
            </div>
            <div
              className="text-center px-6 py-4 rounded-xl border flex-shrink-0"
              style={{ borderColor: cfg.color + "44", backgroundColor: cfg.color + "11" }}
            >
              <div className="text-5xl font-black tabular-nums" style={{ color: cfg.color }}>
                {report.overall_score}
              </div>
              <div className="text-xs font-bold mt-0.5" style={{ color: cfg.color }}>{report.overall_level}</div>
              <div className="text-[10px] mt-0.5" style={{ color: cfg.color, opacity: 0.7 }}>Level {levelNum} of 5</div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div
          className="rounded-2xl p-6 mb-6 border"
          style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
        >
          <h2 className="font-bold mb-2 text-sm uppercase tracking-wider" style={{ color: cfg.color }}>Executive Summary</h2>
          <p className="text-sm leading-relaxed" style={{ color: cfg.color, opacity: 0.9 }}>{report.executive_summary}</p>
          {report.benchmark_context && (
            <p className="text-xs mt-3 pt-3 border-t leading-relaxed"
              style={{ borderColor: cfg.border, color: cfg.color, opacity: 0.7 }}>
              {report.benchmark_context}
            </p>
          )}
        </div>
      </div>

      {/* Score overview + Radar chart */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart2 className="h-4 w-4" style={{ color: "#b07880" }} />
          Readiness Profile
        </h2>
        <ScoreGauge score={report.overall_score} level={report.overall_level} />
        <div className="mt-6 pt-6 border-t border-gray-50">
          <RadarChart dimensions={report.dimensions} />
        </div>
      </div>

      {/* Dimension Score Grid */}
      <div className="mb-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" style={{ color: "#b07880" }} />
          Dimension Scores
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {report.dimensions.map((dim) => {
            const dc = getLvl(dim.level);
            return (
              <div key={dim.dimension} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm" style={{ pageBreakInside: "avoid" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-gray-900">{dim.dimension}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                      style={{ backgroundColor: dc.bg, color: dc.color, borderColor: dc.border }}>
                      {dim.level}
                    </span>
                    <span className="text-lg font-black tabular-nums" style={{ color: dc.color }}>
                      {dim.score}<span className="text-xs text-gray-400 font-normal">/100</span>
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full" style={{ width: `${dim.score}%`, backgroundColor: dc.bar }} />
                </div>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{dim.summary}</p>
                {dim.strengths.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Strengths</p>
                    {dim.strengths.map((s, i) => (
                      <p key={i} className="text-xs text-gray-600 flex items-start gap-1.5 mb-1">
                        <span className="text-emerald-400 flex-shrink-0 mt-0.5">+</span>{s}
                      </p>
                    ))}
                  </div>
                )}
                {dim.gaps.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Gaps</p>
                    {dim.gaps.map((g, i) => (
                      <p key={i} className="text-xs text-gray-600 flex items-start gap-1.5 mb-1">
                        <span className="text-red-400 flex-shrink-0 mt-0.5">−</span>{g}
                      </p>
                    ))}
                  </div>
                )}
                <div className="rounded-lg px-3 py-2 mt-2" style={{ backgroundColor: dc.bg, border: `1px solid ${dc.border}` }}>
                  <p className="text-[10px] font-bold mb-0.5 uppercase tracking-wider" style={{ color: dc.color }}>Next Step</p>
                  <p className="text-xs leading-relaxed" style={{ color: dc.color }}>{dim.recommendation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blockers + Quick Wins */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6" style={{ pageBreakInside: "avoid" }}>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <h2 className="font-bold text-gray-900 text-sm">Critical Blockers</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {report.top_blockers.map((b, i) => (
              <li key={i} className="px-5 py-4">
                <div className="flex items-start gap-3 mb-1">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: b.priority === "critical" ? "#dc2626" : b.priority === "high" ? "#d97706" : "#6b7280" }}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-1">{b.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{b.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <h2 className="font-bold text-gray-900 text-sm">Quick Wins</h2>
            <span className="ml-auto text-xs text-gray-400">Start immediately</span>
          </div>
          <ul className="divide-y divide-gray-50">
            {report.quick_wins.map((w, i) => (
              <li key={i} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-1">{w.action}</p>
                    <p className="text-xs text-gray-500 leading-relaxed mb-1">{w.impact}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{w.timeline}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 90-Day Roadmap */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6" style={{ pageBreakInside: "avoid" }}>
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5">
          <Calendar className="h-4 w-4" style={{ color: "#b07880" }} />
          <h2 className="font-bold text-gray-900">90-Day Action Roadmap</h2>
        </div>
        <div className="p-6 space-y-0">
          {report.roadmap.map((phase, i) => {
            const phaseColors = [
              { dot: "bg-[#9a6570]", line: "from-[#e8c0c5]" },
              { dot: "bg-sky-500",   line: "from-sky-200" },
              { dot: "bg-emerald-500", line: "from-emerald-200" },
            ];
            const pc = phaseColors[i] ?? phaseColors[0];
            return (
              <div key={i} className="flex gap-5">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full ${pc.dot} text-white text-sm font-bold flex items-center justify-center ring-4 ring-white`}>
                    {phase.phase}
                  </div>
                  {i < report.roadmap.length - 1 && (
                    <div className={`w-0.5 flex-1 my-1 bg-gradient-to-b ${pc.line} to-gray-100 min-h-[1.5rem]`} />
                  )}
                </div>
                <div className="flex-1 pb-7">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="font-bold text-gray-900">{phase.title}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{phase.timeline}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {phase.actions.map((a, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Starting Point */}
      {report.recommended_starting_point && (
        <div className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-6" style={{ pageBreakInside: "avoid" }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h2 className="font-bold text-emerald-900 text-sm">Recommended First Step</h2>
          </div>
          <p className="text-sm text-emerald-800 leading-relaxed">{report.recommended_starting_point}</p>
        </div>
      )}

      {/* Footer (print only) */}
      <div className="hidden print:block mt-8 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">Generated by WIRE — Workflow Intelligence &amp; ROI Engine</p>
        <p className="text-xs text-gray-300 mt-1">Confidential — Prepared for {report.client_name}</p>
      </div>
    </div>
  );
}

/* ─── Audit Type Selector ────────────────────────────────── */

const AUDIT_TYPES: {
  type: AuditType;
  icon: React.ReactNode;
  label: string;
  tag?: string;
  description: string;
  dimensions: string[];
  questions: string;
  time: string;
  forWhom: string;
}[] = [
  {
    type: "readiness",
    icon: <BarChart2 className="h-6 w-6" />,
    label: "AI Readiness Audit",
    description: "Assess whether an organization is ready to adopt and scale AI. Covers foundational strategy, data, technology, culture, and process.",
    dimensions: ["Strategy & Leadership", "Data Readiness", "Technology", "People & Culture", "Governance", "Process Maturity", "Financial Readiness"],
    questions: "35–40 questions",
    time: "~15 min",
    forWhom: "For orgs starting or scaling AI adoption",
  },
  {
    type: "agent",
    icon: <Bot className="h-6 w-6" />,
    label: "AI Agent Readiness Audit",
    tag: "NEW",
    description: "Assess whether an organization can govern and control autonomous AI agents. Focuses on oversight, security, accountability, and lifecycle management.",
    dimensions: ["Ownership & Accountability", "Security & Access Controls", "Lifecycle Management", "Governance & Compliance", "Human-in-the-Loop Design"],
    questions: "20–25 questions",
    time: "~10 min",
    forWhom: "For orgs actively deploying AI agents",
  },
];

/* ─── Main Page ──────────────────────────────────────────── */

export default function AuditPage() {
  const [phase, setPhase] = useState<Phase>("type-select");
  const [auditType, setAuditType] = useState<AuditType>("readiness");
  const [profile, setProfile] = useState<ClientProfile>({
    clientName: "", industry: "", orgSize: "", goals: "", workflows: "", painPoints: "",
  });
  const [dimensions, setDimensions] = useState<AuditDimension[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [activeDim, setActiveDim] = useState(0);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  const totalQuestions = dimensions.reduce((a, d) => a + d.questions.length, 0);
  const answeredCount = Object.keys(answers).length;

  /* ── Generate questions ── */
  async function handleGenerateQuestions() {
    if (!profile.clientName || !profile.industry || !profile.orgSize || !profile.goals) return;
    setPhase("generating");
    setError("");
    const endpoint = auditType === "agent" ? "/api/audit/generate-agent" : "/api/audit/generate";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to generate questions");
      setDimensions(data.dimensions);
      setActiveDim(0);
      setPhase("answering");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("client-info");
    }
  }

  /* ── Score audit ── */
  async function handleScore() {
    setPhase("scoring");
    setError("");
    try {
      const res = await fetch("/api/audit/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, dimensions, answers }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to score audit");
      setReport(data.report);
      setPhase("report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("answering");
    }
  }

  /* ── Print ── */
  function handlePrint() {
    window.print();
  }

  /* ── Reset ── */
  function handleReset() {
    setPhase("type-select");
    setProfile({ clientName: "", industry: "", orgSize: "", goals: "", workflows: "", painPoints: "" });
    setDimensions([]);
    setAnswers({});
    setReport(null);
    setError("");
  }

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body { background: white !important; }
          .print-report { display: block !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-10 no-print">

        {/* ── Back link ── */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to WIRE
          </Link>
        </div>

        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#f0f9ff" }}>
              {auditType === "agent" ? <Bot className="h-5 w-5 text-sky-500" /> : <ShieldCheck className="h-5 w-5 text-sky-500" />}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                {phase === "type-select" ? "Audits" : auditType === "agent" ? "AI Agent Readiness Audit" : "AI Readiness Audit"}
              </h1>
              <p className="text-sm text-gray-400">
                {phase === "type-select" && "Choose the type of assessment to run"}
                {phase === "client-info" && "Enter client info to generate a tailored assessment"}
                {phase === "generating" && "Tailoring questions to your client..."}
                {phase === "answering" && `${answeredCount} of ${totalQuestions} questions answered`}
                {phase === "scoring" && "Analyzing responses..."}
                {phase === "report" && `Report complete · ${report?.audit_date}`}
              </p>
            </div>
          </div>
        </div>

        {/* ════════════════ PHASE 0: TYPE SELECT ════════════════ */}
        {phase === "type-select" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
              Two distinct assessments — choose based on where your client is in their AI journey.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AUDIT_TYPES.map((at) => (
                <button
                  key={at.type}
                  onClick={() => { setAuditType(at.type); setPhase("client-info"); }}
                  className="text-left bg-white border border-gray-100 rounded-2xl shadow-sm p-6 hover:border-gray-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ backgroundColor: "#f0f9ff", color: "#0284c7" }}
                    >
                      {at.icon}
                    </div>
                    {at.tag && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0"
                        style={{ backgroundColor: "#fdf0f2", color: "#9a6570" }}
                      >
                        {at.tag}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 mb-1.5">{at.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{at.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {at.dimensions.map((d) => (
                      <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500 font-medium">
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{at.questions}</span>
                      <span>·</span>
                      <span>{at.time}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
                  </div>

                  <p className="text-[11px] text-gray-400 mt-2 italic">{at.forWhom}</p>
                </button>
              ))}
            </div>

            {/* Prereq note */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Not sure which to choose?</strong> Start with the AI Readiness Audit.
                The AI Agent Readiness Audit is most useful for orgs already deploying or evaluating autonomous agents —
                it assumes a baseline level of AI maturity (typically &ldquo;Implementing&rdquo; or above).
              </p>
            </div>
          </div>
        )}

        {/* ════════════════ PHASE 1: CLIENT INFO ════════════════ */}
        {phase === "client-info" && (
          <div className="space-y-5">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Client Information</h2>
                <button
                  onClick={() => setPhase("type-select")}
                  className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Change audit type
                </button>
              </div>
              <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg border" style={{ backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }}>
                <ShieldCheck className="h-4 w-4 text-sky-500 flex-shrink-0" />
                <p className="text-xs text-sky-700 font-medium">
                  {auditType === "agent" ? "AI Agent Readiness Audit — 5 dimensions · 20–25 questions" : "AI Readiness Audit — 7 dimensions · 35–40 questions"}
                </p>
              </div>
              <div className="space-y-4">

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Client / Organization Name *
                  </label>
                  <input
                    className="wire-input"
                    placeholder="e.g. Acme Corp"
                    value={profile.clientName}
                    onChange={(e) => setProfile((p) => ({ ...p, clientName: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Industry *
                    </label>
                    <select
                      className="wire-input"
                      value={profile.industry}
                      onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
                    >
                      <option value="">Select industry...</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Organization Size *
                    </label>
                    <select
                      className="wire-input"
                      value={profile.orgSize}
                      onChange={(e) => setProfile((p) => ({ ...p, orgSize: e.target.value }))}
                    >
                      <option value="">Select size...</option>
                      {ORG_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    What are they hoping to accomplish with AI? *
                  </label>
                  <textarea
                    className="wire-input resize-none"
                    rows={3}
                    placeholder="e.g. Reduce manual data entry, automate customer onboarding, improve reporting accuracy..."
                    value={profile.goals}
                    onChange={(e) => setProfile((p) => ({ ...p, goals: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    {auditType === "agent"
                      ? <>AI agents being deployed or evaluated <span className="text-gray-400 normal-case font-normal ml-1">(e.g. Copilot, custom LLM agents)</span></>
                      : <>Specific workflows or processes they want to automate <span className="text-gray-400 normal-case font-normal ml-1">(optional)</span></>
                    }
                  </label>
                  <textarea
                    className="wire-input resize-none"
                    rows={2}
                    placeholder={auditType === "agent"
                      ? "e.g. Microsoft Copilot Studio agents, SharePoint agents, custom OpenAI assistants..."
                      : "e.g. Invoice processing, client intake forms, weekly reporting..."}
                    value={profile.workflows}
                    onChange={(e) => setProfile((p) => ({ ...p, workflows: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Biggest operational pain points
                    <span className="text-gray-400 normal-case font-normal ml-1">(optional)</span>
                  </label>
                  <textarea
                    className="wire-input resize-none"
                    rows={2}
                    placeholder="e.g. Too much time on manual tasks, can't get reliable data, team lacks technical skills..."
                    value={profile.painPoints}
                    onChange={(e) => setProfile((p) => ({ ...p, painPoints: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-400">
                {auditType === "agent" ? "20–25 tailored questions · ~10 min" : "35–40 tailored questions · ~15 min"}
              </p>
              <button
                onClick={handleGenerateQuestions}
                disabled={!profile.clientName || !profile.industry || !profile.orgSize || !profile.goals}
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold text-sm transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#1e1e1e" }}
              >
                Generate Audit Questions
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════ PHASE 2: GENERATING ════════════════ */}
        {phase === "generating" && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-14 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-5" style={{ color: "#0284c7" }} />
            <p className="text-lg font-semibold text-gray-800 mb-2">Building your audit questionnaire...</p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Claude is selecting and tailoring 35–40 questions from the industry framework
              to match {profile.clientName}&apos;s profile and goals.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {(auditType === "agent"
                ? ["Ownership & Accountability","Security & Access Controls","Lifecycle Management","Governance & Compliance","Human-in-the-Loop Design"]
                : ["Strategy & Leadership","Data Readiness","Technology","People & Culture","Governance","Process Maturity","Financial Readiness"]
              ).map((d) => (
                <span key={d} className="text-xs px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-gray-400 animate-pulse">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════ PHASE 3: ANSWERING ════════════════ */}
        {phase === "answering" && dimensions.length > 0 && (
          <div className="space-y-5">

            {/* Progress + dimension tabs */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500">Overall progress</span>
                <span className="text-xs font-bold text-gray-900">{answeredCount} / {totalQuestions}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%`, backgroundColor: "#1e1e1e" }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dimensions.map((dim, i) => {
                  const dimAnswered = dim.questions.filter((q) => answers[q.id] !== undefined).length;
                  const done = dimAnswered === dim.questions.length;
                  return (
                    <button
                      key={dim.id}
                      onClick={() => setActiveDim(i)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                      style={{
                        backgroundColor: activeDim === i ? "#1e1e1e" : done ? "#f0fdf4" : "white",
                        color: activeDim === i ? "white" : done ? "#059669" : "#6b7280",
                        borderColor: activeDim === i ? "#1e1e1e" : done ? "#a7f3d0" : "#e5e7eb",
                      }}
                    >
                      {done && <CheckCircle2 className="h-3 w-3" />}
                      {dim.name}
                      <span className="opacity-60">{dimAnswered}/{dim.questions.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current dimension questions */}
            {dimensions[activeDim] && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div
                  className="px-6 py-4 border-b border-gray-50 flex items-center gap-3"
                  style={{ backgroundColor: "#fafafa" }}
                >
                  <div>
                    <h2 className="font-bold text-gray-900">{dimensions[activeDim].name}</h2>
                    <p className="text-xs text-gray-400">{dimensions[activeDim].questions.length} questions in this section</p>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {dimensions[activeDim].questions.map((q, qi) => (
                    <div key={q.id} className="px-6 py-5">
                      <div className="flex items-start gap-3 mb-3">
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5"
                          style={{
                            backgroundColor: answers[q.id] !== undefined ? "#1e1e1e" : "#f3f4f6",
                            color: answers[q.id] !== undefined ? "white" : "#9ca3af",
                          }}
                        >
                          {qi + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1 leading-snug">{q.question}</p>
                          {q.weight === 1.5 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                              style={{ backgroundColor: "#fdf0f2", color: "#9a6570" }}>
                              Key question
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-9">
                        <QuestionInput
                          question={q}
                          value={answers[q.id]}
                          onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                        />
                        {q.hint && (
                          <p className="text-[11px] text-gray-400 mt-2 italic leading-relaxed">
                            💡 {q.hint}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setActiveDim((i) => Math.max(0, i - 1))}
                disabled={activeDim === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              {activeDim < dimensions.length - 1 ? (
                <button
                  onClick={() => setActiveDim((i) => i + 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-white"
                  style={{ backgroundColor: "#1e1e1e" }}
                >
                  Next section
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleScore}
                  disabled={answeredCount < Math.ceil(totalQuestions * 0.7)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all text-white disabled:opacity-40"
                  style={{ backgroundColor: "#1e1e1e" }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Generate Audit Report
                </button>
              )}
            </div>

            {answeredCount < Math.ceil(totalQuestions * 0.7) && activeDim === dimensions.length - 1 && (
              <p className="text-xs text-center text-gray-400">
                Please answer at least 70% of questions ({Math.ceil(totalQuestions * 0.7)} of {totalQuestions}) to generate your report.
                Currently: {answeredCount} answered.
              </p>
            )}
          </div>
        )}

        {/* ════════════════ PHASE 4: SCORING ════════════════ */}
        {phase === "scoring" && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-14 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-5" style={{ color: "#1e1e1e" }} />
            <p className="text-lg font-semibold text-gray-800 mb-2">Analyzing responses...</p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Claude is scoring all 7 dimensions, identifying blockers, and building your client&apos;s 90-day action roadmap.
            </p>
          </div>
        )}

        {/* ════════════════ PHASE 5: REPORT ════════════════ */}
        {phase === "report" && report && (
          <div>
            {/* Report actions */}
            <div className="flex flex-wrap items-center gap-3 mb-6 no-print">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-lg font-semibold text-sm transition-all"
                style={{ backgroundColor: "#1e1e1e" }}
              >
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg font-medium text-sm transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                New Audit
              </button>
              <p className="text-xs text-gray-400 ml-auto">
                Use &ldquo;Print / Save PDF&rdquo; to generate a client-ready document
              </p>
            </div>

            <div ref={reportRef}>
              <PrintableReport report={report} auditType={auditType} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
