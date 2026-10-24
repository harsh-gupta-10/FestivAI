import { getAppBindings } from "./cloudflare";
import { EventRecord, RsvpRecord, AIEventPlan } from "@/types";

export async function getEventByIdOrSlug(idOrSlug: string): Promise<{ event: EventRecord; plan: AIEventPlan } | null> {
  const { DB } = await getAppBindings();

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
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
}

export async function createEventRecord(event: Omit<EventRecord, "created_at">): Promise<boolean> {
  const { DB } = await getAppBindings();
  const createdAt = new Date().toISOString();

  try {
    const query = `
      INSERT INTO events (
        id, slug, organizer_name, organizer_email, event_type, title,
        event_date, location, guest_count, total_budget, currency, vibe,
        banner_r2_key, ai_plan_json, last_prompt, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

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
  } catch (error) {
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
  const createdAt = new Date().toISOString();

  try {
    const query = `
      INSERT INTO rsvps (
        id, event_id, guest_name, guest_email, status,
        attendees_count, dietary_notes, message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

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
  } catch (error) {
    console.error("Error creating RSVP:", error);
    throw error;
  }
}
