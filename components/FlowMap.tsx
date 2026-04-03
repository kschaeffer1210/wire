"use client";

import type { BuildTool, BuildSpec } from "@/lib/types";

/* ─── Category → layer mapping ───────────────────────────── */

const LAYER_ORDER = ["Data", "Integration", "AI Model", "Automation", "Platform", "Frontend", "Analytics"];

const LAYER_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; label: string }> = {
  "Data":        { color: "text-sky-700",    bg: "bg-sky-50",     border: "border-sky-200",    dot: "bg-sky-400",    label: "Data" },
  "Integration": { color: "text-violet-700", bg: "bg-violet-50",  border: "border-violet-200", dot: "bg-violet-400", label: "Integration" },
  "AI Model":    { color: "text-indigo-700", bg: "bg-indigo-50",  border: "border-indigo-200", dot: "bg-indigo-500", label: "AI" },
  "Automation":  { color: "text-emerald-700",bg: "bg-emerald-50", border: "border-emerald-200",dot: "bg-emerald-500",label: "Automation" },
  "Platform":    { color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-400",  label: "Platform" },
  "Frontend":    { color: "text-pink-700",   bg: "bg-pink-50",    border: "border-pink-200",   dot: "bg-pink-400",   label: "Output" },
  "Analytics":   { color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200", dot: "bg-orange-400", label: "Analytics" },
};

const DEFAULT_CONFIG = { color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400", label: "Tool" };

interface Layer {
  category: string;
  tools: BuildTool[];
}

function groupIntoLayers(tools: BuildTool[]): Layer[] {
  const map: Record<string, BuildTool[]> = {};
  for (const tool of tools) {
    const cat = tool.category ?? "Platform";
    if (!map[cat]) map[cat] = [];
    map[cat].push(tool);
  }

  // Sort by LAYER_ORDER, unknowns go to middle
  const known = LAYER_ORDER.filter((c) => map[c]);
  const unknown = Object.keys(map).filter((c) => !LAYER_ORDER.includes(c));
  const order = [...known.slice(0, 2), ...unknown, ...known.slice(2)];

  return order.filter((c) => map[c]).map((c) => ({ category: c, tools: map[c] }));
}

/* ─── Arrow SVG between layers ───────────────────────────── */

function Arrow() {
  return (
    <div className="flex items-center justify-center flex-shrink-0 px-1">
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2 12H28M22 6L28 12L22 18"
          stroke="#CBD5E1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ─── Tool node ──────────────────────────────────────────── */

function ToolNode({ tool, primary, config }: {
  tool: BuildTool;
  primary: boolean;
  config: typeof DEFAULT_CONFIG;
}) {
  return (
    <div
      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${config.bg} ${config.border} ${config.color} ${
        primary ? "ring-2 ring-offset-1 ring-[#c48a94] shadow-sm" : ""
      }`}
      title={tool.reason}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
        <span className="leading-tight">{tool.name}</span>
        {primary && (
          <span className="ml-auto text-indigo-500 text-xs font-bold">★</span>
        )}
      </div>
    </div>
  );
}

/* ─── Layer column ───────────────────────────────────────── */

function LayerColumn({ layer, primaryTool }: { layer: Layer; primaryTool: string }) {
  const config = LAYER_CONFIG[layer.category] ?? DEFAULT_CONFIG;
  return (
    <div className="flex flex-col items-center gap-2 min-w-[120px] max-w-[160px]">
      {/* Layer header */}
      <div className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
        {config.label}
      </div>
      {/* Tool nodes */}
      <div className="flex flex-col gap-1.5 w-full">
        {layer.tools.map((tool) => (
          <ToolNode
            key={tool.name}
            tool={tool}
            primary={tool.name === primaryTool}
            config={config}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Flow Map ───────────────────────────────────────────── */

export default function FlowMap({ spec }: { spec: BuildSpec }) {
  const layers = groupIntoLayers(spec.tools);

  if (layers.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">Architecture Flow</h2>
          <p className="text-xs text-gray-400 mt-0.5">How the tools connect end-to-end</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#fdf0f2", color: "#9a6570", border: "1px solid #e8c0c5" }}>
          ★ = primary tool
        </span>
      </div>

      {/* Flow diagram */}
      <div className="px-6 py-6 overflow-x-auto">
        <div className="flex items-start gap-0 min-w-max mx-auto w-fit">
          {/* User trigger node */}
          <div className="flex flex-col items-center gap-2 min-w-[80px]">
            <div className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
              Trigger
            </div>
            <div className="px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 bg-gray-50/50 text-center leading-tight">
              User /<br/>Schedule
            </div>
          </div>

          <Arrow />

          {layers.map((layer, i) => (
            <div key={layer.category} className="flex items-start">
              <LayerColumn layer={layer} primaryTool={spec.primary_tool} />
              {i < layers.length - 1 && <Arrow />}
            </div>
          ))}

          <Arrow />

          {/* Output node */}
          <div className="flex flex-col items-center gap-2 min-w-[80px]">
            <div className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
              Result
            </div>
            <div className="px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 bg-gray-50/50 text-center leading-tight">
              Output /<br/>Notification
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-5">
        <div className="border-t border-gray-50 pt-4 flex flex-wrap gap-x-4 gap-y-1.5">
          {layers.map((layer) => {
            const config = LAYER_CONFIG[layer.category] ?? DEFAULT_CONFIG;
            return (
              <div key={layer.category} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                {layer.category}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
