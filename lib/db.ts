import { getAppBindings } from "./cloudflare.ts";
import type { EventRecord, RsvpRecord, AIEventPlan } from "../types/index.ts";
import { SAMPLE_EVENT, SAMPLE_RSVPS } from "./sample-data.ts";

let isTablesInitialized = false;

/**
 * Automatically creates events and rsvps tables and indexes in Cloudflare D1
 * if they do not exist yet. Also seeds sample-wedding-2026.
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
        created_at TEXT
      )
    `).run().catch((e: any) => console.warn("events table check:", e?.message));

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

    // 4. Seed sample event if not already in DB
    try {
      const existing = await DB.prepare("SELECT id FROM events WHERE id = ?").bind(SAMPLE_EVENT.id).first();
      if (!existing) {
        await DB.prepare(`
          INSERT INTO events (
            id, slug, organizer_name, organizer_email, event_type, title,
            event_date, location, guest_count, total_budget, currency, vibe,
            banner_r2_key, ai_plan_json, last_prompt, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          SAMPLE_EVENT.id,
          SAMPLE_EVENT.slug,
          SAMPLE_EVENT.organizer_name,
          SAMPLE_EVENT.organizer_email,
          SAMPLE_EVENT.event_type,
          SAMPLE_EVENT.title,
          SAMPLE_EVENT.event_date,
          SAMPLE_EVENT.location,
          SAMPLE_EVENT.guest_count,
          SAMPLE_EVENT.total_budget,
          SAMPLE_EVENT.currency,
          SAMPLE_EVENT.vibe,
          SAMPLE_EVENT.banner_r2_key || null,
          SAMPLE_EVENT.ai_plan_json,
          SAMPLE_EVENT.last_prompt || null,
          SAMPLE_EVENT.created_at
        ).run();

        // Seed sample RSVPs
        for (const rsvp of SAMPLE_RSVPS) {
          await DB.prepare(`
            INSERT INTO rsvps (
              id, event_id, guest_name, guest_email, status,
              attendees_count, dietary_notes, message, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            rsvp.id,
            rsvp.event_id,
            rsvp.guest_name,
            rsvp.guest_email,
            rsvp.status,
            rsvp.attendees_count,
            rsvp.dietary_notes || null,
            rsvp.message || null,
            rsvp.created_at
          ).run().catch(() => {});
        }
      }
    } catch (seedErr) {
      // ignore seed errors
    }

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
    let result = await DB.prepare(query).bind(idOrSlug, idOrSlug).first();

    if (!result && idOrSlug === SAMPLE_EVENT.id) {
      // Re-seed and re-check if sample event
      await ensureDbTables(DB);
      result = await DB.prepare(query).bind(idOrSlug, idOrSlug).first();
      if (!result) {
        return { event: SAMPLE_EVENT, plan: JSON.parse(SAMPLE_EVENT.ai_plan_json) };
      }
    }

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
      event.organizer_email,
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
        event.organizer_email,
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

export async function insertRsvp(rsvp: Omit<RsvpRecord, "created_at">): Promise<boolean> {
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
