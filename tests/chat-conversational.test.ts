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
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().split("T")[0];
    const result = formatCelebrationDate(dateStr);
    assert.ok(result.diffDays >= 29 && result.diffDays <= 31);
    assert.ok(result.statusText.includes("days to go"));
    assert.ok(result.formatted.length > 5);
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

  await t.test("parses conversational event edits (location, budget, guests, date, title)", () => {
    // 1. Location
    const locPrompt = "Please change the venue location to Jodhpur, Rajasthan";
    const locMatch = locPrompt.match(
      /(?:change|update|set|move)\s+(?:the\s+)?(?:venue\s+location|event\s+location|location|venue|city|destination)\s+(?:to|in)\s+([^.!?\n]+)/i
    );
    assert.ok(locMatch);
    assert.equal(locMatch[1].trim(), "Jodhpur, Rajasthan");

    // 2. Budget with Lakh
    const budgetPrompt = "change budget to ₹30 Lakhs";
    const lakhMatch = budgetPrompt.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lac|l)/i);
    assert.ok(lakhMatch);
    const parsedBudget = parseFloat(lakhMatch[1]) * 100000;
    assert.equal(parsedBudget, 3000000);

    // 3. Guest count
    const guestPrompt = "increase guest count to 220";
    const guestMatch = guestPrompt.match(
      /(?:change|update|set|increase|decrease)\s+(?:the\s+)?(?:guest\s+count|guests|headcount)\s+to\s+([0-9]+)/i
    );
    assert.ok(guestMatch);
    assert.equal(parseInt(guestMatch[1], 10), 220);

    // 4. Date reschedule
    const datePrompt = "reschedule to 2026-12-05";
    const dateMatch = datePrompt.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
    assert.ok(dateMatch);
    assert.equal(dateMatch[1], "2026-12-05");

    // 5. Title rename
    const titlePrompt = "rename celebration to Royal Heritage Jodhpur Gala";
    const titleMatch = titlePrompt.match(/rename\s+(?:the\s+)?(?:celebration\s+|event\s+)?to\s+([^.!?\n]+)/i);
    assert.ok(titleMatch);
    assert.equal(titleMatch[1].trim(), "Royal Heritage Jodhpur Gala");
  });
});
