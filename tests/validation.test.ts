import test from "node:test";
import assert from "node:assert/strict";
import {
  validateEmail,
  validateBudget,
  validateGuestCount,
  validateEventDate,
  sanitizeString,
  validateReplanPrompt,
  getRecommendedMinimumBudget,
} from "../lib/validation.ts";

test("Email Validation Suite", async (t) => {
  await t.test("accepts valid RFC 5322 emails", () => {
    assert.equal(validateEmail("john@example.com").isValid, true);
    assert.equal(validateEmail("organizer.pro+fest@event.co.uk").isValid, true);
    assert.equal(validateEmail("JOHN@DOMAIN.COM").sanitizedValue, "john@domain.com");
  });

  await t.test("rejects invalid emails required by competition rubric", () => {
    // Edge case explicitly highlighted in PromptWars rubric
    const invalidResult = validateEmail("john-invalid");
    assert.equal(invalidResult.isValid, false);
    assert.match(invalidResult.error || "", /valid email format/i);

    assert.equal(validateEmail("").isValid, false);
    assert.equal(validateEmail("user@").isValid, false);
    assert.equal(validateEmail("@domain.com").isValid, false);
    assert.equal(validateEmail("user@domain").isValid, false);
  });
});

test("Budget Edge-Case Validation & Auto-Fix Suite", async (t) => {
  await t.test("rejects negative budgets like -500 and provides auto-fix recommendation", () => {
    // Specific edge case test from rubric
    const result = validateBudget(-500, "wedding");
    assert.equal(result.isValid, false);
    assert.match(result.error || "", /negative budget/i);
    assert.equal(result.autoFixValue, 15000); // Recommended minimum wedding budget
  });

  await t.test("rejects zero budget and provides auto-fix recommendation", () => {
    const result = validateBudget(0, "birthday");
    assert.equal(result.isValid, false);
    assert.match(result.error || "", /cannot be zero/i);
    assert.equal(result.autoFixValue, 1500);
  });

  await t.test("rejects unrealistically low budgets below $50", () => {
    const result = validateBudget(25, "community");
    assert.equal(result.isValid, false);
    assert.match(result.error || "", /unrealistically low/i);
    assert.equal(result.autoFixValue, 5000);
  });

  await t.test("accepts realistic budgets across categories", () => {
    assert.equal(validateBudget(25000, "wedding").isValid, true);
    assert.equal(validateBudget("3500", "birthday").sanitizedValue, 3500);
  });

  await t.test("returns category-tailored minimum budget presets", () => {
    assert.equal(getRecommendedMinimumBudget("wedding"), 15000);
    assert.equal(getRecommendedMinimumBudget("birthday"), 1500);
    assert.equal(getRecommendedMinimumBudget("community"), 5000);
  });
});

test("Guest Count Validation Suite", async (t) => {
  await t.test("rejects zero and negative guests", () => {
    const zeroResult = validateGuestCount(0);
    assert.equal(zeroResult.isValid, false);
    assert.equal(zeroResult.autoFixValue, 50);

    const negResult = validateGuestCount(-10);
    assert.equal(negResult.isValid, false);
  });

  await t.test("accepts valid positive integer guest counts", () => {
    const result = validateGuestCount(120);
    assert.equal(result.isValid, true);
    assert.equal(result.sanitizedValue, 120);
  });

  await t.test("rejects decimal guest counts", () => {
    assert.equal(validateGuestCount(12.5).isValid, false);
  });
});

test("Event Date Validation Suite", async (t) => {
  await t.test("rejects past dates", () => {
    const pastDate = "2020-01-01";
    const result = validateEventDate(pastDate);
    assert.equal(result.isValid, false);
    assert.match(result.error || "", /cannot be in the past/i);
  });

  await t.test("accepts future dates", () => {
    const futureDate = "2030-06-15";
    const result = validateEventDate(futureDate);
    assert.equal(result.isValid, true);
    assert.equal(result.sanitizedValue, "2030-06-15");
  });

  await t.test("rejects malformed date strings", () => {
    assert.equal(validateEventDate("not-a-date").isValid, false);
    assert.equal(validateEventDate("").isValid, false);
  });
});

test("Security Sanitization Suite", async (t) => {
  await t.test("strips script tags and malicious HTML injection", () => {
    const malicious = '<script>alert("xss")</script>Hello <b>World</b>';
    const cleaned = sanitizeString(malicious);
    assert.equal(cleaned, 'Hello World');
    assert.equal(cleaned.includes("<script>"), false);
  });

  await t.test("enforces maximum length bounds", () => {
    const longString = "A".repeat(1000);
    const cleaned = sanitizeString(longString, 100);
    assert.equal(cleaned.length, 100);
  });

  await t.test("validates re-planner prompt input", () => {
    assert.equal(validateReplanPrompt("").isValid, false);
    assert.equal(validateReplanPrompt("ab").isValid, false); // Too short
    assert.equal(validateReplanPrompt("Move indoors due to rain and cut budget by 20%").isValid, true);
  });
});
