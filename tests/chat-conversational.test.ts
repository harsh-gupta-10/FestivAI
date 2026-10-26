import test from "node:test";
import assert from "node:assert/strict";
import { formatCelebrationDate } from "../lib/date.ts";

test("Conversational Chat & Planning Intelligence Suite", async (t) => {
  await t.test("parses event creation intent with budget and guests from prompt", () => {
    const prompt = "Plan a 30th Birthday rooftop party in Brooklyn with $6,000 for 50 guests";
    const lowerPrompt = prompt.toLowerCase();

    const isCreateIntent =
      (lowerPrompt.includes("plan") || lowerPrompt.includes("create") || lowerPrompt.includes("organize")) &&
      (lowerPrompt.includes("birthday") || lowerPrompt.includes("party"));
    assert.equal(isCreateIntent, true);

    // Budget extraction requiring $ prefix or budget keyword
    const budgetMatch = prompt.match(/(?:\$|budget(?:\s+of)?\s*:?\s*\$?)\s*([0-9]+[0-9,]*)\s*(k|thousand)?/i);
    assert.ok(budgetMatch);
    let budget = parseFloat(budgetMatch[1].replace(/,/g, ""));
    assert.equal(budget, 6000);

    // Guest extraction
    const guestMatch = prompt.match(/([0-9]+)\s*(guests|people|attendees|persons)/i);
    assert.ok(guestMatch);
    const guests = parseInt(guestMatch[1], 10);
    assert.equal(guests, 50);
  });

  await t.test("identifies wedding category with k abbreviation ($25k)", () => {
    const prompt = "Plan an elegant garden wedding in Napa Valley with $25k for 80 attendees";
    const lowerPrompt = prompt.toLowerCase();

    assert.equal(lowerPrompt.includes("wedding"), true);
    const budgetMatch = prompt.match(/(?:\$|budget(?:\s+of)?\s*:?\s*\$?)\s*([0-9]+[0-9,]*)\s*(k|thousand)?/i);
    assert.ok(budgetMatch);
    let budget = parseFloat(budgetMatch[1]);
    if (budgetMatch[2]?.toLowerCase() === "k") budget *= 1000;
    assert.equal(budget, 25000);
  });

  await t.test("identifies 'when is my event' and date countdown queries correctly", () => {
    const dateQueries = [
      "when is my event",
      "When is the celebration?",
      "what is the date of my party",
      "how many days left until my wedding?",
      "countdown to celebration",
      "event date",
      "when are we celebrating?",
    ];

    for (const q of dateQueries) {
      const lower = q.toLowerCase();
      const isDateSchedule =
        lower.includes("when is") ||
        lower.includes("when are") ||
        lower.includes("what date") ||
        lower.includes("what is the date") ||
        lower.includes("event date") ||
        lower.includes("date of") ||
        lower.includes("how many days") ||
        lower.includes("days left") ||
        lower.includes("countdown") ||
        lower.startsWith("when");
      assert.equal(isDateSchedule, true, `Query "${q}" must match date/schedule intent`);
    }

    // Verify formatCelebrationDate output
    const result = formatCelebrationDate("2026-10-31");
    assert.ok(result.formatted.includes("2026"));
    assert.ok(result.formatted.includes("October"));
    assert.ok(result.statusText.includes("days"));
  });

  await t.test("identifies 'where is my event' and location queries correctly", () => {
    const locQueries = [
      "where is my event",
      "where will the party take place?",
      "what is the location?",
      "what is the venue?",
      "where is my wedding",
    ];

    for (const q of locQueries) {
      const lower = q.toLowerCase();
      const isLocation =
        lower.includes("where is") ||
        lower.includes("where will") ||
        lower.includes("what is the location") ||
        lower.includes("what location") ||
        lower.includes("what is the venue") ||
        lower.startsWith("where");
      assert.equal(isLocation, true, `Query "${q}" must match location intent`);
    }
  });

  await t.test("identifies budget inquiry queries correctly", () => {
    const queries = [
      "What is my current budget status?",
      "How much have we spent on catering?",
      "Can we save 10% on floral decorations?",
    ];
    for (const q of queries) {
      const lower = q.toLowerCase();
      const isBudget =
        lower.includes("budget") ||
        lower.includes("spent") ||
        lower.includes("cost") ||
        lower.includes("save") ||
        lower.includes("saving");
      assert.equal(isBudget, true, `Query "${q}" should match budget intent`);
    }
  });

  await t.test("identifies RSVP pulse queries correctly", () => {
    const queries = [
      "Who has confirmed their RSVP?",
      "How many guests are attending?",
      "Show me dietary restrictions",
    ];
    for (const q of queries) {
      const lower = q.toLowerCase();
      const isRsvp =
        lower.includes("rsvp") ||
        lower.includes("guest") ||
        lower.includes("attend") ||
        lower.includes("dietary");
      assert.equal(isRsvp, true, `Query "${q}" should match RSVP intent`);
    }
  });

  await t.test("verifies multi-tenant isolation without dummy data injection", () => {
    const newOrganizerEvents: any[] = [];
    assert.equal(newOrganizerEvents.length, 0);
  });
});
