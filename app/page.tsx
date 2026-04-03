"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Check, Building2, User, Layers, ArrowRight, Lightbulb } from "lucide-react";

const STEPS = [
  { id: 1, label: "Context", description: "Who & what" },
  { id: 2, label: "Workflow", description: "How it works" },
  { id: 3, label: "ROI Inputs", description: "Time & cost" },
];

const STATUS_MESSAGES = [
  "Reading your workflow...",
  "Identifying opportunities...",
  "Calculating time savings...",
  "Building your roadmap...",
  "Saving to Notion...",
];

const CONTEXT_OPTIONS = [
  { value: "NextEra Energy",   icon: <svg className="h-4 w-4" viewBox="0 0 20 16" fill="none"><path d="M1 2L5.5 14L10 4.5L14.5 14L19 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>, color: "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-400 hover:bg-blue-100" },
  { value: "AI Whispers Back", icon: <Layers className="h-4 w-4" />,   color: "border-violet-200 bg-violet-50 text-violet-800 hover:border-violet-400 hover:bg-violet-100" },
  { value: "Personal",         icon: <User className="h-4 w-4" />,     color: "border-teal-200 bg-teal-50 text-teal-800 hover:border-teal-400 hover:bg-teal-100" },
  { value: "Idea",             icon: <Lightbulb className="h-4 w-4" />,color: "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100" },
  { value: "Other",            icon: <Building2 className="h-4 w-4" />,color: "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-gray-100" },
];

const BUILD_OPTIONS = [
  { value: "No-code/low-code first", description: "Zapier, Make, n8n" },
  { value: "API/custom build OK",    description: "Full code, custom integrations" },
  { value: "Open to anything",       description: "Best tool for the job" },
];

const STORAGE_KEY = "wire_intake_draft";

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/* ── Blush spinner W mark ── */
function WMark() {
  return (
    <svg width="28" height="18" viewBox="0 0 26 16" fill="none">
      <path d="M1 8H5.5L8 2L11 14L14 4.5L16.5 8H25" stroke="#b07880" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [error, setError] = useState("");
  const [animating, setAnimating] = useState(false);

  const [form, setForm] = useState({
    workflowName: "",
    context: "",
    buildPreference: "",
    description: "",
    currentTechStack: "",
    painPoints: "",
    desiredOutcome: "",
    timePerRun: "",
    runsPerWeek: "",
    hourlyRate: "",
  });

  useEffect(() => {
    const draft = loadDraft();
    if (Object.keys(draft).length) setForm((f) => ({ ...f, ...draft }));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function canProceed() {
    if (step === 1) return form.workflowName.trim() && form.context && form.buildPreference;
    if (step === 2) return form.description.trim().length >= 20;
    if (step === 3) return form.timePerRun && form.runsPerWeek && form.hourlyRate;
    return false;
  }

  function goTo(nextStep: number) {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 180);
  }

  async function handleSubmit() {
    setError("");
    setIsLoading(true);
    setStatusIdx(0);

    const interval = setInterval(() => {
      setStatusIdx((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
    }, 2200);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      localStorage.removeItem(STORAGE_KEY);
      router.push(`/results/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed — check your API keys and try again.");
      setIsLoading(false);
    } finally {
      clearInterval(interval);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="relative mx-auto w-20 h-20 mb-8">
            <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: "#fdf0f2" }} />
            <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: "#b07880" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <WMark />
            </div>
          </div>
          <p className="text-base font-semibold text-gray-900 mb-1 transition-all duration-300">
            {STATUS_MESSAGES[statusIdx]}
          </p>
          <p className="text-sm text-gray-400 mb-8">Claude is analyzing your workflow</p>
          <div className="flex items-center justify-center gap-2">
            {STATUS_MESSAGES.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: i === statusIdx ? "2rem" : i < statusIdx ? "1.5rem" : "1rem",
                  backgroundColor: i <= statusIdx ? "#b07880" : "#e5e7eb",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#b07880" }}>
              New Analysis
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analyze a workflow</h1>
          <p className="text-gray-500 text-sm mt-1.5">
            Describe it, and we&apos;ll calculate the ROI of automating it with AI.
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  onClick={() => s.id < step && goTo(s.id)}
                  disabled={s.id >= step}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={{
                    backgroundColor: s.id <= step ? "#1e1e1e" : "#f3f4f6",
                    color: s.id <= step ? "white" : "#9ca3af",
                    boxShadow: s.id === step ? "0 0 0 4px #e8e8e8" : "none",
                    cursor: s.id < step ? "pointer" : "default",
                  }}
                >
                  {s.id < step ? <Check className="h-3.5 w-3.5" /> : s.id}
                </button>
                <div className="hidden sm:block">
                  <div className={`text-xs font-semibold leading-none ${s.id <= step ? "text-gray-900" : "text-gray-400"}`}>
                    {s.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-3 h-px bg-gray-200 relative overflow-hidden">
                  <div
                    className="absolute inset-0 transition-transform duration-500 origin-left"
                    style={{
                      backgroundColor: "#1e1e1e",
                      transform: step > s.id ? "scaleX(1)" : "scaleX(0)",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className={`transition-all duration-200 ${animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Workflow name <span className="text-red-400">*</span>
                </label>
                <input
                  autoFocus
                  value={form.workflowName}
                  onChange={(e) => set("workflowName", e.target.value)}
                  placeholder="e.g. Weekly vendor invoice processing"
                  className="wire-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Context / client <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTEXT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("context", opt.value)}
                      className={`flex items-center gap-2 px-3.5 py-3 border rounded-lg text-sm font-medium text-left transition-all duration-150 ${opt.color}`}
                      style={form.context === opt.value ? { outline: "2px solid #1e1e1e", outlineOffset: "2px", borderColor: "transparent" } : {}}
                    >
                      {opt.icon}
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Build preference <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  {BUILD_OPTIONS.map((opt) => {
                    const selected = form.buildPreference === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set("buildPreference", opt.value)}
                        className="w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm text-left transition-all duration-150"
                        style={{
                          borderColor: selected ? "#1e1e1e" : "#e5e7eb",
                          backgroundColor: selected ? "#f5f5f5" : "white",
                          boxShadow: selected ? "0 0 0 2px rgba(0,0,0,0.06)" : "none",
                        }}
                      >
                        <div>
                          <div className="font-medium" style={{ color: selected ? "#1e1e1e" : "#1f2937" }}>
                            {opt.value}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{opt.description}</div>
                        </div>
                        <div
                          className="w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all"
                          style={{
                            borderColor: selected ? "#1e1e1e" : "#d1d5db",
                            backgroundColor: selected ? "#1e1e1e" : "transparent",
                          }}
                        >
                          {selected && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Workflow description <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Step-by-step: what triggers it, what each step involves, who does what.
                </p>
                <textarea
                  autoFocus
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={6}
                  placeholder="e.g. Every Monday, I export a CSV from our ERP, paste it into Excel, manually calculate variance vs budget, then email the summary to 6 stakeholders..."
                  className="wire-input resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-xs ${form.description.length >= 20 ? "text-green-500" : "text-gray-400"}`}>
                    {form.description.length} chars {form.description.length < 20 && `(min 20)`}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current tech stack</label>
                <input value={form.currentTechStack} onChange={(e) => set("currentTechStack", e.target.value)} placeholder="e.g. Excel, Outlook, SAP, SharePoint" className="wire-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pain points</label>
                <input value={form.painPoints} onChange={(e) => set("painPoints", e.target.value)} placeholder="e.g. Manual errors, slow turnaround, too many handoffs" className="wire-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Desired outcome</label>
                <input value={form.desiredOutcome} onChange={(e) => set("desiredOutcome", e.target.value)} placeholder="e.g. Fully automated, human review for exceptions only" className="wire-input" />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
                These three numbers are all we need to calculate your ROI.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Hours per run <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">How long does one complete execution take?</p>
                <div className="relative">
                  <input autoFocus type="number" min="0.1" step="0.5" value={form.timePerRun} onChange={(e) => set("timePerRun", e.target.value)} placeholder="2" className="wire-input pr-12" />
                  <span className="absolute right-3.5 top-2.5 text-sm text-gray-400">hrs</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Runs per week <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">How many times does this workflow run each week?</p>
                <div className="relative">
                  <input type="number" min="1" value={form.runsPerWeek} onChange={(e) => set("runsPerWeek", e.target.value)} placeholder="5" className="wire-input pr-16" />
                  <span className="absolute right-3.5 top-2.5 text-sm text-gray-400">/ week</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Hourly rate <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">Cost of the person (or team) running this workflow.</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-gray-400">$</span>
                  <input type="number" min="1" value={form.hourlyRate} onChange={(e) => set("hourlyRate", e.target.value)} placeholder="75" className="wire-input pl-7 pr-12" />
                  <span className="absolute right-3.5 top-2.5 text-sm text-gray-400">/hr</span>
                </div>
              </div>

              {/* Live preview */}
              {form.timePerRun && form.runsPerWeek && form.hourlyRate && (
                <div className="rounded-xl p-4" style={{ backgroundColor: "#f5f5f5", border: "1px solid #e5e5e5" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#b07880" }}>
                    If Claude saves 50% of this time
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "hrs/week",    value: ((Number(form.timePerRun) * Number(form.runsPerWeek)) * 0.5).toFixed(1) },
                      { label: "hrs/year",    value: Math.round(Number(form.timePerRun) * Number(form.runsPerWeek) * 0.5 * 48).toString() },
                      { label: "annual value",value: `$${Math.round(Number(form.timePerRun) * Number(form.runsPerWeek) * 0.5 * 48 * Number(form.hourlyRate)).toLocaleString()}` },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="text-lg font-bold" style={{ color: "#7d4d57" }}>{item.value}</div>
                        <div className="text-xs" style={{ color: "#c48a94" }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => goTo(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-0 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => goTo(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              style={{ backgroundColor: "#1e1e1e" }}
              onMouseEnter={(e) => { if (canProceed()) e.currentTarget.style.backgroundColor = "#2d2d2d"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1e1e1e"; }}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              style={{ backgroundColor: "#1e1e1e" }}
              onMouseEnter={(e) => { if (canProceed()) e.currentTarget.style.backgroundColor = "#2d2d2d"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1e1e1e"; }}
            >
              <svg width="18" height="11" viewBox="0 0 26 16" fill="none"><path d="M1 8H5.5L8 2L11 14L14 4.5L16.5 8H25" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Run Analysis
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
