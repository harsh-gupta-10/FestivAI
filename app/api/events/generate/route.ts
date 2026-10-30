import { NextRequest, NextResponse } from "next/server";
import { generateMasterplan } from "@/lib/openai";
import { createEventRecord } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getErrorMessage } from "@/lib/error";

export async function POST(req: NextRequest) {
  try {
    // 0. Rate limiting protection (15 event generations per 60 seconds per IP)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`gen_${clientIp}`, 15, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.error || "Generation rate limit exceeded. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rateCheck.resetSeconds) } }
      );
    }

    const body = await req.json();
    const {
      eventType = "wedding",
      title,
      eventDate,
      location,
      guestCount,
      totalBudget,
      currency = "USD",
      vibe = "Elegant & Modern",
      organizerName,
      organizerEmail,
      bannerKey,
      model = "o3-mini",
    } = body as {
      eventType?: string;
      title: string;
      eventDate: string;
      location: string;
      guestCount: number | string;
      totalBudget: number | string;
      currency?: string;
      vibe?: string;
      organizerName: string;
      organizerEmail: string;
      bannerKey?: string | null;
      model?: string;
    };

    const {
      validateEmail,
      validateBudget,
      validateGuestCount,
      validateEventDate,
      sanitizeString,
    } = await import("@/lib/validation");

    // Server-side validation using validation engine
    const emailCheck = validateEmail(organizerEmail);
    if (!emailCheck.isValid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    const budgetCheck = validateBudget(totalBudget, eventType);
    if (!budgetCheck.isValid) {
      return NextResponse.json(
        { error: budgetCheck.error, autoFix: budgetCheck.autoFixValue },
        { status: 400 }
      );
    }

    const guestCheck = validateGuestCount(guestCount);
    if (!guestCheck.isValid) {
      return NextResponse.json({ error: guestCheck.error }, { status: 400 });
    }

    const dateCheck = validateEventDate(eventDate);
    if (!dateCheck.isValid) {
      return NextResponse.json({ error: dateCheck.error }, { status: 400 });
    }

    // Sanitize user strings against injection
    const cleanTitle = sanitizeString(title, 120);
    const cleanLocation = sanitizeString(location, 120);
    const cleanVibe = sanitizeString(vibe, 100);
    const cleanOrganizer = sanitizeString(organizerName, 100);
    const parsedGuests = guestCheck.sanitizedValue || 50;
    const parsedBudget = budgetCheck.sanitizedValue || 10000;

    // Extract custom API key from request headers or Cloudflare bindings
    const customHeaderKey =
      req.headers.get("x-openai-api-key") ||
      req.headers.get("x-api-key") ||
      req.headers.get("x-gemini-api-key") ||
      undefined;

    const { getAppBindings } = await import("@/lib/cloudflare");
    const bindings = await getAppBindings();
    const effectiveKey = customHeaderKey || bindings.OPENAI_API_KEY || bindings.GEMINI_API_KEY;

    // Call GenAI Masterplan generator
    const aiResult = await generateMasterplan({
      eventType,
      title: cleanTitle,
      eventDate: dateCheck.sanitizedValue || eventDate,
      location: cleanLocation,
      guestCount: parsedGuests,
      totalBudget: parsedBudget,
      currency,
      vibe: cleanVibe,
      organizerName: cleanOrganizer,
      model,
      customApiKey: effectiveKey,
    });

    const eventId = "evt_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const slug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50) + "-" + eventId.slice(-4);

    // Save event to Cloudflare D1
    await createEventRecord({
      id: eventId,
      slug,
      organizer_name: cleanOrganizer,
      organizer_email: emailCheck.sanitizedValue || organizerEmail,
      event_type: eventType,
      title: cleanTitle,
      event_date: dateCheck.sanitizedValue || eventDate,
      location: cleanLocation,
      guest_count: parsedGuests,
      total_budget: parsedBudget,
      currency,
      vibe: cleanVibe,
      banner_r2_key: bannerKey || null,
      ai_plan_json: JSON.stringify(aiResult.plan),
      last_prompt: aiResult.userPrompt,
    });

    return NextResponse.json({
      success: true,
      eventId,
      slug,
      plan: aiResult.plan,
      inspectorData: {
        model: aiResult.modelUsed,
        durationMs: aiResult.durationMs,
        systemPrompt: aiResult.systemPrompt,
        userPrompt: aiResult.userPrompt,
        rawJsonOutput: aiResult.rawJsonOutput,
      },
    });
  } catch (error: unknown) {
    const errorMsg = getErrorMessage(error);
    console.error("API /api/events/generate error:", errorMsg);
    return NextResponse.json(
      { error: errorMsg || "Failed to generate event masterplan" },
      { status: 500 }
    );
  }
}
