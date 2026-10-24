import { getFallbackD1, getFallbackR2 } from "./db-fallback.ts";

export interface AppBindings {
  DB: D1Database | any;
  BUCKET: R2Bucket | any;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  isFallback: boolean;
}

/**
 * Access Cloudflare D1 and R2 bindings safely.
 * In Cloudflare Workers: utilizes getCloudflareContext() from @opennextjs/cloudflare.
 * In local Next.js dev: falls back gracefully to in-memory D1 & R2 so the app never crashes.
 */
export async function getAppBindings(): Promise<AppBindings> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    
    if (ctx && ctx.env && ctx.env.DB) {
      return {
        DB: ctx.env.DB,
        BUCKET: ctx.env.BUCKET || getFallbackR2(),
        OPENAI_API_KEY: ctx.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
        GEMINI_API_KEY: (ctx.env as any).GEMINI_API_KEY || process.env.GEMINI_API_KEY,
        isFallback: false,
      };
    }
  } catch (err) {
    // getCloudflareContext threw or is not in a Cloudflare Workers environment
    // Silently fall back to in-memory database
  }

  // Fallback to in-memory SQLite and R2 mock for seamless local development
  return {
    DB: getFallbackD1() as any,
    BUCKET: getFallbackR2() as any,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    isFallback: true,
  };
}
