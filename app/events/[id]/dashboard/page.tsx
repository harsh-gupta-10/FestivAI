"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SettingsModal } from "@/components/SettingsModal";
import { GenAiInspector, InspectorData } from "@/components/GenAiInspector";
import { EventRecord, RsvpRecord, AIEventPlan, BudgetCategory, TimelineMilestone, VendorChecklistItem } from "@/types";
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
  Send,
  RefreshCw,
  Upload,
  Check,
  AlertCircle,
  Copy,
  Download,
  Printer,
  ChevronDown,
  Tag,
  Wand2,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Flame,
  Cake,
  Heart,
  Landmark,
  FileCheck,
} from "lucide-react";

interface DashboardPageProps {
  params: Promise<{ id: string }>;
}

export default function EventDashboardPage({ params }: DashboardPageProps) {
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

  // Inline update actualSpent for a budget category
  const handleUpdateActualSpent = (categoryId: string, newSpentStr: string) => {
    if (!plan) return;
    const val = parseFloat(newSpentStr) || 0;
    const updatedBudget = plan.budgetBreakdown.map((b) =>
      b.id === categoryId ? { ...b, actualSpent: val } : b
    );
    const updatedPlan: AIEventPlan = { ...plan, budgetBreakdown: updatedBudget };
    syncPlanUpdate(updatedPlan);
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
          ...(customApiKey ? { "x-openai-api-key": customApiKey } : {}),
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

      // Update Inspector data with live proof
      if (data.inspectorData) {
        setInspectorData(data.inspectorData);
      }

      setReplanPrompt("");
      // Clear highlight after 6 seconds
      setTimeout(() => setHighlightedFields([]), 6000);
    } catch (err: any) {
      console.error("Replan error:", err);
      alert("Failed to replan: " + err.message);
    } finally {
      setIsReplanning(false);
    }
  };

  // Banner image upload to Cloudflare R2
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

      // Update event banner key in D1
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

  // Export Event Kit (JSON)
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-amber-500 p-0.5 animate-spin">
          <div className="w-full h-full bg-slate-950 rounded-[14px]" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-300 animate-pulse">
          Loading Event Command Center from Cloudflare D1...
        </p>
      </div>
    );
  }

  if (error || !event || !plan) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4">
          <AlertCircle className="w-8 h-8 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Event Not Found</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error || "Could not retrieve this event."}</p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold text-sm transition-colors"
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

  const publicInviteUrl = typeof window !== "undefined" ? `${window.location.origin}/invite/${event.slug || event.id}` : "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
        isInspectorOpen={isInspectorOpen}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* TOP COMMAND HEADER */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">
                {event.event_type}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                {event.vibe}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                D1 ID: {event.id.slice(0, 12)}...
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {event.title}
            </h1>
            <p className="text-sm text-fuchsia-300 italic font-serif">
              &quot;{plan.eventSummary?.tagline}&quot;
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                {event.event_date}
              </span>
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                {event.location}
              </span>
              <span className="flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Target: {event.guest_count} Guests
              </span>
              <span className="flex items-center">
                <DollarSign className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Budget: {event.total_budget.toLocaleString()} {event.currency}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleShareLink}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-lg shadow-fuchsia-600/20 transition-all flex items-center space-x-1.5"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? "Invite Link Copied!" : "Share Public Invite Link"}</span>
            </button>

            <Link
              href={`/invite/${event.slug || event.id}`}
              target="_blank"
              className="p-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center space-x-1.5"
              title="Open Public Invite Page in New Tab"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Preview Invite</span>
            </Link>

            <button
              onClick={handleExportJson}
              className="p-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center space-x-1.5"
              title="Export Event Kit (JSON)"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Export Kit</span>
            </button>

            <button
              onClick={() => setIsInspectorOpen(true)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-fuchsia-950/80 hover:bg-fuchsia-900/80 text-fuchsia-300 border border-fuchsia-600/40 shadow-sm flex items-center space-x-1.5"
              title="Open Live GenAI Prompt & JSON Inspector"
            >
              <Sparkles className="w-4 h-4 text-fuchsia-400 animate-pulse" />
              <span>Inspector</span>
            </button>
          </div>
        </div>

        {/* DYNAMIC AI RE-PLANNER BAR (PROVE AI IS DYNAMIC) */}
        <div
          className={`p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-fuchsia-950/30 to-slate-900 border transition-all ${
            highlightedFields.length > 0
              ? "border-emerald-400 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/30"
              : "border-fuchsia-500/40 shadow-lg"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
                <Wand2 className="w-4 h-4 text-amber-400 animate-spin" />
              </div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                <span>Dynamic AI Re-Planner Bar</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  Prove AI is Dynamic
                </span>
              </h3>
            </div>
            <span className="text-xs text-slate-400">
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
                value={replanPrompt}
                onChange={(e) => setReplanPrompt(e.target.value)}
                placeholder="e.g. Move event indoors due to rain, cut budget by 25%, and switch menu to 100% vegan..."
                className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            <button
              type="submit"
              disabled={isReplanning || !replanPrompt.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-fuchsia-600/30 transition-all flex items-center justify-center space-x-2 flex-shrink-0 cursor-pointer"
            >
              {isReplanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Re-planning with OpenAI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Execute Re-Plan</span>
                </>
              )}
            </button>
          </form>

          {/* Preset Quick-Test Prompts for Judges */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-medium text-slate-400">Quick Test Prompts:</span>
            <button
              type="button"
              onClick={() => handleExecuteReplan("Move event indoors due to rain, cut budget by 25%, and switch menu to 100% vegan")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1"
            >
              <span>🌧️ Rain Contingency + 25% Cut + Vegan Menu</span>
            </button>
            <button
              type="button"
              onClick={() => handleExecuteReplan("Add live saxophone sunset set, reduce floral budget by 10%, and include late night taco bar")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1"
            >
              <span>🎷 Live Saxophone + Taco Bar</span>
            </button>
            <button
              type="button"
              onClick={() => handleExecuteReplan("Switch to zero-waste eco-festival with solar power and digital QR badges")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1"
            >
              <span>🌿 Zero-Waste Eco Vibe</span>
            </button>
          </div>

          {/* Re-Plan Success Banner */}
          {replanSuccessNote && (
            <div className="mt-3 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>AI Dynamically Adapted Plan:</strong> {replanSuccessNote}
                </span>
              </div>
              <button
                onClick={() => setIsInspectorOpen(true)}
                className="underline text-emerald-200 hover:text-white ml-2 text-[11px] whitespace-nowrap"
              >
                Inspect Live Diffs →
              </button>
            </div>
          )}
        </div>

        {/* SECTION: LIVE RSVP METRICS & R2 BANNER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live RSVP Counter Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Users className="w-4 h-4 text-fuchsia-400" />
                  <span>Live RSVP Attendance Counter</span>
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  D1 Realtime
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center mb-4">
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                  <span className="block text-2xl font-black text-emerald-400">{goingCount}</span>
                  <span className="text-[11px] font-semibold text-emerald-200">Going 🎉</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30">
                  <span className="block text-2xl font-black text-amber-400">{maybeCount}</span>
                  <span className="text-[11px] font-semibold text-amber-200">Maybe 🤔</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                  <span className="block text-2xl font-black text-slate-300">{declinedCount}</span>
                  <span className="text-[11px] font-semibold text-slate-400">Declined</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Guest attendance updates directly from the public invite link in Cloudflare D1.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Total Confirmed Heads: <strong className="text-white">{goingCount} / {event.guest_count}</strong>
              </span>
              <Link
                href={`/invite/${event.slug || event.id}`}
                target="_blank"
                className="text-xs font-bold text-fuchsia-400 hover:text-fuchsia-300 flex items-center space-x-1"
              >
                <span>Guest View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Cloudflare R2 Banner Card */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Cloudflare R2 Banner Storage
                </h3>
              </div>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Bucket: festivai-assets
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-36 sm:h-40 group flex items-center justify-center">
              {event.banner_r2_key ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/r2/${event.banner_r2_key}`}
                    alt="Event Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold transition-all">
                      Change Banner in R2
                      <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                    </label>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <p className="text-xs text-slate-400 mb-2">No custom banner uploaded yet to Cloudflare R2.</p>
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all">
                    <Upload className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                    <span>Upload Banner to R2</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
                </div>
              )}

              {isUploadingBanner && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-xs font-bold text-fuchsia-400">
                    <div className="w-4 h-4 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                    <span>Streaming to Cloudflare R2...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-between text-xs text-slate-400">
              <span>R2 Key: <code className="text-emerald-400 font-mono">{event.banner_r2_key || "none"}</code></span>
              <span className="text-slate-500 text-[11px]">Served directly via /api/r2/[key]</span>
            </div>
          </div>
        </div>

        {/* SECTION: INTERACTIVE BUDGET TRACKER */}
        <div
          className={`p-6 sm:p-8 rounded-3xl bg-slate-900/80 border transition-all ${
            highlightedFields.includes("budgetBreakdown")
              ? "border-emerald-400 ring-2 ring-emerald-500/30"
              : "border-slate-800"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-extrabold text-white">Interactive Budget Tracker</h2>
                {highlightedFields.includes("budgetBreakdown") && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                    Dynamically Adjusted!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Inline edit &apos;Actual Spent&apos; amounts below to sync real-time expenses with Cloudflare D1
              </p>
            </div>

            {/* Overall summary pills */}
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Total Allocated</span>
                <span className="text-white font-mono text-sm">{totalAllocated.toLocaleString()} {event.currency}</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Actual Spent</span>
                <span className="text-emerald-400 font-mono text-sm">{totalSpent.toLocaleString()} {event.currency}</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Remaining</span>
                <span className={`font-mono text-sm ${budgetVariance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {budgetVariance.toLocaleString()} {event.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>Budget Utilization ({budgetSpentPercent}%)</span>
              <span>{totalSpent.toLocaleString()} / {event.total_budget.toLocaleString()} {event.currency}</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  budgetSpentPercent > 90 ? "bg-rose-500" : budgetSpentPercent > 70 ? "bg-amber-400" : "bg-emerald-500"
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
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{cat.category}</h4>
                      <span className="text-[11px] text-fuchsia-400 font-medium">
                        Target: {cat.allocatedAmount.toLocaleString()} {event.currency} ({cat.percentage}%)
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {catPercent}%
                    </span>
                  </div>

                  {/* Inline Edit Actual Spent */}
                  <div className="flex items-center space-x-2">
                    <label className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">
                      Actual Spent:
                    </label>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">{event.currency}</span>
                      <input
                        type="number"
                        value={cat.actualSpent || ""}
                        placeholder="0"
                        onChange={(e) => handleUpdateActualSpent(cat.id, e.target.value)}
                        className="w-full pl-10 pr-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                      />
                    </div>
                  </div>

                  {/* Category Progress */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-fuchsia-500 h-1.5 transition-all"
                      style={{ width: `${catPercent}%` }}
                    />
                  </div>

                  {/* AI Saving Tip */}
                  {cat.aiSavingTip && (
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 leading-snug flex items-start space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
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
            className={`p-6 rounded-3xl bg-slate-900/80 border transition-all ${
              highlightedFields.includes("timeline")
                ? "border-emerald-400 ring-2 ring-emerald-500/30"
                : "border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Interactive Timeline Milestones</h3>
              </div>
              <span className="text-xs text-slate-400">
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
                      ? "bg-slate-950/40 border-slate-800/60 opacity-60"
                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="pt-0.5">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        milestone.completed
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "border-slate-600 hover:border-fuchsia-400"
                      }`}
                    >
                      {milestone.completed && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          milestone.completed ? "line-through text-slate-500" : "text-white"
                        }`}
                      >
                        {milestone.taskTitle}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          milestone.priority === "High"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {milestone.timeframe}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Checklist */}
          <div
            className={`p-6 rounded-3xl bg-slate-900/80 border transition-all ${
              highlightedFields.includes("vendorChecklist")
                ? "border-emerald-400 ring-2 ring-emerald-500/30"
                : "border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-base font-extrabold text-white">Vendor Sourcing & Questions</h3>
              </div>
              <span className="text-xs text-slate-400">
                {plan.vendorChecklist.filter((v) => v.booked).length} / {plan.vendorChecklist.length} booked
              </span>
            </div>

            <div className="space-y-3">
              {plan.vendorChecklist.map((vendor) => (
                <div
                  key={vendor.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    vendor.booked
                      ? "bg-emerald-950/20 border-emerald-500/40"
                      : "bg-slate-950/80 border-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white">{vendor.vendorType}</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">{vendor.recommendedAction}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVendor(vendor.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        vendor.booked
                          ? "bg-emerald-600 text-white border-emerald-500"
                          : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                      }`}
                    >
                      {vendor.booked ? "Booked ✓" : "Mark Booked"}
                    </button>
                  </div>

                  {/* Estimated Cost & Tailored Questions */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-col space-y-1 text-[11px]">
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Est. Range:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{vendor.estimatedBudgetRange}</span>
                    </div>
                    {vendor.questionsToAsk && vendor.questionsToAsk.length > 0 && (
                      <div className="mt-1">
                        <span className="text-slate-500 font-semibold block text-[10px] uppercase">Questions to Ask:</span>
                        <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[10px]">
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
          className={`p-6 sm:p-8 rounded-3xl bg-slate-900/80 border transition-all ${
            highlightedFields.includes("personalizedIdeas")
              ? "border-emerald-400 ring-2 ring-emerald-500/30"
              : "border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-extrabold text-white">6 Tailored Creative Ideas</h3>
                {highlightedFields.includes("personalizedIdeas") && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Re-Planned!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Custom ideas matching your vibe, guest count, and dynamic requirements
              </p>
            </div>
            <span className="text-xs font-mono text-fuchsia-400">
              Palette: {plan.eventSummary?.themeColors?.join(", ")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.personalizedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-fuchsia-500/40 transition-all space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
                      {idea.category}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        idea.budgetImpact === "Low"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : idea.budgetImpact === "Medium"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      Impact: {idea.budgetImpact}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{idea.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    {idea.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                  <span>DIY Potential: {idea.diyPotential ? "Yes 🛠️" : "Vendor Recommended"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION: RECENT RSVPS & GUEST FEED */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>Live Guest RSVPs in Cloudflare D1 ({rsvps.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Responses submitted by guests via <code className="text-fuchsia-300">/invite/[id]</code>
              </p>
            </div>
            <Link
              href={`/invite/${event.slug || event.id}`}
              target="_blank"
              className="text-xs font-semibold text-fuchsia-400 hover:text-fuchsia-300 flex items-center space-x-1"
            >
              <span>Test RSVP Form</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {rsvps.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950 text-center text-xs text-slate-400">
              No guest RSVPs received yet. Copy the shareable link above to test in an incognito window!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Guest Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Party Size</th>
                    <th className="py-2.5 px-3">Dietary Notes</th>
                    <th className="py-2.5 px-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {rsvps.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">{r.guest_name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{r.guest_email}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === "going"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : r.status === "maybe"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono">{r.attendees_count}</td>
                      <td className="py-2.5 px-3 text-slate-300">{r.dietary_notes || "None"}</td>
                      <td className="py-2.5 px-3 text-slate-400 italic">&quot;{r.message || "—"}&quot;</td>
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
