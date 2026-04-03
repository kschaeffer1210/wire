import Anthropic from "@anthropic-ai/sdk";
import type { AIAnalysis, IntakeFormData } from "./types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Tool stacks that are approved/available per context
const CONTEXT_TOOL_CONSTRAINTS: Record<string, string> = {
  "NextEra Energy": `
IMPORTANT - NextEra Energy is a large regulated utility. Their available tech stack is strictly constrained to Microsoft-approved enterprise tools:
- Microsoft 365 ecosystem: Copilot for M365, Copilot Studio, Power Automate, Power Apps, Power BI, SharePoint, Teams, Outlook, Excel
- Microsoft Azure: Azure OpenAI Service, Azure Logic Apps, Azure Functions, Azure AI Foundry
- SAP (ERP) integrations via standard connectors
- ServiceNow (ITSM)
- NO external SaaS tools like Zapier, Make, n8n, Airtable, or consumer AI tools
- Agents must be built in Copilot Studio or Azure AI Foundry only
- Any automation must use Power Automate or Azure Logic Apps
- Data must stay within Microsoft cloud (data residency requirements)
Always recommend Microsoft Copilot Studio as the primary agent/chatbot platform for NextEra.
Always include Microsoft Copilot for M365 if the workflow involves Office documents, email, or Teams.`,

  "AI Whispers Back": `
AI Whispers Back is an AI consulting/training business. They can use any tool including:
- OpenAI, Anthropic Claude, Gemini APIs
- n8n, Make, Zapier for automation
- Vercel, Supabase, Railway for hosting
- Airtable, Notion for data
- Voiceflow, Botpress for chatbots
- Any modern AI/automation tool`,

  "Personal": `
Personal project — any tool is on the table, prioritize free/low-cost options and developer-friendly stacks.`,

  "Idea": `
Early-stage idea or problem to solve — no existing client or project context. Focus on:
- Clarifying the core problem and whether AI/automation is the right solution
- Recommending the simplest possible starting point to validate the idea
- Suggesting low-cost or no-code tools to test the concept quickly before investing in a full build
- Identifying what data, access, or integrations would be needed
Prioritize speed of learning and proof-of-concept over production-ready tooling.`,

  "Other": `
No specific tool constraints — recommend best-in-class tools for the use case.`,
};

const SYSTEM_PROMPT = `You are an expert AI implementation strategist with deep knowledge of the latest AI tools as of 2025. Always be current — include tools like Microsoft Copilot Studio, Copilot for M365, Claude claude-sonnet-4-20250514, GPT-4o, Gemini 2.0, n8n, and other cutting-edge platforms where appropriate.

Analyze the workflow and return ONLY a valid JSON object with no markdown fences. Schema:
{
  summary: string (2-3 sentences),
  solution_type: 'Chatbot'|'Automation'|'Agent'|'Vibe-code',
  solution_type_reason: string (1-2 sentences),
  confidence: number (0-100),
  time_reduction_pct: number (0-90),
  opportunities: [{title, detail, effort: 'low'|'medium'|'high', impact: 'high'|'medium'|'low'}] (3 items),
  tech_recommendations: string[] (4-6 tools, each with a 1-line reason),
  phases: [{phase: 1|2|3, label: string, title: string, items: string[] (3-4 bullet points), timeline: string}],
  risks: string,
  build_spec: {
    primary_tool: string,
    primary_tool_reason: string (2-3 sentences on why this is the best fit),
    tools: [{ name: string, category: string (e.g. "AI Model"|"Automation"|"Integration"|"Frontend"|"Data"), reason: string (1 sentence), effort: 'low'|'medium'|'high' }] (4-7 tools),
    integration_notes: string (specific notes on how the tools connect),
    estimated_build_time: string (e.g. "2–3 days" or "1–2 weeks"),
    prerequisites: string[] (3-5 items: licenses, accounts, data access needed before building)
  }
}`;

export async function analyzeWorkflow(intake: IntakeFormData): Promise<AIAnalysis> {
  const contextConstraints = CONTEXT_TOOL_CONSTRAINTS[intake.context] ?? CONTEXT_TOOL_CONSTRAINTS["Other"];

  const userMessage = `
Workflow Name: ${intake.workflowName}
Context/Client: ${intake.context}
Description: ${intake.description}
Current Tech Stack: ${intake.currentTechStack}
Pain Points: ${intake.painPoints}
Time per run: ${intake.timePerRun} hours
Runs per week: ${intake.runsPerWeek}
Hourly rate: $${intake.hourlyRate}/hr
Desired outcome: ${intake.desiredOutcome}
Build preference: ${intake.buildPreference}

TOOL CONSTRAINTS FOR THIS CONTEXT:
${contextConstraints}
  `.trim();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  const analysis: AIAnalysis = JSON.parse(cleaned);
  return analysis;
}
