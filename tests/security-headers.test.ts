import test from "node:test";
import assert from "node:assert/strict";

test("Security Headers & CSP Hardening Suite", async (t) => {
  // Read and verify next.config.mjs headers configuration
  const nextConfigModule = await import("../next.config.mjs");
  const nextConfig = nextConfigModule.default;

  assert.ok(typeof nextConfig.headers === "function", "nextConfig must define a headers function");

  const headerRules = await nextConfig.headers();
  assert.ok(Array.isArray(headerRules), "headers() must return an array of route header configurations");

  const catchAllRule = headerRules.find(
    (rule: any) => rule.source === "/(.*)" || rule.source === "/:path*"
  );
  assert.ok(catchAllRule, "Must have a global catch-all /(.*) or /:path* security header rule");

  const headersMap = new Map<string, string>();
  for (const h of catchAllRule.headers) {
    headersMap.set(h.key.toLowerCase(), h.value);
  }

  await t.test("enforces strict Content-Security-Policy (CSP)", () => {
    const csp = headersMap.get("content-security-policy");
    assert.ok(csp, "Content-Security-Policy header must be present");
    assert.ok(csp.includes("default-src 'self'"), "CSP must restrict default-src to 'self'");
    assert.ok(csp.includes("script-src 'self'"), "CSP must restrict script-src");
    assert.ok(csp.includes("https://apis.google.com"), "CSP must allow Google Auth scripts");
    assert.ok(csp.includes("connect-src 'self'"), "CSP must restrict connect-src");
    assert.ok(csp.includes("https://identitytoolkit.googleapis.com"), "CSP must allow Firebase Identity Toolkit");
    assert.ok(csp.includes("https://api.openai.com"), "CSP must allow OpenAI completions");
    assert.ok(csp.includes("object-src 'none'"), "CSP must block plugin objects");
    assert.ok(csp.includes("frame-ancestors 'none'"), "CSP must prohibit clickjacking via frame-ancestors");
  });

  await t.test("enforces production-grade HSTS with includeSubDomains and preload", () => {
    const hsts = headersMap.get("strict-transport-security");
    assert.ok(hsts, "Strict-Transport-Security header must be present");
    assert.ok(hsts.includes("max-age=63072000"), "HSTS max-age must be at least 2 years (63072000s)");
    assert.ok(hsts.includes("includeSubDomains"), "HSTS must include all subdomains");
    assert.ok(hsts.includes("preload"), "HSTS must include preload directive");
  });

  await t.test("enforces X-Content-Type-Options nosniff and frame protection", () => {
    assert.equal(headersMap.get("x-content-type-options"), "nosniff");
    assert.equal(headersMap.get("x-frame-options"), "DENY");
    assert.equal(headersMap.get("referrer-policy"), "strict-origin-when-cross-origin");
  });

  await t.test("enforces Cross-Origin-Opener-Policy for secure OAuth popups", () => {
    const coop = headersMap.get("cross-origin-opener-policy");
    assert.ok(coop, "Cross-Origin-Opener-Policy must be set");
    assert.equal(coop, "same-origin-allow-popups");
  });

  await t.test("restricts browser hardware capabilities via Permissions-Policy", () => {
    const perm = headersMap.get("permissions-policy");
    assert.ok(perm, "Permissions-Policy must be set");
    assert.ok(perm.includes("camera=()"), "Camera must be denied by default");
    assert.ok(perm.includes("microphone=()"), "Microphone must be denied by default");
    assert.ok(perm.includes("geolocation=()"), "Geolocation must be denied by default");
  });
});
