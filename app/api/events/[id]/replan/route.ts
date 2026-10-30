import { NextRequest, NextResponse } from "next/server";
import { getEventByIdOrSlug, updateEventPlanInDb } from "@/lib/db";
import { replanMasterplan } from "@/lib/openai";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getErrorMessage } from "@/lib/error";

interface ReplanRequestBody {
  replanPrompt: string;
  model?: string;
  userEmail?: string;
  organizer_email?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`replan:${ip}`, { maxRequests: 20, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many replan requests. Please wait a moment." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateLimit.resetInMs / 1000).toString(),
            "X-RateLimit-Limit": "20",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const { id } = await params;
    const body = (await req.json()) as ReplanRequestBody;
    const { replanPrompt, model = "o3-mini" } = body;

    const { validateReplanPrompt } = await import("@/lib/validation");
    const check = validateReplanPrompt(replanPrompt);
    if (!check.isValid) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    const cleanPrompt = check.sanitizedValue || replanPrompt;

    const existing = await getEventByIdOrSlug(id);
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Authorization & IDOR protection: Verify ownership
    const requestEmail =
      req.headers.get("x-user-email") || body.userEmail || body.organizer_email;
    const existingOwner = (existing.event.organizer_email || "").trim().toLowerCase();

    if (existingOwner) {
      if (!requestEmail || requestEmail.trim().toLowerCase() !== existingOwner) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to replan this celebration." },
          { status: 403 }
        );
      }
    }

    // Custom API key from headers or Cloudflare bindings
    const customHeaderKey =
      req.headers.get("x-openai-api-key") ||
      req.headers.get("x-api-key") ||
      req.headers.get("x-gemini-api-key") ||
      undefined;

    const { getAppBindings } = await import("@/lib/cloudflare");
    const bindings = await getAppBindings();
    const effectiveKey = customHeaderKey || bindings.OPENAI_API_KEY || bindings.GEMINI_API_KEY;

    const replanResult = await replanMasterplan({
      currentPlan: existing.plan,
      replanPrompt: cleanPrompt,
      totalBudget: existing.event.total_budget,
      currency: existing.event.currency,
      eventType: existing.event.event_type,
      title: existing.event.title,
      model,
      customApiKey: effectiveKey,
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
  } catch (error: unknown) {
    console.error("POST /api/events/[id]/replan error:", error);
    return NextResponse.json({ error: getErrorMessage(error) || "Failed to replan event" }, { status: 500 });
  }
}
