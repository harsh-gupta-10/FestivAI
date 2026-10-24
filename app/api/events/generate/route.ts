import { NextRequest, NextResponse } from "next/server";
import { generateMasterplan } from "@/lib/openai";
import { createEventRecord } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
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
    } = body;

    // Server-side validation
    if (!title || !eventDate || !location || !organizerName || !organizerEmail) {
      return NextResponse.json(
        { error: "Missing required fields: title, eventDate, location, organizerName, organizerEmail" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(organizerEmail)) {
      return NextResponse.json(
        { error: "Invalid organizer email address" },
        { status: 400 }
      );
    }

    const parsedGuests = parseInt(guestCount, 10);
    const parsedBudget = parseFloat(totalBudget);

    if (isNaN(parsedGuests) || parsedGuests <= 0) {
      return NextResponse.json(
        { error: "Guest count must be greater than 0" },
        { status: 400 }
      );
    }

    if (isNaN(parsedBudget) || parsedBudget < 50) {
      return NextResponse.json(
        { error: "Total budget must be at least 50" },
        { status: 400 }
      );
    }

    // Extract custom API key from request headers if supplied via Settings modal
    const customApiKey = req.headers.get("x-openai-api-key") || undefined;

    // Call GenAI Masterplan generator
    const aiResult = await generateMasterplan({
      eventType,
      title,
      eventDate,
      location,
      guestCount: parsedGuests,
      totalBudget: parsedBudget,
      currency,
      vibe,
      organizerName,
      model,
      customApiKey,
    });

    const eventId = "evt_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50) + "-" + eventId.slice(-4);

    // Save event to Cloudflare D1
    await createEventRecord({
      id: eventId,
      slug,
      organizer_name: organizerName,
      organizer_email: organizerEmail,
      event_type: eventType,
      title,
      event_date: eventDate,
      location,
      guest_count: parsedGuests,
      total_budget: parsedBudget,
      currency,
      vibe,
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
  } catch (error: any) {
    console.error("API /api/events/generate error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate event masterplan" },
      { status: 500 }
    );
  }
}
