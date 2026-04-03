import { Client } from "@notionhq/client";
import type { QueryDatabaseParameters } from "@notionhq/client/build/src/api-endpoints";
import type {
  WorkflowRecord,
  SolutionType,
  WorkflowStatus,
  Context,
  Opportunity,
  RoadmapPhase,
  BuildSpec,
  AIAnalysis,
  IntakeFormData,
} from "./types";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

function richText(text: string) {
  return [{ type: "text" as const, text: { content: text } }];
}

function getRichTextContent(prop: unknown): string {
  const p = prop as { rich_text?: Array<{ plain_text: string }> };
  return p?.rich_text?.map((t) => t.plain_text).join("") ?? "";
}

function getSelectValue(prop: unknown): string {
  const p = prop as { select?: { name: string } };
  return p?.select?.name ?? "";
}

function getNumberValue(prop: unknown): number {
  const p = prop as { number?: number };
  return p?.number ?? 0;
}

function getTitleValue(prop: unknown): string {
  const p = prop as { title?: Array<{ plain_text: string }> };
  return p?.title?.map((t) => t.plain_text).join("") ?? "";
}

export async function createWorkflowPage(
  intake: IntakeFormData,
  analysis: AIAnalysis,
  hoursSavedPerWeek: number,
  hoursSavedPerYear: number,
  annualValue: number
): Promise<string> {
  const response = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      Name: { title: richText(intake.workflowName) },
      Context: { select: { name: intake.context } },
      "Solution Type": { select: { name: analysis.solution_type } },
      Status: { select: { name: "Analyzed" } },
      "Hours Saved Per Week": { number: Math.round(hoursSavedPerWeek * 10) / 10 },
      "Hours Saved Per Year": { number: Math.round(hoursSavedPerYear * 10) / 10 },
      "Annual Value": { number: Math.round(annualValue) },
      "Time Reduction %": { number: analysis.time_reduction_pct },
      "Current Tech Stack": { rich_text: richText(intake.currentTechStack) },
      "Recommended Stack": {
        rich_text: richText(analysis.tech_recommendations.join(", ")),
      },
      Summary: { rich_text: richText(analysis.summary) },
      Opportunities: {
        rich_text: richText(JSON.stringify(analysis.opportunities)),
      },
      Roadmap: {
        rich_text: richText(JSON.stringify(analysis.phases)),
      },
      "Build Spec": {
        rich_text: richText(JSON.stringify(analysis.build_spec ?? null)),
      },
      "Hourly Rate": { number: intake.hourlyRate },
    },
  });

  return response.id;
}

export async function getWorkflowPage(pageId: string): Promise<WorkflowRecord> {
  const page = await notion.pages.retrieve({ page_id: pageId });
  const p = page as { id: string; url: string; created_time: string; properties: Record<string, unknown> };
  const props = p.properties;

  let opportunities: Opportunity[] = [];
  let roadmap: RoadmapPhase[] = [];
  let buildSpec: BuildSpec | undefined;

  try {
    const oppStr = getRichTextContent(props["Opportunities"]);
    if (oppStr) opportunities = JSON.parse(oppStr);
  } catch {}

  try {
    const roadmapStr = getRichTextContent(props["Roadmap"]);
    if (roadmapStr) roadmap = JSON.parse(roadmapStr);
  } catch {}

  try {
    const specStr = getRichTextContent(props["Build Spec"]);
    if (specStr && specStr !== "null") buildSpec = JSON.parse(specStr);
  } catch {}

  return {
    id: p.id,
    notionUrl: p.url,
    name: getTitleValue(props["Name"]),
    context: getSelectValue(props["Context"]) as Context,
    solutionType: getSelectValue(props["Solution Type"]) as SolutionType,
    status: getSelectValue(props["Status"]) as WorkflowStatus,
    hoursSavedPerWeek: getNumberValue(props["Hours Saved Per Week"]),
    hoursSavedPerYear: getNumberValue(props["Hours Saved Per Year"]),
    annualValue: getNumberValue(props["Annual Value"]),
    timeReductionPct: getNumberValue(props["Time Reduction %"]),
    currentTechStack: getRichTextContent(props["Current Tech Stack"]),
    recommendedStack: getRichTextContent(props["Recommended Stack"]),
    summary: getRichTextContent(props["Summary"]),
    opportunities,
    roadmap,
    buildSpec,
    hourlyRate: getNumberValue(props["Hourly Rate"]),
    createdTime: p.created_time,
  };
}

export async function getAllWorkflows(filters?: {
  context?: string;
  solution_type?: string;
  status?: string;
}): Promise<WorkflowRecord[]> {
  const filterConditions: unknown[] = [];

  if (filters?.context) {
    filterConditions.push({
      property: "Context",
      select: { equals: filters.context },
    });
  }
  if (filters?.solution_type) {
    filterConditions.push({
      property: "Solution Type",
      select: { equals: filters.solution_type },
    });
  }
  if (filters?.status) {
    filterConditions.push({
      property: "Status",
      select: { equals: filters.status },
    });
  }

  const queryParams: QueryDatabaseParameters = {
    database_id: DATABASE_ID,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  };

  if (filterConditions.length === 1) {
    queryParams.filter = filterConditions[0] as QueryDatabaseParameters["filter"];
  } else if (filterConditions.length > 1) {
    queryParams.filter = { and: filterConditions } as QueryDatabaseParameters["filter"];
  }

  const response = await notion.databases.query(queryParams);

  return response.results.map((page) => {
    const p = page as { id: string; url: string; created_time: string; properties: Record<string, unknown> };
    const props = p.properties;

    let opportunities: Opportunity[] = [];
    let roadmap: RoadmapPhase[] = [];
    let buildSpec: BuildSpec | undefined;

    try {
      const oppStr = getRichTextContent(props["Opportunities"]);
      if (oppStr) opportunities = JSON.parse(oppStr);
    } catch {}

    try {
      const roadmapStr = getRichTextContent(props["Roadmap"]);
      if (roadmapStr) roadmap = JSON.parse(roadmapStr);
    } catch {}

    try {
      const specStr = getRichTextContent(props["Build Spec"]);
      if (specStr && specStr !== "null") buildSpec = JSON.parse(specStr);
    } catch {}

    return {
      id: p.id,
      notionUrl: p.url,
      name: getTitleValue(props["Name"]),
      context: getSelectValue(props["Context"]) as Context,
      solutionType: getSelectValue(props["Solution Type"]) as SolutionType,
      status: getSelectValue(props["Status"]) as WorkflowStatus,
      hoursSavedPerWeek: getNumberValue(props["Hours Saved Per Week"]),
      hoursSavedPerYear: getNumberValue(props["Hours Saved Per Year"]),
      annualValue: getNumberValue(props["Annual Value"]),
      timeReductionPct: getNumberValue(props["Time Reduction %"]),
      currentTechStack: getRichTextContent(props["Current Tech Stack"]),
      recommendedStack: getRichTextContent(props["Recommended Stack"]),
      summary: getRichTextContent(props["Summary"]),
      opportunities,
      roadmap,
      buildSpec,
      hourlyRate: getNumberValue(props["Hourly Rate"]),
      createdTime: p.created_time,
    };
  });
}
