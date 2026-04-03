import { NextRequest, NextResponse } from "next/server";
import { analyzeWorkflow } from "@/lib/anthropic";
import { createWorkflowPage } from "@/lib/notion";
import type { IntakeFormData } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const intake: IntakeFormData = {
      workflowName: body.workflowName,
      context: body.context,
      description: body.description,
      currentTechStack: body.currentTechStack,
      painPoints: body.painPoints,
      timePerRun: Number(body.timePerRun),
      runsPerWeek: Number(body.runsPerWeek),
      hourlyRate: Number(body.hourlyRate),
      desiredOutcome: body.desiredOutcome,
      buildPreference: body.buildPreference,
    };

    const analysis = await analyzeWorkflow(intake);

    const hoursSavedPerWeek =
      intake.timePerRun * intake.runsPerWeek * (analysis.time_reduction_pct / 100);
    const hoursSavedPerYear = hoursSavedPerWeek * 48;
    const annualValue = hoursSavedPerYear * intake.hourlyRate;

    const pageId = await createWorkflowPage(
      intake,
      analysis,
      hoursSavedPerWeek,
      hoursSavedPerYear,
      annualValue
    );

    return NextResponse.json({ id: pageId });
  } catch (error) {
    console.error("Analysis error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
