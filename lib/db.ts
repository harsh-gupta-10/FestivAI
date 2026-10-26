import { getAppBindings } from "./cloudflare.ts";
import type { EventRecord, RsvpRecord, AIEventPlan } from "../types/index.ts";

let isTablesInitialized = false;

/**
 * Automatically creates events and rsvps tables and indexes in Cloudflare D1
 * if they do not exist yet.
 */
export async function ensureDbTables(DB: any): Promise<void> {
  if (isTablesInitialized) return;
  if (!DB || typeof DB.prepare !== "function") return;

  try {
    // 1. Create events table
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE,
        organizer_name TEXT,
        organizer_email TEXT,
        event_type TEXT,
        title TEXT,
        event_date TEXT,
        location TEXT,
        guest_count INTEGER,
        total_budget REAL,
        currency TEXT,
        vibe TEXT,
        banner_r2_key TEXT,
        ai_plan_json TEXT,
        last_prompt TEXT,
        chat_history_json TEXT,
        created_at TEXT
      )
    `).run().catch((e: any) => console.warn("events table check:", e?.message));

    // Migration: add chat_history_json column to existing tables if missing
    await DB.prepare("ALTER TABLE events ADD COLUMN chat_history_json TEXT").run().catch(() => {});

    // 2. Create rsvps table
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS rsvps (
        id TEXT PRIMARY KEY,
        event_id TEXT,
        guest_name TEXT,
        guest_email TEXT,
        status TEXT,
        attendees_count INTEGER,
        dietary_notes TEXT,
        message TEXT,
        created_at TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `).run().catch((e: any) => console.warn("rsvps table check:", e?.message));

    // 3. Create indexes
    await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id)`).run().catch(() => {});
    await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug)`).run().catch(() => {});
    await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_events_email ON events(organizer_email)`).run().catch(() => {});

    isTablesInitialized = true;
  } catch (err: any) {
    console.warn("ensureDbTables warning:", err?.message);
  }
}

export async function getEventByIdOrSlug(idOrSlug: string): Promise<{ event: EventRecord; plan: AIEventPlan } | null> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);

  try {
    const query = "SELECT * FROM events WHERE id = ? OR slug = ? LIMIT 1";
    const result = await DB.prepare(query).bind(idOrSlug, idOrSlug).first();

    if (!result) return null;

    const event = result as EventRecord;
    let plan: AIEventPlan;
    try {
      plan = JSON.parse(event.ai_plan_json);
    } catch (e) {
      plan = {} as AIEventPlan;
    }

    return { event, plan };
  } catch (error: any) {
    console.error("Error fetching event:", error);
    if (error?.message?.includes("no such table")) {
      isTablesInitialized = false;
      await ensureDbTables(DB);
    }
    return null;
  }
}

export async function createEventRecord(event: Omit<EventRecord, "created_at">): Promise<boolean> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);

  const createdAt = new Date().toISOString();
  const normalizedEmail = (event.organizer_email || "").trim().toLowerCase();

  const query = `
    INSERT INTO events (
      id, slug, organizer_name, organizer_email, event_type, title,
      event_date, location, guest_count, total_budget, currency, vibe,
      banner_r2_key, ai_plan_json, last_prompt, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    await DB.prepare(query).bind(
      event.id,
      event.slug,
      event.organizer_name,
      normalizedEmail,
      event.event_type,
      event.title,
      event.event_date,
      event.location,
      event.guest_count,
      event.total_budget,
      event.currency,
      event.vibe,
      event.banner_r2_key || null,
      event.ai_plan_json,
      event.last_prompt || null,
      createdAt
    ).run();

    return true;
  } catch (error: any) {
    if (error?.message?.includes("no such table")) {
      console.warn("Table missing during createEventRecord, auto-initializing and retrying...");
      isTablesInitialized = false;
      await ensureDbTables(DB);
      await DB.prepare(query).bind(
        event.id,
        event.slug,
        event.organizer_name,
        normalizedEmail,
        event.event_type,
        event.title,
        event.event_date,
        event.location,
        event.guest_count,
        event.total_budget,
        event.currency,
        event.vibe,
        event.banner_r2_key || null,
        event.ai_plan_json,
        event.last_prompt || null,
        createdAt
      ).run();
      return true;
    }
    console.error("Error creating event record:", error);
    throw error;
  }
}

export async function updateEventPlanInDb(
  eventId: string,
  aiPlan: AIEventPlan,
  lastPrompt?: string
): Promise<boolean> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);
  const planJson = JSON.stringify(aiPlan);

  try {
    if (lastPrompt) {
      const query = "UPDATE events SET ai_plan_json = ?, last_prompt = ? WHERE id = ?";
      await DB.prepare(query).bind(planJson, lastPrompt, eventId).run();
    } else {
      const query = "UPDATE events SET ai_plan_json = ? WHERE id = ?";
      await DB.prepare(query).bind(planJson, eventId).run();
    }
    return true;
  } catch (error) {
    console.error("Error updating event plan in DB:", error);
    return false;
  }
}

export async function updateEventBannerInDb(eventId: string, bannerKey: string): Promise<boolean> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);

  try {
    const query = "UPDATE events SET banner_r2_key = ? WHERE id = ?";
    await DB.prepare(query).bind(bannerKey, eventId).run();
    return true;
  } catch (error) {
    console.error("Error updating banner in DB:", error);
    return false;
  }
}

export async function updateEventCurrencyInDb(eventId: string, currency: string): Promise<boolean> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);

  try {
    const query = "UPDATE events SET currency = ? WHERE id = ?";
    await DB.prepare(query).bind(currency.toUpperCase().trim(), eventId).run();
    return true;
  } catch (error) {
    console.error("Error updating currency in DB:", error);
    return false;
  }
}

export async function updateEventBudgetInDb(
  eventId: string,
  totalBudget: number,
  currency?: string
): Promise<boolean> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);

  try {
    if (currency) {
      const query = "UPDATE events SET total_budget = ?, currency = ? WHERE id = ?";
      await DB.prepare(query).bind(totalBudget, currency.toUpperCase().trim(), eventId).run();
    } else {
      const query = "UPDATE events SET total_budget = ? WHERE id = ?";
      await DB.prepare(query).bind(totalBudget, eventId).run();
    }
    return true;
  } catch (error) {
    console.error("Error updating budget in DB:", error);
    return false;
  }
}


export async function getRsvpsForEvent(eventId: string): Promise<RsvpRecord[]> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);

  try {
    const query = "SELECT * FROM rsvps WHERE event_id = ? ORDER BY created_at DESC";
    const res = await DB.prepare(query).bind(eventId).all();
    return (res.results as RsvpRecord[]) || [];
  } catch (error) {
    console.error("Error fetching RSVPs:", error);
    return [];
  }
}

export async function createRsvpRecord(rsvp: Omit<RsvpRecord, "created_at">): Promise<boolean> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);

  const createdAt = new Date().toISOString();

  const query = `
    INSERT INTO rsvps (
      id, event_id, guest_name, guest_email, status,
      attendees_count, dietary_notes, message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    await DB.prepare(query).bind(
      rsvp.id,
      rsvp.event_id,
      rsvp.guest_name,
      rsvp.guest_email,
      rsvp.status,
      rsvp.attendees_count,
      rsvp.dietary_notes || null,
      rsvp.message || null,
      createdAt
    ).run();

    return true;
  } catch (error: any) {
    if (error?.message?.includes("no such table")) {
      isTablesInitialized = false;
      await ensureDbTables(DB);
      await DB.prepare(query).bind(
        rsvp.id,
        rsvp.event_id,
        rsvp.guest_name,
        rsvp.guest_email,
        rsvp.status,
        rsvp.attendees_count,
        rsvp.dietary_notes || null,
        rsvp.message || null,
        createdAt
      ).run();
      return true;
    }
    console.error("Error creating RSVP:", error);
    throw error;
  }
}

export async function getEventsByOrganizerEmail(email?: string): Promise<EventRecord[]> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);

  try {
    if (email && email.trim()) {
      const normalized = email.trim().toLowerCase();
      const query = "SELECT * FROM events WHERE lower(organizer_email) = ? ORDER BY created_at DESC";
      const res = await DB.prepare(query).bind(normalized).all();
      return (res.results as EventRecord[]) || [];
    }

    return [];
  } catch (error) {
    console.error("Error fetching events by organizer:", error);
    return [];
  }
}

export const insertRsvp = createRsvpRecord;

export async function updateEventDetailsInDb(
  eventId: string,
  updates: Partial<EventRecord>
): Promise<boolean> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);

  const allowedFields = [
    "title",
    "event_type",
    "event_date",
    "location",
    "guest_count",
    "total_budget",
    "currency",
    "vibe",
    "banner_r2_key",
    "ai_plan_json",
    "last_prompt",
    "chat_history_json",
  ];

  const setClauses: string[] = [];
  const values: any[] = [];

  for (const [key, val] of Object.entries(updates)) {
    if (allowedFields.includes(key) && val !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (setClauses.length === 0) return true;

  values.push(eventId);
  const query = `UPDATE events SET ${setClauses.join(", ")} WHERE id = ?`;

  try {
    await DB.prepare(query).bind(...values).run();
    return true;
  } catch (error) {
    console.error("Error updating event details in DB:", error);
    return false;
  }
}

export async function updateEventChatHistoryInDb(
  eventId: string,
  messages: any[]
): Promise<boolean> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);

  try {
    const jsonStr = JSON.stringify(messages.slice(-50)); // persist recent 50 messages
    const query = "UPDATE events SET chat_history_json = ? WHERE id = ?";
    await DB.prepare(query).bind(jsonStr, eventId).run();
    return true;
  } catch (error) {
    console.error("Error saving chat history in DB:", error);
    return false;
  }
}

export async function getEventChatHistoryFromDb(eventId: string): Promise<any[]> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);

  try {
    const query = "SELECT chat_history_json FROM events WHERE id = ? LIMIT 1";
    const res = await DB.prepare(query).bind(eventId).first();
    if (res && (res as any).chat_history_json) {
      return JSON.parse((res as any).chat_history_json);
    }
    return [];
  } catch (error) {
    console.error("Error fetching chat history from DB:", error);
    return [];
  }
}

export async function deleteEventRecord(eventId: string, organizerEmail?: string): Promise<boolean> {
  const { DB } = await getAppBindings();
  await ensureDbTables(DB);

  try {
    if (organizerEmail && organizerEmail.trim()) {
      const normalized = organizerEmail.trim().toLowerCase();
      // Verify ownership before deleting
      const checkQuery = "SELECT id FROM events WHERE id = ? AND lower(organizer_email) = ? LIMIT 1";
      const existing = await DB.prepare(checkQuery).bind(eventId, normalized).first();
      if (!existing) {
        console.warn("Unauthorized attempt to delete event:", eventId, organizerEmail);
        return false;
      }
    }

    // Delete rsvps first (foreign key cascade)
    await DB.prepare("DELETE FROM rsvps WHERE event_id = ?").bind(eventId).run().catch(() => {});
    // Delete event
    await DB.prepare("DELETE FROM events WHERE id = ?").bind(eventId).run();
    return true;
  } catch (error) {
    console.error("Error deleting event record:", error);
    return false;
  }
}


