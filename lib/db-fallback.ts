interface StoredRow {
  [key: string]: any;
}

class MockD1PreparedStatement {
  private sql: string;
  private params: any[];
  private db: MockD1Database;

  constructor(sql: string, db: MockD1Database, params: any[] = []) {
    this.sql = sql;
    this.db = db;
    this.params = params;
  }

  bind(...values: any[]) {
    return new MockD1PreparedStatement(this.sql, this.db, values);
  }

  async first<T = Record<string, any>>(colName?: string): Promise<T | null> {
    const res = await this.all<T>();
    if (!res.results || res.results.length === 0) return null;
    if (colName) {
      return (res.results[0] as any)[colName] ?? null;
    }
    return res.results[0];
  }

  async all<T = Record<string, any>>(): Promise<{ results: T[]; success: boolean; meta: any }> {
    const results = this.db.executeQuery<T>(this.sql, this.params);
    return {
      results,
      success: true,
      meta: { duration: 1, changes: 0, last_row_id: 1, served_by: "in-memory-fallback" },
    };
  }

  async run(): Promise<{ success: boolean; meta: any }> {
    const changes = this.db.executeMutation(this.sql, this.params);
    return {
      success: true,
      meta: { duration: 1, changes, last_row_id: 1, served_by: "in-memory-fallback" },
    };
  }
}

export class MockD1Database {
  private events: Map<string, StoredRow> = new Map();
  private rsvps: Map<string, StoredRow> = new Map();

  constructor() {}

  prepare(query: string) {
    return new MockD1PreparedStatement(query, this);
  }

  executeQuery<T>(sql: string, params: any[]): T[] {
    const cleanSql = sql.trim().toLowerCase();

    // SELECT from events WHERE id = ? OR slug = ?
    if (cleanSql.includes("from events")) {
      const allEvents = Array.from(this.events.values());
      if (cleanSql.includes("where id = ? or slug = ?") || (cleanSql.includes("where id = ?") && cleanSql.includes("or slug = ?"))) {
        const queryVal = params[0] || params[1];
        const match = allEvents.find((e) => e.id === queryVal || e.slug === queryVal);
        return match ? ([match] as unknown as T[]) : [];
      }
      if (cleanSql.includes("where id = ?")) {
        const id = params[0];
        const match = this.events.get(id);
        return match ? ([match] as unknown as T[]) : [];
      }
      if (cleanSql.includes("where slug = ?")) {
        const slug = params[0];
        const match = allEvents.find((e) => e.slug === slug);
        return match ? ([match] as unknown as T[]) : [];
      }
      if (cleanSql.includes("where organizer_email = ?")) {
        const email = params[0];
        const matches = allEvents.filter((e) => e.organizer_email === email);
        return matches.length > 0 ? (matches as unknown as T[]) : (allEvents as unknown as T[]);
      }
      return allEvents as unknown as T[];
    }

    // SELECT from rsvps WHERE event_id = ?
    if (cleanSql.includes("from rsvps")) {
      const allRsvps = Array.from(this.rsvps.values());
      if (cleanSql.includes("where event_id = ?")) {
        const eventId = params[0];
        const filtered = allRsvps.filter((r) => r.event_id === eventId);
        filtered.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
        return filtered as unknown as T[];
      }
      return allRsvps as unknown as T[];
    }

    return [];
  }

  executeMutation(sql: string, params: any[]): number {
    const cleanSql = sql.trim().toLowerCase();

    // INSERT INTO events
    if (cleanSql.startsWith("insert into events")) {
      const [id, slug, organizer_name, organizer_email, event_type, title, event_date, location, guest_count, total_budget, currency, vibe, banner_r2_key, ai_plan_json, last_prompt, created_at] = params;
      this.events.set(id, {
        id,
        slug,
        organizer_name,
        organizer_email,
        event_type,
        title,
        event_date,
        location,
        guest_count,
        total_budget,
        currency,
        vibe,
        banner_r2_key,
        ai_plan_json,
        last_prompt,
        created_at: created_at || new Date().toISOString(),
      });
      return 1;
    }

    // UPDATE events SET ...
    if (cleanSql.startsWith("update events")) {
      // Find event ID
      const eventId = params[params.length - 1];
      const existing = this.events.get(eventId);
      if (existing) {
        if (cleanSql.includes("ai_plan_json = ?") && cleanSql.includes("last_prompt = ?")) {
          existing.ai_plan_json = params[0];
          existing.last_prompt = params[1];
        } else if (cleanSql.includes("ai_plan_json = ?")) {
          existing.ai_plan_json = params[0];
        }
        if (cleanSql.includes("banner_r2_key = ?")) {
          existing.banner_r2_key = params[0];
        }
        if (cleanSql.includes("currency = ?") && cleanSql.includes("total_budget = ?")) {
          existing.total_budget = Number(params[0]) || existing.total_budget;
          existing.currency = String(params[1]).toUpperCase().trim();
        } else if (cleanSql.includes("currency = ?")) {
          existing.currency = String(params[0]).toUpperCase().trim();
        } else if (cleanSql.includes("total_budget = ?")) {
          existing.total_budget = Number(params[0]) || existing.total_budget;
        }
        this.events.set(eventId, existing);
        return 1;
      }
      return 0;
    }

    // INSERT INTO rsvps
    if (cleanSql.startsWith("insert into rsvps")) {
      const [id, event_id, guest_name, guest_email, status, attendees_count, dietary_notes, message, created_at] = params;
      this.rsvps.set(id, {
        id,
        event_id,
        guest_name,
        guest_email,
        status,
        attendees_count: Number(attendees_count) || 1,
        dietary_notes,
        message,
        created_at: created_at || new Date().toISOString(),
      });
      return 1;
    }

    // DELETE from rsvps
    if (cleanSql.startsWith("delete from rsvps")) {
      const rsvpId = params[0];
      const existed = this.rsvps.delete(rsvpId);
      return existed ? 1 : 0;
    }

    return 0;
  }
}

// In-memory mock for Cloudflare R2
export class MockR2Bucket {
  private storage: Map<string, { data: Uint8Array; contentType?: string }> = new Map();

  async put(key: string, value: any, options?: { httpMetadata?: { contentType?: string } }) {
    let data: Uint8Array;
    if (value instanceof Uint8Array) {
      data = value;
    } else if (value instanceof ArrayBuffer) {
      data = new Uint8Array(value);
    } else if (typeof value === "string") {
      data = new TextEncoder().encode(value);
    } else if (value && typeof value.arrayBuffer === "function") {
      const ab = await value.arrayBuffer();
      data = new Uint8Array(ab);
    } else {
      data = new Uint8Array();
    }

    this.storage.set(key, {
      data,
      contentType: options?.httpMetadata?.contentType || "application/octet-stream",
    });

    return {
      key,
      size: data.byteLength,
      etag: "mock-etag-" + Date.now(),
    };
  }

  async get(key: string) {
    const item = this.storage.get(key);
    if (!item) return null;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(item.data);
        controller.close();
      },
    });

    return {
      key,
      size: item.data.byteLength,
      httpMetadata: {
        contentType: item.contentType,
      },
      arrayBuffer: async () => item.data.buffer,
      text: async () => new TextDecoder().decode(item.data),
      body: stream,
    };
  }

  async delete(key: string) {
    this.storage.delete(key);
  }
}

// Singleton instances for node dev server
let globalFallbackDb: MockD1Database | null = null;
let globalFallbackR2: MockR2Bucket | null = null;

export function getFallbackD1(): MockD1Database {
  if (!globalFallbackDb) {
    globalFallbackDb = new MockD1Database();
  }
  return globalFallbackDb;
}

export function getFallbackR2(): MockR2Bucket {
  if (!globalFallbackR2) {
    globalFallbackR2 = new MockR2Bucket();
  }
  return globalFallbackR2;
}
