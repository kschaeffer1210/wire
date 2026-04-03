import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ClientProfile } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior AI readiness consultant who has assessed hundreds of organizations. Your task is to generate a tailored set of 35–40 AI readiness audit questions for a specific client.

The questions must be:
- Specific to the client's industry, size, and stated goals — not generic
- Drawn from best-practice frameworks (Cisco, Microsoft, Gartner, McKinsey, BCG)
- Covering 7 dimensions with appropriate depth per dimension
- A mix of formats: scale (1–5), yes_no, and multiple_choice
- Include "killer questions" — the ones most revealing of readiness or unreadiness

Scoring guidelines for question types:
- "scale": respondent answers 1–5 where 1=lowest maturity, 5=highest. Provide clear low/high labels.
- "yes_no": respondent answers "yes" or "no"
- "multiple_choice": provide 4–5 options each with a score (0–100) already embedded

Return ONLY valid JSON. No markdown, no code fences.`;

function buildPrompt(profile: ClientProfile): string {
  return `
Generate a tailored AI readiness audit for this client:

Client: ${profile.clientName}
Industry: ${profile.industry}
Organization Size: ${profile.orgSize} employees
AI Goals: ${profile.goals}
Specific Workflows to Automate: ${profile.workflows || "Not specified"}
Biggest Pain Points: ${profile.painPoints}

Generate 35–40 questions across exactly these 7 dimensions. Tailor the Process Maturity questions especially to their stated workflows and industry.

Dimension weights (affects final score calculation):
- Strategy & Leadership: 1.5x weight — this is the capability multiplier dimension
- Data Readiness: 1.25x weight — #1 predictor of AI success
- Technology & Infrastructure: 1.0x
- People & Culture: 1.0x
- Governance & Ethics: 1.0x
- Process Maturity: 1.0x (tailor heavily to their specific workflows)
- Financial Readiness: 1.0x

Return this JSON structure:
{
  "dimensions": [
    {
      "id": "strategy",
      "name": "Strategy & Leadership",
      "weight": 1.5,
      "questions": [
        {
          "id": "s1",
          "dimension_id": "strategy",
          "question": "<specific question text tailored to this client>",
          "type": "scale",
          "scale_labels": { "low": "<what 1 means>", "high": "<what 5 means>" },
          "weight": 1.5,
          "hint": "<brief tip for the consultant asking this question — what to listen for>"
        },
        {
          "id": "s2",
          "dimension_id": "strategy",
          "question": "<question>",
          "type": "yes_no",
          "weight": 1.0,
          "hint": "<tip>"
        },
        {
          "id": "s3",
          "dimension_id": "strategy",
          "question": "<question>",
          "type": "multiple_choice",
          "options": [
            { "label": "<option A>", "score": 0 },
            { "label": "<option B>", "score": 25 },
            { "label": "<option C>", "score": 50 },
            { "label": "<option D>", "score": 75 },
            { "label": "<option E>", "score": 100 }
          ],
          "weight": 1.0,
          "hint": "<tip>"
        }
      ]
    },
    { "id": "data", "name": "Data Readiness", "weight": 1.25, "questions": [...] },
    { "id": "technology", "name": "Technology & Infrastructure", "weight": 1.0, "questions": [...] },
    { "id": "people", "name": "People & Culture", "weight": 1.0, "questions": [...] },
    { "id": "governance", "name": "Governance & Ethics", "weight": 1.0, "questions": [...] },
    { "id": "process", "name": "Process Maturity", "weight": 1.0, "questions": [...] },
    { "id": "financial", "name": "Financial Readiness", "weight": 1.0, "questions": [...] }
  ]
}

Important rules:
- 5–6 questions per dimension (35–42 total)
- Include at least 2 "killer questions" per dimension (weight: 1.5) — the ones most revealing of readiness
- Regular questions get weight: 1.0
- Make questions conversational and non-threatening — this is a consulting conversation, not a test
- For ${profile.industry} organizations of ${profile.orgSize} employees, calibrate difficulty appropriately (SMBs rarely have formal MLOps; don't penalize them for enterprise-level gaps)
- Process Maturity questions must reference the specific workflows the client mentioned: ${profile.workflows || "general business processes"}
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const profile: ClientProfile = await req.json();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(profile) }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const { dimensions } = JSON.parse(cleaned);

    return NextResponse.json({ dimensions });
  } catch (err) {
    console.error("[audit/generate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate questions" },
      { status: 500 }
    );
  }
}
