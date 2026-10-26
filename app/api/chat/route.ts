import { NextRequest, NextResponse } from "next/server";
import { getAppBindings } from "@/lib/cloudflare";
import { getEventByIdOrSlug, getRsvpsForEvent, getEventsByOrganizerEmail, createEventRecord } from "@/lib/db";
import { generateMasterplan } from "@/lib/openai";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  actionCard?: {
    type: "budget_summary" | "rsvp_summary" | "event_created" | "milestone_list" | "ideas_grid" | "alert";
    title?: string;
    data?: any;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, eventId, userEmail, userName } = body as {
      messages: ChatMessage[];
      eventId?: string;
      userEmail?: string;
      userName?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1];
    const userPrompt = lastUserMessage.content.trim();
    const lowerPrompt = userPrompt.toLowerCase();

    // 1. Fetch current active event details if selected
    let activeEvent = null;
    let activePlan = null;
    let activeRsvps: any[] = [];

    if (eventId) {
      const eventData = await getEventByIdOrSlug(eventId);
      if (eventData) {
        activeEvent = eventData.event;
        activePlan = eventData.plan;
        activeRsvps = await getRsvpsForEvent(eventData.event.id);
      }
    }

    // 2. Fetch all user events for contextual awareness
    const userEvents = await getEventsByOrganizerEmail(userEmail);

    // 3. Check for "Create Event / Plan Event" intent via Natural Language
    const isCreateIntent =
      (lowerPrompt.includes("plan") || lowerPrompt.includes("create") || lowerPrompt.includes("organize") || lowerPrompt.includes("host")) &&
      (lowerPrompt.includes("wedding") || lowerPrompt.includes("birthday") || lowerPrompt.includes("party") || lowerPrompt.includes("gala") || lowerPrompt.includes("celebration") || lowerPrompt.includes("anniversary") || lowerPrompt.includes("event"));

    if (isCreateIntent) {
      // Extract or infer parameters
      let eventType = "birthday";
      if (lowerPrompt.includes("wedding")) eventType = "wedding";
      else if (lowerPrompt.includes("community") || lowerPrompt.includes("gala") || lowerPrompt.includes("festival")) eventType = "community";
      else if (lowerPrompt.includes("anniversary")) eventType = "anniversary";
      else if (lowerPrompt.includes("corporate")) eventType = "corporate";

      // Budget extraction (e.g. $5,000 or budget of $5,000 or $5k)
      let budget = 10000;
      const budgetMatch = userPrompt.match(/(?:\$|budget(?:\s+of)?\s*:?\s*\$?)\s*([0-9]+[0-9,]*)\s*(k|thousand)?/i);
      if (budgetMatch) {
        let val = parseFloat(budgetMatch[1].replace(/,/g, ""));
        if (budgetMatch[2]?.toLowerCase().startsWith("k")) val *= 1000;
        if (!isNaN(val) && val >= 50) budget = val;
      } else if (lowerPrompt.includes("5k")) budget = 5000;
      else if (lowerPrompt.includes("10k")) budget = 10000;
      else if (lowerPrompt.includes("15k")) budget = 15000;
      else if (lowerPrompt.includes("20k")) budget = 20000;
      else if (lowerPrompt.includes("25k")) budget = 25000;

      // Guest count extraction (e.g. 50 guests, 100 people)
      let guests = 75;
      const guestMatch = userPrompt.match(/([0-9]+)\s*(guests|people|attendees|persons)/i);
      if (guestMatch) {
        const g = parseInt(guestMatch[1], 10);
        if (!isNaN(g) && g > 0) guests = g;
      }

      // Location extraction
      let location = "San Francisco, CA";
      const locMatch = userPrompt.match(/in\s+([A-Za-z\s,]+?)(with|for|\$|on|\.|$)/i);
      if (locMatch && locMatch[1].trim().length > 2) {
        location = locMatch[1].trim();
      }

      // Title & Vibe
      const organizer = userName || "Celebration Host";
      const title = `${organizer}'s ${eventType.charAt(0).toUpperCase() + eventType.slice(1)} Celebration`;
      const vibe = lowerPrompt.includes("chic") ? "Modern Chic & Floral" : lowerPrompt.includes("neon") ? "Cyberpunk Neon Glow" : "Warm Golden Hour Elegance";

      // Future date (approx 3 months out)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);
      const dateStr = futureDate.toISOString().split("T")[0];

      // Generate complete masterplan
      const generated = await generateMasterplan({
        eventType,
        title,
        eventDate: dateStr,
        location,
        guestCount: guests,
        totalBudget: budget,
        currency: "USD",
        vibe,
        organizerName: organizer,
      });

      const newId = `event-${Date.now()}`;
      const slug = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}-${Date.now().toString().slice(-4)}`;

      // Persist in Cloudflare D1
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
        currency: "USD",
        vibe,
        banner_r2_key: undefined,
        ai_plan_json: JSON.stringify(generated.plan),
        last_prompt: userPrompt,
      });

      return NextResponse.json({
        response: `🎉 I've created and saved your celebration masterplan for **${title}** in Cloudflare D1!\n\nHere is a summary of what I've prepared:\n- **Location:** ${location}\n- **Date:** ${dateStr}\n- **Guest Target:** ${guests} guests\n- **Total Budget:** $${budget.toLocaleString()} USD (100% mathematically balanced across ${generated.plan.budgetBreakdown.length} categories)\n- **Timeline:** ${generated.plan.timeline.length} phased milestones from now until celebration day.\n\nYou can inspect the breakdown below or jump straight to your live Command Center:`,
        actionCard: {
          type: "event_created",
          title,
          data: {
            id: newId,
            slug,
            title,
            eventType,
            totalBudget: budget,
            currency: "USD",
            guestCount: guests,
            location,
            eventDate: dateStr,
            tagline: generated.plan.eventSummary?.tagline,
            budgetBreakdown: generated.plan.budgetBreakdown,
          },
        },
      });
    }

    // 4. Check for Budget queries
    if (lowerPrompt.includes("budget") || lowerPrompt.includes("spent") || lowerPrompt.includes("cost") || lowerPrompt.includes("money") || lowerPrompt.includes("saving")) {
      if (activeEvent && activePlan) {
        const totalAlloc = activePlan.budgetBreakdown?.reduce((acc: number, c: any) => acc + (c.allocatedAmount || 0), 0) || activeEvent.total_budget;
        const totalSpent = activePlan.budgetBreakdown?.reduce((acc: number, c: any) => acc + (c.actualSpent || 0), 0) || 0;
        const variance = totalAlloc - totalSpent;

        return NextResponse.json({
          response: `Here is the current financial status for **${activeEvent.title}**:\n\n- **Total Allocated:** ${totalAlloc.toLocaleString()} ${activeEvent.currency}\n- **Actual Spent:** ${totalSpent.toLocaleString()} ${activeEvent.currency} (${Math.round((totalSpent / totalAlloc) * 100)}% utilized)\n- **Remaining Buffer:** ${variance.toLocaleString()} ${activeEvent.currency} ${variance >= 0 ? "✅ (Within Budget)" : "⚠️ (Over Budget)"}\n\nTop categories:\n${activePlan.budgetBreakdown.slice(0, 3).map((c: any) => `• **${c.category}:** ${c.allocatedAmount.toLocaleString()} ${activeEvent.currency} (Spent: ${(c.actualSpent || 0).toLocaleString()} ${activeEvent.currency})`).join("\n")}\n\n*Tip: You can edit 'Actual Spent' directly on the interactive dashboard to sync live with Cloudflare D1.*`,
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

    // 5. Check for RSVP / Guest queries
    if (lowerPrompt.includes("rsvp") || lowerPrompt.includes("guest") || lowerPrompt.includes("who is coming") || lowerPrompt.includes("attend")) {
      if (activeEvent) {
        const going = activeRsvps.filter((r) => r.status === "going");
        const goingCount = going.reduce((acc, r) => acc + (r.attendees_count || 1), 0);
        const maybe = activeRsvps.filter((r) => r.status === "maybe");
        const declined = activeRsvps.filter((r) => r.status === "declined");

        return NextResponse.json({
          response: `Current RSVP pulse for **${activeEvent.title}**:\n\n- 🎉 **Confirmed Attending:** ${goingCount} / ${activeEvent.guest_count} guests\n- 🤔 **Tentative (Maybe):** ${maybe.length} parties\n- 💌 **Declined:** ${declined.length}\n\nLatest guest responses:\n${activeRsvps.slice(0, 3).map((r) => `• **${r.guest_name}** (${r.status.toUpperCase()}) — ${r.attendees_count} guest(s)${r.dietary_notes ? ` • Dietary: ${r.dietary_notes}` : ""}`).join("\n")}\n\nShareable public invite link:\n\`/invite/${activeEvent.slug || activeEvent.id}\``,
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

    // 6. Check for Timeline / Milestones queries
    if (lowerPrompt.includes("timeline") || lowerPrompt.includes("milestone") || lowerPrompt.includes("schedule") || lowerPrompt.includes("what next") || lowerPrompt.includes("to do") || lowerPrompt.includes("task")) {
      if (activeEvent && activePlan) {
        const milestones = activePlan.timeline || [];
        const completed = milestones.filter((m: any) => m.completed).length;

        return NextResponse.json({
          response: `Here are the key milestones for **${activeEvent.title}** (${completed}/${milestones.length} completed):\n\n${milestones.map((m: any) => `${m.completed ? "✅" : "⏳"} **[${m.priority || "Medium"}] ${m.taskTitle}** (${m.timeframe})\n  _${m.description}_`).join("\n\n")}`,
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

    // 7. General OpenAI API call if key is present
    const bindings = await getAppBindings();
    const apiKey = bindings.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const systemPrompt = `You are FestivAI Concierge, an editorial, highly capable AI assistant for event planning (weddings, birthdays, galas).
Active Event: ${activeEvent ? `${activeEvent.title} (${activeEvent.event_type}, Date: ${activeEvent.event_date}, Guests: ${activeEvent.guest_count}, Budget: ${activeEvent.total_budget} ${activeEvent.currency}, Vibe: ${activeEvent.vibe})` : "None selected yet"}.
User Celebrations: ${userEvents.map((e) => e.title).join(", ")}.
Answer warmly, professionally, and concisely in markdown with actionable tips. If the user wants to adjust plans or asks what to do next, offer specific creative guidance.`;

        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
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
          const aiText = json.choices?.[0]?.message?.content || "I am ready to help you coordinate your celebrations.";
          return NextResponse.json({ response: aiText });
        }
      } catch (llmErr) {
        console.warn("OpenAI chat error:", llmErr);
      }
    }

    // 8. Domain Intelligent Default Response
    const activeTitle = activeEvent ? activeEvent.title : "your celebrations";
    return NextResponse.json({
      response: `I'm analyzing **${activeTitle}**. Here are a few things we can do right now:\n\n1. **📊 Review & Adjust Budget:** Type *"What's my budget status?"* or *"Cut floral budget by 10%"*.\n2. **💌 Track RSVPs:** Ask *"How many guests are attending?"* or view latest dietary restrictions.\n3. **🌧️ Contingency Planning:** Ask *"What's our rain backup plan?"*.\n4. **✨ Plan a New Celebration:** Say *"Plan a 30th Birthday rooftop party in Chicago with $6,000 for 50 guests"*, and I'll generate and store the complete masterplan in Cloudflare D1 automatically!\n\nHow would you like to proceed?`,
    });
  } catch (error: any) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate chat response" },
      { status: 500 }
    );
  }
}
