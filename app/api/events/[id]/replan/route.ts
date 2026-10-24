import { NextRequest, NextResponse } from "next/server";
import { getEventByIdOrSlug, updateEventPlanInDb } from "@/lib/db";
import { replanMasterplan } from "@/lib/openai";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as any;
    const { replanPrompt, model = "o3-mini" } = body;

    if (!replanPrompt || typeof replanPrompt !== "string" || !replanPrompt.trim()) {
      return NextResponse.json({ error: "Replan prompt is required" }, { status: 400 });
    }

    const existing = await getEventByIdOrSlug(id);
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Custom API key from header if user supplied it in settings
    const customApiKey = req.headers.get("x-openai-api-key") || undefined;

    const replanResult = await replanMasterplan({
      currentPlan: existing.plan,
      replanPrompt: replanPrompt.trim(),
      totalBudget: existing.event.total_budget,
      currency: existing.event.currency,
      eventType: existing.event.event_type,
      title: existing.event.title,
      model,
      customApiKey,
    });

    // Save updated plan in Cloudflare D1
    await updateEventPlanInDb(existing.event.id, replanResult.plan, replanResult.userPrompt);

    return NextResponse.json({
      success: true,
      plan: replanResult.plan,
      changedSummary: replanResult.changedSummary,
      changedFields: replanResult.changedFields,
      inspectorData: {
        model: replanResult.modelUsed,
        durationMs: replanResult.durationMs,
        systemPrompt: replanResult.systemPrompt,
        userPrompt: replanResult.userPrompt,
        rawJsonOutput: replanResult.rawJsonOutput,
        changedSummary: replanResult.changedSummary,
        changedFields: replanResult.changedFields,
      },
    });
  } catch (error: any) {
    console.error("POST /api/events/[id]/replan error:", error);
    return NextResponse.json({ error: error?.message || "Failed to replan event" }, { status: 500 });
  }
}
