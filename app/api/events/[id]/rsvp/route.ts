import { NextRequest, NextResponse } from "next/server";
import { getEventByIdOrSlug, insertRsvp, getRsvpsForEvent } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as any;
    const {
      guest_name,
      guest_email,
      status = "going",
      attendees_count = 1,
      dietary_notes,
      message,
    } = body;

    const existing = await getEventByIdOrSlug(id);
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!guest_name || typeof guest_name !== "string" || !guest_name.trim()) {
      return NextResponse.json({ error: "Guest name is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guest_email || !emailRegex.test(guest_email.trim())) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const rsvpId = "rsvp_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const parsedAttendees = Math.max(1, parseInt(attendees_count, 10) || 1);

    await insertRsvp({
      id: rsvpId,
      event_id: existing.event.id,
      guest_name: guest_name.trim(),
      guest_email: guest_email.trim().toLowerCase(),
      status: status === "maybe" ? "maybe" : status === "declined" ? "declined" : "going",
      attendees_count: parsedAttendees,
      dietary_notes: dietary_notes?.trim() || null,
      message: message?.trim() || null,
    });

    const updatedRsvps = await getRsvpsForEvent(existing.event.id);

    return NextResponse.json({
      success: true,
      message: "RSVP recorded successfully",
      rsvpId,
      rsvps: updatedRsvps,
    });
  } catch (error: any) {
    console.error("POST /api/events/[id]/rsvp error:", error);
    return NextResponse.json({ error: "Failed to record RSVP" }, { status: 500 });
  }
}
