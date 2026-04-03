import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getWorkflowPage } from "@/lib/notion";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior AI readiness consultant who has conducted hundreds of workflow automation assessments. Your job is to audit a specific submitted workflow — not the organization broadly — and produce a rigorous, honest, workflow-specific AI readiness report.

You assess across 7 dimensions using a 1–5 scale:
1 = Ad Hoc     (no structure, major gaps, not ready)
2 = Developing (early stage, fragmented, significant gaps)
3 = Established (functional, some inconsistency, needs improvement)
4 = Advanced   (mature, scalable, minor gaps)
5 = Leading    (optimized, best-practice, ready to execute)

Scoring rules:
- Be realistic and specific. A score of 4 or 5 must be earned — do not be generous.
- Findings must reference the actual workflow details provided, not generic advice.
- Recommendations must be concrete and actionable for this specific workflow.
- The overall_score is a weighted average: Automation Fit and Process Maturity are weighted 1.5x, others 1x.

Return ONLY valid JSON. No markdown, no code fences, no commentary outside the JSON.`;

const USER_PROMPT = (record: {
  name: string;
  context: string;
  summary: string;
  solutionType: string;
  recommendedStack: string;
  currentTechStack: string;
  hoursSavedPerWeek: number;
  annualValue: number;
  status: string;
  hourlyRate: number;
}) => `
Workflow Name: ${record.name}
Context / Organization: ${record.context}
Workflow Summary: ${record.summary}
Solution Type Recommended: ${record.solutionType}
Current Tech Stack: ${record.currentTechStack || "Not specified"}
Recommended Stack: ${record.recommendedStack || "Not specified"}
Hours Saved / Week (projected): ${record.hoursSavedPerWeek}
Annual Value (projected): $${record.annualValue.toLocaleString()}
Current Status: ${record.status}
Hourly Rate Used: $${record.hourlyRate}/hr

Conduct a full AI Readiness Audit for this specific workflow. Assess each of the 7 dimensions below. Use short, punchy dimension names exactly as specified.

Dimensions to assess:
1. "Process Maturity" — Is this workflow documented, standardized, measurable, and repeatable? Is it rule-based with clear inputs/outputs?
2. "Data Readiness" — Does this workflow produce or consume structured, accessible data? Are data quality, consistency, and governance adequate for AI?
3. "Tech Fit" — Are the systems in this workflow API-capable, cloud-ready, and integration-friendly? Does the current stack support automation?
4. "Talent & Change" — Does the team have or can they acquire the AI skills needed? Is there organizational willingness to adopt?
5. "Governance" — Are compliance, privacy, auditability, and risk management addressed for automating this workflow?
6. "Strategic Fit" — Does automating this workflow clearly align with organizational goals? Is there executive-level support?
7. "Automation Fit" — How inherently suited is this specific workflow for AI automation? (repetitive, high-volume, rule-based, well-defined, measurable outcomes)

Return this exact JSON structure:
{
  "overall_score": <weighted average 1.0–5.0, one decimal place>,
  "overall_level": "<exactly one of: Ad Hoc | Developing | Established | Advanced | Leading>",
  "overall_summary": "<2–3 sentences. Specific to this workflow. What is the readiness story? What is the single most important thing holding it back or propelling it forward?>",
  "dimensions": [
    {
      "dimension": "<exact dimension name from list above>",
      "score": <integer 1–5>,
      "level": "<Ad Hoc | Developing | Established | Advanced | Leading>",
      "summary": "<1 crisp sentence specific to this workflow>",
      "findings": [
        "<specific observable finding about this workflow — what signals this score>",
        "<second specific finding>",
        "<third specific finding>"
      ],
      "recommendation": "<1 specific, actionable next step for this workflow — name tools, people, or documents where helpful>"
    }
  ],
  "top_blockers": [
    "<the single most critical blocker to AI automation success for this workflow>",
    "<second critical blocker>",
    "<third critical blocker>"
  ],
  "quick_wins": [
    "<an action that could be taken in the next 30 days to meaningfully improve readiness for this workflow>",
    "<second quick win>",
    "<third quick win>"
  ],
  "phased_roadmap": [
    {
      "phase": "1",
      "title": "<phase name, e.g. Foundation>",
      "timeline": "<e.g. 0–30 days>",
      "actions": [
        "<specific action for this workflow>",
        "<second action>",
        "<third action>"
      ]
    },
    {
      "phase": "2",
      "title": "<phase name, e.g. Pilot>",
      "timeline": "<e.g. 1–3 months>",
      "actions": ["<action>", "<action>", "<action>"]
    },
    {
      "phase": "3",
      "title": "<phase name, e.g. Scale>",
      "timeline": "<e.g. 3–6 months>",
      "actions": ["<action>", "<action>", "<action>"]
    }
  ],
  "automation_fit_score": <integer 1–10, how well-suited is this specific workflow for AI automation>,
  "automation_fit_rationale": "<2–3 sentences explaining the automation fit score. Be specific about what makes this workflow a strong or weak automation candidate.>",
  "benchmark_context": "<1–2 sentences. How does this workflow's readiness profile compare to similar workflows or organizations at this stage of AI adoption?>"
}
`.trim();

export async function POST(req: NextRequest) {
  try {
    const { pageId } = await req.json();
    if (!pageId) {
      return NextResponse.json({ error: "pageId required" }, { status: 400 });
    }

    const record = await getWorkflowPage(pageId);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: USER_PROMPT(record) }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const audit = JSON.parse(cleaned);

    return NextResponse.json({ audit });
  } catch (err) {
    console.error("[ai-readiness]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate audit" },
      { status: 500 }
    );
  }
}
