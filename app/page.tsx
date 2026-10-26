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
  ChevronDown,
  ChevronUp,
  Wand2,
  Share2,
  FileText,
  Utensils,
  Camera,
  Heart,
  Cake,
  ExternalLink,
  MessageSquare,
  CloudSun,
  Search,
  CheckCircle2,
  Sliders,
  Send,
  Star,
  Quote,
  HelpCircle,
  Laptop,
  CheckCircle,
  Coins,
} from "lucide-react";
import { formatCurrency, getCurrencySymbol, SUPPORTED_CURRENCIES } from "@/lib/currency";

export default function MarketingLandingPage() {
  // Interactive Product Tour state
  const [activeTab, setActiveTab] = useState<"chat" | "budget" | "rsvp">("chat");

  // Interactive Currency Switcher preview in marketing hero/budget
  const [demoCurrency, setDemoCurrency] = useState<string>("INR");

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  // Demo budget items that react to currency selection
  const budgetMultiplier = demoCurrency === "INR" ? 85 : demoCurrency === "EUR" ? 0.92 : 1;
  const demoTotal = Math.round(28000 * budgetMultiplier);

  const demoCategories = [
    { name: "Venue & Architectural Pavilion", allocPct: 35, spentPct: 100 },
    { name: "Catering & Curated Bar Experience", allocPct: 30, spentPct: 85 },
    { name: "Editorial Photography & Highlight Film", allocPct: 12, spentPct: 90 },
    { name: "Theme Decor & Ambient Lighting", allocPct: 11, spentPct: 75 },
    { name: "Live Acoustic & Evening DJ Set", allocPct: 8, spentPct: 100 },
    { name: "Digital RSVPs, Signage & Favors", allocPct: 4, spentPct: 50 },
  ];

  return (
    <div className="min-h-screen bg-[#f2f0eb] text-[#292827] flex flex-col font-sans selection:bg-[#d4c7ff] selection:text-[#292827]">
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="w-full bg-[#421d24] text-white py-2.5 px-4 text-xs font-normal border-b border-[#421d24]">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[#d4c7ff] animate-ping shrink-0" />
            <span className="font-semibold text-[#d4c7ff]">FestivAI Concierge 2.0:</span>
            <span className="truncate">Autonomous event reasoning with live weather intelligence & zero-math budgeting</span>
          </div>
          <Link
            href="/app"
            className="hidden sm:inline-flex items-center space-x-1 font-semibold text-white hover:text-[#d4c7ff] transition-colors ml-4 shrink-0"
          >
            <span>Launch Free Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. STICKY EDITORIAL NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 w-full bg-[#f2f0eb]/90 backdrop-blur-md border-b border-[#e3e3e2] transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#421d24] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm group-hover:scale-105 transition-transform">
              F
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold tracking-tight text-[#292827]">
                Festiv<span className="text-[#714cb6]">AI</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#d4c7ff]/60 text-[#292827] border border-[#292827]/10">
                Editorial Concierge
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-[15px] font-[460] text-[#292827]">
            <a href="#preview" className="hover:text-[#714cb6] transition-colors">
              Product Tour
            </a>
            <a href="#how-it-works" className="hover:text-[#714cb6] transition-colors">
              How It Works
            </a>
            <a href="#celebrations" className="hover:text-[#714cb6] transition-colors">
              Celebrations
            </a>
            <a href="#pricing" className="hover:text-[#714cb6] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#714cb6] transition-colors">
              FAQ
            </a>
          </nav>

          {/* CTA & Sign In */}
          <div className="flex items-center space-x-3">
            <Link
              href="/app"
              className="text-sm font-[460] text-[#292827] hover:text-[#714cb6] px-2.5 py-1.5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-[540] text-white bg-[#421d24] hover:bg-[#572730] transition-all shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* 3. CINEMATIC HERO SECTION */}
        <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden border-b border-[#e3e3e2]">
          {/* Subtle warm photography backdrop */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80"
              alt="Golden Hour Celebration Banquet"
              className="w-full h-full object-cover object-center opacity-25 filter saturate-75"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#f2f0eb]/75 via-[#f2f0eb]/90 to-[#f2f0eb]" />
          </div>

          <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto space-y-5">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e3e3e2] text-xs font-[460] text-[#292827] shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#714cb6]" />
                <span>The GenAI Planning Assistant for Weddings, Birthdays & Community Events</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-[460] tracking-[-0.028em] text-[#292827] leading-[1.06]">
                Celebrations, orchestrated to perfection with generative reasoning.
              </h1>

              <p className="text-base sm:text-lg text-[#666666] leading-relaxed max-w-2xl mx-auto font-[460]">
                Say goodbye to scattered spreadsheets and broken budget calculations. FestivAI coordinates balanced budgets, phased timelines, vendor interview guides, and shareable guest RSVP portals in under 30 seconds.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/app"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-[#421d24] text-white text-base font-[540] hover:bg-[#572730] transition-all shadow-md group"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-[#d4c7ff]" />
                  <span>Launch AI Concierge Free</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#preview"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-white text-[#292827] border border-[#e3e3e2] text-base font-[460] hover:bg-[#f8f7f5] transition-all"
                >
                  <Laptop className="w-4 h-4 mr-2 text-[#714cb6]" />
                  <span>See Interactive Product Tour</span>
                </a>
              </div>

              <div className="pt-2 flex items-center justify-center space-x-6 text-xs text-[#666666]">
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  No credit card required
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  100% Mathematically balanced
                </span>
                <span className="hidden sm:flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Instant RSVP link
                </span>
              </div>
            </div>

            {/* REALISTIC CHATGPT-STYLE APP WORKSPACE PREVIEW SCREENSHOT */}
            <div id="preview" className="mt-12 sm:mt-16 max-w-5xl mx-auto">
              {/* Browser Window Chrome */}
              <div className="bg-white rounded-3xl border border-[#e3e3e2] shadow-2xl overflow-hidden">
                {/* Window title bar */}
                <div className="bg-[#f2f0eb] px-4 py-3 border-b border-[#e3e3e2] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block" />
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-white rounded-lg border border-[#e3e3e2] text-[11px] font-mono text-[#666666]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>https://app.festivai.com/concierge</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] font-medium text-[#714cb6]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">FestivAI Concierge</span>
                  </div>
                </div>

                {/* Inner Mockup Layout: Sidebar + Chat Interface */}
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
                  {/* Left Sidebar */}
                  <div className="hidden md:block md:col-span-4 bg-[#f8f7f4] border-r border-[#e3e3e2] p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-[#421d24] text-white flex items-center justify-center font-bold text-xs">
                          H
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#292827]">Harsh Gupta</div>
                          <div className="text-[10px] text-[#666666]">Event Organizer</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4c7ff] text-[#292827] font-semibold">
                        Host Pro
                      </span>
                    </div>

                    <button className="w-full py-2 px-3 rounded-xl bg-white border border-[#e3e3e2] text-xs font-[540] text-[#292827] hover:border-[#714cb6] transition-colors flex items-center justify-between shadow-xs">
                      <span className="flex items-center">
                        <Sparkles className="w-3.5 h-3.5 mr-2 text-[#714cb6]" />
                        + New Celebration
                      </span>
                      <span className="text-[10px] bg-[#f2f0eb] px-1.5 py-0.5 rounded text-[#666666]">
                        Wizard
                      </span>
                    </button>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666] block px-1">
                        Active Celebrations
                      </span>

                      {/* Active Event Item */}
                      <div className="p-3 rounded-xl bg-[#421d24] text-white space-y-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-xs truncate">
                            Royal Heritage Palace Wedding
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 uppercase font-semibold">
                            Nov 15
                          </span>
                        </div>
                        <div className="text-[11px] text-white/80 flex items-center space-x-2">
                          <span>📍 Jaipur, Rajasthan</span>
                          <span>•</span>
                          <span>👥 150 Guests</span>
                        </div>
                      </div>

                      {/* Other Celebrations */}
                      <div className="p-2.5 rounded-xl bg-white border border-[#e3e3e2] hover:border-[#714cb6] transition-colors cursor-pointer text-xs space-y-0.5">
                        <div className="font-bold text-[#292827] truncate">
                          30th Birthday Sunset Rooftop
                        </div>
                        <div className="text-[11px] text-[#666666]">
                          📍 Mumbai • ₹4,50,000 Budget
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#e3e3e2] hover:border-[#714cb6] transition-colors cursor-pointer text-xs space-y-0.5">
                        <div className="font-bold text-[#292827] truncate">
                          Annual Tech Community Gala
                        </div>
                        <div className="text-[11px] text-[#666666]">
                          📍 Bengaluru • 200 Guests
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="flex items-center space-x-1 font-semibold text-[11px]">
                        <CloudSun className="w-3.5 h-3.5 text-amber-600" />
                        <span>Live RSVP Alert</span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        120 of 150 guests confirmed attending for Royal Heritage Palace Wedding.
                      </p>
                    </div>
                  </div>

                  {/* Right Chat & Workspace Area */}
                  <div className="md:col-span-8 p-4 sm:p-6 flex flex-col justify-between bg-white space-y-4">
                    {/* Header bar inside mockup */}
                    <div className="flex items-center justify-between border-b border-[#e3e3e2] pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-serif font-bold text-sm sm:text-base text-[#292827]">
                            Royal Heritage Palace Wedding
                          </h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Planning Active
                          </span>
                        </div>
                        <p className="text-[11px] text-[#666666]">
                          Sunday, November 15, 2026 • Jaipur, Rajasthan • Target: 150 Attendees
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5 bg-[#f8f7f4] px-2.5 py-1 rounded-xl border border-[#e3e3e2]">
                        <span className="font-bold text-xs text-[#421d24]">₹</span>
                        <span className="text-xs font-semibold text-[#292827]">₹28,00,000</span>
                      </div>
                    </div>

                    {/* Chat Bubble Stream */}
                    <div className="space-y-4 overflow-y-auto max-h-[340px] pr-1">
                      {/* User message */}
                      <div className="flex justify-end">
                        <div className="max-w-[85%] bg-[#421d24] text-white p-3.5 rounded-2xl rounded-tr-xs text-xs sm:text-sm leading-relaxed">
                          Please check the weather for our celebration date in Jaipur, and rebalance the budget to ₹28 Lakhs.
                        </div>
                      </div>

                      {/* Assistant Response */}
                      <div className="flex justify-start">
                        <div className="max-w-[95%] bg-[#f8f7f5] border border-[#e3e3e2] p-4 rounded-2xl rounded-tl-xs space-y-3 text-xs sm:text-sm text-[#292827]">
                          {/* Tool call badges */}
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                              <CloudSun className="w-3.5 h-3.5 text-amber-600" />
                              <span>Weather Intel: Jaipur • 28°C Clear Skies, 0% Rain Probability</span>
                            </span>
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-medium">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Financial Ledger: ₹28,00,000 Synced</span>
                            </span>
                          </div>

                          <p className="leading-relaxed">
                            Weather forecast for <strong>Sunday, November 15, 2026</strong> in <strong>Jaipur, Rajasthan</strong> looks picturesque! Clear autumn skies, pleasant 28°C afternoon, and zero rain projected.
                          </p>

                          {/* Interactive Budget Card Preview */}
                          <div className="p-3 bg-white rounded-xl border border-[#e3e3e2] space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#421d24]">
                                Rebalanced Financial Ledger (100% Sum)
                              </span>
                              <span className="font-mono text-emerald-700 font-semibold">
                                Total: ₹28,00,000
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="p-2 bg-[#f8f7f5] rounded-lg">
                                <span className="text-[#666666] block">Venue & Palace Lawn (35%)</span>
                                <span className="font-bold text-[#292827]">₹9,80,000</span>
                              </div>
                              <div className="p-2 bg-[#f8f7f5] rounded-lg">
                                <span className="text-[#666666] block">Royal Rajasthani Catering (30%)</span>
                                <span className="font-bold text-[#292827]">₹8,40,000</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 text-[11px] text-[#714cb6] font-semibold">
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Public Guest Invite: festivai.com/invite/royal-udaipur-m75k (120 confirmed)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chat Input Bar Mockup */}
                    <div className="pt-2 border-t border-[#e3e3e2]">
                      <div className="relative flex items-center bg-[#f8f7f4] rounded-xl border border-[#e3e3e2] p-1.5 focus-within:border-[#714cb6]">
                        <input
                          type="text"
                          readOnly
                          value="Change venue location to Jodhpur, Rajasthan"
                          className="w-full bg-transparent px-3 py-1.5 text-xs text-[#292827] focus:outline-none cursor-default"
                        />
                        <button
                          type="button"
                          className="p-2 rounded-lg bg-[#421d24] text-white hover:bg-[#572730] transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. TRUST & SOCIAL PROOF BAND */}
        <section className="bg-white border-b border-[#e3e3e2] py-10">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <p className="text-center text-xs uppercase tracking-widest text-[#666666] font-semibold mb-6">
              Empowering luxury planners, modern couples & community festival leads across the globe
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-[#e3e3e2] border-t border-b border-[#e3e3e2]">
              {[
                "VOGUE CELEBRATIONS",
                "METROPOLITAN GALA",
                "THE GRAND PALACE",
                "SONOMA RETREATS",
                "HERITAGE WEDDINGS",
                "COMMUNITY FOUNDATION",
              ].map((name) => (
                <div
                  key={name}
                  className="py-5 px-3 flex items-center justify-center text-center font-bold text-xs tracking-wider text-[#292827]/75 hover:text-[#421d24] transition-colors"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. INTERACTIVE PRODUCT SUITE WALKTHROUGH */}
        <section className="py-20 sm:py-28 max-w-[1240px] mx-auto px-4 sm:px-6 w-full space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#714cb6]">
              Interactive System Walkthrough
            </span>
            <h2 className="text-3xl sm:text-5xl font-[460] tracking-[-0.027em] text-[#292827]">
              Every tool an organizer needs. Built as one seamless system.
            </h2>
            <p className="text-[#666666] text-sm sm:text-base font-[460]">
              Click through the tabs below to explore the core pillars powering FestivAI.
            </p>
          </div>

          {/* Interactive Tab Switcher */}
          <div className="bg-white p-1.5 rounded-2xl border border-[#e3e3e2] max-w-2xl mx-auto grid grid-cols-3 gap-1 shadow-sm">
            <button
              onClick={() => setActiveTab("chat")}
              className={`py-3 px-3 rounded-xl text-center transition-all flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 ${
                activeTab === "chat"
                  ? "bg-[#421d24] text-white shadow-sm font-semibold"
                  : "bg-white text-[#292827] hover:bg-[#f2f0eb]"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#d4c7ff]" />
              <span className="text-xs sm:text-sm">AI Concierge</span>
            </button>

            <button
              onClick={() => setActiveTab("budget")}
              className={`py-3 px-3 rounded-xl text-center transition-all flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 ${
                activeTab === "budget"
                  ? "bg-[#421d24] text-white shadow-sm font-semibold"
                  : "bg-white text-[#292827] hover:bg-[#f2f0eb]"
              }`}
            >
              <DollarSign className="w-4 h-4 text-[#d4c7ff]" />
              <span className="text-xs sm:text-sm">Budget Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab("rsvp")}
              className={`py-3 px-3 rounded-xl text-center transition-all flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 ${
                activeTab === "rsvp"
                  ? "bg-[#421d24] text-white shadow-sm font-semibold"
                  : "bg-white text-[#292827] hover:bg-[#f2f0eb]"
              }`}
            >
              <Share2 className="w-4 h-4 text-[#d4c7ff]" />
              <span className="text-xs sm:text-sm">RSVP Portal</span>
            </button>
          </div>

          {/* Tab Showcase Card */}
          <div className="paper-card p-6 sm:p-10 max-w-4xl mx-auto shadow-sm">
            {activeTab === "chat" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-[#421d24] text-white flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-[#d4c7ff]" />
                  </div>
                  <h3 className="text-2xl font-[460] text-[#292827]">
                    Conversational AI Concierge on Call 24/7
                  </h3>
                  <p className="text-sm text-[#666666] leading-relaxed font-[460]">
                    Chat naturally with an intelligent assistant that knows your guest list, venue climate, and financial balance. Ask for weather predictions on your wedding date, query remaining budget, or tell it: <em>&quot;Change location to Jaipur and reduce budget by 15%&quot;</em> — and watch everything adapt instantly.
                  </p>
                  <ul className="space-y-2 text-xs text-[#292827] font-medium">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-[#714cb6]" />
                      <span>Live global weather forecasting for any event date</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-[#714cb6]" />
                      <span>Natural language budget reallocation & venue updates</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-[#714cb6]" />
                      <span>Proactive reminders on dietary notes & RSVP deadlines</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      href="/app"
                      className="violet-link text-sm font-semibold inline-flex items-center"
                    >
                      <span>Try the Concierge Workspace</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#f8f7f4] border border-[#e3e3e2] space-y-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#e3e3e2] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#714cb6]">
                      Host Question:
                    </span>
                    <p className="font-semibold text-[#292827]">
                      &quot;What is our backup protocol if it rains on November 15?&quot;
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#e3e3e2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-800">
                        Concierge Reply:
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        Automated Plan Synced
                      </span>
                    </div>
                    <p className="text-[#292827] leading-relaxed">
                      I have configured the <strong>Covered Pavilion Contingency</strong>. Staging shifts indoors 4 hours before guest arrival, with ambient uplighting and a warm beverage welcome bar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "budget" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0c4243] text-white flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#d4c7ff]" />
                  </div>
                  <h3 className="text-2xl font-[460] text-[#292827]">
                    Zero-Math Flawless Financial Matrix
                  </h3>
                  <p className="text-sm text-[#666666] leading-relaxed font-[460]">
                    Never worry about spreadsheet formula errors again. FestivAI guarantees that every single category sums exactly to 100% of your total celebration budget. Change total budget at any time, and all allocations proportionally rebalance automatically.
                  </p>

                  {/* Currency Switcher Demo */}
                  <div className="p-3 bg-[#f8f7f4] rounded-xl border border-[#e3e3e2] space-y-2">
                    <span className="text-xs font-bold text-[#421d24] block">
                      Preview in your local currency:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["INR", "USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setDemoCurrency(c)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            demoCurrency === c
                              ? "bg-[#421d24] text-white"
                              : "bg-white text-[#292827] hover:bg-[#e3e3e2]"
                          }`}
                        >
                          {c} ({getCurrencySymbol(c)})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/app"
                      className="violet-link text-sm font-semibold inline-flex items-center"
                    >
                      <span>Explore Budgeting in App</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#f8f7f4] border border-[#e3e3e2] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#421d24]">
                      Total Allocation: {getCurrencySymbol(demoCurrency)} {demoTotal.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      100% Sum Equality Verified
                    </span>
                  </div>

                  <div className="space-y-2">
                    {demoCategories.map((cat) => {
                      const amount = Math.round((cat.allocPct / 100) * demoTotal);
                      return (
                        <div key={cat.name} className="p-2.5 bg-white rounded-xl border border-[#e3e3e2] text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-[#292827]">{cat.name}</span>
                            <span className="font-mono text-[#421d24] font-bold">
                              {getCurrencySymbol(demoCurrency)} {amount.toLocaleString()} ({cat.allocPct}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#f2f0eb] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#714cb6] h-1.5 rounded-full"
                              style={{ width: `${cat.allocPct * 2.5}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "rsvp" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-[#714cb6] text-white flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-[#d4c7ff]" />
                  </div>
                  <h3 className="text-2xl font-[460] text-[#292827]">
                    Bespoke Public Digital Invites & RSVPs
                  </h3>
                  <p className="text-sm text-[#666666] leading-relaxed font-[460]">
                    Every celebration comes with a clean, branded public invitation page. Send your link across WhatsApp, SMS, or email. Guests view schedule timings, custom cover photography, directions, and submit attendance and dietary preferences with instant confetti celebration.
                  </p>
                  <ul className="space-y-2 text-xs text-[#292827] font-medium">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-[#714cb6]" />
                      <span>Real-time guest count synchronization</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-[#714cb6]" />
                      <span>Dedicated dietary notes tracker (Vegan, Gluten-free, Allergies)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-[#714cb6]" />
                      <span>No guest login or app download required</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      href="/app"
                      className="violet-link text-sm font-semibold inline-flex items-center"
                    >
                      <span>Create Your First Invite</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#f8f7f4] border border-[#e3e3e2] flex flex-col items-center">
                  <div className="w-full max-w-sm bg-white rounded-2xl border border-[#e3e3e2] p-5 shadow-sm space-y-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#714cb6]">
                      Public Invite Preview
                    </span>
                    <h4 className="font-serif font-bold text-lg text-[#292827]">
                      Royal Heritage Palace Wedding
                    </h4>
                    <p className="text-xs text-[#666666]">
                      Sunday, November 15, 2026 • Jaipur, Rajasthan
                    </p>

                    <div className="p-3 bg-[#f8f7f5] rounded-xl text-xs space-y-1">
                      <span className="font-semibold text-[#421d24] block">
                        Will you be attending?
                      </span>
                      <div className="flex justify-center space-x-2 pt-1">
                        <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold">
                          Attending ✓
                        </span>
                        <span className="px-3 py-1 bg-white border border-[#e3e3e2] text-[#666666] rounded-lg text-xs">
                          Regretfully Decline
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#666666] pt-1 border-t border-[#e3e3e2]">
                      🎉 120 guests already confirmed
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 6. HOW IT WORKS (3 SIMPLE STEPS) */}
        <section id="how-it-works" className="py-20 bg-white border-t border-b border-[#e3e3e2]">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-14">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#714cb6]">
                Simple & Seamless
              </span>
              <h2 className="text-3xl sm:text-5xl font-[460] tracking-[-0.027em] text-[#292827]">
                From idea to orchestrated celebration in 3 steps.
              </h2>
              <p className="text-[#666666] text-sm sm:text-base font-[460]">
                No tedious spreadsheets, no lost messages. FestivAI coordinates everything in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="p-6 rounded-2xl bg-[#f8f7f5] border border-[#e3e3e2] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#421d24] text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="text-lg font-bold text-[#292827]">Describe Your Celebration</h3>
                <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                  Enter your event category (Wedding, Birthday, Gala), target location, guest headcount, total budget, and aesthetic vibe.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-[#e3e3e2] text-[11px] text-[#292827] italic">
                  &quot;Tuscan Garden Wedding in Napa Valley for 90 guests with $25,000&quot;
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-2xl bg-[#f8f7f5] border border-[#e3e3e2] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#714cb6] text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="text-lg font-bold text-[#292827]">Get Balanced Masterplan</h3>
                <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                  In seconds, FestivAI calculates a 100% mathematically balanced budget breakdown, phased milestone schedule, and vendor vetting rubric.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-[#e3e3e2] text-[11px] text-emerald-800 font-medium">
                  ✓ 6 Vendor Categories • 5 Milestones • Zero Formula Errors
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-2xl bg-[#f8f7f5] border border-[#e3e3e2] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#0c4243] text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="text-lg font-bold text-[#292827]">Chat & Adapt Live</h3>
                <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                  Use your AI Concierge to forecast weather, adjust line items conversationally, and track guest RSVPs with your shareable digital link.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-[#e3e3e2] text-[11px] text-[#714cb6] font-medium">
                  ✓ Instant WhatsApp/SMS Share Link with Confetti RSVP
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. CELEBRATION TYPES / USE CASES */}
        <section id="celebrations" className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#714cb6]">
              Versatile Planning
            </span>
            <h2 className="text-3xl sm:text-5xl font-[460] tracking-[-0.027em] text-[#292827]">
              Tailored for every memorable milestone.
            </h2>
            <p className="text-[#666666] text-sm sm:text-base font-[460]">
              From intimate backyard celebrations to grand community festivals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Use Case 1: Weddings */}
            <div className="paper-card p-5 space-y-3 hover:border-[#714cb6] transition-colors">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#292827]">Weddings & Receptions</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Multi-day scheduling, catering tastings, photographer shot lists, and guest dietary matrix tracking.
              </p>
              <span className="text-[10px] font-semibold text-[#714cb6] bg-[#d4c7ff]/50 px-2 py-0.5 rounded-full block w-fit">
                Destination & Local
              </span>
            </div>

            {/* Use Case 2: Birthdays */}
            <div className="paper-card p-5 space-y-3 hover:border-[#714cb6] transition-colors">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Cake className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#292827]">Milestone Birthdays</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Rooftop 30th/40th bashes, curated mixology menus, custom playlists, and instant photo guestbooks.
              </p>
              <span className="text-[10px] font-semibold text-[#714cb6] bg-[#d4c7ff]/50 px-2 py-0.5 rounded-full block w-fit">
                Party & Entertainment
              </span>
            </div>

            {/* Use Case 3: Galas & Non-Profit */}
            <div className="paper-card p-5 space-y-3 hover:border-[#714cb6] transition-colors">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#292827]">Galas & Fundraisers</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Sponsor tier budgeting, silent auction staging, keynote audio cues, and VIP guest check-ins.
              </p>
              <span className="text-[10px] font-semibold text-[#714cb6] bg-[#d4c7ff]/50 px-2 py-0.5 rounded-full block w-fit">
                Corporate & Gala
              </span>
            </div>

            {/* Use Case 4: Festivals */}
            <div className="paper-card p-5 space-y-3 hover:border-[#714cb6] transition-colors">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#292827]">Community Festivals</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Outdoor acoustics, rain contingency alerts, food truck allocations, and high-volume public RSVPs.
              </p>
              <span className="text-[10px] font-semibold text-[#714cb6] bg-[#d4c7ff]/50 px-2 py-0.5 rounded-full block w-fit">
                High Capacity
              </span>
            </div>
          </div>
        </section>

        {/* 8. PROVEN RESULTS & METRICS */}
        <section className="bg-[#421d24] text-white py-16 px-4 sm:px-6">
          <div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-5xl font-bold font-serif text-[#d4c7ff]">15,000+</div>
              <div className="text-xs sm:text-sm text-white/80">Celebrations Coordinated</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-5xl font-bold font-serif text-[#d4c7ff]">100%</div>
              <div className="text-xs sm:text-sm text-white/80">Budget Sum Balance Guarantee</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-5xl font-bold font-serif text-[#d4c7ff]">28s</div>
              <div className="text-xs sm:text-sm text-white/80">Average Generation Speed</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-5xl font-bold font-serif text-[#d4c7ff]">99.4%</div>
              <div className="text-xs sm:text-sm text-white/80">Guest RSVP Completion Rate</div>
            </div>
          </div>
        </section>

        {/* 9. TESTIMONIALS (EDITORIAL SOCIAL PROOF) */}
        <section className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#714cb6]">
              Real Organizer Stories
            </span>
            <h2 className="text-3xl sm:text-5xl font-[460] tracking-[-0.027em] text-[#292827]">
              Loved by hosts and luxury planners.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="paper-card p-6 space-y-4">
              <div className="flex text-amber-500 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#292827] leading-relaxed italic">
                &quot;FestivAI saved our wedding. We had an unexpected venue rate hike 3 weeks before the date. We typed one sentence into the chat, and the AI automatically renegotiated line items to keep our total budget intact.&quot;
              </p>
              <div className="border-t border-[#e3e3e2] pt-3 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#421d24] text-white flex items-center justify-center font-bold text-xs">
                  S
                </div>
                <div>
                  <div className="text-xs font-bold text-[#292827]">Samantha & Ryan M.</div>
                  <div className="text-[10px] text-[#666666]">Napa Valley Garden Wedding • 90 Guests</div>
                </div>
              </div>
            </div>

            <div className="paper-card p-6 space-y-4">
              <div className="flex text-amber-500 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#292827] leading-relaxed italic">
                &quot;The weather intelligence feature is pure magic. Knowing the exact precipitation risk and sun angles for our outdoor sunset gala gave our caterers and lighting engineers the confidence to build a flawless evening.&quot;
              </p>
              <div className="border-t border-[#e3e3e2] pt-3 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#714cb6] text-white flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-[#292827]">Aarav Mehta</div>
                  <div className="text-[10px] text-[#666666]">Luxury Event Director • Mumbai & Goa</div>
                </div>
              </div>
            </div>

            <div className="paper-card p-6 space-y-4">
              <div className="flex text-amber-500 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#292827] leading-relaxed italic">
                &quot;I coordinated my 30th birthday in 10 minutes on my phone. The public invite link was gorgeous, and guest dietary restrictions were clearly tallied so the chef had zero surprises.&quot;
              </p>
              <div className="border-t border-[#e3e3e2] pt-3 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#0c4243] text-white flex items-center justify-center font-bold text-xs">
                  C
                </div>
                <div>
                  <div className="text-xs font-bold text-[#292827]">Chloe D.</div>
                  <div className="text-[10px] text-[#666666]">Rooftop Bash Host • London</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 10. TRANSPARENT PRICING TIERS */}
        <section id="pricing" className="py-20 bg-white border-t border-b border-[#e3e3e2]">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#714cb6]">
                Transparent Pricing
              </span>
              <h2 className="text-3xl sm:text-5xl font-[460] tracking-[-0.027em] text-[#292827]">
                Start free. Upgrade as your celebrations grow.
              </h2>
              <p className="text-[#666666] text-sm sm:text-base font-[460]">
                No hidden fees. Everything you need to plan your celebration stress-free.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Tier 1: Free */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#f8f7f5] border border-[#e3e3e2] space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-[#292827]">Host Free</h3>
                    <p className="text-xs text-[#666666]">For single celebration hosts and birthdays</p>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-bold font-serif text-[#292827]">$0</span>
                    <span className="text-xs text-[#666666]">/ forever</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[#292827] pt-2">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1 Active Celebration Masterplan</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>100% Balanced Budget Calculations</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Public Shareable RSVP Page</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Standard AI Planning Models</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/app"
                  className="w-full py-3 rounded-xl bg-white border border-[#e3e3e2] hover:border-[#714cb6] text-center text-xs font-semibold text-[#292827] transition-all block shadow-xs"
                >
                  Start Free Today
                </Link>
              </div>

              {/* Tier 2: Concierge Pro (Featured) */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#421d24] text-white border-2 border-[#714cb6] space-y-6 flex flex-col justify-between relative shadow-xl">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#714cb6] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-white">Concierge Pro</h3>
                    <p className="text-xs text-white/70">For weddings, galas & luxury events</p>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-bold font-serif text-white">$19</span>
                    <span className="text-xs text-white/70">/ event</span>
                  </div>
                  <ul className="space-y-2 text-xs text-white/90 pt-2">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-[#d4c7ff] shrink-0" />
                      <span>Unlimited Celebrations & Masterplans</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-[#d4c7ff] shrink-0" />
                      <span>Live Weather Intelligence & Climate Forecasts</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-[#d4c7ff] shrink-0" />
                      <span>Conversational Budget & Venue Editing</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-[#d4c7ff] shrink-0" />
                      <span>Global Multi-Currency Support (₹, $, €, £)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-[#d4c7ff] shrink-0" />
                      <span>Custom Cover Uploads & Photo Banners</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/app"
                  className="w-full py-3 rounded-xl bg-[#d4c7ff] text-[#292827] text-center text-xs font-bold hover:bg-[#c4b5fa] transition-all block shadow-sm"
                >
                  Launch Concierge Pro
                </Link>
              </div>

              {/* Tier 3: Planner Studio */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#f8f7f5] border border-[#e3e3e2] space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-[#292827]">Planner Studio</h3>
                    <p className="text-xs text-[#666666]">For professional event coordinators & agencies</p>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-bold font-serif text-[#292827]">$79</span>
                    <span className="text-xs text-[#666666]">/ month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[#292827] pt-2">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Unlimited Client Workspaces</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>White-Label Branding on Public Invites</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Vendor Contract & Budget CSV Exports</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Priority OpenAI Reasoning Engine</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/app"
                  className="w-full py-3 rounded-xl bg-white border border-[#e3e3e2] hover:border-[#714cb6] text-center text-xs font-semibold text-[#292827] transition-all block shadow-xs"
                >
                  Contact Studio Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 11. INTERACTIVE FAQ ACCORDION */}
        <section id="faq" className="py-20 max-w-[800px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#714cb6]">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-[460] text-[#292827]">
              Got questions? We have answers.
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "How does FestivAI guarantee that budget allocations sum to 100%?",
                a: "FestivAI uses a proprietary integer-balanced allocation algorithm. Each vendor line item (Venue, Catering, Decor, etc.) receives a mathematically verified percentage, and the final item auto-absorbs any rounding variance. There are zero floating-point math errors.",
              },
              {
                q: "Can I edit event details or budget after the plan is generated?",
                a: "Yes! You can edit any celebration detail anytime either via the 'Edit Details' modal or simply by asking your AI Concierge in chat (e.g., 'Change location to Jaipur and reduce budget by 10%'). The financial ledger immediately adapts and persists.",
              },
              {
                q: "Do guests need an account or app to submit their RSVP?",
                a: "No! Your guests simply click your public link (e.g., festivai.com/invite/[slug]), choose attending or decline, submit dietary preferences, and receive instant confirmation with celebratory confetti. No password or login required.",
              },
              {
                q: "Which currencies are supported?",
                a: "FestivAI supports Indian Rupees (₹ with Lakh/Crore formatting), US Dollars ($), Euros (€), British Pounds (£), Canadian Dollars (C$), Australian Dollars (A$), and UAE Dirhams (AED). You can switch currencies anytime.",
              },
              {
                q: "How does the Weather Intelligence tool work?",
                a: "When you ask about weather in the chat concierge, FestivAI queries live meteorological data for your celebration city and date, reporting expected temperature ranges, precipitation probabilities, and sunshine duration.",
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="paper-card overflow-hidden transition-all border border-[#e3e3e2]"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between font-semibold text-xs sm:text-sm text-[#292827] hover:text-[#714cb6] transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#714cb6] shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#666666] shrink-0 ml-2" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-[#666666] leading-relaxed border-t border-[#f2f0eb] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 12. BOTTOM CONVERSION CALL TO ACTION (DEEP LAGOON #0c4243) */}
        <section className="w-full bg-[#0c4243] text-white py-20 px-4 sm:px-6 relative overflow-hidden">
          <div className="max-w-[1240px] mx-auto text-center space-y-6 relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#d4c7ff]">
              Start Planning Now
            </span>
            <h2 className="text-3xl sm:text-5xl font-[460] tracking-[-0.028em] text-white max-w-2xl mx-auto leading-tight">
              Your next extraordinary celebration starts with a single prompt.
            </h2>
            <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto font-[460]">
              Join thousands of organizers planning weddings, birthdays, and community festivals with AI elegance.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/app"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-[#d4c7ff] text-[#292827] text-sm font-bold hover:bg-[#c4b5fa] transition-all shadow-lg"
              >
                <span>Launch AI Workspace Free</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 13. SITE-WIDE FOOTER (MIDNIGHT WINE #421d24) */}
      <footer className="w-full bg-[#421d24] text-white py-16 px-4 sm:px-6 border-t border-[#421d24]">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-white text-[#421d24] flex items-center justify-center font-bold text-sm">
                F
              </div>
              <span className="text-lg font-bold tracking-tight text-white">FestivAI</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-[460]">
              The GenAI celebration and event planning concierge. Zero-error budgets, phased milestone schedules, and global RSVP portals.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform</h4>
            <ul className="space-y-2 text-xs font-[460] text-white/70">
              <li>
                <Link href="/app" className="hover:text-white transition-colors">
                  AI Concierge Chat
                </Link>
              </li>
              <li>
                <Link href="/app" className="hover:text-white transition-colors">
                  Event Setup Wizard
                </Link>
              </li>
              <li>
                <Link href="/app" className="hover:text-white transition-colors">
                  Live Weather Intelligence
                </Link>
              </li>
              <li>
                <Link href="/app" className="hover:text-white transition-colors">
                  Shareable Public RSVPs
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Celebrations</h4>
            <ul className="space-y-2 text-xs font-[460] text-white/70">
              <li>Weddings & Receptions</li>
              <li>Milestone Birthdays</li>
              <li>Community Festivals</li>
              <li>Charity Galas & Banquets</li>
              <li>Corporate Retreats</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Currencies</h4>
            <ul className="space-y-2 text-xs font-[460] text-white/70">
              <li>Indian Rupee (₹ INR)</li>
              <li>US Dollar ($ USD)</li>
              <li>Euro (€ EUR)</li>
              <li>British Pound (£ GBP)</li>
              <li>Canadian & Australian Dollar</li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto mt-12 pt-6 border-t border-white/10 text-center text-xs text-white/60 flex flex-col sm:flex-row items-center justify-between gap-2 font-[460]">
          <p>© 2026 FestivAI. All rights reserved. Crafted for memorable celebrations worldwide.</p>
          <div className="flex items-center space-x-4">
            <Link href="/app" className="hover:text-white transition-colors">
              Launch App
            </Link>
            <span>•</span>
            <Link href="#preview" className="hover:text-white transition-colors">
              Product Tour
            </Link>
            <span>•</span>
            <Link href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
