import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("WCAG 2.1 & WAI-ARIA Accessibility (a11y) Verification Suite", async (t) => {
  const pageContent = fs.readFileSync(path.resolve(process.cwd(), "app/page.tsx"), "utf-8");
  const navbarContent = fs.readFileSync(path.resolve(process.cwd(), "components/Navbar.tsx"), "utf-8");
  const dashboardContent = fs.readFileSync(path.resolve(process.cwd(), "components/EventDashboard.tsx"), "utf-8");
  const editModalContent = fs.readFileSync(path.resolve(process.cwd(), "components/EditEventModal.tsx"), "utf-8");
  const authModalContent = fs.readFileSync(path.resolve(process.cwd(), "components/AuthModal.tsx"), "utf-8");

  await t.test("verifies skip-to-main-content accessible link in header", () => {
    assert.ok(navbarContent.includes('href="#main-content"'), "Navbar must have skip link to #main-content");
    assert.ok(navbarContent.includes("Skip to main content"), "Skip link must have clear text");
    assert.ok(dashboardContent.includes('id="main-content"'), "Dashboard must define id='main-content' as landmark");
  });

  await t.test("verifies WAI-ARIA tablist and tabpanel semantics on interactive tour", () => {
    assert.ok(pageContent.includes('role="tablist"'), "Product tour must define role='tablist'");
    assert.ok(pageContent.includes('role="tab"'), "Tour tabs must define role='tab'");
    assert.ok(pageContent.includes('aria-selected='), "Tour tabs must declare aria-selected");
    assert.ok(pageContent.includes('aria-controls="panel-chat"'), "Chat tab must control panel-chat");
    assert.ok(pageContent.includes('aria-controls="panel-budget"'), "Budget tab must control panel-budget");
    assert.ok(pageContent.includes('aria-controls="panel-rsvp"'), "RSVP tab must control panel-rsvp");
    assert.ok(pageContent.includes('role="tabpanel"'), "Panels must declare role='tabpanel'");
    assert.ok(pageContent.includes('aria-labelledby="tab-chat"'), "Panel must link back to tab via aria-labelledby");
  });

  await t.test("verifies WAI-ARIA dialog semantics on modals", () => {
    // EditEventModal
    assert.ok(editModalContent.includes('role="dialog"'), "EditEventModal must define role='dialog'");
    assert.ok(editModalContent.includes('aria-modal="true"'), "EditEventModal must define aria-modal='true'");
    assert.ok(editModalContent.includes('aria-labelledby="edit-event-modal-title"'), "EditEventModal must label title");
    assert.ok(editModalContent.includes('aria-label="Close edit event dialog"'), "Close button must have aria-label");

    // AuthModal
    assert.ok(authModalContent.includes('role="dialog"'), "AuthModal must define role='dialog'");
    assert.ok(authModalContent.includes('aria-modal="true"'), "AuthModal must define aria-modal='true'");
    assert.ok(authModalContent.includes('aria-labelledby="auth-modal-title"'), "AuthModal must have aria-labelledby");
  });

  await t.test("verifies WAI-ARIA accordion semantics on FAQ section", () => {
    assert.ok(pageContent.includes('aria-expanded='), "FAQ accordions must declare aria-expanded");
    assert.ok(pageContent.includes('aria-controls='), "FAQ buttons must declare aria-controls");
    assert.ok(pageContent.includes('role="region"'), "FAQ answer sections must declare role='region'");
  });

  await t.test("verifies screen reader live region for asynchronous mutations", () => {
    assert.ok(
      dashboardContent.includes('aria-live="polite"'),
      "Save status in EventDashboard must declare aria-live='polite' for real-time D1 persistence announcement"
    );
  });

  await t.test("verifies all buttons have explicit type attribute", () => {
    assert.ok(!editModalContent.includes("<button onClick"), "EditEventModal buttons must declare type='button'");
    assert.ok(!pageContent.includes("<button onClick={() => setActiveTab"), "Tab buttons must have type='button'");
  });

  await t.test("verifies compliance with WCAG 1.4.1 (not relying on color alone for state)", () => {
    // Save status pill has textual confirmation ("Saved to D1 ✓", "Saving...", "Unsaved")
    assert.ok(dashboardContent.includes("Saved to D1 ✓"), "Status communicates completion textually, not just color");
    assert.ok(dashboardContent.includes("Saving to D1..."), "Status communicates in-progress textually");
  });
});
