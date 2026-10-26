import { NextRequest, NextResponse } from "next/server";
import { getEventsByOrganizerEmail } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || undefined;

    const events = await getEventsByOrganizerEmail(email);

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error: any) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch events" },
      { status: 500 }
    );
  }
}
