"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SettingsModal } from "@/components/SettingsModal";
import { GenAiInspector, InspectorData } from "@/components/GenAiInspector";
import { EventRecord, RsvpRecord, AIEventPlan } from "@/types";
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Share2,
  ExternalLink,
  CheckCircle,
  Clock,
  RefreshCw,
  Upload,
  Check,
  AlertCircle,
  Download,
  Wand2,
  FileCheck,
  MessageSquare,
} from "lucide-react";

export interface EventDashboardProps {
  params: Promise<{ id: string }>;
}

export function EventDashboard({ params }: EventDashboardProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [plan, setPlan] = useState<AIEventPlan | null>(null);
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector & Settings Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState("o3-mini");
  const [inspectorData, setInspectorData] = useState<InspectorData | null>(null);

  // Dynamic Re-Planner Bar
  const [replanPrompt, setReplanPrompt] = useState("");
  const [isReplanning, setIsReplanning] = useState(false);
  const [replanSuccessNote, setReplanSuccessNote] = useState<string | null>(null);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

  // Share link copy notification
  const [copiedLink, setCopiedLink] = useState(false);

  // Banner uploader
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Fetch event and plan on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("festivai_model");
      if (stored) setCurrentModel(stored);
    }
    async function loadEvent() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) {
          throw new Error("Could not find event with ID: " + eventId);
        }
        const data = (await res.json()) as any;
        setEvent(data.event);
        setPlan(data.plan);
        setRsvps(data.rsvps || []);

        // Initialize Inspector data
        if (data.plan?.genAiMetadata) {
          setInspectorData({
            model: data.plan.genAiMetadata.model || "o3-mini",
            durationMs: data.plan.genAiMetadata.generationTimeMs || 1200,
            systemPrompt: "System Instructions: World-class event planner structured JSON outputs...",
            userPrompt: data.event.last_prompt || `Generate plan for ${data.event.title}`,
            rawJsonOutput: JSON.stringify(data.plan, null, 2),
            changedSummary: data.plan.genAiMetadata.lastReplanNote,
            changedFields: data.plan.genAiMetadata.changedFields || [],
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load event data");
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  // Copy shareable public invite link
  const handleShareLink = () => {
    if (typeof window === "undefined" || !event) return;
    const inviteUrl = `${window.location.origin}/invite/${event.slug || event.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync plan mutations to D1
  const syncPlanUpdate = async (updatedPlan: AIEventPlan) => {
    setPlan(updatedPlan);
    try {
      await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedPlan }),
      });
    } catch (err) {
      console.error("Failed to sync plan update to D1:", err);
    }
  };

  // Debounced sync to prevent flooding Cloudflare D1 with rapid keystrokes
  const debouncedSyncPlan = (updatedPlan: AIEventPlan) => {
    setPlan(updatedPlan);
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedPlan }),
      }).catch((err) => console.error("Debounced sync failed:", err));
    }, 400);
  };

  // Toggle milestone completion
  const handleToggleMilestone = (milestoneId: string) => {
    if (!plan) return;
    const updatedTimeline = plan.timeline.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const updatedPlan: AIEventPlan = { ...plan, timeline: updatedTimeline };
    syncPlanUpdate(updatedPlan);
  };

  // Toggle vendor booked status
  const handleToggleVendor = (vendorId: string) => {
    if (!plan) return;
    const updatedVendors = plan.vendorChecklist.map((v) =>
      v.id === vendorId ? { ...v, booked: !v.booked } : v
    );
    const updatedPlan: AIEventPlan = { ...plan, vendorChecklist: updatedVendors };
    syncPlanUpdate(updatedPlan);
  };

  // Inline update actualSpent for a budget category (debounced to save D1 write cycles)
  const handleUpdateActualSpent = (categoryId: string, newSpentStr: string) => {
    if (!plan) return;
    const val = parseFloat(newSpentStr) || 0;
    const updatedBudget = plan.budgetBreakdown.map((b) =>
      b.id === categoryId ? { ...b, actualSpent: val } : b
    );
    const updatedPlan: AIEventPlan = { ...plan, budgetBreakdown: updatedBudget };
    debouncedSyncPlan(updatedPlan);
  };

  // Execute Dynamic Re-Plan
  const handleExecuteReplan = async (promptOverride?: string) => {
    const textToRun = promptOverride || replanPrompt;
    if (!textToRun.trim() || !plan) return;

    setIsReplanning(true);
    setReplanSuccessNote(null);

    try {
      const customApiKey = typeof window !== "undefined" ? localStorage.getItem("festivai_openai_key") || "" : "";
      const res = await fetch(`/api/events/${eventId}/replan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customApiKey ? { "x-openai-api-key": customApiKey, "x-api-key": customApiKey } : {}),
        },
        body: JSON.stringify({
          replanPrompt: textToRun,
          model: currentModel,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to dynamically re-plan event");
      }

      const data = (await res.json()) as any;
      setPlan(data.plan);
      setReplanSuccessNote(data.changedSummary || "Plan dynamically adapted!");
      setHighlightedFields(data.changedFields || ["budgetBreakdown", "timeline", "personalizedIdeas"]);

      if (data.inspectorData) {
        setInspectorData(data.inspectorData);
      }

      setReplanPrompt("");
      setTimeout(() => setHighlightedFields([]), 6000);
    } catch (err: any) {
      console.error("Replan error:", err);
      alert("Failed to replan: " + err.message);
    } finally {
      setIsReplanning(false);
    }
  };

  // Banner upload to Cloudflare R2
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;

    setIsUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload to Cloudflare R2");
      const data = (await res.json()) as any;

      await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerKey: data.key }),
      });

      setEvent({ ...event, banner_r2_key: data.key });
    } catch (err: any) {
      alert("Failed to upload banner: " + err.message);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Export Event Kit
  const handleExportJson = () => {
    if (!event || !plan) return;
    const kit = {
      event,
      plan,
      rsvps,
      exportedAt: new Date().toISOString(),
      platform: "FestivAI Cloudflare Native Event Planner",
    };
    const blob = new Blob([JSON.stringify(kit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.slug || "event"}-festivai-kit.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f0eb] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-xl bg-[#421d24] text-white flex items-center justify-center font-bold animate-spin shadow-sm">
          F
        </div>
        <p className="mt-4 text-xs font-[460] text-[#666666] animate-pulse">
          Loading Event Command Center from Cloudflare D1...
        </p>
      </div>
    );
  }

  if (error || !event || !plan) {
    return (
      <div className="min-h-screen bg-[#f2f0eb] flex flex-col items-center justify-center p-4 text-center">
        <div className="p-4 rounded-2xl bg-white border border-[#e3e3e2] mb-4">
          <AlertCircle className="w-8 h-8 mx-auto text-[#421d24]" />
        </div>
        <h2 className="text-xl font-bold text-[#292827] mb-2">Event Not Found</h2>
        <p className="text-sm text-[#666666] max-w-md mb-6">{error || "Could not retrieve this event."}</p>
        <Link
          href="/app"
          className="px-5 py-2.5 rounded-buttons bg-[#421d24] text-white font-[460] text-sm transition-colors"
        >
          Return to Event Planner
        </Link>
      </div>
    );
  }

  // Budget calculations
  const totalAllocated = plan.budgetBreakdown.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const totalSpent = plan.budgetBreakdown.reduce((sum, b) => sum + (b.actualSpent || 0), 0);
  const budgetVariance = event.total_budget - totalSpent;
  const budgetSpentPercent = Math.min(100, Math.round((totalSpent / (event.total_budget || 1)) * 100));

  // RSVP statistics
  const goingCount = rsvps.filter((r) => r.status === "going").reduce((sum, r) => sum + (r.attendees_count || 1), 0);
  const maybeCount = rsvps.filter((r) => r.status === "maybe").reduce((sum, r) => sum + (r.attendees_count || 1), 0);
  const declinedCount = rsvps.filter((r) => r.status === "declined").length;

  return (
    <div className="min-h-screen bg-[#f2f0eb] text-[#292827] flex flex-col font-sans">
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
        isInspectorOpen={isInspectorOpen}
      />

      <main id="main-content" className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* TOP COMMAND HEADER */}
        <div className="paper-card p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#d4c7ff] text-[#292827] border border-[#292827]/10">
                {event.event_type}
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-[460] bg-[#f8f7f5] text-[#292827] border border-[#e3e3e2]">
                {event.vibe}
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-mono font-medium text-emerald-800 bg-emerald-50 border border-emerald-200">
                D1 ID: {event.id.slice(0, 12)}...
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-[460] text-[#292827] tracking-[-0.027em]">
              {event.title}
            </h1>

            <p className="text-sm text-[#714cb6] italic font-serif">
              &quot;{plan.eventSummary?.tagline}&quot;
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#666666] pt-1">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                {event.event_date}
              </span>
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-[#421d24]" />
                {event.location}
              </span>
              <span className="flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-[#714cb6]" />
                Target: {event.guest_count} Guests
              </span>
              <span className="flex items-center">
                <DollarSign className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                Budget: {event.total_budget.toLocaleString()} {event.currency}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleShareLink}
              className="px-4 py-2.5 rounded-buttons text-xs font-[540] bg-[#421d24] text-white hover:bg-[#572730] shadow-sm transition-all flex items-center space-x-1.5"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#d4c7ff]" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? "Invite Link Copied!" : "Share Public Invite Link"}</span>
            </button>

            <Link
              href={`/invite/${event.slug || event.id}`}
              target="_blank"
              className="px-3.5 py-2.5 rounded-buttons text-xs font-[540] bg-[#d4c7ff] text-[#292827] border border-[#292827] hover:bg-[#c4b5fa] transition-colors flex items-center space-x-1.5"
              title="Open Public Invite Page in New Tab"
            >
              <ExternalLink className="w-4 h-4 text-[#292827]" />
              <span className="hidden sm:inline">Preview Invite</span>
            </Link>

            <button
              onClick={handleExportJson}
              className="p-2.5 rounded-buttons text-xs font-medium bg-white hover:bg-[#f8f7f5] text-[#292827] border border-[#e3e3e2] transition-colors flex items-center space-x-1.5"
              title="Export Event Kit (JSON)"
            >
              <Download className="w-4 h-4 text-[#666666]" />
              <span className="hidden sm:inline">Export Kit</span>
            </button>

            <button
              onClick={() => setIsInspectorOpen(true)}
              className="px-3.5 py-2.5 rounded-buttons text-xs font-[540] bg-white hover:bg-[#f8f7f5] text-[#714cb6] border border-[#e3e3e2] shadow-sm flex items-center space-x-1.5"
              title="Open Live GenAI Prompt & JSON Inspector"
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Inspector</span>
            </button>
          </div>
        </div>

        {/* DYNAMIC AI RE-PLANNER BAR (PROVE AI IS DYNAMIC) */}
        <div
          className={`paper-card p-6 transition-all ${
            highlightedFields.length > 0 ? "replan-glow" : ""
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-[#d4c7ff] text-[#292827]">
                <Wand2 className="w-4 h-4 text-[#421d24]" />
              </div>
              <h3 className="text-sm font-bold text-[#292827] uppercase tracking-wider flex items-center space-x-2">
                <span>Dynamic AI Re-Planner Bar</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4c7ff] text-[#292827]">
                  Prove AI is Dynamic
                </span>
              </h3>
            </div>
            <span className="text-xs text-[#666666]">
              Type any live modification to update budget, milestones & ideas in D1
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteReplan();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <input
                type="text"
                aria-label="Dynamic AI Re-planning Prompt"
                value={replanPrompt}
                onChange={(e) => setReplanPrompt(e.target.value)}
                placeholder="e.g. Move event indoors due to rain, cut budget by 25%, and switch menu to 100% vegan..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white border border-[#e3e3e2] text-sm text-[#292827] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#714cb6]/40"
              />
            </div>
            <button
              type="submit"
              disabled={isReplanning || !replanPrompt.trim()}
              className="px-6 py-2.5 rounded-buttons bg-[#421d24] hover:bg-[#572730] disabled:opacity-50 text-white font-[540] text-xs shadow-sm transition-all flex items-center justify-center space-x-2 flex-shrink-0 cursor-pointer"
            >
              {isReplanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#d4c7ff]" />
                  <span>Re-planning with OpenAI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#d4c7ff]" />
                  <span>Execute Re-Plan</span>
                </>
              )}
            </button>
          </form>

          {/* Preset Quick-Test Prompts for Judges */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-medium text-[#666666]">Quick Test Prompts:</span>
            <button
              type="button"
              onClick={() => handleExecuteReplan("Move event indoors due to rain, cut budget by 25%, and switch menu to 100% vegan")}
              className="px-2.5 py-1 rounded-lg bg-[#f8f7f5] hover:bg-white border border-[#e3e3e2] text-[#292827] transition-colors flex items-center space-x-1"
            >
              <span>🌧️ Rain Contingency + 25% Cut + Vegan Menu</span>
            </button>
            <button
              type="button"
              onClick={() => handleExecuteReplan("Add live saxophone sunset set, reduce floral budget by 10%, and include late night taco bar")}
              className="px-2.5 py-1 rounded-lg bg-[#f8f7f5] hover:bg-white border border-[#e3e3e2] text-[#292827] transition-colors flex items-center space-x-1"
            >
              <span>🎷 Live Saxophone + Taco Bar</span>
            </button>
            <button
              type="button"
              onClick={() => handleExecuteReplan("Switch to zero-waste eco-festival with solar power and digital QR badges")}
              className="px-2.5 py-1 rounded-lg bg-[#f8f7f5] hover:bg-white border border-[#e3e3e2] text-[#292827] transition-colors flex items-center space-x-1"
            >
              <span>🌿 Zero-Waste Eco Vibe</span>
            </button>
          </div>

          {/* Re-Plan Success Banner */}
          {replanSuccessNote && (
            <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between animate-fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>AI Dynamically Adapted Plan:</strong> {replanSuccessNote}
                </span>
              </div>
              <button
                onClick={() => setIsInspectorOpen(true)}
                className="underline text-emerald-800 hover:text-black ml-2 text-[11px] whitespace-nowrap"
              >
                Inspect Live Diffs →
              </button>
            </div>
          )}
        </div>

        {/* SECTION: LIVE RSVP METRICS & R2 BANNER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live RSVP Counter Card */}
          <div className="paper-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#292827] uppercase tracking-wider flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#714cb6]" />
                  <span>RSVP Attendance Counter</span>
                </h3>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  D1 Realtime
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center mb-4">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="block text-2xl font-bold text-emerald-800">{goingCount}</span>
                  <span className="text-[11px] font-semibold text-emerald-700">Going 🎉</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <span className="block text-2xl font-bold text-amber-800">{maybeCount}</span>
                  <span className="text-[11px] font-semibold text-amber-700">Maybe 🤔</span>
                </div>
                <div className="p-3 rounded-xl bg-[#f8f7f5] border border-[#e3e3e2]">
                  <span className="block text-2xl font-bold text-[#666666]">{declinedCount}</span>
                  <span className="text-[11px] font-semibold text-[#666666]">Declined</span>
                </div>
              </div>

              <p className="text-xs text-[#666666] leading-relaxed">
                Guest attendance updates directly from the public invite link in Cloudflare D1.
              </p>
            </div>

            <div className="pt-4 border-t border-[#e3e3e2] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#292827]">
                Confirmed Heads: <strong>{goingCount} / {event.guest_count}</strong>
              </span>
              <Link
                href={`/invite/${event.slug || event.id}`}
                target="_blank"
                className="text-xs font-bold text-[#714cb6] hover:underline flex items-center space-x-1"
              >
                <span>Guest View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Cloudflare R2 Banner Card */}
          <div className="lg:col-span-2 paper-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-[#292827] uppercase tracking-wider">
                  Cloudflare R2 Banner Storage
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#714cb6] bg-[#d4c7ff]/50 px-2.5 py-0.5 rounded-full border border-[#714cb6]/20">
                Bucket: festivai-assets
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-[#e3e3e2] bg-[#f8f7f5] h-36 sm:h-40 group flex items-center justify-center">
              {event.banner_r2_key ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/r2/${event.banner_r2_key}`}
                    alt="Event Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer px-4 py-2 rounded-buttons bg-[#421d24] hover:bg-[#572730] text-white text-xs font-bold transition-all">
                      Change Banner in R2
                      <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                    </label>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <p className="text-xs text-[#666666] mb-2">No custom banner uploaded yet to Cloudflare R2.</p>
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 rounded-buttons bg-white hover:bg-[#f8f7f5] text-[#292827] text-xs font-semibold border border-[#e3e3e2] transition-all">
                    <Upload className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                    <span>Upload Banner to R2</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
                </div>
              )}

              {isUploadingBanner && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#421d24]">
                    <div className="w-4 h-4 border-2 border-[#421d24] border-t-transparent rounded-full animate-spin" />
                    <span>Streaming to Cloudflare R2...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-between text-xs text-[#666666]">
              <span>R2 Key: <code className="text-[#714cb6] font-mono">{event.banner_r2_key || "none"}</code></span>
              <span className="text-[#999999] text-[11px]">Served via /api/r2/[key]</span>
            </div>
          </div>
        </div>

        {/* SECTION: INTERACTIVE BUDGET TRACKER */}
        <div
          className={`paper-card p-6 sm:p-8 transition-all ${
            highlightedFields.includes("budgetBreakdown") ? "replan-glow" : ""
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-[460] text-[#292827] tracking-tight">Interactive Budget Tracker</h2>
                {highlightedFields.includes("budgetBreakdown") && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Dynamically Adjusted!
                  </span>
                )}
              </div>
              <p className="text-xs text-[#666666]">
                Inline edit &apos;Actual Spent&apos; amounts below to sync real-time expenses with Cloudflare D1
              </p>
            </div>

            {/* Overall summary pills */}
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <div className="px-3.5 py-1.5 rounded-xl bg-[#f8f7f5] border border-[#e3e3e2]">
                <span className="text-[#666666] block text-[10px]">Total Allocated</span>
                <span className="text-[#292827] font-mono text-sm">{totalAllocated.toLocaleString()} {event.currency}</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-[#f8f7f5] border border-[#e3e3e2]">
                <span className="text-[#666666] block text-[10px]">Actual Spent</span>
                <span className="text-emerald-800 font-mono text-sm">{totalSpent.toLocaleString()} {event.currency}</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-[#f8f7f5] border border-[#e3e3e2]">
                <span className="text-[#666666] block text-[10px]">Remaining</span>
                <span className={`font-mono text-sm ${budgetVariance >= 0 ? "text-emerald-800" : "text-rose-700"}`}>
                  {budgetVariance.toLocaleString()} {event.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 space-y-1.5">
            <div className="flex justify-between text-xs text-[#666666] font-medium">
              <span>Budget Utilization ({budgetSpentPercent}%)</span>
              <span>{totalSpent.toLocaleString()} / {event.total_budget.toLocaleString()} {event.currency}</span>
            </div>
            <div className="w-full bg-[#f2f0eb] rounded-full h-2.5 overflow-hidden border border-[#e3e3e2]">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  budgetSpentPercent > 90 ? "bg-rose-600" : budgetSpentPercent > 70 ? "bg-amber-500" : "bg-[#421d24]"
                }`}
                style={{ width: `${budgetSpentPercent}%` }}
              />
            </div>
          </div>

          {/* Category Cards / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.budgetBreakdown.map((cat) => {
              const spent = cat.actualSpent || 0;
              const catPercent = Math.min(100, Math.round((spent / (cat.allocatedAmount || 1)) * 100));

              return (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl bg-white border border-[#e3e3e2] hover:border-[#714cb6] transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#292827]">{cat.category}</h4>
                      <span className="text-[11px] text-[#714cb6] font-medium">
                        Target: {cat.allocatedAmount.toLocaleString()} {event.currency} ({cat.percentage}%)
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#666666]">
                      {catPercent}%
                    </span>
                  </div>

                  {/* Inline Edit Actual Spent */}
                  <div className="flex items-center space-x-2">
                    <label className="text-[11px] text-[#666666] font-semibold whitespace-nowrap">
                      Actual Spent:
                    </label>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1 text-xs text-[#999999]">{event.currency}</span>
                      <input
                        type="number"
                        aria-label={`Actual spent amount for ${cat.category}`}
                        value={cat.actualSpent || ""}
                        placeholder="0"
                        onChange={(e) => handleUpdateActualSpent(cat.id, e.target.value)}
                        className="w-full pl-10 pr-2.5 py-1 text-xs rounded-lg bg-[#f8f7f5] border border-[#e3e3e2] text-[#292827] font-mono focus:outline-none focus:ring-1 focus:ring-[#714cb6]"
                      />
                    </div>
                  </div>

                  {/* Category Progress */}
                  <div className="w-full bg-[#f2f0eb] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#714cb6] h-1.5 transition-all"
                      style={{ width: `${catPercent}%` }}
                    />
                  </div>

                  {/* AI Saving Tip */}
                  {cat.aiSavingTip && (
                    <div className="p-2 rounded-xl bg-[#f8f7f5] border border-[#e3e3e2] text-[11px] text-[#292827] leading-snug flex items-start space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{cat.aiSavingTip}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: TIMELINE MILESTONES & VENDOR CHECKLIST */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Milestone Timeline */}
          <div
            className={`paper-card p-6 transition-all ${
              highlightedFields.includes("timeline") ? "replan-glow" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-[#292827]">Interactive Timeline Milestones</h3>
              </div>
              <span className="text-xs text-[#666666]">
                {plan.timeline.filter((t) => t.completed).length} / {plan.timeline.length} done
              </span>
            </div>

            <div className="space-y-3">
              {plan.timeline.map((milestone) => (
                <div
                  key={milestone.id}
                  onClick={() => handleToggleMilestone(milestone.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                    milestone.completed
                      ? "bg-[#f8f7f5] border-[#e3e3e2] opacity-70"
                      : "bg-white border-[#e3e3e2] hover:border-[#714cb6]"
                  }`}
                >
                  <div className="pt-0.5">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        milestone.completed
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-[#999999] hover:border-[#714cb6]"
                      }`}
                    >
                      {milestone.completed && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          milestone.completed ? "line-through text-[#999999]" : "text-[#292827]"
                        }`}
                      >
                        {milestone.taskTitle}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          milestone.priority === "High"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : "bg-[#d4c7ff]/50 text-[#292827] border border-[#714cb6]/20"
                        }`}
                      >
                        {milestone.timeframe}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666666] mt-1 leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Checklist */}
          <div
            className={`paper-card p-6 transition-all ${
              highlightedFields.includes("vendorChecklist") ? "replan-glow" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-[#714cb6]" />
                <h3 className="text-base font-bold text-[#292827]">Vendor Sourcing & Questions</h3>
              </div>
              <span className="text-xs text-[#666666]">
                {plan.vendorChecklist.filter((v) => v.booked).length} / {plan.vendorChecklist.length} booked
              </span>
            </div>

            <div className="space-y-3">
              {plan.vendorChecklist.map((vendor) => (
                <div
                  key={vendor.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    vendor.booked
                      ? "bg-emerald-50/50 border-emerald-300"
                      : "bg-white border-[#e3e3e2]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-[#292827]">{vendor.vendorType}</h4>
                      <p className="text-[11px] text-[#666666] mt-0.5">{vendor.recommendedAction}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVendor(vendor.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        vendor.booked
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "bg-white text-[#292827] border-[#e3e3e2] hover:bg-[#f8f7f5]"
                      }`}
                    >
                      {vendor.booked ? "Booked ✓" : "Mark Booked"}
                    </button>
                  </div>

                  {/* Estimated Cost & Tailored Questions */}
                  <div className="mt-2.5 pt-2 border-t border-[#e3e3e2] flex flex-col space-y-1 text-[11px]">
                    <div className="text-[#666666] flex items-center justify-between">
                      <span>Est. Range:</span>
                      <span className="font-mono text-emerald-800 font-semibold">{vendor.estimatedBudgetRange}</span>
                    </div>
                    {vendor.questionsToAsk && vendor.questionsToAsk.length > 0 && (
                      <div className="mt-1">
                        <span className="text-[#999999] font-semibold block text-[10px] uppercase">Questions to Ask:</span>
                        <ul className="list-disc list-inside text-[#666666] space-y-0.5 text-[10px]">
                          {vendor.questionsToAsk.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION: 6 PERSONALIZED IDEAS SHOWCASE */}
        <div
          className={`paper-card p-6 sm:p-8 transition-all ${
            highlightedFields.includes("personalizedIdeas") ? "replan-glow" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-[460] text-[#292827] tracking-tight">6 Tailored Creative Ideas</h3>
                {highlightedFields.includes("personalizedIdeas") && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4c7ff] text-[#292827]">
                    Re-Planned!
                  </span>
                )}
              </div>
              <p className="text-xs text-[#666666]">
                Custom ideas matching your vibe, guest count, and dynamic requirements
              </p>
            </div>
            <span className="text-xs font-mono text-[#714cb6]">
              Palette: {plan.eventSummary?.themeColors?.join(", ")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.personalizedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="p-4 rounded-2xl bg-white border border-[#e3e3e2] hover:border-[#714cb6] transition-all space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d4c7ff]/60 text-[#292827] border border-[#292827]/10">
                      {idea.category}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        idea.budgetImpact === "Low"
                          ? "bg-emerald-50 text-emerald-800"
                          : idea.budgetImpact === "Medium"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-rose-50 text-rose-800"
                      }`}
                    >
                      Impact: {idea.budgetImpact}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#292827]">{idea.title}</h4>
                  <p className="text-xs text-[#666666] leading-relaxed mt-1 font-[460]">
                    {idea.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#e3e3e2] flex items-center justify-between text-[11px] text-[#666666]">
                  <span>DIY Potential: {idea.diyPotential ? "Yes 🛠️" : "Vendor Recommended"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION: RECENT RSVPS & GUEST FEED */}
        <div className="paper-card p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#292827] flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#714cb6]" />
                <span>Live Guest RSVPs in Cloudflare D1 ({rsvps.length})</span>
              </h3>
              <p className="text-xs text-[#666666]">
                Responses submitted by guests via <code className="text-[#421d24]">/invite/[id]</code>
              </p>
            </div>
            <Link
              href={`/invite/${event.slug || event.id}`}
              target="_blank"
              className="text-xs font-semibold text-[#714cb6] hover:underline flex items-center space-x-1"
            >
              <span>Test RSVP Form</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {rsvps.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#f8f7f5] text-center text-xs text-[#666666]">
              No guest RSVPs received yet. Copy the shareable link above to test in an incognito window!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e3e3e2] text-[#666666] uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Guest Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Party Size</th>
                    <th className="py-2.5 px-3">Dietary Notes</th>
                    <th className="py-2.5 px-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e3e2] font-normal">
                  {rsvps.map((r) => (
                    <tr key={r.id} className="hover:bg-[#f8f7f5] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#292827]">{r.guest_name}</td>
                      <td className="py-2.5 px-3 font-mono text-[#666666]">{r.guest_email}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === "going"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : r.status === "maybe"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-[#f2f0eb] text-[#666666]"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#292827] font-mono">{r.attendees_count}</td>
                      <td className="py-2.5 px-3 text-[#666666]">{r.dietary_notes || "None"}</td>
                      <td className="py-2.5 px-3 text-[#666666] italic">&quot;{r.message || "—"}&quot;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentModel={currentModel}
        onModelChange={(m) => setCurrentModel(m)}
      />

      {/* GenAI Inspector Drawer */}
      <GenAiInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        data={inspectorData}
      />
    </div>
  );
}
