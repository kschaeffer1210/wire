import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ClientProfile, AuditDimension, AuditReport } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior AI readiness consultant producing a formal audit report. You will receive a client profile, a set of assessment questions, and the client's answers.

Your job is to:
1. Score each dimension honestly (0–100) based on the answers
2. Apply dimension weights to compute the overall weighted score (0–100)
3. Write specific, insightful analysis — not generic advice
4. Identify real blockers and actionable quick wins
5. Build a practical 90-day roadmap

Scoring formula:
overall_score = weighted sum of (dimension_score × dimension_weight) / sum of weights

Maturity bands:
80–100: Transforming — ready to scale AI broadly
65–79: Scaling — actively piloting and expanding
50–64: Implementing — pilots underway, gaps to address
35–49: Exploring — foundational work needed first
0–34: Aware — not ready; invest in prerequisites

Be honest. Most SMBs score 35–55 on initial assessment. Do not inflate scores.
Return ONLY valid JSON. No markdown, no code fences.`;

function buildScorePrompt(
  profile: ClientProfile,
  dimensions: AuditDimension[],
  answers: Record<string, string | number>
): string {
  const qaBlock = dimensions.map((dim) => {
    const qs = dim.questions.map((q) => {
      const answer = answers[q.id];
      return `  Q (${q.type}, weight=${q.weight}): ${q.question}\n  A: ${answer ?? "Not answered"}`;
    }).join("\n\n");
    return `=== ${dim.name} (dimension weight: ${dim.weight}x) ===\n${qs}`;
  }).join("\n\n");

  return `
Client: ${profile.clientName}
Industry: ${profile.industry}
Size: ${profile.orgSize} employees
Goals: ${profile.goals}
Workflows: ${profile.workflows}
Pain Points: ${profile.painPoints}

QUESTIONS AND ANSWERS:
${qaBlock}

Dimension weights:
${dimensions.map((d) => `- ${d.name}: ${d.weight}x`).join("\n")}

Score all dimensions and produce a comprehensive audit report. Return this exact JSON:
{
  "client_name": "${profile.clientName}",
  "client_industry": "${profile.industry}",
  "audit_date": "${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}",
  "overall_score": <0–100 weighted integer>,
  "overall_level": "<Aware | Exploring | Implementing | Scaling | Transforming>",
  "executive_summary": "<3–4 sentences. The single most important readiness story for this specific client. What is their headline strength? What is the critical gap holding them back? What should they do first?>",
  "dimensions": [
    {
      "dimension": "<exact dimension name>",
      "score": <0–100>,
      "level": "<Aware | Exploring | Implementing | Scaling | Transforming>",
      "summary": "<1 crisp sentence specific to this client and their answers>",
      "strengths": ["<specific strength from their answers>", "<second strength>"],
      "gaps": ["<specific gap from their answers>", "<second gap>"],
      "recommendation": "<1 specific, actionable next step — name tools, people, or documents where helpful>"
    }
  ],
  "top_blockers": [
    {
      "title": "<short blocker title>",
      "detail": "<2 sentences explaining why this specifically blocks AI success for this client>",
      "priority": "<critical | high | medium>"
    }
  ],
  "quick_wins": [
    {
      "action": "<specific action — what exactly to do>",
      "impact": "<what this will enable or unlock>",
      "timeline": "<e.g. Week 1–2>"
    }
  ],
  "roadmap": [
    {
      "phase": "1",
      "title": "<phase name — e.g. Foundation>",
      "timeline": "<e.g. Days 1–30>",
      "actions": ["<specific action>", "<action>", "<action>"]
    },
    {
      "phase": "2",
      "title": "<phase name — e.g. Pilot>",
      "timeline": "<e.g. Days 31–60>",
      "actions": ["<action>", "<action>", "<action>"]
    },
    {
      "phase": "3",
      "title": "<phase name — e.g. Scale>",
      "timeline": "<e.g. Days 61–90>",
      "actions": ["<action>", "<action>", "<action>"]
    }
  ],
  "benchmark_context": "<2 sentences. How does this client's profile compare to similar ${profile.industry} organizations at this stage? Use real benchmark data where relevant (e.g., Cisco 2024: only 14% of SMBs are fully AI-ready).>",
  "recommended_starting_point": "<The single best first AI use case or workflow to pursue, specific to this client's situation and pain points. 2–3 sentences explaining why this is the right starting point.>"
}
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { profile, dimensions, answers } = await req.json() as {
      profile: ClientProfile;
      dimensions: AuditDimension[];
      answers: Record<string, string | number>;
    };

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildScorePrompt(profile, dimensions, answers) }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const report: AuditReport = JSON.parse(cleaned);

    return NextResponse.json({ report });
  } catch (err) {
    console.error("[audit/score]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to score audit" },
      { status: 500 }
    );
  }
}
