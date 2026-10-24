// In-memory fallback for local Next.js development (next dev)
// Implements Cloudflare D1 and Cloudflare R2 interfaces so local dev NEVER crashes.

interface StoredRow {
  [key: string]: any;
}

class MockD1PreparedStatement {
  private sql: string;
  private params: any[];
  private db: MockD1Database;

  constructor(sql: string, db: MockD1Database, params: any[] = []) {
    this.sql = sql;
    this.db = db;
    this.params = params;
  }

  bind(...values: any[]) {
    return new MockD1PreparedStatement(this.sql, this.db, values);
  }

  async first<T = Record<string, any>>(colName?: string): Promise<T | null> {
    const res = await this.all<T>();
    if (!res.results || res.results.length === 0) return null;
    if (colName) {
      return (res.results[0] as any)[colName] ?? null;
    }
    return res.results[0];
  }

  async all<T = Record<string, any>>(): Promise<{ results: T[]; success: boolean; meta: any }> {
    const results = this.db.executeQuery<T>(this.sql, this.params);
    return {
      results,
      success: true,
      meta: { duration: 1, changes: 0, last_row_id: 1, served_by: "in-memory-fallback" },
    };
  }

  async run(): Promise<{ success: boolean; meta: any }> {
    const changes = this.db.executeMutation(this.sql, this.params);
    return {
      success: true,
      meta: { duration: 1, changes, last_row_id: 1, served_by: "in-memory-fallback" },
    };
  }
}

export class MockD1Database {
  private events: Map<string, StoredRow> = new Map();
  private rsvps: Map<string, StoredRow> = new Map();

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const sampleEventId = "sample-wedding-2026";
    const samplePlan = {
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

    this.events.set(sampleEventId, {
      id: sampleEventId,
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
      ai_plan_json: JSON.stringify(samplePlan),
      last_prompt: "Wedding: Enchanted Sunset Garden Celebration for 120 guests with $25,000 budget.",
      created_at: new Date().toISOString(),
    });

    const sampleRsvps = [
      { id: "r1", event_id: sampleEventId, guest_name: "Elena Rostova", guest_email: "elena@example.com", status: "going", attendees_count: 2, dietary_notes: "Vegetarian, no cilantro", message: "Can't wait to dance all night!", created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
      { id: "r2", event_id: sampleEventId, guest_name: "Devon Clark", guest_email: "devon@example.com", status: "going", attendees_count: 1, dietary_notes: "None", message: "So thrilled for you both!", created_at: new Date(Date.now() - 3600000 * 18).toISOString() },
      { id: "r3", event_id: sampleEventId, guest_name: "Maya Lin", guest_email: "maya@example.com", status: "maybe", attendees_count: 1, dietary_notes: "Gluten-free", message: "Checking flight schedules, hope to make it!", created_at: new Date(Date.now() - 3600000 * 6).toISOString() },
    ];

    sampleRsvps.forEach((r) => this.rsvps.set(r.id, r));
  }

  prepare(query: string) {
    return new MockD1PreparedStatement(query, this);
  }

  executeQuery<T>(sql: string, params: any[]): T[] {
    const cleanSql = sql.trim().toLowerCase();

    // SELECT from events WHERE id = ? OR slug = ?
    if (cleanSql.includes("from events")) {
      const allEvents = Array.from(this.events.values());
      if (cleanSql.includes("where id = ? or slug = ?") || (cleanSql.includes("where id = ?") && cleanSql.includes("or slug = ?"))) {
        const queryVal = params[0] || params[1];
        const match = allEvents.find((e) => e.id === queryVal || e.slug === queryVal);
        return match ? ([match] as unknown as T[]) : [];
      }
      if (cleanSql.includes("where id = ?")) {
        const id = params[0];
        const match = this.events.get(id);
        return match ? ([match] as unknown as T[]) : [];
      }
      if (cleanSql.includes("where slug = ?")) {
        const slug = params[0];
        const match = allEvents.find((e) => e.slug === slug);
        return match ? ([match] as unknown as T[]) : [];
      }
      return allEvents as unknown as T[];
    }

    // SELECT from rsvps WHERE event_id = ?
    if (cleanSql.includes("from rsvps")) {
      const allRsvps = Array.from(this.rsvps.values());
      if (cleanSql.includes("where event_id = ?")) {
        const eventId = params[0];
        const filtered = allRsvps.filter((r) => r.event_id === eventId);
        filtered.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
        return filtered as unknown as T[];
      }
      return allRsvps as unknown as T[];
    }

    return [];
  }

  executeMutation(sql: string, params: any[]): number {
    const cleanSql = sql.trim().toLowerCase();

    // INSERT INTO events
    if (cleanSql.startsWith("insert into events")) {
      const [id, slug, organizer_name, organizer_email, event_type, title, event_date, location, guest_count, total_budget, currency, vibe, banner_r2_key, ai_plan_json, last_prompt, created_at] = params;
      this.events.set(id, {
        id,
        slug,
        organizer_name,
        organizer_email,
        event_type,
        title,
        event_date,
        location,
        guest_count,
        total_budget,
        currency,
        vibe,
        banner_r2_key,
        ai_plan_json,
        last_prompt,
        created_at: created_at || new Date().toISOString(),
      });
      return 1;
    }

    // UPDATE events SET ...
    if (cleanSql.startsWith("update events")) {
      // Find event ID
      const eventId = params[params.length - 1];
      const existing = this.events.get(eventId);
      if (existing) {
        if (cleanSql.includes("ai_plan_json = ?") && cleanSql.includes("last_prompt = ?")) {
          existing.ai_plan_json = params[0];
          existing.last_prompt = params[1];
        } else if (cleanSql.includes("ai_plan_json = ?")) {
          existing.ai_plan_json = params[0];
        }
        if (cleanSql.includes("banner_r2_key = ?")) {
          existing.banner_r2_key = params[0];
        }
        this.events.set(eventId, existing);
        return 1;
      }
      return 0;
    }

    // INSERT INTO rsvps
    if (cleanSql.startsWith("insert into rsvps")) {
      const [id, event_id, guest_name, guest_email, status, attendees_count, dietary_notes, message, created_at] = params;
      this.rsvps.set(id, {
        id,
        event_id,
        guest_name,
        guest_email,
        status,
        attendees_count: Number(attendees_count) || 1,
        dietary_notes,
        message,
        created_at: created_at || new Date().toISOString(),
      });
      return 1;
    }

    // DELETE from rsvps
    if (cleanSql.startsWith("delete from rsvps")) {
      const rsvpId = params[0];
      const existed = this.rsvps.delete(rsvpId);
      return existed ? 1 : 0;
    }

    return 0;
  }
}

// In-memory mock for Cloudflare R2
export class MockR2Bucket {
  private storage: Map<string, { data: Uint8Array; contentType?: string }> = new Map();

  async put(key: string, value: any, options?: { httpMetadata?: { contentType?: string } }) {
    let data: Uint8Array;
    if (value instanceof Uint8Array) {
      data = value;
    } else if (value instanceof ArrayBuffer) {
      data = new Uint8Array(value);
    } else if (typeof value === "string") {
      data = new TextEncoder().encode(value);
    } else if (value && typeof value.arrayBuffer === "function") {
      const ab = await value.arrayBuffer();
      data = new Uint8Array(ab);
    } else {
      data = new Uint8Array();
    }

    this.storage.set(key, {
      data,
      contentType: options?.httpMetadata?.contentType || "application/octet-stream",
    });

    return {
      key,
      size: data.byteLength,
      etag: "mock-etag-" + Date.now(),
    };
  }

  async get(key: string) {
    const item = this.storage.get(key);
    if (!item) return null;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(item.data);
        controller.close();
      },
    });

    return {
      key,
      size: item.data.byteLength,
      httpMetadata: {
        contentType: item.contentType,
      },
      arrayBuffer: async () => item.data.buffer,
      text: async () => new TextDecoder().decode(item.data),
      body: stream,
    };
  }

  async delete(key: string) {
    this.storage.delete(key);
  }
}

// Singleton instances for node dev server
let globalFallbackDb: MockD1Database | null = null;
let globalFallbackR2: MockR2Bucket | null = null;

export function getFallbackD1(): MockD1Database {
  if (!globalFallbackDb) {
    globalFallbackDb = new MockD1Database();
  }
  return globalFallbackDb;
}

export function getFallbackR2(): MockR2Bucket {
  if (!globalFallbackR2) {
    globalFallbackR2 = new MockR2Bucket();
  }
  return globalFallbackR2;
}
