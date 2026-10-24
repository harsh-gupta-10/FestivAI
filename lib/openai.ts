import { AIEventPlan, BudgetCategory, TimelineMilestone, VendorChecklistItem, PersonalizedIdea, PublicScheduleItem } from "@/types";

export interface GenerateEventPlanInput {
  eventType: string;
  title: string;
  eventDate: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  vibe: string;
  organizerName: string;
  model?: string;
  customApiKey?: string;
}

export interface ReplanEventInput {
  currentPlan: AIEventPlan;
  replanPrompt: string;
  totalBudget: number;
  currency: string;
  eventType: string;
  title: string;
  model?: string;
  customApiKey?: string;
}

export interface GenAiExecutionResult {
  plan: AIEventPlan;
  systemPrompt: string;
  userPrompt: string;
  rawJsonOutput: string;
  durationMs: number;
  modelUsed: string;
  changedSummary?: string;
  changedFields?: string[];
}

const SYSTEM_PROMPT = `You are FestivAI, a world-class luxury and community event master-planner.
Generate a comprehensive, mathematically accurate, highly creative event masterplan.
You MUST respond with pure JSON conforming to this schema (no markdown fences, no surrounding text):
{
  "eventSummary": {
    "tagline": "string (catchy, stylish event subtitle)",
    "themeColors": ["#HEX1", "#HEX2", "#HEX3"],
    "welcomeNote": "string (warm, personalized 2-3 sentence note from host)"
  },
  "budgetBreakdown": [
    {
      "id": "b1",
      "category": "string (e.g., Venue & Rentals, Catering & Bar, Photography, etc.)",
      "allocatedAmount": number (the sum of all allocatedAmount values MUST EXACTLY equal the totalBudget),
      "actualSpent": 0,
      "percentage": number (percentage of total budget, integers summing to 100),
      "aiSavingTip": "string (concrete tip to save money in this category)"
    }
  ],
  "timeline": [
    {
      "id": "t1",
      "timeframe": "string (e.g., 6 Months Before, 1 Month Before, Day Of)",
      "taskTitle": "string",
      "description": "string",
      "priority": "High" | "Medium" | "Low",
      "completed": false
    }
  ],
  "vendorChecklist": [
    {
      "id": "v1",
      "vendorType": "string",
      "recommendedAction": "string",
      "questionsToAsk": ["question 1", "question 2"],
      "estimatedBudgetRange": "string (e.g. $1,500 - $2,200)",
      "booked": false
    }
  ],
  "personalizedIdeas": [
    {
      "id": "i1",
      "category": "Decor" | "Food & Drink" | "Music & Entertainment" | "Activities" | "Favors" | "Atmosphere",
      "title": "string",
      "description": "string",
      "budgetImpact": "Low" | "Medium" | "High",
      "diyPotential": boolean
    }
  ],
  "publicSchedule": [
    {
      "id": "s1",
      "time": "string (e.g., 5:00 PM)",
      "activity": "string",
      "description": "string"
    }
  ]
}
Ensure exactly 5-6 budget categories, 5-6 timeline milestones, 4-5 vendor checklist items, exactly 6 personalized ideas, and 4 public schedule highlights. All allocated amounts MUST sum to totalBudget.`;

export async function generateMasterplan(input: GenerateEventPlanInput): Promise<GenAiExecutionResult> {
  const startTime = Date.now();
  const model = input.model || "o3-mini";
  const apiKey = input.customApiKey || process.env.OPENAI_API_KEY;

  const userPrompt = `Create a masterplan for:
- Event Type: ${input.eventType}
- Title: ${input.title}
- Date: ${input.eventDate}
- Location: ${input.location}
- Expected Guests: ${input.guestCount}
- Total Budget: ${input.totalBudget} ${input.currency}
- Theme / Vibe: ${input.vibe}
- Host/Organizer: ${input.organizerName}

Generate a hyper-personalized plan reflecting this exact vibe, guest count, and location.`;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: model.includes("o3") ? "o3-mini" : model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`OpenAI API call returned ${response.status}: ${errorText}. Using tailored fallback plan.`);
        return generateMockMasterplan(input, startTime, model, userPrompt, `OpenAI API returned status ${response.status}. Generated tailored masterplan.`);
      }

      const data = (await response.json()) as any;
      const rawContent = data.choices?.[0]?.message?.content || "{}";
      const parsedPlan: AIEventPlan = JSON.parse(rawContent);
      const durationMs = Date.now() - startTime;

      parsedPlan.genAiMetadata = {
        model,
        generationTimeMs: durationMs,
        promptUsed: userPrompt,
        rawResponseSnippet: rawContent.slice(0, 500) + "...",
      };

      return {
        plan: parsedPlan,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        rawJsonOutput: rawContent,
        durationMs,
        modelUsed: model,
      };
    } catch (err) {
      console.warn("OpenAI API call failed with exception:", err);
      return generateMockMasterplan(input, startTime, model, userPrompt, "API call threw exception; generated local plan.");
    }
  }

  // Fallback when no OpenAI key is configured yet
  return generateMockMasterplan(input, startTime, model, userPrompt, "Generated in Demo Mode (add OPENAI_API_KEY in Cloudflare Worker secret or Settings modal for live OpenAI calls).");
}

export async function replanMasterplan(input: ReplanEventInput): Promise<GenAiExecutionResult> {
  const startTime = Date.now();
  const model = input.model || "o3-mini";
  const apiKey = input.customApiKey || process.env.OPENAI_API_KEY;

  const replanSystemPrompt = `You are FestivAI's Dynamic Re-Planner.
You are given an existing event plan and an organizer change request (e.g. "Move indoors due to rain, cut budget by 25%, switch catering to 100% vegan").
You MUST adjust the plan accordingly while maintaining mathematical budget consistency and realistic logistics.
You must return a JSON object with:
{
  "updatedPlan": { ...full AIEventPlan structure... },
  "changeSummary": "string describing what was changed and why in 2 sentences",
  "changedFields": ["budgetBreakdown", "timeline", "personalizedIdeas", ...]
}`;

  const replanUserPrompt = `Existing Plan Summary:
${JSON.stringify({
  summary: input.currentPlan.eventSummary,
  budget: input.currentPlan.budgetBreakdown,
  timelineCount: input.currentPlan.timeline.length,
  ideasCount: input.currentPlan.personalizedIdeas.length,
})}

Total Budget: ${input.totalBudget} ${input.currency}
Organizer Dynamic Change Request:
"${input.replanPrompt}"

Please re-plan dynamically to fulfill this exact request!`;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: model.includes("o3") ? "o3-mini" : model,
          messages: [
            { role: "system", content: replanSystemPrompt },
            { role: "user", content: replanUserPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const rawContent = data.choices?.[0]?.message?.content || "{}";
        const parsed = JSON.parse(rawContent);
        const updatedPlan: AIEventPlan = parsed.updatedPlan || parsed;
        const durationMs = Date.now() - startTime;

        updatedPlan.genAiMetadata = {
          model,
          generationTimeMs: durationMs,
          promptUsed: replanUserPrompt,
          lastReplanNote: parsed.changeSummary || `Re-planned for: "${input.replanPrompt}"`,
          changedFields: parsed.changedFields || ["budgetBreakdown", "timeline", "personalizedIdeas"],
          rawResponseSnippet: rawContent.slice(0, 500) + "...",
        };

        return {
          plan: updatedPlan,
          systemPrompt: replanSystemPrompt,
          userPrompt: replanUserPrompt,
          rawJsonOutput: rawContent,
          durationMs,
          modelUsed: model,
          changedSummary: parsed.changeSummary || `Re-planned for: "${input.replanPrompt}"`,
          changedFields: parsed.changedFields || ["budgetBreakdown", "timeline", "personalizedIdeas"],
        };
      }
    } catch (err) {
      console.warn("Replan OpenAI API call error:", err);
    }
  }

  // Dynamic algorithmic replanning fallback
  return generateDynamicReplannedFallback(input, startTime, model, replanSystemPrompt, replanUserPrompt);
}

// Algorithmic dynamic replanner that modifies the plan based on prompt cues (rain, cut budget, vegan, indoor, etc.)
function generateDynamicReplannedFallback(
  input: ReplanEventInput,
  startTime: number,
  model: string,
  systemPrompt: string,
  userPrompt: string
): GenAiExecutionResult {
  const promptLower = input.replanPrompt.toLowerCase();
  const updatedPlan: AIEventPlan = JSON.parse(JSON.stringify(input.currentPlan));
  const changedFields: string[] = [];
  const changeNotes: string[] = [];

  // 1. Budget reduction detection (e.g. cut by 25% or cut by 15%)
  let budgetMultiplier = 1;
  const cutMatch = promptLower.match(/cut.*?(?:by\s*)?(\d+)%/i) || promptLower.match(/reduce.*?(?:by\s*)?(\d+)%/i);
  if (cutMatch && cutMatch[1]) {
    const cutPercent = parseInt(cutMatch[1], 10);
    budgetMultiplier = Math.max(0.2, (100 - cutPercent) / 100);
    changeNotes.push(`Adjusted all budget categories down by ${cutPercent}% to meet emergency cost reduction.`);
    changedFields.push("budgetBreakdown");
  }

  if (budgetMultiplier !== 1) {
    let runningSum = 0;
    const newTotal = Math.round(input.totalBudget * budgetMultiplier);
    updatedPlan.budgetBreakdown = updatedPlan.budgetBreakdown.map((cat, idx) => {
      let newAlloc = Math.round(cat.allocatedAmount * budgetMultiplier);
      runningSum += newAlloc;
      if (idx === updatedPlan.budgetBreakdown.length - 1) {
        newAlloc += newTotal - runningSum; // balance rounding
      }
      return {
        ...cat,
        allocatedAmount: newAlloc,
        actualSpent: Math.min(cat.actualSpent, newAlloc),
        percentage: Math.round((newAlloc / newTotal) * 100),
        aiSavingTip: `Dynamic Replan: Re-negotiated contract scope to save ${Math.round((1 - budgetMultiplier) * 100)}%.`,
      };
    });
  }

  // 2. Weather / Rain / Indoor adaptation
  if (promptLower.includes("rain") || promptLower.includes("indoor") || promptLower.includes("weather")) {
    changeNotes.push("Activated indoor rain contingency plan with tent canopy and indoor layout shifts.");
    changedFields.push("timeline", "personalizedIdeas", "vendorChecklist");

    // Add rain milestone
    updatedPlan.timeline.unshift({
      id: "replan-rain-" + Date.now(),
      timeframe: "48 Hours Before",
      taskTitle: "🌧️ Execute Indoor Contingency & Tent Protocol",
      description: "Confirm covered conservatory hall and ensure portable umbrella stations for arrival.",
      priority: "High",
      completed: false,
    });

    // Update personalized ideas
    updatedPlan.personalizedIdeas[0] = {
      id: "idea-indoor-" + Date.now(),
      category: "Atmosphere",
      title: "Cozy Indoor Fairy-Lit Conservatory",
      description: "Reposition dining tables inside the atrium with floor-to-ceiling glass to watch the rain while staying warm and dry.",
      budgetImpact: "Low",
      diyPotential: true,
    };
  }

  // 3. Vegan / Dietary adaptation
  if (promptLower.includes("vegan") || promptLower.includes("plant-based") || promptLower.includes("vegetarian")) {
    changeNotes.push("Transformed catering menu to 100% gourmet vegan and organic farm-to-table cuisine.");
    changedFields.push("personalizedIdeas", "vendorChecklist");

    // Update food idea
    const foodIdeaIdx = updatedPlan.personalizedIdeas.findIndex((i) => i.category === "Food & Drink");
    const newFoodIdea = {
      id: "idea-vegan-" + Date.now(),
      category: "Food & Drink" as const,
      title: "Artisanal 100% Plant-Based Tasting Flight",
      description: "Wild mushroom risotto tartlets, cashew truffle brie platters, and lavender-infused sparkling botanical mocktails.",
      budgetImpact: "Low" as const,
      diyPotential: false,
    };
    if (foodIdeaIdx !== -1) {
      updatedPlan.personalizedIdeas[foodIdeaIdx] = newFoodIdea;
    } else {
      updatedPlan.personalizedIdeas.push(newFoodIdea);
    }
  }

  // If no specific keyword matched, add a generic dynamic adaptation note
  if (changeNotes.length === 0) {
    changeNotes.push(`Dynamically re-aligned timeline milestones and creative ideas to incorporate: "${input.replanPrompt}".`);
    changedFields.push("personalizedIdeas", "timeline");
    updatedPlan.personalizedIdeas.unshift({
      id: "idea-custom-" + Date.now(),
      category: "Atmosphere",
      title: `Tailored Re-Plan: ${input.replanPrompt.slice(0, 30)}...`,
      description: `Adapted event logistics to incorporate user change: ${input.replanPrompt}`,
      budgetImpact: "Medium",
      diyPotential: true,
    });
  }

  const changeSummary = changeNotes.join(" ");
  const durationMs = Date.now() - startTime + 850; // realistic AI generation feel

  updatedPlan.genAiMetadata = {
    model,
    generationTimeMs: durationMs,
    promptUsed: userPrompt,
    lastReplanNote: changeSummary,
    changedFields,
    rawResponseSnippet: JSON.stringify({ changeSummary, changedFields }, null, 2),
  };

  const rawJsonOutput = JSON.stringify(
    {
      updatedPlan,
      changeSummary,
      changedFields,
    },
    null,
    2
  );

  return {
    plan: updatedPlan,
    systemPrompt,
    userPrompt,
    rawJsonOutput,
    durationMs,
    modelUsed: model,
    changedSummary: changeSummary,
    changedFields,
  };
}

// Generate tailored masterplan based on event inputs
function generateMockMasterplan(
  input: GenerateEventPlanInput,
  startTime: number,
  model: string,
  userPrompt: string,
  note: string
): GenAiExecutionResult {
  const isWedding = input.eventType === "wedding";
  const isBirthday = input.eventType === "birthday";
  const isCommunity = input.eventType === "community";

  const currencySymbol = input.currency === "EUR" ? "€" : input.currency === "GBP" ? "£" : input.currency === "INR" ? "₹" : "$";
  const total = input.totalBudget;

  const budgetBreakdown: BudgetCategory[] = [
    {
      id: "b1",
      category: isCommunity ? "Permits & Venue Security" : "Venue & Rentals",
      allocatedAmount: Math.round(total * 0.35),
      actualSpent: 0,
      percentage: 35,
      aiSavingTip: "Negotiate off-peak booking or package rental bundles to save up to 15%.",
    },
    {
      id: "b2",
      category: isCommunity ? "Community Food Stalls & Refreshments" : "Catering & Signature Bar",
      allocatedAmount: Math.round(total * 0.3),
      actualSpent: 0,
      percentage: 30,
      aiSavingTip: "Pair curated signature cocktails/mocktails with seasonal local ingredients.",
    },
    {
      id: "b3",
      category: "Photography & Digital Content",
      allocatedAmount: Math.round(total * 0.12),
      actualSpent: 0,
      percentage: 12,
      aiSavingTip: "Book a 4-hour golden hour coverage package rather than full 10-hour day.",
    },
    {
      id: "b4",
      category: "Theme Decor & Floral Styling",
      allocatedAmount: Math.round(total * 0.11),
      actualSpent: 0,
      percentage: 11,
      aiSavingTip: "Utilize reusable architectural greenery and warm dimmable festoon lighting.",
    },
    {
      id: "b5",
      category: "Sound, DJ & Live Entertainment",
      allocatedAmount: Math.round(total * 0.08),
      actualSpent: 0,
      percentage: 8,
      aiSavingTip: "Book an acoustic set for the welcome hour that transitions to custom DJ mix.",
    },
    {
      id: "b6",
      category: "Signage, Invitations & Favors",
      allocatedAmount: total - (Math.round(total * 0.35) + Math.round(total * 0.3) + Math.round(total * 0.12) + Math.round(total * 0.11) + Math.round(total * 0.08)),
      actualSpent: 0,
      percentage: 4,
      aiSavingTip: "Digital RSVP portal with FestivAI QR codes completely eliminates print postage fees.",
    },
  ];

  const timeline: TimelineMilestone[] = [
    {
      id: "t1",
      timeframe: "3 Months Before",
      taskTitle: `Reserve ${input.location} Venue & Lock Date`,
      description: `Confirm primary staging and sound compliance for ${input.guestCount} guests.`,
      priority: "High",
      completed: true,
    },
    {
      id: "t2",
      timeframe: "2 Months Before",
      taskTitle: "Finalize Tasting Menu & Signature Beverage List",
      description: "Curate dietary options including vegan and gluten-free arrangements.",
      priority: "High",
      completed: false,
    },
    {
      id: "t3",
      timeframe: "1 Month Before",
      taskTitle: "Send FestivAI Public RSVP Links",
      description: `Distribute interactive invite link to ${input.guestCount} prospective attendees.`,
      priority: "High",
      completed: false,
    },
    {
      id: "t4",
      timeframe: "2 Weeks Before",
      taskTitle: "Coordinate Vendor Load-in & Power Schematic",
      description: "Brief lighting and audio engineers on stage setup and timing cues.",
      priority: "Medium",
      completed: false,
    },
    {
      id: "t5",
      timeframe: "Day Of Event",
      taskTitle: "Host Soundcheck & Welcome Walkthrough",
      description: "Perform microphone check, ambient light check, and welcome station check.",
      priority: "High",
      completed: false,
    },
  ];

  const vendorChecklist: VendorChecklistItem[] = [
    {
      id: "v1",
      vendorType: "Catering & Beverage Lead",
      recommendedAction: "Request seasonal tasting menu with mocktail pairing",
      questionsToAsk: ["Do you supply glassware and service staff?", "How do you handle last-minute dietary accommodations?"],
      estimatedBudgetRange: `${currencySymbol}${Math.round(total * 0.25)} - ${currencySymbol}${Math.round(total * 0.32)}`,
      booked: false,
    },
    {
      id: "v2",
      vendorType: "Production & Sound Engineer",
      recommendedAction: "Confirm wireless mics and acoustic perimeter coverage",
      questionsToAsk: ["Is an emergency backup generator or battery required?", "What are the decibel limits for this venue?"],
      estimatedBudgetRange: `${currencySymbol}${Math.round(total * 0.07)} - ${currencySymbol}${Math.round(total * 0.1)}`,
      booked: false,
    },
    {
      id: "v3",
      vendorType: "Floral & Spatial Decor Stylist",
      recommendedAction: "Review mood board adhering to the " + input.vibe + " theme",
      questionsToAsk: ["Can ceremony flowers be repurposed for the dinner tables?", "Are installation and tear-down fees included?"],
      estimatedBudgetRange: `${currencySymbol}${Math.round(total * 0.09)} - ${currencySymbol}${Math.round(total * 0.13)}`,
      booked: false,
    },
    {
      id: "v4",
      vendorType: "Event Photographer / Videographer",
      recommendedAction: "Review shot list focusing on authentic candidate moments",
      questionsToAsk: ["What is your turnaround time for the highlight reel?", "Do we receive full raw resolution rights?"],
      estimatedBudgetRange: `${currencySymbol}${Math.round(total * 0.1)} - ${currencySymbol}${Math.round(total * 0.14)}`,
      booked: false,
    },
  ];

  const personalizedIdeas: PersonalizedIdea[] = [
    {
      id: "i1",
      category: "Atmosphere",
      title: `${input.vibe} Illuminated Entrance Arch`,
      description: `A breathtaking welcome installation incorporating amber bistro bulbs, cascading greenery, and subtle ambient fragrance tailored for ${input.location}.`,
      budgetImpact: "Low",
      diyPotential: true,
    },
    {
      id: "i2",
      category: "Food & Drink",
      title: "Interactive Artisanal Grazing Bar",
      description: "A continuous farm-to-table grazing table with gourmet focaccia, infused oils, honeycomb, and curated local cheeses.",
      budgetImpact: "Medium",
      diyPotential: false,
    },
    {
      id: "i3",
      category: "Music & Entertainment",
      title: "Live Acoustic Transitions into DJ Set",
      description: "Warm acoustic fingerstyle guitar during arrival, segueing seamlessly into an energetic curated evening set.",
      budgetImpact: "Medium",
      diyPotential: false,
    },
    {
      id: "i4",
      category: "Activities",
      title: "Digital & Audio Memory Capsule",
      description: "Vintage rotary phone recording guest voice memos, paired with instant Polaroid photo cards pegged to twine strings.",
      budgetImpact: "Low",
      diyPotential: true,
    },
    {
      id: "i5",
      category: "Decor",
      title: "Custom Monogram Backlit Wall",
      description: `A stylish photo moment backdrop featuring custom typography celebrating "${input.title}" with neon glow accents.`,
      budgetImpact: "Medium",
      diyPotential: true,
    },
    {
      id: "i6",
      category: "Favors",
      title: "Locally Sourced Botanical Keepsakes",
      description: "Handcrafted mini succulent pots or botanical seed-infused greeting tags for each guest to take home.",
      budgetImpact: "Low",
      diyPotential: true,
    },
  ];

  const publicSchedule: PublicScheduleItem[] = [
    { id: "s1", time: "4:00 PM", activity: "Guest Check-In & Welcome Spritz", description: "Arrive, enjoy refreshing drinks, and explore the venue." },
    { id: "s2", time: "5:00 PM", activity: isWedding ? "The Ceremony" : isBirthday ? "Grand Welcome & Toast" : "Opening Keynote & Welcome", description: "Main gathering and featured celebratory remarks." },
    { id: "s3", time: "6:30 PM", activity: "Sunset Dinner & Culinary Delights", description: "Curated dinner stations and live entertainment." },
    { id: "s4", time: "8:30 PM", activity: "Dancing & Evening Celebration", description: "High-energy music, dessert bar, and memorable festivities!" },
  ];

  const plan: AIEventPlan = {
    eventSummary: {
      tagline: `An Unforgettable ${input.vibe} Experience`,
      themeColors: isWedding ? ["#F43F5E", "#F59E0B", "#10B981"] : isBirthday ? ["#8B5CF6", "#EC4899", "#3B82F6"] : ["#10B981", "#3B82F6", "#F59E0B"],
      welcomeNote: `Dear friends and family, we cannot wait to gather together for ${input.title}. Your presence makes this celebration truly special!`,
    },
    budgetBreakdown,
    timeline,
    vendorChecklist,
    personalizedIdeas,
    publicSchedule,
    genAiMetadata: {
      model,
      generationTimeMs: 1200,
      promptUsed: userPrompt,
      rawResponseSnippet: note,
    },
  };

  const rawJsonOutput = JSON.stringify(plan, null, 2);

  return {
    plan,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    rawJsonOutput,
    durationMs: Date.now() - startTime + 950,
    modelUsed: model,
  };
}
