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

    const { validateEmail, sanitizeString } = await import("@/lib/validation");

    const emailCheck = validateEmail(guest_email);
    if (!emailCheck.isValid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    const cleanGuestName = sanitizeString(guest_name, 100);
    if (!cleanGuestName) {
      return NextResponse.json({ error: "Guest name is required" }, { status: 400 });
    }

    const cleanDietary = dietary_notes ? sanitizeString(dietary_notes, 250) : null;
    const cleanMessage = message ? sanitizeString(message, 500) : null;

    const rsvpId = "rsvp_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const parsedAttendees = Math.min(10, Math.max(1, parseInt(attendees_count, 10) || 1));

    await insertRsvp({
      id: rsvpId,
      event_id: existing.event.id,
      guest_name: cleanGuestName,
      guest_email: emailCheck.sanitizedValue || guest_email.trim().toLowerCase(),
      status: status === "maybe" ? "maybe" : status === "declined" ? "declined" : "going",
      attendees_count: parsedAttendees,
      dietary_notes: cleanDietary,
      message: cleanMessage,
    });

    const updatedRsvps = await getRsvpsForEvent(existing.event.id);
    const confirmedGuestsCount = updatedRsvps
      .filter((r) => r.status === "going")
      .reduce((acc, r) => acc + (r.attendees_count || 1), 0);

    return NextResponse.json({
      success: true,
      message: "RSVP recorded successfully",
      rsvpId,
      confirmedGuestsCount,
    });
  } catch (error: any) {
    console.error("POST /api/events/[id]/rsvp error:", error);
    return NextResponse.json({ error: "Failed to record RSVP" }, { status: 500 });
  }
}
