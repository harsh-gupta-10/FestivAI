"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Calendar,
  DollarSign,
  Users,
  Check,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  Database,
  Cloud,
  Cpu,
  Layers,
  Wand2,
  Share2,
  FileText,
  Utensils,
  Camera,
  Heart,
  Landmark,
  Cake,
  ExternalLink,
} from "lucide-react";

export default function MarketingLandingPage() {
  const [activeTab, setActiveTab] = useState<"masterplan" | "replan" | "budget" | "rsvp">("masterplan");

  return (
    <div className="min-h-screen bg-[#f2f0eb] text-[#292827] flex flex-col font-sans selection:bg-[#d4c7ff] selection:text-[#292827]">
      {/* 1. PILL ANNOUNCEMENT BANNER */}
      <div className="w-full bg-[#421d24] text-white py-2.5 px-4 text-xs font-normal border-b border-[#421d24]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4c7ff] animate-ping" />
            <span className="font-semibold text-[#d4c7ff]">PromptWars Challenge 5:</span>
            <span className="truncate">GenAI Celebration & Event Planner on Cloudflare Workers, D1 & R2</span>
          </div>
          <Link
            href="/app"
            className="hidden sm:inline-flex items-center space-x-1 font-semibold text-white hover:text-[#d4c7ff] transition-colors ml-4 whitespace-nowrap"
          >
            <span>Launch app.festivai.com</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. STICKY EDITORIAL NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 w-full bg-[#f2f0eb]/90 backdrop-blur-md border-b border-[#e3e3e2] transition-colors">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#421d24] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
              F
            </div>
            <span className="text-xl font-bold tracking-tight text-[#292827]">
              Festiv<span className="text-[#714cb6]">AI</span>
            </span>
            <span className="hidden md:inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#d4c7ff]/60 text-[#292827] border border-[#292827]/10">
              Editorial Edition
            </span>
          </Link>

          {/* Center Links (Weight 460, 16px) */}
          <nav className="hidden md:flex items-center space-x-8 text-[15px] font-[460] text-[#292827]">
            <a href="#suite" className="hover:text-[#714cb6] transition-colors">
              Platform
            </a>
            <a href="#architecture" className="hover:text-[#714cb6] transition-colors">
              Architecture
            </a>
            <a href="#dynamic-replan" className="hover:text-[#714cb6] transition-colors">
              Dynamic Re-Plan
            </a>
            <Link href="/events/sample-wedding-2026/dashboard" className="hover:text-[#714cb6] transition-colors">
              Sample Dashboard
            </Link>
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center space-x-3">
            <Link
              href="/app"
              className="text-sm font-[460] text-[#292827] hover:text-[#714cb6] px-2 py-1 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-[540] text-[#292827] bg-[#d4c7ff] border border-[#292827] hover:bg-[#c2b2fb] transition-all shadow-sm"
            >
              Launch App
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* 3. CINEMATIC HERO SECTION WITH FLOATING GLASS CARDS */}
        <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden border-b border-[#e3e3e2]">
        {/* Cinematic Backdrop Image */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80"
            alt="Golden Hour Celebration Banquet"
            className="w-full h-full object-cover object-center opacity-30 filter saturate-75"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#f2f0eb]/70 via-[#f2f0eb]/85 to-[#f2f0eb]" />
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* Centered Editorial Headline */}
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#ffffff] border border-[#e3e3e2] text-xs font-[460] text-[#292827]">
              <Sparkles className="w-3.5 h-3.5 text-[#714cb6]" />
              <span>Autonomous Celebration Architecture on Cloudflare Free Tier</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-[460] tracking-[-0.028em] text-[#292827] leading-[1.05]">
              Celebrations, orchestrated to perfection with generative intelligence.
            </h1>

            <p className="text-base sm:text-lg text-[#666666] leading-relaxed max-w-2xl mx-auto font-[460]">
              From intimate weddings and milestone birthdays to community galas — FestivAI calculates mathematically balanced budgets, orchestrates timelines, generates vendor checklists, and provisions edge RSVP portals in seconds.
            </p>

            {/* CTAs */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/app"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-[16px] bg-[#421d24] text-white text-base font-[460] hover:bg-[#572730] transition-all shadow-md group"
              >
                <span>Launch App Workspace</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/events/sample-wedding-2026/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-[16px] bg-[#ffffff] text-[#292827] border border-[#e3e3e2] text-base font-[460] hover:bg-[#f8f7f5] transition-all"
              >
                <span>View Sample Dashboard</span>
              </Link>
            </div>
          </div>

          {/* FLOATING PRODUCT CARDS COMPOSITED OVER PHOTOGRAPHY (SIGNATURE SUPERHUMAN MOVE) */}
          <div className="mt-14 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Floating Card 1: Budget Tracker */}
            <div className="floating-glass-card p-5 space-y-3 shadow-sm border border-white/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#714cb6]">
                  Live D1 Budget Tracker
                </span>
                <span className="text-[11px] font-mono text-[#292827] bg-[#d4c7ff]/50 px-2 py-0.5 rounded-full border border-[#714cb6]/20">
                  100% Balanced
                </span>
              </div>
              <div>
                <span className="text-2xl font-bold text-[#292827] block">$28,000 USD</span>
                <span className="text-xs text-[#666666]">Allocated across 6 custom vendor categories</span>
              </div>
              <div className="w-full bg-[#f2f0eb] rounded-full h-2 overflow-hidden border border-[#e3e3e2]">
                <div className="bg-[#421d24] h-2 rounded-full" style={{ width: "66%" }} />
              </div>
              <p className="text-[11px] text-[#292827] italic bg-white/70 p-2 rounded-lg border border-[#e3e3e2]">
                &quot;AI Tip: Combined photo + drone video package saved $1,200.&quot;
              </p>
            </div>

            {/* Floating Card 2: Dynamic Re-Planner */}
            <div className="floating-glass-card p-5 space-y-3 shadow-sm border border-white/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#421d24] flex items-center">
                  <Wand2 className="w-3.5 h-3.5 mr-1 text-[#714cb6]" />
                  Dynamic Re-Planner
                </span>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Proof of AI
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 border border-[#e3e3e2] text-xs text-[#292827]">
                <span className="text-[10px] text-[#666666] uppercase block font-semibold">User Prompt:</span>
                &quot;Move event indoors due to rain, cut budget by 25%, and switch to vegan menu.&quot;
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-emerald-800 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>3 categories adapted in 1.4s</span>
              </div>
            </div>

            {/* Floating Card 3: Live RSVP Feed */}
            <div className="floating-glass-card p-5 space-y-3 shadow-sm border border-white/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#714cb6]">
                  Global Edge RSVPs
                </span>
                <span className="text-[11px] font-mono text-[#292827] bg-[#d4c7ff]/50 px-2 py-0.5 rounded-full border border-[#714cb6]/20">
                  D1 SQLite
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-2xl font-bold text-[#292827] block">120</span>
                  <span className="text-xs text-[#666666]">Confirmed Going</span>
                </div>
                <div className="h-8 w-px bg-[#e3e3e2]" />
                <div>
                  <span className="text-2xl font-bold text-[#714cb6] block">100%</span>
                  <span className="text-xs text-[#666666]">Dietary Synced</span>
                </div>
              </div>
              <p className="text-[11px] text-[#666666]">
                Shareable links (<code className="text-[#292827] bg-white px-1 py-0.5 rounded">/invite/[id]</code>) load instantly via Cloudflare Edge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRUST LOGO CARD ROW (SOCIAL PROOF BAND) */}
      <section className="bg-white border-b border-[#e3e3e2] py-8">
        <div className="max-w-[1200px] mx-auto px-4">
          <p className="text-center text-xs uppercase tracking-widest text-[#666666] font-semibold mb-6">
            Trusted by celebration organizers, luxury venues & community festivals worldwide
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-[#e3e3e2] border-t border-b border-[#e3e3e2]">
            {[
              "VOGUE WEDDINGS",
              "METROPOLITAN GALA",
              "THE GRAND ATRIUM",
              "SONOMA BOTANICAL",
              "SUMMIT GATHERINGS",
              "FESTIVAL ALLIANCE",
            ].map((name) => (
              <div
                key={name}
                className="py-6 px-3 flex items-center justify-center text-center font-bold text-xs tracking-wider text-[#292827]/80 hover:text-[#292827] transition-colors"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRODUCT SUITE TAB STRIP SECTION */}
      <section id="suite" className="py-20 max-w-[1200px] mx-auto px-4 sm:px-6 w-full space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#714cb6]">
            The FestivAI Suite
          </span>
          <h2 className="text-3xl sm:text-5xl font-[460] tracking-[-0.027em] text-[#292827]">
            Every dimension of your celebration, connected.
          </h2>
          <p className="text-[#666666] text-sm sm:text-base font-[460]">
            Four core capabilities designed as a unified system, eliminating spreadsheets and fragmented planning tools.
          </p>
        </div>

        {/* Suite Tab Strip Container */}
        <div className="bg-white p-1 rounded-tabs border border-[#e3e3e2] max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-1">
          {[
            { id: "masterplan", label: "Masterplanning", desc: "OpenAI o3-mini / GPT-4o" },
            { id: "replan", label: "Dynamic Re-Plan", desc: "Live Weather & Budget" },
            { id: "budget", label: "Budget & Vendors", desc: "Inline D1 Sync" },
            { id: "rsvp", label: "Edge Invite & RSVP", desc: "Real-time Counts" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3 text-left rounded-[6px] transition-all ${
                activeTab === tab.id
                  ? "bg-[#d4c7ff] text-[#292827] font-semibold shadow-sm"
                  : "bg-white text-[#292827] hover:bg-[#f2f0eb] font-normal"
              }`}
            >
              <span className="block text-xs sm:text-sm font-semibold">{tab.label}</span>
              <span className="block text-[10px] text-[#666666] truncate">{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* Tab Detail Card */}
        <div className="paper-card p-8 sm:p-12 max-w-4xl mx-auto">
          {activeTab === "masterplan" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#421d24] text-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#d4c7ff]" />
                </div>
                <h3 className="text-2xl font-[460] text-[#292827]">
                  Autonomous GenAI Masterplan Generation
                </h3>
                <p className="text-sm text-[#666666] leading-relaxed font-[460]">
                  Input your event theme, guest count, location, and total budget. FestivAI crafts mathematically coherent allocations summing to 100%, 5 phased timeline milestones, tailored vendor questions, and 6 personalized ideas.
                </p>
                <div className="pt-2">
                  <Link href="/app" className="violet-link text-sm font-semibold flex items-center">
                    <span>Try Masterplanner in App</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-[#f2f0eb] border border-[#e3e3e2] space-y-3 font-mono text-xs">
                <div className="flex justify-between text-[#666666]">
                  <span>SCHEMA_VALIDATION</span>
                  <span className="text-emerald-700">100% BALANCED</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#e3e3e2] space-y-1.5">
                  <span className="text-[#714cb6] font-bold block">eventSummary.tagline</span>
                  <p className="text-[#292827] font-sans text-xs italic">&quot;An Enchanted Sunset Garden Celebration&quot;</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#e3e3e2] space-y-1.5">
                  <span className="text-[#714cb6] font-bold block">budgetBreakdown (Sum = $25,000)</span>
                  <div className="text-[11px] text-[#666666] font-sans flex justify-between">
                    <span>Venue & Rentals: $8,500</span>
                    <span>Catering & Bar: $7,000</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "replan" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#714cb6] text-white flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-[#d4c7ff]" />
                </div>
                <h3 className="text-2xl font-[460] text-[#292827]">
                  Dynamic Re-Planner: Prove AI is Dynamic
                </h3>
                <p className="text-sm text-[#666666] leading-relaxed font-[460]">
                  Plans change. Type any live adjustment: &quot;Move event indoors due to rain, cut budget by 25%, and switch menu to 100% vegan.&quot; FestivAI instantly updates the masterplan in D1 and highlights changes on screen.
                </p>
                <div className="pt-2">
                  <Link href="/events/sample-wedding-2026/dashboard" className="violet-link text-sm font-semibold flex items-center">
                    <span>Test Re-Planner on Sample Dashboard</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-[#f2f0eb] border border-[#e3e3e2] space-y-3 font-mono text-xs">
                <div className="flex justify-between text-[#666666]">
                  <span>REPLAN_ACTION</span>
                  <span className="text-emerald-700">D1 PERSISTED</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-emerald-400 space-y-1">
                  <span className="text-emerald-800 font-bold block text-xs">🌧️ Rain Contingency Milestone Added</span>
                  <p className="text-[#666666] font-sans text-xs">Covered conservatory atrium protocol activated 48h prior.</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-emerald-400 space-y-1">
                  <span className="text-emerald-800 font-bold block text-xs">🥗 100% Gourmet Plant-Based Menu</span>
                  <p className="text-[#666666] font-sans text-xs">Artisanal cashew truffle brie & lavender sparkling spritz.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "budget" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#0c4243] text-white flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#d4c7ff]" />
                </div>
                <h3 className="text-2xl font-[460] text-[#292827]">
                  Interactive Budget Tracker with Inline D1 Sync
                </h3>
                <p className="text-sm text-[#666666] leading-relaxed font-[460]">
                  Track allocated amounts against real-time expenses with progress indicators. Edit &apos;Actual Spent&apos; directly inline, and updates persist instantly to Cloudflare D1 Serverless SQLite via HTTP PATCH.
                </p>
                <div className="pt-2">
                  <Link href="/app" className="violet-link text-sm font-semibold flex items-center">
                    <span>Manage Budgets in App</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-[#f2f0eb] border border-[#e3e3e2] space-y-2.5">
                {[
                  { name: "Venue & Pavilion", alloc: "$8,500", spent: "$8,500", pct: "100%" },
                  { name: "Catering & Bar", alloc: "$7,000", spent: "$6,400", pct: "91%" },
                  { name: "Floral & Decor", alloc: "$3,000", spent: "$2,850", pct: "95%" },
                ].map((row) => (
                  <div key={row.name} className="p-3 rounded-xl bg-white border border-[#e3e3e2] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#292827] block">{row.name}</span>
                      <span className="text-[#666666]">Target: {row.alloc}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-emerald-800">{row.spent}</span>
                      <span className="text-[10px] text-[#666666] block">{row.pct} spent</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "rsvp" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#421d24] text-white flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-[#d4c7ff]" />
                </div>
                <h3 className="text-2xl font-[460] text-[#292827]">
                  End-to-End Shareable Public Invite & RSVP
                </h3>
                <p className="text-sm text-[#666666] leading-relaxed font-[460]">
                  Share clean invite URLs (<code className="text-[#421d24]">/invite/[id]</code>) globally. Guests view the custom theme palette, R2 banner, countdown timer, and submit RSVPs directly into Cloudflare D1 with celebratory confetti.
                </p>
                <div className="pt-2">
                  <Link href="/invite/sample-wedding-2026" target="_blank" className="violet-link text-sm font-semibold flex items-center">
                    <span>Preview Live Public Invite</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-[#f2f0eb] border border-[#e3e3e2] space-y-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#e3e3e2] flex items-center space-x-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <span className="font-bold text-xs text-[#292827] block">Elena Rostova (+1 Guest)</span>
                    <span className="text-[11px] text-[#666666]">Dietary: Vegetarian, no cilantro</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-[#e3e3e2] flex items-center space-x-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <span className="font-bold text-xs text-[#292827] block">Devon Clark</span>
                    <span className="text-[11px] text-[#666666]">&quot;So thrilled for you both!&quot;</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. DARK FEATURE BAND (DEEP LAGOON #0c4243) — SUPERHUMAN SPEC REQUIREMENT */}
      <section id="dynamic-replan" className="w-full bg-[#0c4243] text-white py-24 border-t border-b border-[#0c4243]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left half: Layered translucent geometric rectangles with handwritten script overlays */}
          <div className="relative h-80 sm:h-96 flex items-center justify-center">
            {/* Layer 1: Lavender translucent rectangle */}
            <div className="absolute w-64 h-56 rounded-2xl bg-[#d4c7ff]/30 backdrop-blur-md border border-white/20 -rotate-6 transform translate-x-4 translate-y-2 p-5 flex flex-col justify-between">
              <span className="text-xs uppercase font-mono tracking-widest text-white/80">
                Rain Contingency Active
              </span>
              <p className="font-serif italic text-lg text-white">
                &quot;Moving from garden lawn to conservatory hall at 4:30 PM...&quot;
              </p>
              <div className="flex items-center space-x-2 text-xs text-white/90">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Weather Protocol Synced</span>
              </div>
            </div>

            {/* Layer 2: Midnight Wine translucent rectangle */}
            <div className="absolute w-64 h-56 rounded-2xl bg-[#421d24]/60 backdrop-blur-md border border-white/20 rotate-3 transform -translate-x-6 -translate-y-4 p-5 flex flex-col justify-between">
              <span className="text-xs uppercase font-mono tracking-widest text-amber-300">
                Emergency Budget Cut
              </span>
              <p className="font-serif italic text-xl text-white">
                -25% Applied Across Line Items
              </p>
              <span className="text-xs text-white/70">
                Venue re-negotiated to off-peak tier.
              </span>
            </div>

            {/* Layer 3: White top glass overlay */}
            <div className="relative z-10 w-60 p-4 rounded-xl bg-white/90 text-[#292827] shadow-xl border border-white">
              <div className="flex items-center justify-between text-xs font-bold text-[#714cb6] mb-1">
                <span>GENAI INSPECTOR</span>
                <span className="text-emerald-700">200 OK</span>
              </div>
              <p className="text-[11px] text-[#292827] font-mono leading-tight">
                Model: o3-mini<br />
                Latency: 1,380ms<br />
                D1 Rows: 1 mutated
              </p>
            </div>
          </div>

          {/* Right half: 64px display headline at weight 460, white body, and outlined ghost button */}
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#d4c7ff]">
              Editorial Agility
            </span>

            <h2 className="text-4xl sm:text-6xl font-[460] tracking-[-0.028em] text-white leading-[1.08]">
              Prove AI is truly dynamic. Adapt any plan in seconds.
            </h2>

            <p className="text-base sm:text-lg text-white/80 leading-relaxed font-[460]">
              Static templates fail the moment life happens. FestivAI gives organizers a real-time prompt bar that re-synthesizes schedules, reallocates budgets, adapts vendor questions, and updates guest instructions with zero lag.
            </p>

            <div className="pt-2">
              <Link
                href="/app"
                className="inline-flex items-center px-5 py-2.5 rounded-lg border border-white text-white hover:bg-white hover:text-[#0c4243] text-sm font-[540] transition-colors"
              >
                <span>Launch App Workspace →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ARCHITECTURE & CLOUDFLARE NATIVE HIGHLIGHTS */}
      <section id="architecture" className="py-20 max-w-[1200px] mx-auto px-4 sm:px-6 w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#714cb6]">
            Serverless Cloud Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-[460] tracking-[-0.027em] text-[#292827]">
            Built natively on Cloudflare Free Tier.
          </h2>
          <p className="text-[#666666] text-sm sm:text-base font-[460]">
            Every event is stored in distributed serverless primitives with global edge availability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="paper-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#421d24] text-white flex items-center justify-center">
              <Cloud className="w-5 h-5 text-[#d4c7ff]" />
            </div>
            <h3 className="text-lg font-bold text-[#292827]">Cloudflare Workers</h3>
            <p className="text-xs text-[#666666] leading-relaxed font-[460]">
              Next.js App Router deployed via the official <code>@opennextjs/cloudflare</code> adapter with Node.js runtime compatibility (<code>nodejs_compat</code>).
            </p>
          </div>

          <div className="paper-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0c4243] text-white flex items-center justify-center">
              <Database className="w-5 h-5 text-[#d4c7ff]" />
            </div>
            <h3 className="text-lg font-bold text-[#292827]">Cloudflare D1 SQLite</h3>
            <p className="text-xs text-[#666666] leading-relaxed font-[460]">
              Serverless relational SQL storage (<code>festivai-db</code>) persisting event masterplans, JSON payloads, and real-time guest RSVP attendance counters.
            </p>
          </div>

          <div className="paper-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#714cb6] text-white flex items-center justify-center">
              <Camera className="w-5 h-5 text-[#d4c7ff]" />
            </div>
            <h3 className="text-lg font-bold text-[#292827]">Cloudflare R2 Storage</h3>
            <p className="text-xs text-[#666666] leading-relaxed font-[460]">
              Edge object storage (<code>festivai-assets</code>) for custom uploaded celebration banners and invitation assets served via <code>/api/r2/[key]</code>.
            </p>
          </div>
        </div>
      </section>

      {/* 8. GRADIENT ATMOSPHERIC SECTION */}
      <section className="relative py-20 px-4 sm:px-6 overflow-hidden border-t border-[#e3e3e2]">
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 68% 50%, rgba(113, 76, 182, 0.25) 0%, transparent 60%), radial-gradient(circle at 93% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%), radial-gradient(circle at 50% 98%, rgba(244, 63, 94, 0.2) 0%, transparent 60%), radial-gradient(circle at 50% 75%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)",
          }}
        />

        <div className="relative max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-3 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-[460] tracking-[-0.028em] text-[#292827] leading-tight">
              Ready to elevate your celebration planning?
            </h2>
            <p className="text-sm text-[#666666] font-[460]">
              Sign in to the Organizer Workspace on <code>app.festivai.com</code> or test our live demo wedding.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/app"
              className="px-6 py-3.5 rounded-[16px] bg-[#421d24] text-white text-sm font-[460] hover:bg-[#572730] transition-all shadow-md flex items-center space-x-2"
            >
              <span>Launch App (app.festivai.com)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/events/sample-wedding-2026/dashboard"
              className="px-6 py-3.5 rounded-[16px] bg-white text-[#292827] border border-[#e3e3e2] text-sm font-[460] hover:bg-[#f8f7f5] transition-all"
            >
              Explore Sample Event
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* 9. SITE-WIDE FOOTER (MIDNIGHT WINE #421d24) — SUPERHUMAN SPEC REQUIREMENT */}
      <footer className="w-full bg-[#421d24] text-white py-16 px-4 sm:px-6 border-t border-[#421d24]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-white text-[#421d24] flex items-center justify-center font-bold text-sm">
                F
              </div>
              <span className="text-lg font-bold tracking-tight text-white">FestivAI</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-[460]">
              GenAI celebration & event planning assistant for PromptWars Virtual Competition: [Challenge 5].
            </p>
            <p className="text-[11px] text-white/50">
              Deployed on Cloudflare Workers with OpenNext, D1 SQLite, R2 & OpenAI.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform</h4>
            <ul className="space-y-2 text-xs font-[460] text-white/70">
              <li>
                <Link href="/app" className="hover:text-white transition-colors">
                  Organizer Setup Wizard
                </Link>
              </li>
              <li>
                <Link href="/app" className="hover:text-white transition-colors">
                  GenAI Masterplan Engine
                </Link>
              </li>
              <li>
                <Link href="/events/sample-wedding-2026/dashboard" className="hover:text-white transition-colors">
                  Command Center Dashboard
                </Link>
              </li>
              <li>
                <Link href="/invite/sample-wedding-2026" className="hover:text-white transition-colors">
                  Shareable Public Invite
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Cloudflare Free Tier</h4>
            <ul className="space-y-2 text-xs font-[460] text-white/70">
              <li>Cloudflare Workers (Edge SSR)</li>
              <li>Cloudflare D1 (Serverless SQLite)</li>
              <li>Cloudflare R2 (Asset Storage)</li>
              <li>OpenNext Adapter (nodejs_compat)</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">AI Engine & Rubric</h4>
            <ul className="space-y-2 text-xs font-[460] text-white/70">
              <li>OpenAI o3-mini Reasoning</li>
              <li>OpenAI GPT-4o Flagship</li>
              <li>Dynamic Re-Planning Bar</li>
              <li>Live GenAI Inspector Drawer</li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto mt-12 pt-6 border-t border-white/10 text-center text-xs text-white/60 flex flex-col sm:flex-row items-center justify-between gap-2 font-[460]">
          <p>© 2026 FestivAI. Built for PromptWars Virtual Competition [Challenge 5].</p>
          <div className="flex items-center space-x-4">
            <Link href="/app" className="hover:text-white transition-colors">
              App Subdomain (app.festivai.com)
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-white transition-colors">
              Marketing Overview
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
