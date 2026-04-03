export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAllWorkflows } from "@/lib/notion";

export async function GET(req: NextRequest) {
  try {
    const context = req.nextUrl.searchParams.get("context") ?? undefined;
    const solution_type = req.nextUrl.searchParams.get("solution_type") ?? undefined;
    const status = req.nextUrl.searchParams.get("status") ?? undefined;

    const workflows = await getAllWorkflows({ context, solution_type, status });
    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Projects fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch projects." }, { status: 500 });
  }
}
