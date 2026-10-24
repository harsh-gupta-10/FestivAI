"use client";

import React, { useState, useEffect, use } from "react";
import confetti from "canvas-confetti";
import {
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Share2,
  Check,
  PartyPopper,
} from "lucide-react";
import { EventRecord, AIEventPlan, RsvpRecord } from "@/types";

export interface PublicInviteProps {
  params: Promise<{ id: string }>;
}

export function PublicInvite({ params }: PublicInviteProps) {
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
          colors: plan?.eventSummary?.themeColors || ["#d4c7ff", "#421d24", "#714cb6"],
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
      <div className="min-h-screen bg-[#f2f0eb] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-xl bg-[#421d24] text-white flex items-center justify-center font-bold animate-spin shadow-sm">
          F
        </div>
        <p className="mt-4 text-xs font-[460] text-[#666666]">Loading Invitation from Cloudflare Edge...</p>
      </div>
    );
  }

  if (error || !event || !plan) {
    return (
      <div className="min-h-screen bg-[#f2f0eb] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-[#292827] mb-2">Invitation Not Found</h2>
        <p className="text-xs text-[#666666] max-w-sm mb-4">
          This invitation link may have expired or is unavailable on Cloudflare D1.
        </p>
      </div>
    );
  }

  const colors = plan.eventSummary?.themeColors || ["#d4c7ff", "#421d24", "#714cb6"];
  const goingTotal = rsvps.filter((r) => r.status === "going").reduce((acc, r) => acc + (r.attendees_count || 1), 0);

  return (
    <div className="min-h-screen bg-[#f2f0eb] text-[#292827] flex flex-col font-sans selection:bg-[#d4c7ff] selection:text-[#292827]">
      {/* Top Banner & Floating Nav */}
      <nav className="w-full border-b border-[#e3e3e2] bg-[#f2f0eb]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1000px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#421d24]">
              {event.event_type} Invitation
            </span>
            <span className="text-[#999999]">•</span>
            <span className="text-xs text-[#666666]">{event.organizer_name}</span>
          </div>

          <button
            onClick={handleShareLink}
            className="px-3 py-1.5 rounded-lg text-xs font-[540] bg-white hover:bg-[#f8f7f5] text-[#292827] border border-[#e3e3e2] transition-colors flex items-center space-x-1"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied!" : "Share Link"}</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-[800px] w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* HERO CARD WITH R2 BANNER */}
        <div className="paper-card overflow-hidden shadow-sm relative">
          {event.banner_r2_key ? (
            <div className="w-full h-64 sm:h-80 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/r2/${event.banner_r2_key}`}
                alt="Celebration Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
            </div>
          ) : (
            <div
              className="w-full h-48 sm:h-64 relative flex items-center justify-center p-6 text-center"
              style={{
                background: `linear-gradient(135deg, ${colors[0]}44 0%, ${colors[1]}33 50%, ${colors[2]}44 100%)`,
              }}
            >
              <div className="space-y-1">
                <Sparkles className="w-8 h-8 mx-auto text-[#421d24] animate-pulse" />
                <span className="text-xs uppercase font-bold tracking-widest text-[#292827]">
                  {event.vibe}
                </span>
              </div>
            </div>
          )}

          {/* Hero Content */}
          <div className="p-6 sm:p-10 space-y-4 -mt-10 relative z-10 bg-white/95 backdrop-blur-sm rounded-t-3xl border-t border-[#e3e3e2]">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-[540] uppercase tracking-wider bg-[#d4c7ff] text-[#292827] border border-[#292827]/10">
              <Sparkles className="w-3.5 h-3.5 text-[#421d24]" />
              <span>You Are Cordially Invited</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-[460] tracking-[-0.028em] text-[#292827] leading-tight">
              {event.title}
            </h1>

            <p className="text-base sm:text-lg text-[#714cb6] italic font-serif">
              &quot;{plan.eventSummary?.tagline}&quot;
            </p>

            {/* Host Welcome Note */}
            <div className="p-4 rounded-2xl bg-[#f8f7f5] border border-[#e3e3e2] text-xs sm:text-sm text-[#292827] leading-relaxed font-sans">
              <span className="font-bold text-[#292827] block mb-1">A Note From {event.organizer_name}:</span>
              {plan.eventSummary?.welcomeNote}
            </div>

            {/* Event Key Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#f8f7f5] border border-[#e3e3e2] flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <span className="block text-[#666666] text-[10px] uppercase font-bold">Date</span>
                  <span className="font-bold text-[#292827] text-sm">{event.event_date}</span>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f8f7f5] border border-[#e3e3e2] flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-[#421d24] flex-shrink-0" />
                <div>
                  <span className="block text-[#666666] text-[10px] uppercase font-bold">Venue & Location</span>
                  <span className="font-bold text-[#292827] text-sm">{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE COUNTDOWN TIMER */}
        <div className="paper-card p-6 text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#666666]">
            Countdown to Celebration
          </span>
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
            {[
              { label: "Days", val: timeLeft.days },
              { label: "Hours", val: timeLeft.hours },
              { label: "Minutes", val: timeLeft.minutes },
              { label: "Seconds", val: timeLeft.seconds },
            ].map((slot) => (
              <div key={slot.label} className="p-3 rounded-2xl bg-[#f8f7f5] border border-[#e3e3e2]">
                <span className="block text-2xl sm:text-3xl font-[460] text-[#292827] font-mono">{slot.val}</span>
                <span className="text-[10px] font-semibold uppercase text-[#666666]">{slot.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SCHEDULE HIGHLIGHTS */}
        {plan.publicSchedule && plan.publicSchedule.length > 0 && (
          <div className="paper-card p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-bold text-[#292827] flex items-center space-x-2">
              <Clock className="w-5 h-5 text-[#714cb6]" />
              <span>Event Schedule & Flow</span>
            </h3>

            <div className="space-y-3">
              {plan.publicSchedule.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#f8f7f5] border border-[#e3e3e2] flex items-start space-x-3"
                >
                  <span className="px-2.5 py-1 rounded-xl bg-[#d4c7ff] text-[#292827] font-mono text-xs font-bold whitespace-nowrap">
                    {item.time}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#292827]">{item.activity}</h4>
                    <p className="text-[11px] text-[#666666] mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE GUEST RSVP FORM */}
        <div className="paper-card p-6 sm:p-8 relative overflow-hidden shadow-sm">
          <div className="mb-6 space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#292827] flex items-center space-x-2">
                <PartyPopper className="w-5 h-5 text-[#421d24]" />
                <span>RSVP to Attend</span>
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {goingTotal} Confirmed Attending
              </span>
            </div>
            <p className="text-xs text-[#666666]">
              Please let {event.organizer_name} know if you will celebrate with us!
            </p>
          </div>

          {rsvpSuccess ? (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-3 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-emerald-950">RSVP Received!</h3>
              <p className="text-xs text-emerald-900 max-w-sm mx-auto leading-relaxed">
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
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#f8f7f5] text-[#292827] border border-[#e3e3e2] transition-colors"
              >
                Submit Another Response
              </button>
            </div>
          ) : (
            <form onSubmit={handleRsvpSubmit} className="space-y-4">
              {/* Name & Email with Live Real-Time Validation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] mb-1.5">
                    Your Full Name <span className="text-[#421d24]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e3e3e2] text-sm text-[#292827] focus:outline-none focus:ring-2 focus:ring-[#714cb6]/40"
                  />
                </div>

                {/* Email with Explicit Live Validation Badge */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                      Email Address <span className="text-[#421d24]">*</span>
                    </label>
                    {showEmailSuccess && (
                      <span className="text-[11px] font-bold text-emerald-800 flex items-center">
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
                    className={`w-full px-4 py-2.5 rounded-xl bg-white border text-sm text-[#292827] focus:outline-none transition-all ${
                      showEmailError
                        ? "border-[#421d24] ring-2 ring-[#421d24]/20 bg-rose-50/30"
                        : showEmailSuccess
                        ? "border-emerald-500 ring-2 ring-emerald-500/20"
                        : "border-[#e3e3e2] focus:ring-2 focus:ring-[#714cb6]/40"
                    }`}
                  />
                  {showEmailError && (
                    <p className="mt-1 text-xs text-[#421d24] flex items-center space-x-1 animate-slide-up">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Please enter a valid email format (e.g. name@domain.com).</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Attendance Status Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] mb-2">
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
                          ? "bg-[#d4c7ff] border-[#292827] text-[#292827] font-semibold shadow-sm"
                          : "bg-white border-[#e3e3e2] text-[#666666] hover:text-[#292827]"
                      }`}
                    >
                      <span className="text-xs font-bold block">{s.label}</span>
                      <span className="text-[10px] text-[#666666]">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Attendees & Dietary Notes */}
              {status !== "declined" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] mb-1.5">
                      Total Attendees
                    </label>
                    <select
                      value={attendeesCount}
                      onChange={(e) => setAttendeesCount(parseInt(e.target.value, 10))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e3e3e2] text-sm text-[#292827] focus:outline-none focus:ring-2 focus:ring-[#714cb6]/40"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Person" : "People"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] mb-1.5">
                      Dietary Preferences / Allergies
                    </label>
                    <input
                      type="text"
                      value={dietaryNotes}
                      onChange={(e) => setDietaryNotes(e.target.value)}
                      placeholder="e.g. Vegetarian, Gluten-Free, Nut Allergy..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e3e3e2] text-sm text-[#292827] focus:outline-none focus:ring-2 focus:ring-[#714cb6]/40"
                    />
                  </div>
                </div>
              )}

              {/* Personal Message */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] mb-1.5">
                  Message to Host (Optional)
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a sweet congratulatory note..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e3e3e2] text-sm text-[#292827] focus:outline-none focus:ring-2 focus:ring-[#714cb6]/40 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingRsvp || !guestName.trim() || !isEmailValid}
                className="w-full py-3.5 rounded-buttons font-[540] text-sm text-white bg-[#421d24] hover:bg-[#572730] disabled:opacity-50 shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isSubmittingRsvp ? (
                  <span>Recording in Cloudflare D1...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#d4c7ff]" />
                    <span>Confirm RSVP Attendance</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* RECENT GUEST WISHES FEED */}
        {rsvps.filter((r) => r.message && r.message.trim()).length > 0 && (
          <div className="paper-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-[#292827] uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#714cb6]" />
              <span>Guest Wishes & Messages ({rsvps.filter((r) => r.message).length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rsvps
                .filter((r) => r.message && r.message.trim())
                .slice(0, 6)
                .map((r) => (
                  <div key={r.id} className="p-3.5 rounded-2xl bg-[#f8f7f5] border border-[#e3e3e2] text-xs">
                    <span className="font-bold text-[#292827] block">{r.guest_name}</span>
                    <p className="text-[#666666] italic mt-1 leading-snug">
                      &quot;{r.message}&quot;
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#e3e3e2] py-6 text-center text-xs text-[#666666]">
        <p>FestivAI Invitation Portal — Hosted on Cloudflare Workers & D1 SQLite</p>
      </footer>
    </div>
  );
}
