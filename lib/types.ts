export type SolutionType = "Chatbot" | "Automation" | "Agent" | "Vibe-code";
export type WorkflowStatus = "Analyzed" | "In Progress" | "Complete" | "Archived";
export type Context = "NextEra Energy" | "AI Whispers Back" | "Personal" | "Idea" | "Other";
export type Effort = "low" | "medium" | "high";
export type Impact = "high" | "medium" | "low";
export type BuildPreference = "No-code/low-code first" | "API/custom build OK" | "Open to anything";

export interface Opportunity {
  title: string;
  detail: string;
  effort: Effort;
  impact: Impact;
}

export interface RoadmapPhase {
  phase: 1 | 2 | 3;
  label: string;
  title: string;
  items: string[];
  timeline: string;
}

export interface BuildTool {
  name: string;
  category: string;
  reason: string;
  effort: Effort;
  url?: string;
}

export interface BuildSpec {
  primary_tool: string;
  primary_tool_reason: string;
  tools: BuildTool[];
  integration_notes: string;
  estimated_build_time: string;
  prerequisites: string[];
}

export type FlowNodeType = "trigger" | "process" | "ai" | "decision" | "integration" | "output" | "notification";

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  label: string;
  tool?: string;
  note?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface BuildStep {
  step: number;
  title: string;
  tool: string;
  instructions: string[];
  time_estimate: string;
  tip?: string;
}

export interface BuildGuide {
  flow_nodes: FlowNode[];
  flow_edges: FlowEdge[];
  build_steps: BuildStep[];
  test_plan: string[];
  go_live_checklist: string[];
  total_build_time: string;
}

export interface AIAnalysis {
  summary: string;
  solution_type: SolutionType;
  solution_type_reason: string;
  confidence: number;
  time_reduction_pct: number;
  opportunities: Opportunity[];
  tech_recommendations: string[];
  phases: RoadmapPhase[];
  risks: string;
  build_spec?: BuildSpec;
}

export interface IntakeFormData {
  workflowName: string;
  context: Context;
  description: string;
  currentTechStack: string;
  painPoints: string;
  timePerRun: number;
  runsPerWeek: number;
  hourlyRate: number;
  desiredOutcome: string;
  buildPreference: BuildPreference;
}

export interface ReadinessDimension {
  dimension: string;
  score: number;
  level: string;
  summary: string;
  findings: string[];
  recommendation: string;
}

export interface ReadinessPhase {
  phase: string;
  title: string;
  timeline: string;
  actions: string[];
}

export interface AIReadinessAudit {
  overall_score: number;
  overall_level: string;
  overall_summary: string;
  dimensions: ReadinessDimension[];
  top_blockers: string[];
  quick_wins: string[];
  phased_roadmap: ReadinessPhase[];
  automation_fit_score: number;
  automation_fit_rationale: string;
  benchmark_context: string;
}

export interface WorkflowRecord {
  id: string;
  notionUrl: string;
  name: string;
  context: Context;
  solutionType: SolutionType;
  status: WorkflowStatus;
  hoursSavedPerWeek: number;
  hoursSavedPerYear: number;
  annualValue: number;
  timeReductionPct: number;
  currentTechStack: string;
  recommendedStack: string;
  summary: string;
  opportunities: Opportunity[];
  roadmap: RoadmapPhase[];
  buildSpec?: BuildSpec;
  buildGuide?: BuildGuide;
  hourlyRate: number;
  createdTime: string;
}
