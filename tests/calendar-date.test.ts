import test from "node:test";
import assert from "node:assert/strict";
import { generateIcsCalendar } from "../lib/calendar.ts";
import { formatCelebrationDate } from "../lib/date.ts";

test("Calendar RFC 5545 & Date Intelligence Suite", async (t) => {
  await t.test("generates RFC 5545 compliant VCALENDAR string with CRLF endings", () => {
    const mockEvent = {
      id: "evt_test123",
      title: "Royal Heritage Palace Wedding",
      location: "Jaipur, Rajasthan",
      event_date: "2026-11-15",
      vibe: "Regal Royal Rajputana",
      guest_count: 150,
    };

    const ics = generateIcsCalendar(mockEvent);

    assert.ok(ics.includes("BEGIN:VCALENDAR"));
    assert.ok(ics.includes("VERSION:2.0"));
    assert.ok(ics.includes("PRODID:-//FestivAI//Celebration Planner//EN"));
    assert.ok(ics.includes("BEGIN:VEVENT"));
    assert.ok(ics.includes("UID:festivai-evt_test123@festivai.com"));
    assert.ok(ics.includes("SUMMARY:Royal Heritage Palace Wedding"));
    assert.ok(ics.includes("LOCATION:Jaipur, Rajasthan"));
    assert.ok(ics.includes("DTSTART:20261115T100000Z"));
    assert.ok(ics.includes("DTEND:20261115T220000Z"));
    assert.ok(ics.includes("END:VEVENT"));
    assert.ok(ics.includes("END:VCALENDAR"));
    // RFC 5545 specifies lines MUST terminate with CRLF (\r\n)
    assert.ok(ics.includes("\r\n"));
  });

  await t.test("handles missing optional parameters gracefully in calendar output", () => {
    const minimalEvent = {};
    const ics = generateIcsCalendar(minimalEvent);

    assert.ok(ics.includes("BEGIN:VCALENDAR"));
    assert.ok(ics.includes("SUMMARY:Celebration"));
    assert.ok(ics.includes("LOCATION:Venue TBA"));
    assert.ok(ics.includes("END:VCALENDAR"));
  });

  await t.test("formats celebration countdowns for today, tomorrow, and past dates", () => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const todayRes = formatCelebrationDate(todayStr);
    assert.equal(todayRes.diffDays, 0);
    assert.ok(todayRes.statusText.includes("Today is celebration day"));

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const tomorrowRes = formatCelebrationDate(tomorrowStr);
    assert.equal(tomorrowRes.diffDays, 1);
    assert.ok(tomorrowRes.statusText.includes("Tomorrow is celebration day"));

    const past = new Date();
    past.setDate(past.getDate() - 10);
    const pastStr = past.toISOString().split("T")[0];
    const pastRes = formatCelebrationDate(pastStr);
    assert.ok(pastRes.diffDays < 0);
    assert.ok(pastRes.statusText.includes("concluded"));
  });

  await t.test("handles undefined or empty date strings safely", () => {
    const emptyRes = formatCelebrationDate(undefined);
    assert.equal(emptyRes.formatted, "TBD");
    assert.equal(emptyRes.diffDays, 0);
    assert.ok(emptyRes.statusText.includes("Date pending"));
  });
});
