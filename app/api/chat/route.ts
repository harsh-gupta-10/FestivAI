import { NextRequest, NextResponse } from "next/server";
import { getAppBindings } from "@/lib/cloudflare";
import {
  getEventByIdOrSlug,
  getRsvpsForEvent,
  getEventsByOrganizerEmail,
  createEventRecord,
  updateEventCurrencyInDb,
  updateEventDetailsInDb,
  updateEventChatHistoryInDb,
  getEventChatHistoryFromDb,
} from "@/lib/db";
import { generateMasterplan } from "@/lib/openai";
import { getWeatherIntelligence, WeatherReport } from "@/lib/tools/weather";
import { searchWebIntelligence, WebSearchReport } from "@/lib/tools/web-search";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { formatCelebrationDate } from "@/lib/date";
import { sanitizeString, validateBudget, validateEventDate } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getErrorMessage } from "@/lib/error";
import type {
  EventRecord,
  RsvpRecord,
  AIEventPlan,
  ChatMessage,
  ChatToolCallItem as ToolCallItem,
  ChatActionCard,
} from "@/types";

export type { ToolCallItem, ChatMessage };

// Persist chat to Cloudflare D1 helper
async function respondWithChat(
  activeEventId: string | undefined,
  incomingMessages: ChatMessage[],
  payload: {
    response: string;
    toolCalls?: ToolCallItem[];
    actionCard?: ChatActionCard<unknown>;
    updatedEvent?: Partial<EventRecord>;
  }
) {
  if (activeEventId) {
    const assistantMsg: ChatMessage = {
      id: `asst-${Date.now()}`,
      role: "assistant",
      content: payload.response,
      createdAt: new Date().toISOString(),
      toolCalls: payload.toolCalls,
      actionCard: payload.actionCard,
    };
    await updateEventChatHistoryInDb(activeEventId, [...incomingMessages, assistantMsg]).catch(() => {});
  }
  return NextResponse.json(payload);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }
    const eventData = await getEventByIdOrSlug(eventId);
    if (!eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const ownerEmail = (eventData.event.organizer_email || "").trim().toLowerCase();
    const requestEmail = (
      req.headers.get("x-user-email") ||
      searchParams.get("userEmail") ||
      searchParams.get("email") ||
      ""
    ).trim().toLowerCase();

    if (ownerEmail && (!requestEmail || requestEmail !== ownerEmail)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this chat history." },
        { status: 403 }
      );
    }

    const history = await getEventChatHistoryFromDb(eventData.event.id);
    return NextResponse.json({ success: true, messages: history });
  } catch (error: any) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }
    const eventData = await getEventByIdOrSlug(eventId);
    if (!eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const ownerEmail = (eventData.event.organizer_email || "").trim().toLowerCase();
    const requestEmail = (
      req.headers.get("x-user-email") ||
      searchParams.get("userEmail") ||
      searchParams.get("email") ||
      ""
    ).trim().toLowerCase();

    if (ownerEmail && (!requestEmail || requestEmail !== ownerEmail)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to clear chat history for this event." },
        { status: 403 }
      );
    }

    await updateEventChatHistoryInDb(eventData.event.id, []);
    return NextResponse.json({ success: true, message: "Chat history cleared" });
  } catch (error: any) {
    console.error("DELETE /api/chat error:", error);
    return NextResponse.json({ error: "Failed to clear chat history" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // 0. Rate limiting protection (45 requests per 60 seconds per IP)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`chat_${clientIp}`, 45, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.error || "Rate limit exceeded. Please wait a moment before sending more messages." },
        { status: 429, headers: { "Retry-After": String(rateCheck.resetSeconds) } }
      );
    }

    const { messages, eventId, userEmail, userName, apiKey: clientBodyKey, model } = body as {
      messages: ChatMessage[];
      eventId?: string;
      userEmail?: string;
      userName?: string;
      apiKey?: string;
      model?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1];
    const userPrompt = lastUserMessage.content.trim();
    const lowerPrompt = userPrompt.toLowerCase();

    const effectiveUserEmail = (
      req.headers.get("x-user-email") ||
      userEmail ||
      ""
    ).trim().toLowerCase();

    // 1. Fetch current active event details if selected
    let activeEvent: EventRecord | null = null;
    let activePlan: AIEventPlan | null = null;
    let activeRsvps: RsvpRecord[] = [];

    if (eventId) {
      const eventData = await getEventByIdOrSlug(eventId);
      if (eventData) {
        const ownerEmail = (eventData.event.organizer_email || "").trim().toLowerCase();
        if (ownerEmail && (!effectiveUserEmail || effectiveUserEmail !== ownerEmail)) {
          return NextResponse.json(
            { error: "Forbidden: You do not have permission to query or modify this event's assistant." },
            { status: 403 }
          );
        }
        activeEvent = eventData.event;
        activePlan = eventData.plan;
        activeRsvps = await getRsvpsForEvent(eventData.event.id);
      }
    }

    // 2. Fetch all user events for contextual awareness
    const userEvents = effectiveUserEmail ? await getEventsByOrganizerEmail(effectiveUserEmail) : [];

    // If activeEvent wasn't found by ID but user has events, auto-bind to the primary event
    if (!activeEvent && userEvents.length > 0) {
      const primaryData = await getEventByIdOrSlug(userEvents[0].id);
      if (primaryData) {
        activeEvent = primaryData.event;
        activePlan = primaryData.plan;
        activeRsvps = await getRsvpsForEvent(primaryData.event.id);
      }
    }

    const activeCurrency = activeEvent?.currency || "USD";
    const currSym = getCurrencySymbol(activeCurrency);

    // 3. TOOL: Currency Switch / Conversion
    const isCurrencySwitch =
      lowerPrompt.includes("currency") ||
      lowerPrompt.includes("rupee") ||
      lowerPrompt.includes("rupees") ||
      lowerPrompt.includes("inr") ||
      lowerPrompt.includes("₹") ||
      lowerPrompt.includes("dollar") ||
      lowerPrompt.includes("usd") ||
      lowerPrompt.includes("euro") ||
      lowerPrompt.includes("eur") ||
      lowerPrompt.includes("pound") ||
      lowerPrompt.includes("gbp");

    if (
      (lowerPrompt.includes("change") ||
        lowerPrompt.includes("switch") ||
        lowerPrompt.includes("convert") ||
        lowerPrompt.includes("update") ||
        lowerPrompt.includes("set")) &&
      isCurrencySwitch
    ) {
      let targetCurrency = "USD";
      if (
        lowerPrompt.includes("inr") ||
        lowerPrompt.includes("rupee") ||
        lowerPrompt.includes("rupees") ||
        lowerPrompt.includes("₹")
      ) {
        targetCurrency = "INR";
      } else if (lowerPrompt.includes("eur") || lowerPrompt.includes("euro")) {
        targetCurrency = "EUR";
      } else if (lowerPrompt.includes("gbp") || lowerPrompt.includes("pound")) {
        targetCurrency = "GBP";
      } else if (lowerPrompt.includes("cad")) {
        targetCurrency = "CAD";
      } else if (lowerPrompt.includes("aud")) {
        targetCurrency = "AUD";
      } else if (lowerPrompt.includes("aed") || lowerPrompt.includes("dirham")) {
        targetCurrency = "AED";
      }

      const sym = getCurrencySymbol(targetCurrency);

      if (activeEvent) {
        await updateEventCurrencyInDb(activeEvent.id, targetCurrency);
        activeEvent.currency = targetCurrency;
      }

      const toolCall: ToolCallItem = {
        id: `tool-${Date.now()}`,
        tool: "currency_switch",
        title: `Switched Currency to ${targetCurrency} (${sym})`,
        summary: `Updated celebration financial ledger and live balance formatting in Cloudflare D1 to ${targetCurrency}.`,
        data: { targetCurrency, symbol: sym },
        status: "completed",
      };

      const responseText = `I've updated the currency for **${
        activeEvent ? activeEvent.title : "your celebrations"
      }** to **${targetCurrency} (${sym})** in Cloudflare D1.\n\nAll budget allocations, vendor expense entries, and live cards are now dynamically formatted with the **${sym}** currency icon.\n\n### Updated Ledger Highlights:\n- **Active Currency:** ${targetCurrency} (${sym})\n- **Sample Allocation:** ${formatCurrency(
        activeEvent ? activeEvent.total_budget : 25000,
        targetCurrency
      )}\n- **Sync Status:** Real-time persistence saved.`;

      return respondWithChat(activeEvent?.id, messages, {
        response: responseText,
        toolCalls: [toolCall],
        actionCard: activeEvent && activePlan
          ? {
              type: "budget_summary",
              title: `Updated Financial Ledger: ${activeEvent.title}`,
              data: {
                totalAlloc: activeEvent.total_budget,
                totalSpent: 0,
                variance: activeEvent.total_budget,
                currency: targetCurrency,
                breakdown: activePlan.budgetBreakdown,
              },
            }
          : undefined,
      });
    }

    // 4. TOOL: Conversational Event Editing Intent (Location, Date, Title, Guests, Budget, Vibe)
    const isEditEventIntent =
      activeEvent &&
      !isCurrencySwitch &&
      (lowerPrompt.includes("change") ||
        lowerPrompt.includes("update") ||
        lowerPrompt.includes("set") ||
        lowerPrompt.includes("rename") ||
        lowerPrompt.includes("reschedule") ||
        lowerPrompt.includes("move") ||
        lowerPrompt.includes("increase") ||
        lowerPrompt.includes("decrease") ||
        lowerPrompt.includes("cut")) &&
      (lowerPrompt.includes("location") ||
        lowerPrompt.includes("venue") ||
        lowerPrompt.includes("city") ||
        lowerPrompt.includes("destination") ||
        lowerPrompt.includes("date") ||
        lowerPrompt.includes("title") ||
        lowerPrompt.includes("name") ||
        lowerPrompt.includes("guest") ||
        lowerPrompt.includes("headcount") ||
        lowerPrompt.includes("budget") ||
        lowerPrompt.includes("theme") ||
        lowerPrompt.includes("vibe"));

    if (isEditEventIntent && activeEvent) {
      const updates: Partial<EventRecord> = {};
      const changesList: string[] = [];

      // A. Location / Venue
      if (
        lowerPrompt.includes("location") ||
        lowerPrompt.includes("venue") ||
        lowerPrompt.includes("city") ||
        lowerPrompt.includes("destination") ||
        lowerPrompt.includes("move event to") ||
        lowerPrompt.includes("move to")
      ) {
        const locMatch =
          userPrompt.match(/(?:change|update|set|move)\s+(?:the\s+)?(?:venue\s+location|event\s+location|location|venue|city|destination)\s+(?:to|in)\s+([^.!?\n]+)/i) ||
          userPrompt.match(/move\s+(?:the\s+)?(?:event\s+)?(?:to|in)\s+([^.!?\n]+)/i);
        if (locMatch && locMatch[1].trim()) {
          const newLoc = sanitizeString(locMatch[1].trim(), 120);
          updates.location = newLoc;
          changesList.push(`📍 Venue Location updated to **${newLoc}**`);
        }
      }

      // B. Date / Reschedule
      if (
        lowerPrompt.includes("date") ||
        lowerPrompt.includes("reschedule") ||
        lowerPrompt.includes("day")
      ) {
        const dateMatch = userPrompt.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
        if (dateMatch) {
          const newDate = dateMatch[1];
          const check = validateEventDate(newDate);
          if (check.isValid) {
            updates.event_date = check.sanitizedValue;
            const { formatted } = formatCelebrationDate(newDate);
            changesList.push(`🗓️ Event Date rescheduled to **${formatted}**`);
          }
        }
      }

      // C. Title / Rename
      if (lowerPrompt.includes("title") || lowerPrompt.includes("rename") || lowerPrompt.includes("name")) {
        const titleMatch =
          userPrompt.match(/(?:change|update|set)\s+(?:the\s+)?title\s+to\s+([^.!?\n]+)/i) ||
          userPrompt.match(/rename\s+(?:the\s+)?(?:event\s+)?to\s+([^.!?\n]+)/i);
        if (titleMatch && titleMatch[1].trim()) {
          const newTitle = sanitizeString(titleMatch[1].trim(), 120);
          updates.title = newTitle;
          changesList.push(`✨ Celebration Title renamed to **"${newTitle}"**`);
        }
      }

      // D. Guest count
      if (lowerPrompt.includes("guest") || lowerPrompt.includes("headcount") || lowerPrompt.includes("people")) {
        const guestMatch =
          userPrompt.match(/(?:change|update|set|increase|decrease)\s+(?:the\s+)?(?:guest\s+count|guests|headcount)\s+to\s+([0-9]+)/i) ||
          userPrompt.match(/([0-9]+)\s+(?:guests|people|attendees)/i);
        if (guestMatch) {
          const count = parseInt(guestMatch[1], 10);
          if (count > 0) {
            updates.guest_count = count;
            changesList.push(`👥 Target Guests adjusted to **${count} attendees**`);
          }
        }
      }

      // E. Budget
      if (lowerPrompt.includes("budget")) {
        const lakhMatch = userPrompt.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lac|l)/i);
        const croreMatch = userPrompt.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:crore|cr)/i);
        let newBudget: number | null = null;

        if (lakhMatch) {
          newBudget = parseFloat(lakhMatch[1]) * 100000;
        } else if (croreMatch) {
          newBudget = parseFloat(croreMatch[1]) * 10000000;
        } else {
          const bMatch = userPrompt.match(/(?:[\$₹€£]|to\s*:?\s*[\$₹€£]?)\s*([0-9]+[0-9,]*)\s*(k|thousand)?/i);
          if (bMatch) {
            let val = parseFloat(bMatch[1].replace(/,/g, ""));
            if (bMatch[2]?.toLowerCase().startsWith("k")) val *= 1000;
            if (!isNaN(val) && val >= 50) newBudget = val;
          }
        }

        if (newBudget && newBudget >= 50) {
          updates.total_budget = newBudget;
          if (activePlan && Array.isArray(activePlan.budgetBreakdown)) {
            const oldBudget = activeEvent.total_budget || 1;
            const ratio = newBudget / oldBudget;
            let cum = 0;
            const rebalanced = activePlan.budgetBreakdown.map((item: any, idx: number, arr: any[]) => {
              if (idx === arr.length - 1) {
                const finalAlloc = Math.max(0, newBudget! - cum);
                return { ...item, allocatedAmount: finalAlloc };
              }
              const alloc = Math.round(item.allocatedAmount * ratio);
              cum += alloc;
              return { ...item, allocatedAmount: alloc };
            });
            const newPlan = { ...activePlan, budgetBreakdown: rebalanced };
            updates.ai_plan_json = JSON.stringify(newPlan);
            activePlan = newPlan;
          }
          changesList.push(
            `💰 Total Budget updated to **${formatCurrency(newBudget, activeEvent.currency)}** (all categories mathematically rebalanced)`
          );
        }
      }

      // F. Vibe / Theme
      if (lowerPrompt.includes("vibe") || lowerPrompt.includes("theme") || lowerPrompt.includes("aesthetic")) {
        const vibeMatch =
          userPrompt.match(/(?:change|update|set)\s+(?:the\s+)?(?:vibe|theme|aesthetic)\s+to\s+([^.!?\n]+)/i);
        if (vibeMatch && vibeMatch[1].trim()) {
          const newVibe = sanitizeString(vibeMatch[1].trim(), 120);
          updates.vibe = newVibe;
          changesList.push(`🎨 Theme & Vibe updated to **${newVibe}**`);
        }
      }

      if (changesList.length > 0) {
        await updateEventDetailsInDb(activeEvent.id, updates);
        Object.assign(activeEvent, updates);

        const toolCall: ToolCallItem = {
          id: `tool-${Date.now()}`,
          tool: "sync_d1",
          title: `Updated Celebration Details: ${activeEvent.title}`,
          summary: changesList.map((c) => c.replace(/\*\*/g, "")).join(" • "),
          data: updates,
          status: "completed",
        };

        const responseText = `I have updated your celebration details for **${activeEvent.title}** in Cloudflare D1:\n\n${changesList
          .map((c) => `• ${c}`)
          .join(
            "\n"
          )}\n\n### Current Celebration Snapshot:\n- **Event Date:** ${formatCelebrationDate(activeEvent.event_date).formatted}\n- **Venue:** 📍 ${activeEvent.location}\n- **Guests:** 👥 ${activeEvent.guest_count} attendees\n- **Total Budget:** 💰 ${formatCurrency(activeEvent.total_budget, activeEvent.currency)}\n- **Theme:** ✨ ${activeEvent.vibe || "Celebration Elegance"}\n\n*All modifications are persisted in your Cloudflare D1 serverless database and synced across your dashboard.*`;

        return respondWithChat(activeEvent.id, messages, {
          response: responseText,
          toolCalls: [toolCall],
          updatedEvent: activeEvent,
        });
      }
    }

    // 5. TOOL: Event Date, Schedule & Countdown Query
    const isDateScheduleQuery =
      lowerPrompt.includes("when is") ||
      lowerPrompt.includes("when are") ||
      lowerPrompt.includes("what date") ||
      lowerPrompt.includes("what is the date") ||
      lowerPrompt.includes("event date") ||
      lowerPrompt.includes("celebration date") ||
      lowerPrompt.includes("date of") ||
      lowerPrompt.includes("how many days") ||
      lowerPrompt.includes("days left") ||
      lowerPrompt.includes("days to go") ||
      lowerPrompt.includes("countdown") ||
      lowerPrompt.includes("schedule") ||
      lowerPrompt.includes("calendar") ||
      lowerPrompt.includes("timing") ||
      lowerPrompt === "when" ||
      lowerPrompt === "date" ||
      (lowerPrompt.startsWith("when") && !lowerPrompt.includes("plan"));

    if (isDateScheduleQuery) {
      if (activeEvent) {
        const { formatted, diffDays, statusText } = formatCelebrationDate(activeEvent.event_date);

        const toolCall: ToolCallItem = {
          id: `tool-${Date.now()}`,
          tool: "sync_d1",
          title: `Schedule Intelligence: ${activeEvent.title}`,
          summary: `${formatted} (${diffDays >= 0 ? `${diffDays} days remaining` : `${Math.abs(diffDays)} days ago`}) • ${activeEvent.location}`,
          data: {
            date: activeEvent.event_date,
            formatted,
            diffDays,
            location: activeEvent.location,
          },
          status: "completed",
        };

        const responseText = `🗓️ **${activeEvent.title}** is scheduled for **${formatted}**!\n\n### ⏳ Celebration Countdown & Details:\n- **Event Date:** **${formatted}** (\`${activeEvent.event_date}\`)\n- **Timeline Countdown:** ${statusText}\n- **Venue & City:** 📍 **${activeEvent.location}**\n- **Target Guests:** 👥 **${activeEvent.guest_count} guests**\n- **Total Budget:** 💰 **${formatCurrency(activeEvent.total_budget, activeEvent.currency)}**\n- **Atmosphere / Vibe:** ✨ **${activeEvent.vibe || "Celebration Elegance"}**\n\n### 💡 Recommended Next Actions:\n• Ask **"What will the weather be like in ${activeEvent.location} on ${activeEvent.event_date}?"** to get live atmospheric forecasts and rain risk.\n• Ask **"Show me my milestone checklist"** to review what's due this week.\n• Ask **"Show RSVPs"** to inspect confirmed attendee numbers.`;

        return respondWithChat(activeEvent.id, messages, {
          response: responseText,
          toolCalls: [toolCall],
        });
      } else if (userEvents.length > 0) {
        const listText = userEvents
          .map((e) => {
            const { formatted, statusText } = formatCelebrationDate(e.event_date);
            return `• **${e.title}:** ${formatted} (${statusText}) in **${e.location}**`;
          })
          .join("\n");

        return NextResponse.json({
          response: `Here are the scheduled dates for your organized celebrations:\n\n${listText}\n\n*Click on any celebration in the sidebar to inspect its detailed masterplan.*`,
        });
      }
    }

    // 6. TOOL: Event Location & Venue Query
    const isLocationQuery =
      lowerPrompt.includes("where is") ||
      lowerPrompt.includes("where will") ||
      lowerPrompt.includes("what location") ||
      lowerPrompt.includes("what is the location") ||
      lowerPrompt.includes("what is the venue") ||
      lowerPrompt.includes("what venue") ||
      lowerPrompt.includes("venue address") ||
      lowerPrompt.includes("event location") ||
      lowerPrompt.includes("which city") ||
      lowerPrompt === "where" ||
      lowerPrompt === "location" ||
      lowerPrompt === "venue";

    if (isLocationQuery) {
      if (activeEvent) {
        const { formatted } = formatCelebrationDate(activeEvent.event_date);

        const toolCall: ToolCallItem = {
          id: `tool-${Date.now()}`,
          tool: "sync_d1",
          title: `Location Intelligence: ${activeEvent.title}`,
          summary: `City/Venue: ${activeEvent.location} • Target: ${activeEvent.guest_count} guests`,
          data: { location: activeEvent.location, guestCount: activeEvent.guest_count },
          status: "completed",
        };

        const responseText = `📍 **${activeEvent.title}** will take place in **${activeEvent.location}**!\n\n### 🏛️ Venue & Destination Profile:\n- **City / Region:** **${activeEvent.location}**\n- **Date:** **${formatted}**\n- **Expected Headcount:** **${activeEvent.guest_count} attendees**\n- **Vibe:** **${activeEvent.vibe || "Celebration Elegance"}**\n\n### 💡 What would you like to explore next?\n• Say **"Check the weather in ${activeEvent.location} on ${activeEvent.event_date}"** for precipitation probability and temperature.\n• Say **"Search top venues in ${activeEvent.location}"** for live internet recommendations & pricing benchmarks.\n• Say **"Show vendor checklist"** to review your catering and decor contracts.`;

        return respondWithChat(activeEvent.id, messages, {
          response: responseText,
          toolCalls: [toolCall],
        });
      }
    }

    // 7. TOOL: Executive Overview / Details
    const isOverviewQuery =
      lowerPrompt.includes("overview") ||
      lowerPrompt.includes("summary") ||
      lowerPrompt.includes("tell me about") ||
      lowerPrompt.includes("what is my event") ||
      lowerPrompt.includes("about my event") ||
      lowerPrompt.includes("event details") ||
      lowerPrompt.includes("celebration details") ||
      lowerPrompt.includes("event info") ||
      lowerPrompt === "details" ||
      lowerPrompt === "info" ||
      lowerPrompt === "overview";

    if (isOverviewQuery) {
      if (activeEvent) {
        const { formatted, diffDays, statusText } = formatCelebrationDate(activeEvent.event_date);
        const going = activeRsvps.filter((r) => r.status === "going");
        const goingCount = going.reduce((acc, r) => acc + (r.attendees_count || 1), 0);

        const toolCall: ToolCallItem = {
          id: `tool-${Date.now()}`,
          tool: "sync_d1",
          title: `Masterplan Briefing: ${activeEvent.title}`,
          summary: `${(activeEvent.event_type || "Celebration").toUpperCase()} • ${formatted} (${diffDays}d) • ${activeEvent.location} • ${formatCurrency(activeEvent.total_budget, activeEvent.currency)}`,
          data: activeEvent,
          status: "completed",
        };

        const responseText = `Here is the complete executive masterplan for **${activeEvent.title}**:\n\n### 🌟 Celebration Snapshot:\n- **Category:** ${(activeEvent.event_type || "Celebration").toUpperCase()}\n- **Scheduled Date:** **${formatted}** (${statusText})\n- **Destination & Venue:** 📍 **${activeEvent.location}**\n- **Target Guests:** 👥 **${activeEvent.guest_count} guests** (${goingCount} confirmed attending)\n- **Total Budget:** 💰 **${formatCurrency(activeEvent.total_budget, activeEvent.currency)}**\n- **Atmosphere & Vibe:** ✨ **${activeEvent.vibe || "Celebration Elegance"}**\n- **Public RSVP Portal:** \`/invite/${activeEvent.slug || activeEvent.id}\`\n\n${activePlan?.eventSummary?.tagline ? `> _"${activePlan.eventSummary.tagline}"_\n\n` : ""}What aspect of your celebration would you like to review or refine right now?`;

        return respondWithChat(activeEvent.id, messages, {
          response: responseText,
          toolCalls: [toolCall],
        });
      }
    }

    // 8. TOOL: Weather Intelligence
    const isWeatherQuery =
      lowerPrompt.includes("weather") ||
      lowerPrompt.includes("rain") ||
      lowerPrompt.includes("temperature") ||
      lowerPrompt.includes("climate") ||
      lowerPrompt.includes("monsoon") ||
      lowerPrompt.includes("forecast") ||
      lowerPrompt.includes("sunny") ||
      lowerPrompt.includes("wind") ||
      lowerPrompt.includes("humidity") ||
      lowerPrompt.includes("sunset");

    if (isWeatherQuery) {
      let queryLocation = activeEvent?.location || "Mumbai, India";
      const inMatch = userPrompt.match(/in\s+([A-Za-z\s,]+?)(on|for|at|\?|\.|$)/i);
      const forMatch = userPrompt.match(/for\s+([A-Za-z\s,]+?)(on|in|at|\?|\.|$)/i);

      if (inMatch && inMatch[1].trim().length > 2) {
        queryLocation = inMatch[1].trim();
      } else if (forMatch && forMatch[1].trim().length > 2 && !forMatch[1].toLowerCase().includes("wedding")) {
        queryLocation = forMatch[1].trim();
      }

      let queryDate = activeEvent?.event_date || undefined;
      const dateMatch = userPrompt.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
      if (dateMatch) {
        queryDate = dateMatch[1];
      }

      const weatherReport = await getWeatherIntelligence(queryLocation, queryDate);

      const toolCall: ToolCallItem = {
        id: `tool-${Date.now()}`,
        tool: "check_weather",
        title: `Weather Intelligence: ${weatherReport.location}`,
        summary: `${weatherReport.date} • ${weatherReport.temperatureC.high}°C / ${weatherReport.temperatureF.high}°F • ${weatherReport.condition} (${weatherReport.precipitationProbability}% Rain Risk)`,
        data: weatherReport,
        status: "completed",
      };

      const responseText = `Here is the comprehensive weather intelligence for **${weatherReport.location}** on **${weatherReport.date}**:\n\n### 🌤️ Forecast & Atmospheric Conditions\n- **Condition:** ${weatherReport.condition}\n- **Daytime High:** ${weatherReport.temperatureC.high}°C (${weatherReport.temperatureF.high}°F)\n- **Evening Low:** ${weatherReport.temperatureC.low}°C (${weatherReport.temperatureF.low}°F)\n- **Precipitation Probability:** ${weatherReport.precipitationProbability}% ${weatherReport.precipitationProbability > 30 ? "⚠️ (Contingency Recommended)" : "✅ (Minimal Risk)"}\n- **Relative Humidity:** ${weatherReport.humidity}%\n- **Wind Speed:** ${weatherReport.windSpeedKmH} km/h\n- **Estimated Sunset:** ${weatherReport.sunsetTime} (Golden Hour window starts ~${weatherReport.sunsetTime.replace(":15", ":30").replace(":45", ":00")})\n\n### 🎯 Outdoor Celebration Suitability: ${weatherReport.outdoorSuitabilityScore} / 10 (${weatherReport.verdict.toUpperCase().replace("_", " ")})\n${weatherReport.actionableAdvice.map((a) => `• ${a}`).join("\n")}\n\n*Would you like me to incorporate indoor/outdoor contingency clauses into your vendor checklist or timeline?*`;

      return respondWithChat(activeEvent?.id, messages, {
        response: responseText,
        toolCalls: [toolCall],
        actionCard: {
          type: "weather_card",
          title: `Weather Intelligence: ${weatherReport.location}`,
          data: weatherReport,
        },
      });
    }

    // 9. TOOL: Web Search & Internet Access
    const isSearchIntent =
      lowerPrompt.includes("search") ||
      lowerPrompt.includes("browse") ||
      lowerPrompt.includes("find venue") ||
      lowerPrompt.includes("venues in") ||
      lowerPrompt.includes("caterer") ||
      lowerPrompt.includes("photographer") ||
      lowerPrompt.includes("vendor rates") ||
      lowerPrompt.includes("trends") ||
      lowerPrompt.includes("recommend venue") ||
      lowerPrompt.includes("top venues");

    if (isSearchIntent) {
      const searchReport = await searchWebIntelligence(userPrompt);

      const toolCall: ToolCallItem = {
        id: `tool-${Date.now()}`,
        tool: "search_web",
        title: `Web Search: "${userPrompt.slice(0, 40)}"`,
        summary: `Retrieved ${searchReport.resultsCount} live web sources and industry benchmarks.`,
        data: searchReport,
        status: "completed",
      };

      const responseText = `Here are the curated findings from live internet research:\n\n${searchReport.synthesis}\n\n### 💡 Recommended Next Actions:\n${searchReport.recommendedNextActions.map((a) => `• ${a}`).join("\n")}\n\n*Would you like me to add any of these to your celebration checklist or calculate an updated budget allocation in ${activeCurrency}?*`;

      return respondWithChat(activeEvent?.id, messages, {
        response: responseText,
        toolCalls: [toolCall],
        actionCard: {
          type: "web_results",
          title: `Web Intelligence: "${searchReport.query.slice(0, 35)}"`,
          data: searchReport,
        },
      });
    }

    // 10. TOOL: Create Event / Plan Event Intent
    const isCreateIntent =
      (lowerPrompt.includes("plan") ||
        lowerPrompt.includes("create") ||
        lowerPrompt.includes("organize") ||
        lowerPrompt.includes("host")) &&
      (lowerPrompt.includes("wedding") ||
        lowerPrompt.includes("birthday") ||
        lowerPrompt.includes("party") ||
        lowerPrompt.includes("gala") ||
        lowerPrompt.includes("celebration") ||
        lowerPrompt.includes("anniversary") ||
        lowerPrompt.includes("event"));

    if (isCreateIntent) {
      let eventType = "birthday";
      if (lowerPrompt.includes("wedding")) eventType = "wedding";
      else if (
        lowerPrompt.includes("community") ||
        lowerPrompt.includes("gala") ||
        lowerPrompt.includes("festival")
      )
        eventType = "community";
      else if (lowerPrompt.includes("anniversary")) eventType = "anniversary";
      else if (lowerPrompt.includes("corporate")) eventType = "corporate";

      let eventCurrency = "USD";
      if (
        lowerPrompt.includes("inr") ||
        lowerPrompt.includes("rupee") ||
        lowerPrompt.includes("rupees") ||
        lowerPrompt.includes("₹") ||
        lowerPrompt.includes("lakh") ||
        lowerPrompt.includes("crore")
      ) {
        eventCurrency = "INR";
      } else if (lowerPrompt.includes("eur") || lowerPrompt.includes("euro") || lowerPrompt.includes("€")) {
        eventCurrency = "EUR";
      } else if (lowerPrompt.includes("gbp") || lowerPrompt.includes("pound") || lowerPrompt.includes("£")) {
        eventCurrency = "GBP";
      }

      let budget = eventCurrency === "INR" ? 500000 : 10000;

      const lakhMatch = userPrompt.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lac|l)/i);
      const croreMatch = userPrompt.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:crore|cr)/i);

      if (lakhMatch) {
        budget = parseFloat(lakhMatch[1]) * 100000;
        eventCurrency = "INR";
      } else if (croreMatch) {
        budget = parseFloat(croreMatch[1]) * 10000000;
        eventCurrency = "INR";
      } else {
        const budgetMatch = userPrompt.match(
          /(?:[\$₹€£]|budget(?:\s+of)?\s*:?\s*[\$₹€£]?)\s*([0-9]+[0-9,]*)\s*(k|thousand)?/i
        );
        if (budgetMatch) {
          let val = parseFloat(budgetMatch[1].replace(/,/g, ""));
          if (budgetMatch[2]?.toLowerCase().startsWith("k")) val *= 1000;
          if (!isNaN(val) && val >= 50) budget = val;
        } else if (lowerPrompt.includes("5k")) budget = 5000;
        else if (lowerPrompt.includes("10k")) budget = 10000;
        else if (lowerPrompt.includes("15k")) budget = 15000;
        else if (lowerPrompt.includes("20k")) budget = 20000;
        else if (lowerPrompt.includes("25k")) budget = 25000;
      }

      let guests = 75;
      const guestMatch = userPrompt.match(/([0-9]+)\s*(guests|people|attendees|persons)/i);
      if (guestMatch) {
        const g = parseInt(guestMatch[1], 10);
        if (!isNaN(g) && g > 0) guests = g;
      }

      let location = eventCurrency === "INR" ? "Goa, India" : "San Francisco, CA";
      const locMatch = userPrompt.match(/in\s+([A-Za-z\s,]+?)(with|for|[\$₹€£]|on|\.|$)/i);
      if (locMatch && locMatch[1].trim().length > 2) {
        location = locMatch[1].trim();
      }

      const organizer = userName || "Celebration Host";
      const title = `${organizer}'s ${eventType.charAt(0).toUpperCase() + eventType.slice(1)} Celebration`;
      const vibe = lowerPrompt.includes("chic")
        ? "Modern Chic & Floral"
        : lowerPrompt.includes("neon")
        ? "Cyberpunk Neon Glow"
        : lowerPrompt.includes("royal")
        ? "Royal Heritage & Palatial Elegance"
        : "Warm Golden Hour Elegance";

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);
      const dateStr = futureDate.toISOString().split("T")[0];

      const generated = await generateMasterplan({
        eventType,
        title,
        eventDate: dateStr,
        location,
        guestCount: guests,
        totalBudget: budget,
        currency: eventCurrency,
        vibe,
        organizerName: organizer,
      });

      const newId = `event-${Date.now()}`;
      const slug = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}-${Date.now().toString().slice(-4)}`;

      await createEventRecord({
        id: newId,
        slug,
        organizer_name: organizer,
        organizer_email: userEmail ? userEmail.trim().toLowerCase() : "",
        event_type: eventType,
        title,
        event_date: dateStr,
        location,
        guest_count: guests,
        total_budget: budget,
        currency: eventCurrency,
        vibe,
        banner_r2_key: undefined,
        ai_plan_json: JSON.stringify(generated.plan),
        last_prompt: userPrompt,
      });

      const newSym = getCurrencySymbol(eventCurrency);
      const formattedTotal = formatCurrency(budget, eventCurrency);

      const toolCall: ToolCallItem = {
        id: `tool-${Date.now()}`,
        tool: "sync_d1",
        title: `Created Celebration: "${title}"`,
        summary: `Persisted in Cloudflare D1 with ${generated.plan.budgetBreakdown.length} balanced budget items (${newSym}) and ${generated.plan.timeline.length} milestone tasks.`,
        data: { id: newId, title, budget, currency: eventCurrency },
        status: "completed",
      };

      const responseText = `🎉 I've created and saved your celebration masterplan for **${title}** in Cloudflare D1!\n\nHere is a summary of what I've configured:\n- **Location:** ${location}\n- **Date:** ${dateStr}\n- **Target Guests:** ${guests} guests\n- **Total Budget:** ${formattedTotal} (100% mathematically balanced across ${generated.plan.budgetBreakdown.length} categories)\n- **Currency:** ${eventCurrency} (${newSym})\n- **Milestone Timeline:** ${generated.plan.timeline.length} phased checkpoints from concept through celebration day.\n\nYou can review the breakdown below or jump directly to your interactive Command Center:`;

      return respondWithChat(newId, messages, {
        response: responseText,
        toolCalls: [toolCall],
        actionCard: {
          type: "event_created",
          title,
          data: {
            id: newId,
            slug,
            title,
            eventType,
            totalBudget: budget,
            currency: eventCurrency,
            guestCount: guests,
            location,
            eventDate: dateStr,
            tagline: generated.plan.eventSummary?.tagline,
            budgetBreakdown: generated.plan.budgetBreakdown,
          },
        },
      });
    }

    // 11. TOOL: Budget & Expense Queries
    if (
      lowerPrompt.includes("budget") ||
      lowerPrompt.includes("spent") ||
      lowerPrompt.includes("cost") ||
      lowerPrompt.includes("money") ||
      lowerPrompt.includes("saving") ||
      lowerPrompt.includes("ledger") ||
      lowerPrompt.includes("expense") ||
      lowerPrompt.includes("price") ||
      lowerPrompt.includes("how much")
    ) {
      if (activeEvent && activePlan) {
        const totalAlloc =
          activePlan.budgetBreakdown?.reduce((acc: number, c: any) => acc + (c.allocatedAmount || 0), 0) ||
          activeEvent.total_budget;
        const totalSpent =
          activePlan.budgetBreakdown?.reduce((acc: number, c: any) => acc + (c.actualSpent || 0), 0) || 0;
        const variance = totalAlloc - totalSpent;
        const sym = getCurrencySymbol(activeEvent.currency);

        const toolCall: ToolCallItem = {
          id: `tool-${Date.now()}`,
          tool: "sync_d1",
          title: `Queried Ledger: ${activeEvent.title}`,
          summary: `Allocated ${formatCurrency(totalAlloc, activeEvent.currency)} • Spent ${formatCurrency(totalSpent, activeEvent.currency)} • Remaining ${formatCurrency(variance, activeEvent.currency)}`,
          data: { totalAlloc, totalSpent, variance, currency: activeEvent.currency },
          status: "completed",
        };

        const responseText = `Here is the real-time financial ledger for **${activeEvent.title}**:\n\n- **Total Allocated:** ${formatCurrency(totalAlloc, activeEvent.currency)}\n- **Actual Spent:** ${formatCurrency(totalSpent, activeEvent.currency)} (${Math.round((totalSpent / totalAlloc) * 100)}% utilized)\n- **Remaining Buffer:** ${formatCurrency(variance, activeEvent.currency)} ${variance >= 0 ? "✅ (Within Budget)" : "⚠️ (Over Budget)"}\n\n### Top Category Allocations (${sym}):\n${activePlan.budgetBreakdown
          .slice(0, 3)
          .map(
            (c: any) =>
              `• **${c.category}:** ${formatCurrency(c.allocatedAmount, activeEvent.currency)} (Spent: ${formatCurrency(c.actualSpent || 0, activeEvent.currency)})`
          )
          .join("\n")}\n\n*Tip: You can edit 'Actual Spent' directly in the Command Center or tell me to 'Cut catering budget by 10%'.*`;

        return respondWithChat(activeEvent.id, messages, {
          response: responseText,
          toolCalls: [toolCall],
          actionCard: {
            type: "budget_summary",
            title: `Budget: ${activeEvent.title}`,
            data: {
              totalAlloc,
              totalSpent,
              variance,
              currency: activeEvent.currency,
              breakdown: activePlan.budgetBreakdown,
            },
          },
        });
      }
    }

    // 12. TOOL: RSVP & Guest Queries
    if (
      lowerPrompt.includes("rsvp") ||
      lowerPrompt.includes("guest") ||
      lowerPrompt.includes("who is coming") ||
      lowerPrompt.includes("attend") ||
      lowerPrompt.includes("attendance") ||
      lowerPrompt.includes("headcount") ||
      lowerPrompt.includes("invited") ||
      lowerPrompt.includes("dietary")
    ) {
      if (activeEvent) {
        const going = activeRsvps.filter((r) => r.status === "going");
        const goingCount = going.reduce((acc, r) => acc + (r.attendees_count || 1), 0);
        const maybe = activeRsvps.filter((r) => r.status === "maybe");
        const declined = activeRsvps.filter((r) => r.status === "declined");

        const toolCall: ToolCallItem = {
          id: `tool-${Date.now()}`,
          tool: "sync_d1",
          title: `Queried Guest Pulse: ${activeEvent.title}`,
          summary: `${goingCount} confirmed attending • ${maybe.length} tentative • ${declined.length} declined`,
          data: { goingCount, maybeCount: maybe.length, declinedCount: declined.length },
          status: "completed",
        };

        const responseText = `Current RSVP pulse for **${activeEvent.title}**:\n\n- 🎉 **Confirmed Attending:** ${goingCount} / ${activeEvent.guest_count} guests\n- 🤔 **Tentative (Maybe):** ${maybe.length} parties\n- 💌 **Declined:** ${declined.length}\n\n${activeRsvps.length > 0 ? `### Latest Guest Responses:\n${activeRsvps.slice(0, 3).map((r) => `• **${r.guest_name}** (${r.status.toUpperCase()}) — ${r.attendees_count} guest(s)${r.dietary_notes ? ` • Dietary: ${r.dietary_notes}` : ""}`).join("\n")}\n\n` : `_No guest responses recorded yet._\n\n`}**Shareable Public Invite Link:**\n\`/invite/${activeEvent.slug || activeEvent.id}\``;

        return respondWithChat(activeEvent.id, messages, {
          response: responseText,
          toolCalls: [toolCall],
          actionCard: {
            type: "rsvp_summary",
            title: `RSVP Metrics: ${activeEvent.title}`,
            data: {
              goingCount,
              targetGuests: activeEvent.guest_count,
              maybeCount: maybe.length,
              declinedCount: declined.length,
              recentRsvps: activeRsvps.slice(0, 5),
              inviteUrl: `/invite/${activeEvent.slug || activeEvent.id}`,
            },
          },
        });
      }
    }

    // 13. TOOL: Timeline & Milestone Queries
    if (
      lowerPrompt.includes("timeline") ||
      lowerPrompt.includes("milestone") ||
      lowerPrompt.includes("schedule") ||
      lowerPrompt.includes("what next") ||
      lowerPrompt.includes("to do") ||
      lowerPrompt.includes("todo") ||
      lowerPrompt.includes("task") ||
      lowerPrompt.includes("checklist")
    ) {
      if (activeEvent && activePlan) {
        const milestones = activePlan.timeline || [];
        const completed = milestones.filter((m: any) => m.completed).length;

        const toolCall: ToolCallItem = {
          id: `tool-${Date.now()}`,
          tool: "sync_d1",
          title: `Queried Milestones: ${activeEvent.title}`,
          summary: `${completed} of ${milestones.length} tasks completed`,
          data: { completedCount: completed, totalTasks: milestones.length },
          status: "completed",
        };

        const responseText = `Here is the milestone schedule for **${activeEvent.title}** (${completed}/${milestones.length} completed):\n\n${milestones.map((m: any) => `${m.completed ? "✅" : "⏳"} **[${m.priority || "Medium"}] ${m.taskTitle}** (${m.timeframe})\n  _${m.description}_`).join("\n\n")}`;

        return respondWithChat(activeEvent.id, messages, {
          response: responseText,
          toolCalls: [toolCall],
          actionCard: {
            type: "milestone_list",
            title: `Timeline Milestones: ${activeEvent.title}`,
            data: {
              milestones,
              completedCount: completed,
            },
          },
        });
      }
    }

    // 14. TOOL: Creative Ideas, Themes, Food, Music
    const isIdeasQuery =
      lowerPrompt.includes("idea") ||
      lowerPrompt.includes("ideas") ||
      lowerPrompt.includes("theme") ||
      lowerPrompt.includes("decor") ||
      lowerPrompt.includes("food") ||
      lowerPrompt.includes("menu") ||
      lowerPrompt.includes("catering") ||
      lowerPrompt.includes("music") ||
      lowerPrompt.includes("playlist") ||
      lowerPrompt.includes("entertainment") ||
      lowerPrompt.includes("activities") ||
      lowerPrompt.includes("cocktail") ||
      lowerPrompt.includes("drinks") ||
      lowerPrompt.includes("dress code");

    if (isIdeasQuery && activeEvent) {
      const ideas = activePlan?.personalizedIdeas || [
        {
          title: "Golden Hour Signature Lounge",
          concept: `Curated outdoor lounge setup in ${activeEvent.location} with warm amber accent lighting, ambient jazz, and custom welcome refreshments.`,
          estimatedImpact: "High",
          budgetTier: "$$",
        },
        {
          title: "Interactive Guest Memory Wall",
          concept: "Instant polaroid station with metallic ink guestbook and digital QR upload gallery.",
          estimatedImpact: "Medium",
          budgetTier: "$",
        },
      ];

      const toolCall: ToolCallItem = {
        id: `tool-${Date.now()}`,
        tool: "sync_d1",
        title: `Curated Ideas: ${activeEvent.title}`,
        summary: `${ideas.length} custom concepts tailored for ${activeEvent.vibe || "Celebration Elegance"} in ${activeEvent.location}`,
        data: ideas,
        status: "completed",
      };

      const responseText = `Here are personalized creative concepts for **${activeEvent.title}** (${activeEvent.vibe || "Celebration Elegance"} in ${activeEvent.location}):\n\n${ideas
        .map(
          (idea: any, idx: number) =>
            `${idx + 1}. ✨ **${idea.title}** (${idea.budgetTier || idea.budgetImpact || "$$"})\n   ${idea.description || idea.concept || "Curated celebration concept."}\n   _Impact: ${idea.estimatedImpact || idea.budgetImpact || "High"}_`
        )
        .join("\n\n")}\n\n*Would you like me to add any of these ideas to your milestone checklist or allocate a budget line item in ${activeEvent.currency}?*`;

      return respondWithChat(activeEvent.id, messages, {
        response: responseText,
        toolCalls: [toolCall],
        actionCard: {
          type: "ideas_grid",
          title: `Creative Concepts: ${activeEvent.title}`,
          data: ideas,
        },
      });
    }

    // 15. TOOL: Public Invite Link Query
    const isInviteQuery =
      lowerPrompt.includes("invite link") ||
      lowerPrompt.includes("how to invite") ||
      lowerPrompt.includes("share link") ||
      lowerPrompt.includes("guest link") ||
      lowerPrompt.includes("invitation link");

    if (isInviteQuery && activeEvent) {
      const inviteUrl = `/invite/${activeEvent.slug || activeEvent.id}`;
      return respondWithChat(activeEvent.id, messages, {
        response: `💌 Here is your shareable public invite portal for **${activeEvent.title}**:\n\n🔗 **[${inviteUrl}](${inviteUrl})**\n\nGuests can use this link to confirm their attendance, record dietary restrictions, and leave personal notes for the host. All RSVPs update your live dashboard and Concierge pulse instantly!`,
      });
    }

    // 16. General LLM call if OpenAI or Gemini API key is present
    const customHeaderKey = req.headers.get("x-openai-key") || req.headers.get("x-gemini-key");
    const bindings = await getAppBindings();
    const effectiveKey =
      customHeaderKey ||
      clientBodyKey ||
      bindings.OPENAI_API_KEY ||
      bindings.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY;

    if (effectiveKey) {
      try {
        const { formatted, diffDays } = formatCelebrationDate(activeEvent?.event_date);
        const systemPrompt = `You are FestivAI Concierge, an editorial, highly capable AI assistant for celebration planning (weddings, birthdays, galas).
Active Celebration: ${
          activeEvent
            ? `${activeEvent.title} (${activeEvent.event_type}, Date: ${formatted} [${activeEvent.event_date}, ${diffDays} days to go], Location: ${activeEvent.location}, Guests: ${activeEvent.guest_count}, Budget: ${formatCurrency(
                activeEvent.total_budget,
                activeEvent.currency
              )}, Currency: ${activeEvent.currency} (${currSym}), Vibe: ${activeEvent.vibe})`
            : "None selected yet"
        }.
Active Currency: ${activeCurrency} (Symbol: ${currSym}).
User Celebrations: ${userEvents.map((e) => e.title).join(", ")}.
Answer warmly, professionally, and concisely in markdown with actionable tips. Always format monetary values using the active currency symbol (${currSym}). When asked about date, location, or budget, provide exact details from the active celebration.`;

        if (effectiveKey.startsWith("AIza")) {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${effectiveKey}`;
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `${systemPrompt}\n\nConversation History:\n${messages
                        .slice(-4)
                        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
                        .join("\n")}\n\nUSER: ${userPrompt}\nASSISTANT:`,
                    },
                  ],
                },
              ],
            }),
          });

          if (geminiRes.ok) {
            const data = (await geminiRes.json()) as any;
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) {
              return respondWithChat(activeEvent?.id, messages, { response: reply });
            }
          }
        } else {
          const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${effectiveKey}`,
            },
            body: JSON.stringify({
              model: model || "gpt-4o",
              messages: [
                { role: "system", content: systemPrompt },
                ...messages.map((m) => ({ role: m.role, content: m.content })),
              ],
              temperature: 0.7,
              max_tokens: 800,
            }),
          });

          if (openAiRes.ok) {
            const json = (await openAiRes.json()) as any;
            const aiText =
              json.choices?.[0]?.message?.content ||
              "I am ready to help you coordinate your celebrations.";
            return respondWithChat(activeEvent?.id, messages, { response: aiText });
          }
        }
      } catch (llmErr) {
        console.warn("LLM chat error:", llmErr);
      }
    }

    // 17. Natural Conversational Default with Event Awareness
    if (activeEvent) {
      const { formatted, diffDays, statusText } = formatCelebrationDate(activeEvent.event_date);
      const greeting = userName ? `Hello **${userName}**!` : "Hello!";

      const defaultText = `${greeting} I'm actively coordinating **${activeEvent.title}** (${(activeEvent.event_type || "Celebration").toUpperCase()} in **${activeEvent.location}** on **${formatted}**).\n\n### 📋 Active Celebration Status:\n- **Event Date:** 🗓️ **${formatted}** (${statusText})\n- **Location:** 📍 **${activeEvent.location}**\n- **Target Guests:** 👥 **${activeEvent.guest_count} attendees**\n- **Financial Ledger:** 💰 **${formatCurrency(activeEvent.total_budget, activeEvent.currency)}**\n- **Vibe:** ✨ **${activeEvent.vibe || "Celebration Elegance"}**\n\nHow can I help you today? You can ask me:\n- *"When is my event?"* or *"Where is my event?"*\n- *"What will the weather be like in ${activeEvent.location}?"*\n- *"What's our budget breakdown?"* or *"Show RSVP pulse"*\n- *"Change location to Jaipur"* or *"Increase budget to ₹20 Lakhs"*`;

      return respondWithChat(activeEvent.id, messages, { response: defaultText });
    }

    return NextResponse.json({
      response: `Hello! Welcome to your FestivAI Planning Concierge.\n\nYou have no active celebration selected yet. Click **+ New Celebration** in the sidebar to configure a celebration, or type a prompt like:\n\n- *"Plan a Tuscan Garden Wedding in Napa Valley for 90 guests with $25,000 budget"*\n- *"Plan a 30th Birthday rooftop party in Mumbai with ₹5 Lakhs for 60 guests"*`,
    });
  } catch (error: any) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate chat response" },
      { status: 500 }
    );
  }
}
