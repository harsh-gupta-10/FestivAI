import type { EventRecord, AIEventPlan } from "../types/index.ts";

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string for a celebration event.
 */
export function generateIcsCalendar(
  event: Partial<EventRecord>,
  plan?: Partial<AIEventPlan> | null
): string {
  const title = event.title || "Celebration";
  const location = event.location || "Venue TBA";
  const vibe = event.vibe ? `Vibe: ${event.vibe}` : "";
  const tagline = plan?.eventSummary?.tagline ? `"${plan.eventSummary.tagline}"` : "";
  const eventDate = event.event_date || new Date().toISOString().split("T")[0];

  // Format date: YYYYMMDD
  const dateFormatted = eventDate.replace(/[^0-9]/g, "");
  const startDateStr = `${dateFormatted}T100000Z`;
  const endDateStr = `${dateFormatted}T220000Z`;
  const nowStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `festivai-${event.id || Date.now()}@festivai.com`;

  const description = [
    `Celebration: ${title}`,
    tagline,
    `Hosted via FestivAI Autonomous Planner`,
    vibe,
    event.guest_count ? `Guest Count: ${event.guest_count}` : "",
  ]
    .filter(Boolean)
    .join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FestivAI//Celebration Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${startDateStr}`,
    `DTEND:${endDateStr}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
