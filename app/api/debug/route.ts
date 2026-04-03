export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

export async function GET() {
  const results: Record<string, string> = {};

  results.anthropic_key = process.env.ANTHROPIC_API_KEY
    ? `set (starts with ${process.env.ANTHROPIC_API_KEY.slice(0, 12)}...)`
    : "MISSING";

  results.notion_token = process.env.NOTION_TOKEN
    ? `set (starts with ${process.env.NOTION_TOKEN.slice(0, 12)}...)`
    : "MISSING";

  results.notion_db = process.env.NOTION_DATABASE_ID
    ? `set: ${process.env.NOTION_DATABASE_ID}`
    : "MISSING";

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 10,
      messages: [{ role: "user", content: "say hi" }],
    });
    results.claude_test = `OK — ${msg.content[0].type}`;
  } catch (err) {
    results.claude_test = `FAILED: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json(results);
}
