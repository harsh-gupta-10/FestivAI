import type { RateLimitResult } from "../types/index.ts";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window cache for rate limiting
const rateLimitMap = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  maxRequests?: number;
  windowSeconds?: number;
  windowMs?: number;
}

/**
 * Checks if a given identifier exceeds the rate limit.
 * Supports both options object or positional numbers.
 */
export function checkRateLimit(
  identifier: string,
  optionsOrMax: number | RateLimitOptions = 30,
  windowSecondsParam: number = 60
): RateLimitResult {
  let maxRequests = 30;
  let windowMs = 60 * 1000;

  if (typeof optionsOrMax === "object" && optionsOrMax !== null) {
    maxRequests = optionsOrMax.maxRequests ?? 30;
    if (optionsOrMax.windowMs) {
      windowMs = optionsOrMax.windowMs;
    } else if (optionsOrMax.windowSeconds) {
      windowMs = optionsOrMax.windowSeconds * 1000;
    }
  } else if (typeof optionsOrMax === "number") {
    maxRequests = optionsOrMax;
    windowMs = windowSecondsParam * 1000;
  }

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // If no record exists or window expired, reset
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetSeconds: windowSeconds,
      resetInMs: windowMs,
    };
  }

  // If record exists and within window
  const resetInMs = Math.max(0, record.resetTime - now);
  const remainingSeconds = Math.max(1, Math.ceil(resetInMs / 1000));

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: remainingSeconds,
      resetInMs,
      error: `Too many requests. Please wait ${remainingSeconds} second(s) before retrying.`,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetSeconds: remainingSeconds,
    resetInMs,
  };
}

/**
 * Resets the in-memory rate limit map (useful for test isolation)
 */
export function resetRateLimits(): void {
  rateLimitMap.clear();
}

/**
 * Extracts client IP safely from incoming Next.js Request headers
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",");
    if (ips[0]) return ips[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}
