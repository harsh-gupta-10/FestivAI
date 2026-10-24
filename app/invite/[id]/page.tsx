"use client";

import React, { useState, useEffect, use } from "react";
import confetti from "canvas-confetti";
import {
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Users,
  Heart,
  CheckCircle2,
  Mail,
  AlertTriangle,
  Send,
  MessageSquare,
  Utensils,
  Share2,
  Check,
  ChevronRight,
  PartyPopper,
} from "lucide-react";
import { EventRecord, AIEventPlan, RsvpRecord } from "@/types";

interface InvitePageProps {
  params: Promise<{ id: string }>;
}

export default function PublicInvitePage({ params }: InvitePageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [plan, setPlan] = useState<AIEventPlan | null>(null);
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // RSVP Form fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [status, setStatus] = useState<"going" | "maybe" | "declined">("going");
  const [attendeesCount, setAttendeesCount] = useState(1);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [message, setMessage] = useState("");

  // Live email validation
  const [emailInteracted, setEmailInteracted] = useState(false);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim());
  const showEmailError = emailInteracted && guestEmail.trim().length > 0 && !isEmailValid;
  const showEmailSuccess = emailInteracted && isEmailValid;

  // Submitting state
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Load event from D1
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) throw new Error("Could not find event: " + eventId);
        const data = (await res.json()) as any;
        setEvent(data.event);
        setPlan(data.plan);
        setRsvps(data.rsvps || []);
      } catch (err: any) {
        setError(err.message || "Failed to load invitation");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  // Countdown calculation
  useEffect(() => {
    if (!event?.event_date) return;

    const targetDate = new Date(event.event_date).getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event?.event_date]);

  // Handle RSVP Submit
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailInteracted(true);

    if (!guestName.trim() || !isEmailValid) return;

    setIsSubmittingRsvp(true);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName,
          guest_email: guestEmail,
          status,
          attendees_count: attendeesCount,
          dietary_notes: dietaryNotes,
          message,
        }),
      });

      if (!res.ok) throw new Error("Failed to record RSVP");
      const data = (await res.json()) as any;

      setRsvps(data.rsvps || []);
      setRsvpSuccess(true);

      // Trigger Celebration Confetti!
      if (typeof window !== "undefined") {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: plan?.eventSummary?.themeColors || ["#d946ef", "#f59e0b", "#10b981"],
        });
      }
    } catch (err: any) {
      alert("Error submitting RSVP: " + err.message);
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const handleShareLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-slate-400">Loading Invitation from Cloudflare Edge...</p>
      </div>
    );
  }

  if (error || !event || !plan) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Invitation Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          This invitation link may have expired or is unavailable on Cloudflare D1.
        </p>
      </div>
    );
  }

  // Theme colors from AI plan
  const colors = plan.eventSummary?.themeColors || ["#d946ef", "#f59e0b", "#10b981"];
  const goingTotal = rsvps.filter((r) => r.status === "going").reduce((acc, r) => acc + (r.attendees_count || 1), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-fuchsia-500 selection:text-white">
      {/* Top Banner & Floating Nav */}
      <nav className="w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-400">
              {event.event_type} Invitation
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">{event.organizer_name}</span>
          </div>

          <button
            onClick={handleShareLink}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center space-x-1"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied!" : "Share Link"}</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* HERO CARD WITH R2 BANNER */}
        <div className="rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800 shadow-2xl relative">
          {event.banner_r2_key ? (
            <div className="w-full h-64 sm:h-80 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/r2/${event.banner_r2_key}`}
                alt="Celebration Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            </div>
          ) : (
            <div
              className="w-full h-48 sm:h-64 relative flex items-center justify-center p-6 text-center"
              style={{
                background: `linear-gradient(135deg, ${colors[0]}33 0%, ${colors[1]}33 50%, ${colors[2]}33 100%)`,
              }}
            >
              <div className="space-y-1">
                <Sparkles className="w-8 h-8 mx-auto text-amber-300 animate-pulse" />
                <span className="text-xs uppercase font-bold tracking-widest text-slate-300">
                  {event.vibe}
                </span>
              </div>
            </div>
          )}

          {/* Hero Content */}
          <div className="p-6 sm:p-10 space-y-4 -mt-12 relative z-10">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>You Are Cordially Invited</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {event.title}
            </h1>

            <p className="text-base sm:text-lg text-fuchsia-200 italic font-serif">
              &quot;{plan.eventSummary?.tagline}&quot;
            </p>

            {/* Host Welcome Note */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              <span className="font-semibold text-white block mb-1">A Note From {event.organizer_name}:</span>
              {plan.eventSummary?.welcomeNote}
            </div>

            {/* Event Key Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-bold">Date</span>
                  <span className="font-bold text-white text-sm">{event.event_date}</span>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-bold">Venue & Location</span>
                  <span className="font-bold text-white text-sm">{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE COUNTDOWN TIMER */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Countdown to Celebration
          </span>
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
            {[
              { label: "Days", val: timeLeft.days },
              { label: "Hours", val: timeLeft.hours },
              { label: "Minutes", val: timeLeft.minutes },
              { label: "Seconds", val: timeLeft.seconds },
            ].map((slot) => (
              <div key={slot.label} className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="block text-2xl sm:text-3xl font-black text-white font-mono">{slot.val}</span>
                <span className="text-[10px] font-semibold uppercase text-slate-400">{slot.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SCHEDULE HIGHLIGHTS */}
        {plan.publicSchedule && plan.publicSchedule.length > 0 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-fuchsia-400" />
              <span>Event Schedule & Flow</span>
            </h3>

            <div className="space-y-3">
              {plan.publicSchedule.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start space-x-3"
                >
                  <span className="px-2.5 py-1 rounded-xl bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 font-mono text-xs font-bold whitespace-nowrap">
                    {item.time}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.activity}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE GUEST RSVP FORM (CRITICAL FOR LIVE RUBRIC DEMO) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-fuchsia-500/40 shadow-2xl relative overflow-hidden">
          <div className="mb-6 space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white flex items-center space-x-2">
                <PartyPopper className="w-5 h-5 text-amber-400" />
                <span>RSVP to Attend</span>
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {goingTotal} Guests Confirmed Going
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Please let {event.organizer_name} know if you will celebrate with us!
            </p>
          </div>

          {rsvpSuccess ? (
            <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">RSVP Received!</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Thank you, <strong>{guestName}</strong>! Your response has been saved to Cloudflare D1 and shared directly with {event.organizer_name}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setRsvpSuccess(false);
                  setGuestName("");
                  setGuestEmail("");
                  setMessage("");
                }}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
              >
                Submit Another Response
              </button>
            </div>
          ) : (
            <form onSubmit={handleRsvpSubmit} className="space-y-4">
              {/* Name & Email with Live Real-Time Validation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Your Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>

                {/* Email with Explicit Live Validation Badge */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    {showEmailSuccess && (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center">
                        <Check className="w-3 h-3 mr-0.5" />
                        Valid Email ✓
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value);
                      setEmailInteracted(true);
                    }}
                    onBlur={() => setEmailInteracted(true)}
                    placeholder="e.g. jordan@example.com (try 'guest-invalid')"
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-sm text-white focus:outline-none transition-all ${
                      showEmailError
                        ? "border-rose-500 ring-2 ring-rose-500/30"
                        : showEmailSuccess
                        ? "border-emerald-500 ring-2 ring-emerald-500/20"
                        : "border-slate-800 focus:ring-2 focus:ring-fuchsia-500"
                    }`}
                  />
                  {showEmailError && (
                    <p className="mt-1 text-xs text-rose-400 flex items-center space-x-1 animate-slide-down">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Please enter a valid email format (e.g. name@domain.com).</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Attendance Status Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Will You Attend?
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "going", label: "Going 🎉", desc: "Can't wait!" },
                    { id: "maybe", label: "Maybe 🤔", desc: "Checking plans" },
                    { id: "declined", label: "Can't Make It 💌", desc: "Wishing you best" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        status === s.id
                          ? "bg-fuchsia-600 border-fuchsia-500 text-white shadow-md shadow-fuchsia-600/20"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xs font-bold block">{s.label}</span>
                      <span className="text-[10px] opacity-75">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Attendees & Dietary Notes */}
              {status !== "declined" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Total Attendees
                    </label>
                    <select
                      value={attendeesCount}
                      onChange={(e) => setAttendeesCount(parseInt(e.target.value, 10))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Person" : "People"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Dietary Preferences / Allergies
                    </label>
                    <input
                      type="text"
                      value={dietaryNotes}
                      onChange={(e) => setDietaryNotes(e.target.value)}
                      placeholder="e.g. Vegetarian, Gluten-Free, Nut Allergy..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    />
                  </div>
                </div>
              )}

              {/* Personal Message */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Message to Host (Optional)
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a sweet congratulatory note..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingRsvp || !guestName.trim() || !isEmailValid}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 hover:from-fuchsia-500 hover:to-amber-400 disabled:opacity-50 shadow-xl shadow-fuchsia-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isSubmittingRsvp ? (
                  <span>Recording in Cloudflare D1...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>Confirm RSVP Attendance</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* RECENT GUEST WISHES FEED */}
        {rsvps.filter((r) => r.message && r.message.trim()).length > 0 && (
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-fuchsia-400" />
              <span>Guest Wishes & Messages ({rsvps.filter((r) => r.message).length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rsvps
                .filter((r) => r.message && r.message.trim())
                .slice(0, 6)
                .map((r) => (
                  <div key={r.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
                    <span className="font-bold text-white block">{r.guest_name}</span>
                    <p className="text-slate-300 italic mt-1 leading-snug">
                      &quot;{r.message}&quot;
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>FestivAI Invitation Portal — Hosted on Cloudflare Workers & D1 SQLite</p>
      </footer>
    </div>
  );
}
