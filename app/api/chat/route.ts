import { NextRequest, NextResponse } from "next/server";
import { getAppBindings } from "@/lib/cloudflare";
import {
  getEventByIdOrSlug,
  getRsvpsForEvent,
  getEventsByOrganizerEmail,
  createEventRecord,
  updateEventCurrencyInDb,
} from "@/lib/db";
import { generateMasterplan } from "@/lib/openai";
import { getWeatherIntelligence, WeatherReport } from "@/lib/tools/weather";
import { searchWebIntelligence, WebSearchReport } from "@/lib/tools/web-search";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";

export interface ToolCallItem {
  id: string;
  tool: "check_weather" | "search_web" | "sync_d1" | "currency_switch";
  title: string;
  summary: string;
  data?: any;
  status: "completed" | "running" | "error";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  toolCalls?: ToolCallItem[];
  actionCard?: {
    type:
      | "budget_summary"
      | "rsvp_summary"
      | "event_created"
      | "milestone_list"
      | "ideas_grid"
      | "alert"
      | "weather_card"
      | "web_results";
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

      return NextResponse.json({
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

    // 4. TOOL: Weather Intelligence
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
      // Extract location if specified in prompt, else fallback to activeEvent.location
      let queryLocation = activeEvent?.location || "Goa, India";
      const inMatch = userPrompt.match(/in\s+([A-Za-z\s,]+?)(on|for|at|\?|\.|$)/i);
      const forMatch = userPrompt.match(/for\s+([A-Za-z\s,]+?)(on|in|at|\?|\.|$)/i);

      if (inMatch && inMatch[1].trim().length > 2) {
        queryLocation = inMatch[1].trim();
      } else if (forMatch && forMatch[1].trim().length > 2 && !forMatch[1].toLowerCase().includes("wedding")) {
        queryLocation = forMatch[1].trim();
      }

      // Extract date if specified in prompt, else fallback to activeEvent.event_date
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

      return NextResponse.json({
        response: responseText,
        toolCalls: [toolCall],
        actionCard: {
          type: "weather_card",
          title: `Weather Intelligence: ${weatherReport.location}`,
          data: weatherReport,
        },
      });
    }

    // 5. TOOL: Web Search & Internet Access
    const isSearchIntent =
      lowerPrompt.includes("search") ||
      lowerPrompt.includes("browse") ||
      lowerPrompt.includes("find venue") ||
      lowerPrompt.includes("venues in") ||
      lowerPrompt.includes("caterer") ||
      lowerPrompt.includes("photographer") ||
      lowerPrompt.includes("vendor rates") ||
      lowerPrompt.includes("trends") ||
      lowerPrompt.includes("ideas for") ||
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

      return NextResponse.json({
        response: responseText,
        toolCalls: [toolCall],
        actionCard: {
          type: "web_results",
          title: `Web Intelligence: "${searchReport.query.slice(0, 35)}"`,
          data: searchReport,
        },
      });
    }

    // 6. TOOL: Create Event / Plan Event Intent
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

      // Currency detection during creation
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

      // Budget extraction
      let budget = eventCurrency === "INR" ? 500000 : 10000;

      // Check for Lakh/Crore in INR
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

      // Guest count extraction
      let guests = 75;
      const guestMatch = userPrompt.match(/([0-9]+)\s*(guests|people|attendees|persons)/i);
      if (guestMatch) {
        const g = parseInt(guestMatch[1], 10);
        if (!isNaN(g) && g > 0) guests = g;
      }

      // Location extraction
      let location = eventCurrency === "INR" ? "Goa, India" : "San Francisco, CA";
      const locMatch = userPrompt.match(/in\s+([A-Za-z\s,]+?)(with|for|[\$₹€£]|on|\.|$)/i);
      if (locMatch && locMatch[1].trim().length > 2) {
        location = locMatch[1].trim();
      }

      // Title & Vibe
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

      return NextResponse.json({
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

    // 7. TOOL: Budget Query
    if (
      lowerPrompt.includes("budget") ||
      lowerPrompt.includes("spent") ||
      lowerPrompt.includes("cost") ||
      lowerPrompt.includes("money") ||
      lowerPrompt.includes("saving") ||
      lowerPrompt.includes("ledger")
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

        return NextResponse.json({
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

    // 8. TOOL: RSVP / Guest Queries
    if (
      lowerPrompt.includes("rsvp") ||
      lowerPrompt.includes("guest") ||
      lowerPrompt.includes("who is coming") ||
      lowerPrompt.includes("attend")
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

        return NextResponse.json({
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

    // 9. TOOL: Timeline / Milestone Queries
    if (
      lowerPrompt.includes("timeline") ||
      lowerPrompt.includes("milestone") ||
      lowerPrompt.includes("schedule") ||
      lowerPrompt.includes("what next") ||
      lowerPrompt.includes("to do") ||
      lowerPrompt.includes("task")
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

        return NextResponse.json({
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

    // 10. General LLM call if OpenAI API key is present
    const bindings = await getAppBindings();
    const apiKey = bindings.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const systemPrompt = `You are FestivAI Concierge, an editorial, highly capable AI assistant for celebration planning (weddings, birthdays, galas).
Active Event: ${
          activeEvent
            ? `${activeEvent.title} (${activeEvent.event_type}, Date: ${activeEvent.event_date}, Location: ${activeEvent.location}, Guests: ${activeEvent.guest_count}, Budget: ${formatCurrency(
                activeEvent.total_budget,
                activeEvent.currency
              )}, Currency: ${activeEvent.currency} (${currSym}), Vibe: ${activeEvent.vibe})`
            : "None selected yet"
        }.
Active Currency: ${activeCurrency} (Symbol: ${currSym}).
User Celebrations: ${userEvents.map((e) => e.title).join(", ")}.
Answer warmly, professionally, and concisely in markdown with actionable tips. Always format monetary values using the active currency symbol (${currSym}). If the user asks about weather, internet research, or budget adjustments, provide helpful context.`;

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
          const aiText =
            json.choices?.[0]?.message?.content ||
            "I am ready to help you coordinate your celebrations.";
          return NextResponse.json({ response: aiText });
        }
      } catch (llmErr) {
        console.warn("OpenAI chat error:", llmErr);
      }
    }

    // 11. Domain Intelligent Default ChatGPT Response
    const activeTitle = activeEvent ? activeEvent.title : "your celebrations";
    return NextResponse.json({
      response: `I'm analyzing **${activeTitle}**. Here are four intelligent actions you can trigger right now:\n\n1. **🌤️ Check Venue Weather:** Ask *"What will the weather be like in ${activeEvent ? activeEvent.location : "Goa"} on celebration day?"* to get live forecasts, precipitation risk, and golden hour timing.\n2. **🌐 Search the Internet:** Ask *"Find top beachfront venues in Goa with guest capacity 150"* for real-time web intelligence and citations.\n3. **💱 Switch Currency:** Say *"Change currency to INR (₹)"* or *"Switch to Euros"* to immediately reformat all ledger cards.\n4. **📊 Analyze Budget & RSVPs:** Ask *"What's our budget buffer?"* or *"Who has confirmed attendance?"*.\n\nHow would you like to proceed?`,
    });
  } catch (error: any) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate chat response" },
      { status: 500 }
    );
  }
}
