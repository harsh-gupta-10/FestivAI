import test from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, resetRateLimits, getClientIp } from "../lib/rate-limit.ts";

test("Sliding Window Rate Limiter Suite", async (t) => {
  t.beforeEach(() => {
    resetRateLimits();
  });

  await t.test("allows requests within configured threshold", () => {
    const key = "test-user-1";
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, { maxRequests: 5, windowMs: 10000 });
      assert.equal(result.allowed, true);
      assert.equal(result.remaining, 4 - i);
    }
  });

  await t.test("blocks requests exceeding threshold and returns retry info", () => {
    const key = "test-user-blocked";
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, { maxRequests: 3, windowMs: 5000 });
    }

    const blocked = checkRateLimit(key, { maxRequests: 3, windowMs: 5000 });
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.resetInMs > 0);
  });

  await t.test("isolates rate limits by distinct keys (multi-tenant protection)", () => {
    const userA = "ip-192.168.1.1";
    const userB = "ip-10.0.0.1";

    for (let i = 0; i < 2; i++) {
      checkRateLimit(userA, { maxRequests: 2, windowMs: 5000 });
    }

    // User A is blocked
    const resA = checkRateLimit(userA, { maxRequests: 2, windowMs: 5000 });
    assert.equal(resA.allowed, false);

    // User B should still be allowed
    const resB = checkRateLimit(userB, { maxRequests: 2, windowMs: 5000 });
    assert.equal(resB.allowed, true);
    assert.equal(resB.remaining, 1);
  });

  await t.test("extracts client IP from Cloudflare and proxy headers", () => {
    const cfReq = {
      headers: new Headers({
        "cf-connecting-ip": "203.0.113.195",
        "x-forwarded-for": "198.51.100.1, 203.0.113.195",
      }),
    };
    assert.equal(getClientIp(cfReq as any), "203.0.113.195");

    const xffReq = {
      headers: new Headers({
        "x-forwarded-for": "198.51.100.22, 10.0.0.1",
      }),
    };
    assert.equal(getClientIp(xffReq as any), "198.51.100.22");

    const fallbackReq = {
      headers: new Headers({}),
    };
    assert.equal(getClientIp(fallbackReq as any), "127.0.0.1");
  });
});
