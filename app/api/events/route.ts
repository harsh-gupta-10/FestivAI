import { NextRequest, NextResponse } from "next/server";
import { getEventsByOrganizerEmail } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (
      req.headers.get("x-user-email") ||
      searchParams.get("email") ||
      ""
    ).trim().toLowerCase();

    if (!email) {
      return NextResponse.json({
        success: true,
        events: [],
      });
    }

    const events = await getEventsByOrganizerEmail(email);

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to fetch events";
    console.error("GET /api/events error:", errorMsg);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
