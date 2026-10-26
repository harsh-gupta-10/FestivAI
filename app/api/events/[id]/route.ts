import { NextRequest, NextResponse } from "next/server";
import {
  getEventByIdOrSlug,
  updateEventPlanInDb,
  updateEventBannerInDb,
  updateEventCurrencyInDb,
  updateEventBudgetInDb,
  updateEventDetailsInDb,
  deleteEventRecord,
  getRsvpsForEvent,
} from "@/lib/db";
import { AIEventPlan, EventRecord } from "@/types";
import {
  sanitizeString,
  validateBudget,
  validateEventDate,
  validateGuestCount,
} from "@/lib/validation";

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

    const requestEmail = (
      req.headers.get("x-user-email") ||
      req.nextUrl.searchParams.get("email") ||
      ""
    ).trim().toLowerCase();

    const ownerEmail = (data.event.organizer_email || "").trim().toLowerCase();
    const isOwner = Boolean(ownerEmail && requestEmail && requestEmail === ownerEmail);

    const rsvps = await getRsvpsForEvent(data.event.id);
    const confirmedGuestsCount = rsvps
      .filter((r) => r.status === "going")
      .reduce((acc, r) => acc + (r.attendees_count || 1), 0);

    // If requester is verified owner, return full private dashboard details
    if (isOwner) {
      let chatHistory: any[] = [];
      if (data.event.chat_history_json) {
        try {
          chatHistory = JSON.parse(data.event.chat_history_json);
        } catch {
          chatHistory = [];
        }
      }

      return NextResponse.json({
        success: true,
        isOwner: true,
        event: data.event,
        plan: data.plan,
        rsvps,
        chatHistory,
        confirmedGuestsCount,
      });
    }

    // Otherwise, for all guests and unauthenticated visitors: return strictly sanitized public invitation data
    return NextResponse.json({
      success: true,
      isOwner: false,
      event: {
        id: data.event.id,
        slug: data.event.slug,
        title: data.event.title,
        event_type: data.event.event_type,
        event_date: data.event.event_date,
        location: data.event.location,
        vibe: data.event.vibe,
        banner_r2_key: data.event.banner_r2_key,
        organizer_name: data.event.organizer_name,
        guest_count: data.event.guest_count,
      },
      plan: {
        eventSummary: data.plan?.eventSummary,
        publicSchedule: data.plan?.publicSchedule,
      },
      confirmedGuestsCount,
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

    // Authorization & IDOR protection: Verify ownership if organizer email is recorded
    const requestEmail = (
      req.headers.get("x-user-email") ||
      body.userEmail ||
      body.organizer_email ||
      ""
    ).trim().toLowerCase();
    const existingOwner = (existing.event.organizer_email || "").trim().toLowerCase();

    if (existingOwner) {
      if (!requestEmail || requestEmail !== existingOwner) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to modify this celebration." },
          { status: 403 }
        );
      }
    }

    const updates: Partial<EventRecord> = {};

    // 1. Title
    if (body.title !== undefined) {
      const cleanTitle = sanitizeString(body.title, 120);
      if (!cleanTitle) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      updates.title = cleanTitle;
    }

    // 2. Event Type
    if (body.event_type !== undefined) {
      const cleanType = sanitizeString(body.event_type, 30).toLowerCase();
      updates.event_type = cleanType;
    }

    // 3. Date
    if (body.event_date !== undefined) {
      const dateCheck = validateEventDate(body.event_date);
      if (!dateCheck.isValid) {
        return NextResponse.json({ error: dateCheck.error }, { status: 400 });
      }
      updates.event_date = dateCheck.sanitizedValue || body.event_date;
    }

    // 4. Location
    if (body.location !== undefined) {
      const cleanLocation = sanitizeString(body.location, 120);
      if (!cleanLocation) {
        return NextResponse.json({ error: "Location cannot be empty" }, { status: 400 });
      }
      updates.location = cleanLocation;
    }

    // 5. Guest Count
    if (body.guest_count !== undefined) {
      const guestCheck = validateGuestCount(body.guest_count);
      if (!guestCheck.isValid) {
        return NextResponse.json({ error: guestCheck.error }, { status: 400 });
      }
      updates.guest_count = guestCheck.sanitizedValue;
    }

    // 6. Currency
    if (body.currency !== undefined) {
      updates.currency = body.currency.toUpperCase().trim();
    }

    // 7. Budget & Plan auto-rebalancing
    if (body.total_budget !== undefined) {
      const budgetCheck = validateBudget(body.total_budget, updates.currency || existing.event.currency);
      if (!budgetCheck.isValid) {
        return NextResponse.json({ error: budgetCheck.error }, { status: 400 });
      }
      const newBudget = budgetCheck.sanitizedValue ?? 0;
      updates.total_budget = newBudget;

      // If budget changed and no explicit updatedPlan was provided, rescale plan allocations
      if (!body.updatedPlan && existing.plan && Array.isArray(existing.plan.budgetBreakdown)) {
        const oldBudget = existing.event.total_budget || 1;
        const scaleRatio = newBudget / oldBudget;
        let cumulative = 0;
        const rebalanced = existing.plan.budgetBreakdown.map((item, idx, arr) => {
          if (idx === arr.length - 1) {
            const finalAlloc = Math.max(0, newBudget - cumulative);
            return { ...item, allocatedAmount: finalAlloc };
          }
          const alloc = Math.round(item.allocatedAmount * scaleRatio);
          cumulative += alloc;
          return { ...item, allocatedAmount: alloc };
        });

        const newPlan = { ...existing.plan, budgetBreakdown: rebalanced };
        updates.ai_plan_json = JSON.stringify(newPlan);
      }
    }

    // 8. Vibe
    if (body.vibe !== undefined) {
      updates.vibe = sanitizeString(body.vibe, 120);
    }

    // 9. Banner R2 Key
    if (body.bannerKey !== undefined) {
      updates.banner_r2_key = sanitizeString(body.bannerKey, 200);
    }

    // 10. Explicit Updated Plan
    if (body.updatedPlan) {
      updates.ai_plan_json = JSON.stringify(body.updatedPlan);
    }

    // 11. Chat History
    if (body.chatHistory) {
      updates.chat_history_json = JSON.stringify(body.chatHistory.slice(-50));
    }

    // Save updates
    await updateEventDetailsInDb(existing.event.id, updates);

    // Fetch refreshed event
    const refreshed = await getEventByIdOrSlug(existing.event.id);

    return NextResponse.json({
      success: true,
      message: "Celebration details updated successfully",
      event: refreshed?.event,
      plan: refreshed?.plan,
    });
  } catch (error: any) {
    console.error("PATCH /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getEventByIdOrSlug(id);

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const requestEmail = (
      req.headers.get("x-user-email") ||
      searchParams.get("email") ||
      ""
    ).trim().toLowerCase();
    const existingOwner = (existing.event.organizer_email || "").trim().toLowerCase();

    // Verify ownership
    if (existingOwner) {
      if (!requestEmail || requestEmail !== existingOwner) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to delete this celebration." },
          { status: 403 }
        );
      }
    }

    const deleted = await deleteEventRecord(existing.event.id, requestEmail);
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete celebration" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Celebration deleted successfully",
      deletedId: existing.event.id,
    });
  } catch (error: any) {
    console.error("DELETE /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
