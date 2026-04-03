import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getWorkflowPage } from "@/lib/notion";
import type { BuildGuide } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CONTEXT_TOOL_CONSTRAINTS: Record<string, string> = {
  "NextEra Energy": `
STRICT CONSTRAINT — NextEra Energy Microsoft-only stack:
- Automation: Power Automate, Azure Logic Apps only
- AI/Agents: Microsoft Copilot Studio, Azure OpenAI Service, Azure AI Foundry only
- Data: SharePoint, Dataverse, Azure SQL, OneDrive
- Notifications: Teams, Outlook
- Monitoring: Power BI, Azure Monitor
- NO Zapier, Make, n8n, OpenAI direct API, or any non-Microsoft SaaS
All node "tool" fields must reference Microsoft products only.`,

  "AI Whispers Back": `
Use modern best-in-class AI tools: Claude API, OpenAI, n8n, Make, Zapier, Voiceflow, Supabase, Vercel, etc.`,

  "Personal": `
Use free/low-cost, developer-friendly tools. Prioritize open-source.`,

  "Idea": `
This is an early-stage idea. Recommend the simplest no-code or low-code tools to build a proof-of-concept quickly. Focus on validating the concept before a full build.`,

  "Other": `
Use best-in-class tools appropriate for the use case.`,
};

const BUILD_GUIDE_SYSTEM_PROMPT = `You are an expert workflow automation architect. Generate a detailed, specific, actionable build guide for the given workflow.

Return ONLY valid JSON (no markdown, no code fences). Schema:
{
  "flow_nodes": [
    { "id": "string (slug like 'trigger-1')", "type": "trigger|process|ai|decision|integration|output|notification", "label": "string (max 32 chars)", "tool": "string (tool/platform name, max 24 chars)", "note": "string (optional short note)" }
  ],
  "flow_edges": [
    { "from": "node-id", "to": "node-id", "label": "string (optional, e.g. 'Yes', 'No', 'On error')" }
  ],
  "build_steps": [
    { "step": 1, "title": "string", "tool": "string", "instructions": ["string", "..."] (4-7 specific instructions), "time_estimate": "string (e.g. '30 min')", "tip": "string (optional pro tip)" }
  ],
  "test_plan": ["string"] (5-7 specific test cases),
  "go_live_checklist": ["string"] (5-7 go-live items),
  "total_build_time": "string (e.g. '2-3 days')"
}

Rules:
- flow_nodes must represent the ACTUAL automated workflow steps (6-12 nodes), not tool categories
- First node is always type "trigger" (what kicks off the workflow)
- Last node(s) are type "output" or "notification"
- flow_edges form a directed graph — every node must be reachable from the trigger
- build_steps must be specific, actionable steps with exact menu paths, settings, and field names where possible
- Instructions should be numbered-style commands like "In Power Automate, click New flow → Automated cloud flow"
- test_plan and go_live_checklist items should be specific to this workflow, not generic`;

export async function POST(req: NextRequest) {
  try {
    const { pageId } = await req.json();
    if (!pageId) {
      return NextResponse.json({ error: "pageId required" }, { status: 400 });
    }

    // Fetch workflow context from Notion
    const record = await getWorkflowPage(pageId);

    const contextConstraints = CONTEXT_TOOL_CONSTRAINTS[record.context] ?? CONTEXT_TOOL_CONSTRAINTS["Other"];

    const buildSpecContext = record.buildSpec
      ? `
Primary Tool: ${record.buildSpec.primary_tool}
Primary Tool Reason: ${record.buildSpec.primary_tool_reason}
Tool Stack: ${record.buildSpec.tools.map((t) => `${t.name} (${t.category})`).join(", ")}
Integration Notes: ${record.buildSpec.integration_notes}
Prerequisites: ${record.buildSpec.prerequisites?.join(", ") ?? "None"}
Estimated Build Time: ${record.buildSpec.estimated_build_time}`
      : "";

    const userMessage = `
Workflow Name: ${record.name}
Context/Client: ${record.context}
Solution Type: ${record.solutionType}
Summary: ${record.summary}
Current Tech Stack: ${record.currentTechStack}
Recommended Stack: ${record.recommendedStack}
${buildSpecContext}

TOOL CONSTRAINTS:
${contextConstraints}

Generate a complete build guide for this ${record.solutionType} workflow. The flow diagram should show the actual automated process from trigger to output — what happens at each step when this workflow runs. The build steps should walk a developer through building it from scratch.
    `.trim();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: BUILD_GUIDE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const guide: BuildGuide = JSON.parse(cleaned);

    return NextResponse.json({ guide });
  } catch (err) {
    console.error("[build-guide]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate build guide" },
      { status: 500 }
    );
  }
}
