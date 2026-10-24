-- FestivAI Cloudflare D1 Database Schema
-- Run locally: wrangler d1 execute festivai-db --local --file=./schema.sql
-- Run remote:  wrangler d1 execute festivai-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  organizer_name TEXT,
  organizer_email TEXT,
  event_type TEXT,
  title TEXT,
  event_date TEXT,
  location TEXT,
  guest_count INTEGER,
  total_budget REAL,
  currency TEXT,
  vibe TEXT,
  banner_r2_key TEXT,
  ai_plan_json TEXT,
  last_prompt TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS rsvps (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  guest_name TEXT,
  guest_email TEXT,
  status TEXT,
  attendees_count INTEGER,
  dietary_notes TEXT,
  message TEXT,
  created_at TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
