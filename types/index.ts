import "@opennextjs/cloudflare";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    BUCKET: R2Bucket;
    OPENAI_API_KEY?: string;
    ASSETS?: Fetcher;
  }
}

export interface EventRecord {
  id: string;
  slug: string;
  organizer_name: string;
  organizer_email: string;
  event_type: "wedding" | "birthday" | "community" | "corporate" | "anniversary" | string;
  title: string;
  event_date: string;
  location: string;
  guest_count: number;
  total_budget: number;
  currency: string;
  vibe: string;
  banner_r2_key?: string | null;
  ai_plan_json: string;
  last_prompt?: string | null;
  created_at: string;
}

export interface RsvpRecord {
  id: string;
  event_id: string;
  guest_name: string;
  guest_email: string;
  status: "going" | "maybe" | "declined";
  attendees_count: number;
  dietary_notes?: string | null;
  message?: string | null;
  created_at: string;
}

export interface BudgetCategory {
  id: string;
  category: string;
  allocatedAmount: number;
  actualSpent: number;
  percentage: number;
  aiSavingTip: string;
}

export interface TimelineMilestone {
  id: string;
  timeframe: string;
  taskTitle: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
}

export interface VendorChecklistItem {
  id: string;
  vendorType: string;
  recommendedAction: string;
  questionsToAsk: string[];
  estimatedBudgetRange: string;
  booked: boolean;
}

export interface PersonalizedIdea {
  id: string;
  category: "Decor" | "Food & Drink" | "Music & Entertainment" | "Activities" | "Favors" | "Atmosphere";
  title: string;
  description: string;
  budgetImpact: "Low" | "Medium" | "High";
  diyPotential: boolean;
}

export interface PublicScheduleItem {
  id: string;
  time: string;
  activity: string;
  description: string;
}

export interface AIEventPlan {
  eventSummary: {
    tagline: string;
    themeColors: [string, string, string]; // 3 hex colors
    welcomeNote: string;
  };
  budgetBreakdown: BudgetCategory[];
  timeline: TimelineMilestone[];
  vendorChecklist: VendorChecklistItem[];
  personalizedIdeas: PersonalizedIdea[];
  publicSchedule: PublicScheduleItem[];
  genAiMetadata?: {
    model: string;
    generationTimeMs: number;
    promptUsed: string;
    rawResponseSnippet?: string;
    lastReplanNote?: string;
    changedFields?: string[];
  };
}
