import type { EventRecord, RsvpRecord, AIEventPlan } from "../types/index.ts";

export const SAMPLE_PLAN: AIEventPlan = {
  eventSummary: {
    tagline: "An Enchanted Sunset Garden Celebration",
    themeColors: ["#D946EF", "#F59E0B", "#10B981"],
    welcomeNote: "Welcome to our special day! We are thrilled to celebrate love, laughter, and lifelong memories with our dearest friends and family.",
  },
  budgetBreakdown: [
    { id: "b1", category: "Venue & Rentals", allocatedAmount: 8500, actualSpent: 8500, percentage: 34, aiSavingTip: "Booked during shoulder season for 15% discount." },
    { id: "b2", category: "Catering & Bar", allocatedAmount: 7000, actualSpent: 6400, percentage: 28, aiSavingTip: "Opted for signature cocktail stations rather than full open bar." },
    { id: "b3", category: "Photography & Video", allocatedAmount: 3500, actualSpent: 3500, percentage: 14, aiSavingTip: "Combined photo + drone video package." },
    { id: "b4", category: "Floral & Decor", allocatedAmount: 3000, actualSpent: 2850, percentage: 12, aiSavingTip: "Repurposed ceremony arch florals for the bridal table." },
    { id: "b5", category: "Music & Entertainment", allocatedAmount: 2000, actualSpent: 1950, percentage: 8, aiSavingTip: "Live acoustic duo for ceremony + DJ for dance reception." },
    { id: "b6", category: "Favors & Stationery", allocatedAmount: 1000, actualSpent: 920, percentage: 4, aiSavingTip: "Digital invites with QR code saved $400 on postage." },
  ],
  timeline: [
    { id: "t1", timeframe: "6 Months Before", taskTitle: "Secure Garden Venue & Officiant", description: "Signed contracts and reserved the botanical pavilion.", priority: "High", completed: true },
    { id: "t2", timeframe: "4 Months Before", taskTitle: "Tasting Menu & Cake Design", description: "Sampled farm-to-table entrees and selected 3-tier citrus berry cake.", priority: "High", completed: true },
    { id: "t3", timeframe: "2 Months Before", taskTitle: "Send Public RSVPs & Finalize Playlist", description: "Launched FestivAI guest portal with dietary preferences.", priority: "Medium", completed: true },
    { id: "t4", timeframe: "1 Week Before", taskTitle: "Final Headcount & Seating Chart", description: "Confirmed 120 guests with catering team.", priority: "High", completed: false },
    { id: "t5", timeframe: "Day Of", taskTitle: "Golden Hour Photo Walk", description: "Sunset couple portraits at the fountain overlook at 6:15 PM.", priority: "Medium", completed: false },
  ],
  vendorChecklist: [
    { id: "v1", vendorType: "Catering Service", recommendedAction: "Confirm vegan and gluten-free platters", questionsToAsk: ["What is your server-to-guest ratio?", "Do you provide bar glassware?"], estimatedBudgetRange: "$6,000 - $7,500", booked: true },
    { id: "v2", vendorType: "Floral Designer", recommendedAction: "Review installation timeline for ceremony arch", questionsToAsk: ["Can arrangements be repurposed after the vows?", "Are seasonal blooms included?"], estimatedBudgetRange: "$2,500 - $3,500", booked: true },
    { id: "v3", vendorType: "DJ & Sound Tech", recommendedAction: "Provide do-not-play list and first dance track", questionsToAsk: ["Do you bring wireless lapel mics for vows?", "Is dance floor lighting included?"], estimatedBudgetRange: "$1,800 - $2,200", booked: true },
    { id: "v4", vendorType: "Live Painter / Artist", recommendedAction: "Select canvas size and vantage point during cocktail hour", questionsToAsk: ["Will painting be completed during event?", "Do guests get to watch?"], estimatedBudgetRange: "$800 - $1,400", booked: false },
  ],
  personalizedIdeas: [
    { id: "i1", category: "Atmosphere", title: "Fairy Light Canopy Tunnel", description: "Suspended warm bistro lights connecting the pavilion to the dining terrace.", budgetImpact: "Low", diyPotential: true },
    { id: "i2", category: "Food & Drink", title: "His & Hers Signature Spritz", description: "Lavender Gin Fizz for her and Smoked Rosemary Bourbon Smash for him.", budgetImpact: "Low", diyPotential: false },
    { id: "i3", category: "Activities", title: "Audio Guestbook Rotary Phone", description: "Vintage telephone recording guests' spoken wishes into digital audio keepsakes.", budgetImpact: "Medium", diyPotential: true },
    { id: "i4", category: "Decor", title: "Pressed Wildflower Table Numbers", description: "Double glass frames holding botanical pressings and handwritten gold calligraphy.", budgetImpact: "Low", diyPotential: true },
    { id: "i5", category: "Music & Entertainment", title: "Surprise Saxophone Soloist", description: "Live saxophonist joins the DJ during the final 90 minutes of the dance set.", budgetImpact: "Medium", diyPotential: false },
    { id: "i6", category: "Favors", title: "Wildflower Seed Bombs & Honey Jars", description: "Eco-friendly handmade seed paper and local artisan honey with custom seal.", budgetImpact: "Low", diyPotential: true },
  ],
  publicSchedule: [
    { id: "s1", time: "4:30 PM", activity: "Guest Arrival & Welcome Refreshments", description: "Chilled lavender lemonade and acoustic violin in the courtyard." },
    { id: "s2", time: "5:00 PM", activity: "Vow Exchange Ceremony", description: "Under the botanical flower pavilion." },
    { id: "s3", time: "6:00 PM", activity: "Sunset Cocktails & Hors d'Oeuvres", description: "Lawn games, open terrace bar, and golden hour photos." },
    { id: "s4", time: "7:30 PM", activity: "Dinner, Speeches & Starlit Dancing", description: "Farm-to-table banquet followed by celebratory dance party!" },
  ],
  genAiMetadata: {
    model: "o3-mini",
    generationTimeMs: 1420,
    promptUsed: "Wedding: Enchanted Sunset Garden Celebration for 120 guests with $25,000 budget.",
  },
};

export const SAMPLE_EVENT: EventRecord = {
  id: "sample-wedding-2026",
  slug: "enchanted-sunset-garden",
  organizer_name: "Sarah & Marcus",
  organizer_email: "sarah@example.com",
  event_type: "wedding",
  title: "Sarah & Marcus's Enchanted Garden Wedding",
  event_date: "2026-09-18",
  location: "Botanical Pavilion, San Francisco, CA",
  guest_count: 120,
  total_budget: 25000,
  currency: "USD",
  vibe: "Boho Chic & Botanical Elegance",
  banner_r2_key: null,
  ai_plan_json: JSON.stringify(SAMPLE_PLAN),
  last_prompt: "Wedding: Enchanted Sunset Garden Celebration for 120 guests with $25,000 budget.",
  created_at: "2026-03-01T12:00:00.000Z",
};

export const SAMPLE_RSVPS: RsvpRecord[] = [
  {
    id: "r1",
    event_id: "sample-wedding-2026",
    guest_name: "Elena Rostova",
    guest_email: "elena@example.com",
    status: "going",
    attendees_count: 2,
    dietary_notes: "Vegetarian, no cilantro",
    message: "Can't wait to dance all night!",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "r2",
    event_id: "sample-wedding-2026",
    guest_name: "Devon Clark",
    guest_email: "devon@example.com",
    status: "going",
    attendees_count: 1,
    dietary_notes: "None",
    message: "So thrilled for you both!",
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: "r3",
    event_id: "sample-wedding-2026",
    guest_name: "Maya Lin",
    guest_email: "maya@example.com",
    status: "maybe",
    attendees_count: 1,
    dietary_notes: "Gluten-free",
    message: "Checking flight schedules, hope to make it!",
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];
