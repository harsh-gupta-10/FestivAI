import { test, describe } from "node:test";
import assert from "node:assert";
import {
  getCurrencySymbol,
  formatCurrency,
  convertCurrency,
  getCurrencyMeta,
  SUPPORTED_CURRENCIES,
} from "../lib/currency.ts";

describe("Currency Engine & Symbol Resolution Suite", () => {
  test("resolves INR symbol as ₹", () => {
    assert.strictEqual(getCurrencySymbol("INR"), "₹");
    assert.strictEqual(getCurrencySymbol("inr"), "₹");
  });

  test("resolves standard global currency symbols", () => {
    assert.strictEqual(getCurrencySymbol("USD"), "$");
    assert.strictEqual(getCurrencySymbol("EUR"), "€");
    assert.strictEqual(getCurrencySymbol("GBP"), "£");
    assert.strictEqual(getCurrencySymbol("CAD"), "CA$");
    assert.strictEqual(getCurrencySymbol("AUD"), "A$");
    assert.strictEqual(getCurrencySymbol("JPY"), "¥");
  });

  test("formats INR with Indian comma separation and ₹ symbol", () => {
    const formatted = formatCurrency(250000, "INR");
    assert.ok(formatted.includes("₹"), "Should include ₹ symbol");
    // In en-IN 250,000 is 2,50,000
    assert.strictEqual(formatted, "₹2,50,000");
  });

  test("formats compact INR with Lakh and Crore", () => {
    assert.strictEqual(formatCurrency(1500000, "INR", { compact: true }), "₹15.0 L");
    assert.strictEqual(formatCurrency(25000000, "INR", { compact: true }), "₹2.5 Cr");
    assert.strictEqual(formatCurrency(50000, "INR", { compact: true }), "₹50k");
  });

  test("formats standard USD amounts", () => {
    assert.strictEqual(formatCurrency(32500, "USD"), "$32,500");
    assert.strictEqual(formatCurrency(32500, "USD", { compact: true }), "$33k");
  });

  test("converts currency with realistic benchmark rates", () => {
    const converted = convertCurrency(1000, "USD", "INR");
    assert.ok(converted > 80000 && converted < 90000, `Expected ~86500, got ${converted}`);
  });
});
