export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ClientProfile } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior AI governance consultant specializing in agentic AI systems. You assess whether organizations can govern and control autonomous AI agents — not whether they're ready to start using AI, but whether they can responsibly manage AI that acts on its own.

Your framework is informed by AvePoint's Agent Readiness model, Microsoft's Agentic AI Adoption Maturity Model, Gartner's Agentic AI Maturity Roadmap, and the Cisco 2025 AI Readiness Index.

Generate 20–25 targeted questions across 5 dimensions to assess AI Agent governance readiness. Make questions specific to the client's context, industry, and the agents they are deploying.

Return ONLY valid JSON. No markdown, no code fences.`;

function buildPrompt(profile: ClientProfile): string {
  return `
Client: ${profile.clientName}
Industry: ${profile.industry}
Organization Size: ${profile.orgSize} employees
AI Agents Being Deployed: ${profile.workflows || "Not specified"}
Current AI Goals: ${profile.goals}
Pain Points / Concerns: ${profile.painPoints || "Not specified"}

Generate 20–25 tailored AI Agent Readiness questions across exactly these 5 dimensions:

1. **Ownership & Accountability** (weight: 1.5x) — Who owns each agent? Are there clear approval workflows, named accountability, and escalation paths? Is shadow AI being tracked?

2. **Security & Access Controls** (weight: 1.5x) — Does each agent operate with least-privilege access? Is sensitive data exposure monitored? Are identity and authentication controls in place for agent actions?

3. **Lifecycle Management** (weight: 1.0x) — Is there a structured process for creating, testing, approving, updating, and retiring agents? Are stale or orphaned agents identified?

4. **Governance & Compliance** (weight: 1.0x) — Are AI agent policies documented? Is there audit-ready reporting on agent activity? Are relevant regulations (EU AI Act, NIST AI RMF, GDPR/CCPA, HIPAA if applicable) addressed?

5. **Human-in-the-Loop Design** (weight: 1.25x) — Are human intervention points defined for each agent? Are override mechanisms in place? Is decision accountability clear when agents take consequential actions?

Important calibration: most organizations deploying their first agents have no formal governance. Calibrate questions appropriately for a ${profile.orgSize} ${profile.industry} organization. Do not penalize early-stage orgs for lacking enterprise-level controls — but flag critical risks.

Return this JSON structure:
{
  "dimensions": [
    {
      "id": "ownership",
      "name": "Ownership & Accountability",
      "weight": 1.5,
      "questions": [
        {
          "id": "oa1",
          "dimension_id": "ownership",
          "question": "<specific, conversational question tailored to this client>",
          "type": "scale",
          "scale_labels": { "low": "<what 1 means for this question>", "high": "<what 5 means>" },
          "weight": 1.5,
          "hint": "<what to listen for — signals of readiness or a red flag>"
        },
        {
          "id": "oa2",
          "dimension_id": "ownership",
          "question": "<yes/no question>",
          "type": "yes_no",
          "weight": 1.0,
          "hint": "<context for the consultant>"
        }
      ]
    },
    { "id": "security", "name": "Security & Access Controls", "weight": 1.5, "questions": [...] },
    { "id": "lifecycle", "name": "Lifecycle Management", "weight": 1.0, "questions": [...] },
    { "id": "governance", "name": "Governance & Compliance", "weight": 1.0, "questions": [...] },
    { "id": "human_loop", "name": "Human-in-the-Loop Design", "weight": 1.25, "questions": [...] }
  ]
}

Rules:
- 4–5 questions per dimension (20–25 total)
- Include at least 1 "killer question" per dimension (weight: 1.5) — the ones that most reveal whether agents are under control
- Mix of scale, yes_no, and multiple_choice formats
- The Security and Ownership dimensions are the highest-signal — weight them accordingly
- If the client mentions specific agents (e.g. Copilot, ChatGPT, custom LLM), reference those in questions
- For ${profile.industry}: include any industry-specific compliance angle (e.g. HIPAA for healthcare, SOX for financial services)
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const profile: ClientProfile = await req.json();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(profile) }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const { dimensions } = JSON.parse(cleaned);

    return NextResponse.json({ dimensions });
  } catch (err) {
    console.error("[audit/generate-agent]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate questions" },
      { status: 500 }
    );
  }
}
