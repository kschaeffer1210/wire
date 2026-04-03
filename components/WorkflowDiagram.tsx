"use client";

import type { BuildGuide, FlowNode, FlowNodeType } from "@/lib/types";

/* ─── Layout constants ──────────────────────────────────────── */

const CANVAS_W = 580;
const NODE_W = 260;
const NODE_H = 60;
const DECISION_W = 200;
const DECISION_H = 72;
const ROW_H = 120; // total height per row (node + gap)
const CX = CANVAS_W / 2;
const PAD_Y = 28;

/* ─── Node style config ─────────────────────────────────────── */

type NodeStyle = {
  fill: string;
  stroke: string;
  badge: string;
  badgeText: string;
  label: string;
  textColor: string;
};

const STYLES: Record<FlowNodeType, NodeStyle> = {
  trigger: {
    fill: "#ecfdf5", stroke: "#059669",
    badge: "#d1fae5", badgeText: "#059669",
    label: "TRIGGER", textColor: "#065f46",
  },
  process: {
    fill: "#f9fafb", stroke: "#9ca3af",
    badge: "#f3f4f6", badgeText: "#6b7280",
    label: "PROCESS", textColor: "#111827",
  },
  ai: {
    fill: "#eef2ff", stroke: "#4f46e5",
    badge: "#e0e7ff", badgeText: "#4338ca",
    label: "AI", textColor: "#1e1b4b",
  },
  decision: {
    fill: "#fffbeb", stroke: "#d97706",
    badge: "#fef3c7", badgeText: "#b45309",
    label: "DECISION", textColor: "#78350f",
  },
  integration: {
    fill: "#faf5ff", stroke: "#7c3aed",
    badge: "#ede9fe", badgeText: "#6d28d9",
    label: "INTEGRATION", textColor: "#3b0764",
  },
  output: {
    fill: "#f0fdf4", stroke: "#16a34a",
    badge: "#dcfce7", badgeText: "#15803d",
    label: "OUTPUT", textColor: "#14532d",
  },
  notification: {
    fill: "#eff6ff", stroke: "#2563eb",
    badge: "#dbeafe", badgeText: "#1d4ed8",
    label: "NOTIFY", textColor: "#1e3a8a",
  },
};

/* ─── Helpers ───────────────────────────────────────────────── */

function nodeTopY(index: number): number {
  return PAD_Y + index * ROW_H;
}

function nodeCenterY(index: number, type: FlowNodeType): number {
  const h = type === "decision" ? DECISION_H : NODE_H;
  return nodeTopY(index) + h / 2;
}

function nodeBottomY(index: number, type: FlowNodeType): number {
  const h = type === "decision" ? DECISION_H : NODE_H;
  return nodeTopY(index) + h;
}

function trunc(s: string, max: number): string {
  return s && s.length > max ? s.slice(0, max - 1) + "…" : (s ?? "");
}

/* ─── Arrow marker ──────────────────────────────────────────── */

function Defs() {
  return (
    <defs>
      <marker id="wf-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
      </marker>
      <filter id="node-shadow" x="-5%" y="-5%" width="110%" height="120%">
        <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#00000018" />
      </filter>
    </defs>
  );
}

/* ─── Node renderers ────────────────────────────────────────── */

function RectNode({ node, index }: { node: FlowNode; index: number }) {
  const s = STYLES[node.type] ?? STYLES.process;
  const x = CX - NODE_W / 2;
  const y = nodeTopY(index);
  const badgeW = s.label.length * 6 + 12;

  return (
    <g filter="url(#node-shadow)">
      {/* Card */}
      <rect x={x} y={y} width={NODE_W} height={NODE_H} rx="10" fill={s.fill} stroke={s.stroke} strokeWidth="1.5" />

      {/* Type badge pill */}
      <rect x={x + 10} y={y + 9} width={badgeW} height={17} rx="4" fill={s.badge} />
      <text x={x + 16} y={y + 18} fontSize="9" fontWeight="700" fill={s.badgeText} letterSpacing="0.6">
        {s.label}
      </text>

      {/* Main label */}
      <text x={CX} y={y + 38} fontSize="12.5" fontWeight="600" fill={s.textColor} textAnchor="middle" dominantBaseline="middle">
        {trunc(node.label, 34)}
      </text>

      {/* Tool sub-label (right side) */}
      {node.tool && (
        <text x={x + NODE_W - 10} y={y + 12} fontSize="9" fill="#94a3b8" textAnchor="end" dominantBaseline="middle">
          {trunc(node.tool, 22)}
        </text>
      )}
    </g>
  );
}

function DiamondNode({ node, index }: { node: FlowNode; index: number }) {
  const s = STYLES.decision;
  const cx = CX;
  const cy = nodeCenterY(index, "decision");
  const hw = DECISION_W / 2;
  const hh = DECISION_H / 2;
  const points = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;

  return (
    <g filter="url(#node-shadow)">
      <polygon points={points} fill={s.fill} stroke={s.stroke} strokeWidth="1.5" />
      <text x={cx} y={cy - 8} fontSize="9" fontWeight="700" fill={s.badgeText} textAnchor="middle" letterSpacing="0.6">
        {s.label}
      </text>
      <text x={cx} y={cy + 8} fontSize="12" fontWeight="600" fill={s.textColor} textAnchor="middle" dominantBaseline="middle">
        {trunc(node.label, 22)}
      </text>
    </g>
  );
}

/* ─── Edge renderer ─────────────────────────────────────────── */

function Edge({
  fromIdx, toIdx, fromType, label,
}: {
  fromIdx: number; toIdx: number;
  fromType: FlowNodeType; toType?: FlowNodeType;
  label?: string;
}) {
  const x1 = CX;
  const y1 = nodeBottomY(fromIdx, fromType);
  const y2 = nodeTopY(toIdx) - 2;
  const midY = (y1 + y2) / 2;

  // If going backwards or to same row, skip (avoid visual mess)
  if (toIdx <= fromIdx) return null;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x1} y2={y2 - 6} stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#wf-arrow)" />
      {label && (
        <text x={x1 + 8} y={midY} fontSize="10" fill="#64748b" fontWeight="500" dominantBaseline="middle">
          {label}
        </text>
      )}
    </g>
  );
}

/* ─── Main component ────────────────────────────────────────── */

export default function WorkflowDiagram({ guide }: { guide: BuildGuide }) {
  const { flow_nodes: nodes, flow_edges: edges } = guide;

  if (!nodes || nodes.length === 0) return null;

  // Build index map
  const idxMap = new Map(nodes.map((n, i) => [n.id, i]));

  // Calculate total canvas height
  const lastIdx = nodes.length - 1;
  const lastType = nodes[lastIdx].type;
  const canvasH = nodeBottomY(lastIdx, lastType) + PAD_Y;

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm">Workflow Diagram</h3>
        <p className="text-xs text-gray-400 mt-0.5">Visual flow of the automated process</p>
      </div>

      {/* SVG diagram */}
      <div className="px-6 py-6 flex justify-center overflow-x-auto">
        <svg
          width={CANVAS_W}
          height={canvasH}
          viewBox={`0 0 ${CANVAS_W} ${canvasH}`}
          style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", maxWidth: "100%" }}
        >
          <Defs />

          {/* Background grid dots (subtle) */}
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#f1f5f9" />
          </pattern>
          <rect width={CANVAS_W} height={canvasH} fill="url(#dots)" />

          {/* Edges (drawn first so nodes appear on top) */}
          {edges.map((edge, i) => {
            const fromIdx = idxMap.get(edge.from);
            const toIdx = idxMap.get(edge.to);
            if (fromIdx === undefined || toIdx === undefined) return null;
            return (
              <Edge
                key={i}
                fromIdx={fromIdx}
                toIdx={toIdx}
                fromType={nodes[fromIdx].type}
                toType={nodes[toIdx].type}
                label={edge.label}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node, i) =>
            node.type === "decision" ? (
              <DiamondNode key={node.id} node={node} index={i} />
            ) : (
              <RectNode key={node.id} node={node} index={i} />
            )
          )}
        </svg>
      </div>

      {/* Node type legend */}
      <div className="px-6 pb-5 border-t border-gray-50 pt-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {(["trigger", "process", "ai", "decision", "integration", "output", "notification"] as FlowNodeType[])
            .filter((t) => nodes.some((n) => n.type === t))
            .map((type) => {
              const s = STYLES[type];
              return (
                <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: s.badge, border: `1px solid ${s.stroke}` }}
                  />
                  {s.label.charAt(0) + s.label.slice(1).toLowerCase()}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
