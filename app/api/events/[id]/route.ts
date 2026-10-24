import { NextRequest, NextResponse } from "next/server";
import { getEventByIdOrSlug, updateEventPlanInDb, updateEventBannerInDb, getRsvpsForEvent } from "@/lib/db";
import { AIEventPlan } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getEventByIdOrSlug(id);

    if (!data) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const rsvps = await getRsvpsForEvent(data.event.id);

    return NextResponse.json({
      success: true,
      event: data.event,
      plan: data.plan,
      rsvps,
    });
  } catch (error: any) {
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to retrieve event" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as any;
    const existing = await getEventByIdOrSlug(id);

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { updatedPlan, bannerKey } = body;

    if (bannerKey !== undefined) {
      await updateEventBannerInDb(existing.event.id, bannerKey);
      existing.event.banner_r2_key = bannerKey;
    }

    if (updatedPlan) {
      await updateEventPlanInDb(existing.event.id, updatedPlan as AIEventPlan);
    }

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      banner_r2_key: existing.event.banner_r2_key,
    });
  } catch (error: any) {
    console.error("PATCH /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
