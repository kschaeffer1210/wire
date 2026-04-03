"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare, Zap, Brain, Code2,
  LayoutGrid, List, Plus, ChevronDown,
  DollarSign, Clock, TrendingUp, ArrowRight,
} from "lucide-react";
import type { WorkflowRecord, SolutionType, WorkflowStatus, Context } from "@/lib/types";

/* ─── Config ─────────────────────────────────────────────── */

const SOLUTION_CONFIG: Record<SolutionType, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Chatbot:    { color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: <MessageSquare className="h-3 w-3" /> },
  Automation: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <Zap className="h-3 w-3" /> },
  Agent:      { color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200",  icon: <Brain className="h-3 w-3" /> },
  "Vibe-code":{ color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: <Code2 className="h-3 w-3" /> },
};

const STATUS_CONFIG: Record<WorkflowStatus, { color: string; bg: string; dot: string }> = {
  Analyzed:     { color: "text-blue-700",    bg: "bg-blue-50",    dot: "bg-blue-500"    },
  "In Progress":{ color: "text-yellow-700",  bg: "bg-yellow-50",  dot: "bg-yellow-500"  },
  Complete:     { color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  Archived:     { color: "text-gray-500",    bg: "bg-gray-100",   dot: "bg-gray-400"    },
};

const CONTEXT_COLORS: Record<Context, string> = {
  "NextEra Energy":   "bg-sky-50 text-sky-700 border-sky-200",
  "AI Whispers Back": "bg-violet-50 text-violet-700 border-violet-200",
  Personal:           "bg-teal-50 text-teal-700 border-teal-200",
  Idea:               "bg-amber-50 text-amber-700 border-amber-200",
  Other:              "bg-gray-50 text-gray-600 border-gray-200",
};

function formatCurrency(n: number) {
  if (n >= 100000) return `$${(n / 1000).toFixed(0)}k`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Skeleton card ──────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
      <div className="flex gap-1.5 mb-5">
        <div className="h-5 bg-gray-100 rounded-full w-24" />
        <div className="h-5 bg-gray-100 rounded-full w-16" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="h-3 bg-gray-100 rounded w-16 mb-1.5" />
          <div className="h-5 bg-gray-100 rounded w-10" />
        </div>
        <div>
          <div className="h-3 bg-gray-100 rounded w-20 mb-1.5" />
          <div className="h-5 bg-gray-100 rounded w-14" />
        </div>
      </div>
    </div>
  );
}

/* ─── Project card ───────────────────────────────────────── */

function ProjectCard({ record, index }: { record: WorkflowRecord; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 60);
    return () => clearTimeout(t);
  }, [index]);

  const sol = SOLUTION_CONFIG[record.solutionType];
  const stat = STATUS_CONFIG[record.status];
  const ctxColor = CONTEXT_COLORS[record.context] ?? "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <Link
      href={`/results/${record.id}`}
      className={`group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors text-sm leading-snug line-clamp-2 flex-1">
          {record.name}
        </h3>
        {sol && (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold border flex-shrink-0 ${sol.bg} ${sol.color} ${sol.border}`}>
            {sol.icon}
            {record.solutionType}
          </span>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${ctxColor}`}>
          {record.context}
        </span>
        {stat && (
          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${stat.bg} ${stat.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
            {record.status}
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
            <Clock className="h-3 w-3" /> Hrs saved/yr
          </div>
          <div className="font-bold text-gray-900 text-base">{record.hoursSavedPerYear.toFixed(0)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
            <DollarSign className="h-3 w-3" /> Annual value
          </div>
          <div className="font-bold text-emerald-600 text-base">{formatCurrency(record.annualValue)}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3.5 pt-3.5 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">{formatDate(record.createdTime)}</span>
        <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

/* ─── Aggregate stats bar ────────────────────────────────── */

function StatsBar({ records }: { records: WorkflowRecord[] }) {
  const totalValue = records.reduce((s, r) => s + r.annualValue, 0);
  const totalHours = records.reduce((s, r) => s + r.hoursSavedPerYear, 0);
  const avgReduction = records.length
    ? Math.round(records.reduce((s, r) => s + r.timeReductionPct, 0) / records.length)
    : 0;

  if (!records.length) return null;

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { icon: <DollarSign className="h-4 w-4 text-emerald-500" />, label: "Total annual value", value: formatCurrency(totalValue), color: "text-emerald-700" },
        { icon: <Clock className="h-4 w-4 text-indigo-500" />,       label: "Total hours saved/yr", value: `${totalHours.toFixed(0)} hrs`, color: "text-gray-900" },
        { icon: <TrendingUp className="h-4 w-4 text-purple-500" />,  label: "Avg time reduction", value: `${avgReduction}%`, color: "text-gray-900" },
      ].map((stat) => (
        <div key={stat.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
          {stat.icon}
          <div>
            <div className={`font-bold text-base ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Filter select ──────────────────────────────────────── */

function FilterSelect({
  value, onChange, children,
}: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 appearance-none hover:border-gray-300 transition-colors cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function ProjectsPage() {
  const [records, setRecords]       = useState<WorkflowRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState<"card" | "table">("card");
  const [context, setContext]       = useState("");
  const [solutionType, setSolutionType] = useState("");
  const [status, setStatus]         = useState("");
  const [sortBy, setSortBy]         = useState("annualValue");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (context)      params.set("context", context);
    if (solutionType) params.set("solution_type", solutionType);
    if (status)       params.set("status", status);
    const res = await fetch(`/api/projects?${params}`);
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [context, solutionType, status]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const sorted = [...records].sort((a, b) => {
    if (sortBy === "annualValue")       return b.annualValue - a.annualValue;
    if (sortBy === "hoursSavedPerYear") return b.hoursSavedPerYear - a.hoursSavedPerYear;
    return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">Project Hub</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">All workflows</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? "Loading..." : `${sorted.length} workflow${sorted.length !== 1 ? "s" : ""} analyzed`}
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
        >
          <Plus className="h-4 w-4" />
          New Analysis
        </Link>
      </div>

      {/* Aggregate stats */}
      {!loading && <StatsBar records={sorted} />}

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <FilterSelect value={context} onChange={setContext}>
          <option value="">All Contexts</option>
          <option>NextEra Energy</option>
          <option>AI Whispers Back</option>
          <option>Personal</option>
          <option>Other</option>
        </FilterSelect>

        <FilterSelect value={solutionType} onChange={setSolutionType}>
          <option value="">All Types</option>
          <option>Chatbot</option>
          <option>Automation</option>
          <option>Agent</option>
          <option>Vibe-code</option>
        </FilterSelect>

        <FilterSelect value={status} onChange={setStatus}>
          <option value="">All Statuses</option>
          <option>Analyzed</option>
          <option>In Progress</option>
          <option>Complete</option>
          <option>Archived</option>
        </FilterSelect>

        <FilterSelect value={sortBy} onChange={setSortBy}>
          <option value="annualValue">Sort: Annual Value</option>
          <option value="hoursSavedPerYear">Sort: Hours Saved</option>
          <option value="createdTime">Sort: Date Created</option>
        </FilterSelect>

        {/* View toggle */}
        <div className="ml-auto flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
          <button
            onClick={() => setView("card")}
            className={`p-1.5 rounded-md transition-all ${view === "card" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("table")}
            className={`p-1.5 rounded-md transition-all ${view === "table" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading skeleton grid */}
      {loading && view === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && sorted.length === 0 && (
        <div className="text-center py-24 bg-white border border-gray-100 rounded-2xl">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="h-7 w-7 text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No workflows found</h3>
          <p className="text-sm text-gray-400 mb-6">
            {context || solutionType || status ? "Try adjusting your filters" : "Analyze your first workflow to get started"}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
          >
            <Plus className="h-4 w-4" />
            New Analysis
          </Link>
        </div>
      )}

      {/* Card grid */}
      {!loading && sorted.length > 0 && view === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((record, i) => (
            <ProjectCard key={record.id} record={record} index={i} />
          ))}
        </div>
      )}

      {/* Table view */}
      {!loading && sorted.length > 0 && view === "table" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {["Name", "Context", "Type", "Status", "Hrs/yr", "Annual Value", "Created"].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((record, i) => {
                  const sol = SOLUTION_CONFIG[record.solutionType];
                  const stat = STATUS_CONFIG[record.status];
                  const ctxColor = CONTEXT_COLORS[record.context] ?? "bg-gray-50 text-gray-600 border-gray-200";
                  return (
                    <tr
                      key={record.id}
                      onClick={() => (window.location.href = `/results/${record.id}`)}
                      className={`group hover:bg-indigo-50/50 transition-colors cursor-pointer ${
                        i % 2 === 0 ? "" : "bg-gray-50/30"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate group-hover:text-indigo-700 transition-colors">
                        {record.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${ctxColor}`}>
                          {record.context}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {sol && (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold border ${sol.bg} ${sol.color} ${sol.border}`}>
                            {sol.icon} {record.solutionType}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {stat && (
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${stat.bg} ${stat.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                            {record.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 text-right">
                        {record.hoursSavedPerYear.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 text-right">
                        {formatCurrency(record.annualValue)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(record.createdTime)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
