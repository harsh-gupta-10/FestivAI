import { test, describe } from "node:test";
import assert from "node:assert";
import { getWeatherIntelligence } from "../lib/tools/weather.ts";
import { searchWebIntelligence } from "../lib/tools/web-search.ts";
import { getCurrencySymbol, formatCurrency } from "../lib/currency.ts";

describe("Autonomous Tools & Grounded Intelligence Suite", () => {
  test("getWeatherIntelligence returns complete climate report for Goa", async () => {
    const report = await getWeatherIntelligence("Goa, India", "2026-12-15");
    assert.ok(report, "Should return a report");
    assert.strictEqual(report.date, "2026-12-15");
    assert.ok(report.temperatureC.high > 20, "Tropical high temp should be > 20C");
    assert.ok(report.outdoorSuitabilityScore >= 1 && report.outdoorSuitabilityScore <= 10);
    assert.ok(Array.isArray(report.actionableAdvice), "Should include actionable advice");
    assert.ok(report.actionableAdvice.length > 0, "Should have advice items");
  });

  test("getWeatherIntelligence handles winter climate in London", async () => {
    const report = await getWeatherIntelligence("London, UK", "2026-12-20");
    assert.ok(report.temperatureC.high < 15, "London winter high should be cold (< 15C)");
    assert.ok(report.sunsetTime, "Should provide sunset estimate");
  });

  test("searchWebIntelligence returns grounded sources and synthesis", async () => {
    const report = await searchWebIntelligence("beach wedding venues in Goa");
    assert.strictEqual(report.query, "beach wedding venues in Goa");
    assert.ok(report.resultsCount > 0, "Should return results");
    assert.ok(report.sources.length > 0, "Should include sources");
    assert.ok(report.sources[0].url.startsWith("http"), "Should have valid HTTP URL");
    assert.ok(report.synthesis.length > 20, "Should include grounded synthesis");
  });

  test("currency formatting handles INR with ₹ and Lakh", () => {
    assert.strictEqual(getCurrencySymbol("INR"), "₹");
    const formatted = formatCurrency(500000, "INR");
    assert.ok(formatted.startsWith("₹"));
    assert.strictEqual(formatCurrency(1500000, "INR", { compact: true }), "₹15.0 L");
  });
});
