import { NextRequest, NextResponse } from "next/server";
import { getAllWorkflows } from "@/lib/notion";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const context = searchParams.get("context") ?? undefined;
    const solution_type = searchParams.get("solution_type") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const workflows = await getAllWorkflows({ context, solution_type, status });
    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Projects fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch projects." }, { status: 500 });
  }
}
